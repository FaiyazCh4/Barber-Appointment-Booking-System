import crypto from 'node:crypto';
import { getDb, runWithLock } from './db.js';
import {
  generateBookingConfirmationHtml,
  generateCancellationHtml,
  queueNotification,
} from './notifications.js';
import { saveAppointmentToSupabase } from './supabase.js';
import { londonToUtcIso, utcToLondon } from './timeUtils.js';
import type { Appointment, PriceType, ReservationHold, Service, Staff } from './types.js';

export interface AvailableSlot {
  timeStr: string; // '09:30' (London local time)
  startUtc: string; // ISO
  endUtc: string; // ISO
  availableStaff: {
    id: string;
    name: string;
    roleTitle: string;
  }[];
}

/**
 * Remove stale reservation holds past expiry
 */
export async function cleanExpiredHolds(): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  db.run(`DELETE FROM reservation_holds WHERE expires_at <= ?`, [now]);
}

/**
 * Query available booking slots for a given date, service, and optional stylist.
 */
export async function getAvailableSlots(params: {
  serviceId: string;
  staffId?: string; // 'any' or specific ID
  dateStr: string; // 'YYYY-MM-DD' in London local date
  ignoreAppointmentId?: string; // For rescheduling
  ignoreSessionId?: string; // For holds belonging to the user's current session
}): Promise<{
  dateStr: string;
  service: Service;
  slots: AvailableSlot[];
  salonNotice?: string;
  isConfirmedHours: boolean;
}> {
  const db = await getDb();
  await cleanExpiredHolds();

  // 1. Get Service details
  const srvRes = db.exec(`SELECT * FROM services WHERE id = '${params.serviceId.replace(/'/g, "''")}'`);
  if (!srvRes.length || !srvRes[0].values.length) {
    throw new Error('Service not found');
  }
  const sCols = srvRes[0].columns;
  const sVals = srvRes[0].values[0];
  const sObj: Record<string, any> = {};
  sCols.forEach((c, idx) => (sObj[c] = sVals[idx]));

  const service: Service = {
    id: sObj.id,
    category_id: sObj.category_id,
    name: sObj.name,
    slug: sObj.slug,
    description: sObj.description,
    duration_minutes: sObj.duration_minutes,
    buffer_minutes: sObj.buffer_minutes,
    price: sObj.price,
    price_type: sObj.price_type as PriceType,
    requires_consultation: Boolean(sObj.requires_consultation),
    requires_patch_test: Boolean(sObj.requires_patch_test),
    active: Boolean(sObj.active),
    online_booking_enabled: Boolean(sObj.online_booking_enabled),
    sort_order: sObj.sort_order,
  };

  if (!service.active || !service.online_booking_enabled) {
    return {
      dateStr: params.dateStr,
      service,
      slots: [],
      salonNotice: 'This service is currently consultation-only or requires telephone booking.',
      isConfirmedHours: true,
    };
  }

  // 2. Check salon hours for day of week
  const dummyLondonUtc = londonToUtcIso(params.dateStr, '12:00');
  const londonInfo = utcToLondon(dummyLondonUtc);
  const dayOfWeek = londonInfo.dayOfWeek;

  const hoursRes = db.exec(`SELECT * FROM salon_hours WHERE day_of_week = ${dayOfWeek}`);
  if (!hoursRes.length || !hoursRes[0].values.length) {
    return { dateStr: params.dateStr, service, slots: [], isConfirmedHours: false };
  }
  const hCols = hoursRes[0].columns;
  const hVals = hoursRes[0].values[0];
  const hObj: Record<string, any> = {};
  hCols.forEach((c, idx) => (hObj[c] = hVals[idx]));

  const isConfirmedHours = Boolean(hObj.is_confirmed);
  if (!hObj.is_open) {
    return {
      dateStr: params.dateStr,
      service,
      slots: [],
      salonNotice: `The salon is closed on ${londonInfo.displayDate.split(' ')[0]}s.`,
      isConfirmedHours,
    };
  }

  // 3. Check salon closures
  const closureRes = db.exec(`SELECT * FROM salon_closures WHERE date = '${params.dateStr.replace(/'/g, "''")}'`);
  if (closureRes.length && closureRes[0].values.length) {
    const reason = closureRes[0].values[0][2];
    return {
      dateStr: params.dateStr,
      service,
      slots: [],
      salonNotice: `Salon closed: ${reason}`,
      isConfirmedHours,
    };
  }

  // 4. Identify candidate staff members assigned to this service
  let staffQuery = `
    SELECT s.id, s.name, s.role_title, s.active
    FROM staff s
    JOIN staff_services ss ON s.id = ss.staff_id
    WHERE ss.service_id = '${params.serviceId.replace(/'/g, "''")}'
    AND s.active = 1
  `;
  if (params.staffId && params.staffId !== 'any') {
    staffQuery += ` AND s.id = '${params.staffId.replace(/'/g, "''")}'`;
  }
  staffQuery += ' ORDER BY s.sort_order ASC';

  const staffRes = db.exec(staffQuery);
  if (!staffRes.length || !staffRes[0].values.length) {
    return {
      dateStr: params.dateStr,
      service,
      slots: [],
      salonNotice: 'No active stylists are available for this service on this date.',
      isConfirmedHours,
    };
  }

  const candidateStaff = staffRes[0].values.map((v) => ({
    id: v[0] as string,
    name: v[1] as string,
    roleTitle: v[2] as string,
  }));

  // 5. Build candidate time intervals for each staff member
  const nowUtc = new Date();
  // Minimum lead time (2 hours)
  const minLeadTimeMs = 2 * 60 * 60 * 1000;
  const earliestAllowedUtc = new Date(nowUtc.getTime() + minLeadTimeMs);

  const totalServiceDuration = service.duration_minutes + service.buffer_minutes;
  const slotsMap = new Map<string, { timeStr: string; startUtc: string; endUtc: string; staff: typeof candidateStaff }>();

  for (const staff of candidateStaff) {
    // Check staff working hours on this day
    const swhRes = db.exec(
      `SELECT start_time, end_time, is_working FROM staff_working_hours WHERE staff_id = '${staff.id}' AND day_of_week = ${dayOfWeek}`,
    );
    if (!swhRes.length || !swhRes[0].values.length) continue;
    const [shiftStart, shiftEnd, isWorking] = swhRes[0].values[0];
    if (!isWorking) continue;

    // Staff breaks
    const breaksRes = db.exec(
      `SELECT start_time, end_time FROM staff_breaks WHERE staff_id = '${staff.id}' AND day_of_week = ${dayOfWeek}`,
    );
    const staffBreaks = breaksRes.length ? breaksRes[0].values.map((b) => ({ start: b[0] as string, end: b[1] as string })) : [];

    // Staff time off overlapping this day
    const dayStartUtc = londonToUtcIso(params.dateStr, '00:00');
    const dayEndUtc = londonToUtcIso(params.dateStr, '23:59');
    const timeOffRes = db.exec(
      `SELECT start_datetime, end_datetime FROM staff_time_off
       WHERE staff_id = '${staff.id}'
       AND NOT (end_datetime <= '${dayStartUtc}' OR start_datetime >= '${dayEndUtc}')`,
    );
    const timeOffIntervals = timeOffRes.length
      ? timeOffRes[0].values.map((to) => ({
          start: new Date(to[0] as string).getTime(),
          end: new Date(to[1] as string).getTime(),
        }))
      : [];

    // Existing appointments for this staff on this day
    let apptQuery = `
      SELECT id, start_time, end_time, booked_buffer_minutes FROM appointments
      WHERE staff_id = '${staff.id}'
      AND status NOT IN ('cancelled', 'no_show')
      AND NOT (end_time <= '${dayStartUtc}' OR start_time >= '${dayEndUtc}')
    `;
    if (params.ignoreAppointmentId) {
      apptQuery += ` AND id != '${params.ignoreAppointmentId.replace(/'/g, "''")}'`;
    }
    const apptRes = db.exec(apptQuery);
    const busyIntervals: { start: number; end: number }[] = [];
    if (apptRes.length) {
      for (const row of apptRes[0].values) {
        const apptStart = new Date(row[1] as string).getTime();
        const apptEnd = new Date(row[2] as string).getTime();
        const bufferMs = ((row[3] as number) || 0) * 60 * 1000;
        busyIntervals.push({ start: apptStart, end: apptEnd + bufferMs });
      }
    }

    // Active reservation holds for this staff (excluding current user's session if provided)
    let holdQuery = `
      SELECT start_time, end_time FROM reservation_holds
      WHERE staff_id = '${staff.id}'
      AND expires_at > '${nowUtc.toISOString()}'
      AND NOT (end_time <= '${dayStartUtc}' OR start_time >= '${dayEndUtc}')
    `;
    if (params.ignoreSessionId) {
      holdQuery += ` AND session_id != '${params.ignoreSessionId.replace(/'/g, "''")}'`;
    }
    const holdRes = db.exec(holdQuery);
    if (holdRes.length) {
      for (const row of holdRes[0].values) {
        busyIntervals.push({
          start: new Date(row[0] as string).getTime(),
          end: new Date(row[1] as string).getTime() + service.buffer_minutes * 60 * 1000,
        });
      }
    }

    // Determine start/end time bound for day (must be within salon hours AND staff shift)
    const effectiveStartStr = (hObj.open_time as string) > (shiftStart as string) ? (hObj.open_time as string) : (shiftStart as string);
    const effectiveEndStr = (hObj.close_time as string) < (shiftEnd as string) ? (hObj.close_time as string) : (shiftEnd as string);

    const [startH, startM] = effectiveStartStr.split(':').map((x) => parseInt(x, 10));
    const [endH, endM] = effectiveEndStr.split(':').map((x) => parseInt(x, 10));

    const dayStartMinutes = startH * 60 + startM;
    const dayEndMinutes = endH * 60 + endM;

    // Cadence: every 15 minutes
    for (let m = dayStartMinutes; m + totalServiceDuration <= dayEndMinutes; m += 15) {
      const slotHour = Math.floor(m / 60);
      const slotMin = m % 60;
      const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`;

      // Check against staff breaks
      const slotEndMinutes = m + totalServiceDuration;
      let overlapsBreak = false;
      for (const brk of staffBreaks) {
        const [bsh, bsm] = brk.start.split(':').map((x) => parseInt(x, 10));
        const [beh, bem] = brk.end.split(':').map((x) => parseInt(x, 10));
        const brkStartMin = bsh * 60 + bsm;
        const brkEndMin = beh * 60 + bem;
        // Overlap if max(m, brkStartMin) < min(slotEndMinutes, brkEndMin)
        if (Math.max(m, brkStartMin) < Math.min(slotEndMinutes, brkEndMin)) {
          overlapsBreak = true;
          break;
        }
      }
      if (overlapsBreak) continue;

      const slotStartUtc = londonToUtcIso(params.dateStr, timeStr);
      const slotEndUtc = new Date(new Date(slotStartUtc).getTime() + service.duration_minutes * 60000).toISOString();
      const slotStartMs = new Date(slotStartUtc).getTime();
      const slotEndMs = slotStartMs + totalServiceDuration * 60000;

      // Minimum notice
      if (slotStartMs < earliestAllowedUtc.getTime()) continue;

      // Check staff time off
      let overlapsTimeOff = false;
      for (const to of timeOffIntervals) {
        if (Math.max(slotStartMs, to.start) < Math.min(slotEndMs, to.end)) {
          overlapsTimeOff = true;
          break;
        }
      }
      if (overlapsTimeOff) continue;

      // Check busy intervals (appointments & holds)
      let overlapsBusy = false;
      for (const b of busyIntervals) {
        if (Math.max(slotStartMs, b.start) < Math.min(slotEndMs, b.end)) {
          overlapsBusy = true;
          break;
        }
      }
      if (overlapsBusy) continue;

      // Valid slot for this staff member!
      if (!slotsMap.has(timeStr)) {
        slotsMap.set(timeStr, {
          timeStr,
          startUtc: slotStartUtc,
          endUtc: slotEndUtc,
          staff: [],
        });
      }
      slotsMap.get(timeStr)!.staff.push(staff);
    }
  }

  // Sort slots by time
  const sortedSlots = Array.from(slotsMap.values()).sort((a, b) => a.timeStr.localeCompare(b.timeStr));

  return {
    dateStr: params.dateStr,
    service,
    slots: sortedSlots.map((s) => ({
      timeStr: s.timeStr,
      startUtc: s.startUtc,
      endUtc: s.endUtc,
      availableStaff: s.staff,
    })),
    isConfirmedHours,
  };
}

/**
 * Creates an atomic temporary reservation hold (10 min duration)
 */
export async function createReservationHold(params: {
  serviceId: string;
  staffId: string; // specific ID or 'any'
  dateStr: string;
  timeStr: string;
  sessionId: string;
}): Promise<ReservationHold> {
  return await runWithLock(async () => {
    const db = await getDb();
    await cleanExpiredHolds();

    const availableData = await getAvailableSlots({
      serviceId: params.serviceId,
      staffId: params.staffId,
      dateStr: params.dateStr,
      ignoreSessionId: params.sessionId,
    });

    const targetSlot = availableData.slots.find((s) => s.timeStr === params.timeStr);
    if (!targetSlot || !targetSlot.availableStaff.length) {
      throw new Error('This appointment slot is no longer available. Please choose another time.');
    }

    // If 'any', select the first available staff member
    let chosenStaff = targetSlot.availableStaff[0];
    if (params.staffId && params.staffId !== 'any') {
      const matched = targetSlot.availableStaff.find((s) => s.id === params.staffId);
      if (!matched) {
        throw new Error('Selected stylist is no longer available at this time.');
      }
      chosenStaff = matched;
    }

    const holdId = `hold_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Delete any existing hold for this session
    db.run(`DELETE FROM reservation_holds WHERE session_id = ?`, [params.sessionId]);

    db.run(
      `INSERT INTO reservation_holds (id, staff_id, service_id, start_time, end_time, session_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [holdId, chosenStaff.id, params.serviceId, targetSlot.startUtc, targetSlot.endUtc, params.sessionId, expiresAt],
    );

    return {
      id: holdId,
      staff_id: chosenStaff.id,
      service_id: params.serviceId,
      start_time: targetSlot.startUtc,
      end_time: targetSlot.endUtc,
      session_id: params.sessionId,
      expires_at: expiresAt,
    };
  });
}

/**
 * Confirm appointment atomically with snapshotting, idempotency and conflict prevention
 */
export async function confirmAppointment(params: {
  idempotencyKey?: string;
  serviceId: string;
  staffId: string; // specific ID or 'any'
  dateStr: string;
  timeStr: string;
  sessionId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: string;
  policyAccepted: boolean;
  marketingConsent: boolean;
  patchTestAcknowledged: boolean;
  userId?: string;
}): Promise<Appointment> {
  const db = await getDb();

  // 1. Idempotency Check
  if (params.idempotencyKey) {
    const existing = db.exec(
      `SELECT response_body FROM idempotency_keys WHERE key = '${params.idempotencyKey.replace(/'/g, "''")}'`,
    );
    if (existing.length && existing[0].values.length) {
      return JSON.parse(existing[0].values[0][0] as string);
    }
  }

  // 2. Atomic confirmation inside lock
  const appointment = await runWithLock(async () => {
    await cleanExpiredHolds();

    // Check if the user already held a slot with a specific staff member during Step 3
    let preferredStaffId = params.staffId;
    if (params.sessionId) {
      const holdRes = db.exec(
        `SELECT staff_id FROM reservation_holds WHERE session_id = '${params.sessionId.replace(/'/g, "''")}' AND expires_at > '${new Date().toISOString()}'`,
      );
      if (holdRes.length && holdRes[0].values.length) {
        const heldStaffId = holdRes[0].values[0][0] as string;
        if (params.staffId === 'any' || !params.staffId) {
          preferredStaffId = heldStaffId;
        }
      }
    }

    // Re-verify availability ignoring user's own session hold
    const availableData = await getAvailableSlots({
      serviceId: params.serviceId,
      staffId: params.staffId,
      dateStr: params.dateStr,
      ignoreSessionId: params.sessionId,
    });

    const targetSlot = availableData.slots.find((s) => s.timeStr === params.timeStr);
    if (!targetSlot || !targetSlot.availableStaff.length) {
      throw new Error('This time slot is no longer available. Please select another slot.');
    }

    let assignedStaff = targetSlot.availableStaff[0];
    if (preferredStaffId && preferredStaffId !== 'any') {
      const matched = targetSlot.availableStaff.find((s) => s.id === preferredStaffId);
      if (matched) {
        assignedStaff = matched;
      } else if (params.staffId && params.staffId !== 'any') {
        throw new Error('The chosen stylist is no longer available at this time.');
      }
    }

    const service = availableData.service;

    // Check patch test requirement
    if (service.requires_patch_test && !params.patchTestAcknowledged) {
      throw new Error('A 48-hour skin patch test must be acknowledged for this colour service.');
    }

    // 3. Customer record creation or lookup
    let customerId = '';
    const custRes = db.exec(`SELECT id FROM customers WHERE email = '${params.customerEmail.toLowerCase().trim().replace(/'/g, "''")}'`);
    if (custRes.length && custRes[0].values.length) {
      customerId = custRes[0].values[0][0] as string;
      // Update phone if needed
      db.run(`UPDATE customers SET full_name = ?, phone = ? WHERE id = ?`, [
        params.customerName.trim(),
        params.customerPhone.trim(),
        customerId,
      ]);
    } else {
      customerId = `cust_${crypto.randomUUID()}`;
      db.run(
        `INSERT INTO customers (id, user_id, full_name, email, phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          customerId,
          params.userId || null,
          params.customerName.trim(),
          params.customerEmail.toLowerCase().trim(),
          params.customerPhone.trim(),
          new Date().toISOString(),
        ],
      );
    }

    // 4. Generate unique booking reference & guest access token
    const randPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const bookingReference = `GD-2026-${randPart}`;
    const accessToken = `tok_${crypto.randomUUID().replace(/-/g, '')}`;
    const appointmentId = `app_${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();

    // 5. Insert Appointment with HISTORICAL SNAPSHOTS
    db.run(
      `INSERT INTO appointments (
        id, booking_reference, access_token, customer_id, staff_id, service_id,
        booked_service_name, booked_price, booked_price_type, booked_duration_minutes, booked_buffer_minutes,
        start_time, end_time, status, notes, policy_accepted, marketing_consent, patch_test_acknowledged,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, 'confirmed', ?, ?, ?, ?,
        ?, ?
      )`,
      [
        appointmentId,
        bookingReference,
        accessToken,
        customerId,
        assignedStaff.id,
        service.id,
        service.name,
        service.price,
        service.price_type,
        service.duration_minutes,
        service.buffer_minutes,
        targetSlot.startUtc,
        targetSlot.endUtc,
        params.notes?.trim() || null,
        params.policyAccepted ? 1 : 0,
        params.marketingConsent ? 1 : 0,
        params.patchTestAcknowledged ? 1 : 0,
        nowIso,
        nowIso,
      ],
    );

    // 6. Release reservation hold for this session
    if (params.sessionId) {
      db.run(`DELETE FROM reservation_holds WHERE session_id = ?`, [params.sessionId]);
    }

    // 7. Audit log
    db.run(
      `INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `audit_${crypto.randomUUID()}`,
        params.customerEmail,
        'APPOINTMENT_CONFIRMED',
        'appointment',
        appointmentId,
        `Confirmed appointment ${bookingReference} with ${assignedStaff.name} for ${service.name} at ${params.dateStr} ${params.timeStr}`,
        nowIso,
      ],
    );

    const result: Appointment = {
      id: appointmentId,
      booking_reference: bookingReference,
      access_token: accessToken,
      customer_id: customerId,
      customer_name: params.customerName.trim(),
      customer_email: params.customerEmail.toLowerCase().trim(),
      customer_phone: params.customerPhone.trim(),
      staff_id: assignedStaff.id,
      staff_name: assignedStaff.name,
      service_id: service.id,
      booked_service_name: service.name,
      booked_price: service.price,
      booked_price_type: service.price_type,
      booked_duration_minutes: service.duration_minutes,
      booked_buffer_minutes: service.buffer_minutes,
      start_time: targetSlot.startUtc,
      end_time: targetSlot.endUtc,
      status: 'confirmed',
      notes: params.notes?.trim() || undefined,
      policy_accepted: params.policyAccepted,
      marketing_consent: params.marketingConsent,
      patch_test_acknowledged: params.patchTestAcknowledged,
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Store idempotency result if key was provided
    if (params.idempotencyKey) {
      db.run(
        `INSERT INTO idempotency_keys (key, response_body, created_at) VALUES (?, ?, ?)`,
        [params.idempotencyKey, JSON.stringify(result), nowIso],
      );
    }

    return result;
  });

  // 8. Queue notification
  const londonDate = utcToLondon(appointment.start_time);
  const emailSubject = `Appointment Confirmed: ${appointment.booked_service_name} at George Davis Hairdressing (${appointment.booking_reference})`;
  const emailBody = `
Dear ${appointment.customer_name},

Thank you for choosing George Davis Hairdressing in Bromsgrove.

Your appointment details:
- Reference: ${appointment.booking_reference}
- Service: ${appointment.booked_service_name}
- Stylist: ${appointment.staff_name}
- Date & Time: ${londonDate.displayDate} at ${londonDate.displayTime} (UK Time)
- Duration: ${appointment.booked_duration_minutes} minutes
- Estimated Price: ${appointment.booked_price_type === 'consultation' ? 'Complimentary Consultation' : appointment.booked_price_type === 'from' ? `From £${appointment.booked_price.toFixed(2)}` : `£${appointment.booked_price.toFixed(2)}`}

Location:
George Davis Hairdressing
14 St John Street, Bromsgrove, B61 8QY
Phone: 01527 577000

${appointment.patch_test_acknowledged ? 'IMPORTANT: Please ensure your skin allergy patch test is completed at least 48 hours prior to your colour appointment.\n' : ''}
Cancellation Policy:
Please give at least 24 hours notice if you need to reschedule or cancel your appointment.
  `.trim();

  const emailHtml = generateBookingConfirmationHtml({
    customerName: appointment.customer_name,
    bookingReference: appointment.booking_reference,
    serviceName: appointment.booked_service_name,
    staffName: appointment.staff_name,
    displayDate: londonDate.displayDate,
    displayTime: londonDate.displayTime,
    durationMinutes: appointment.booked_duration_minutes,
    price: appointment.booked_price,
    priceType: appointment.booked_price_type,
    patchTestAcknowledged: Boolean(appointment.patch_test_acknowledged),
  });

  await queueNotification({
    appointmentId: appointment.id,
    recipientEmail: appointment.customer_email,
    type: 'confirmation',
    subject: emailSubject,
    content: emailBody,
    html: emailHtml,
  });

  // 9. Sync appointment details into the connected Supabase backend tables
  try {
    await saveAppointmentToSupabase(appointment);
  } catch (supabaseErr) {
    console.error('[Supabase Sync Error]', supabaseErr);
  }

  return appointment;
}

/**
 * Reschedule appointment atomically
 */
export async function rescheduleAppointment(params: {
  appointmentId: string;
  newDateStr: string;
  newTimeStr: string;
  newStaffId?: string;
  actorEmail: string;
  isAdmin?: boolean;
}): Promise<Appointment> {
  const db = await getDb();

  return await runWithLock(async () => {
    // 1. Fetch existing appointment
    const apptRes = db.exec(`
      SELECT a.*, c.full_name, c.email, c.phone, st.name as staff_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN staff st ON a.staff_id = st.id
      WHERE a.id = '${params.appointmentId.replace(/'/g, "''")}'
    `);
    if (!apptRes.length || !apptRes[0].values.length) {
      throw new Error('Appointment not found');
    }
    const cols = apptRes[0].columns;
    const vals = apptRes[0].values[0];
    const appt: Record<string, any> = {};
    cols.forEach((c, idx) => (appt[c] = vals[idx]));

    if (appt.status === 'cancelled') {
      throw new Error('This appointment has already been cancelled.');
    }

    // Check cancellation window for customers (24 hours minimum unless admin)
    if (!params.isAdmin) {
      const apptStartMs = new Date(appt.start_time).getTime();
      const nowMs = Date.now();
      const hoursRemaining = (apptStartMs - nowMs) / (1000 * 60 * 60);
      if (hoursRemaining < 24) {
        throw new Error('Appointments within 24 hours cannot be rescheduled online. Please telephone the salon directly on 01527 577000.');
      }
    }

    // 2. Check availability of the new slot (ignoring current appointment)
    const targetStaffId = params.newStaffId && params.newStaffId !== 'any' ? params.newStaffId : appt.staff_id;
    const availableData = await getAvailableSlots({
      serviceId: appt.service_id,
      staffId: targetStaffId,
      dateStr: params.newDateStr,
      ignoreAppointmentId: appt.id,
    });

    const targetSlot = availableData.slots.find((s) => s.timeStr === params.newTimeStr);
    if (!targetSlot || !targetSlot.availableStaff.length) {
      throw new Error('The requested new slot is not available. Please choose another time.');
    }

    const assignedStaff = targetSlot.availableStaff[0];
    const nowIso = new Date().toISOString();

    // 3. Update appointment
    db.run(
      `UPDATE appointments
       SET staff_id = ?, start_time = ?, end_time = ?, status = 'confirmed', updated_at = ?
       WHERE id = ?`,
      [assignedStaff.id, targetSlot.startUtc, targetSlot.endUtc, nowIso, appt.id],
    );

    // 4. Audit log
    db.run(
      `INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `audit_${crypto.randomUUID()}`,
        params.actorEmail,
        'APPOINTMENT_RESCHEDULED',
        'appointment',
        appt.id,
        `Rescheduled from ${appt.start_time} to ${targetSlot.startUtc} with ${assignedStaff.name}`,
        nowIso,
      ],
    );

    const updated: Appointment = {
      id: appt.id,
      booking_reference: appt.booking_reference,
      access_token: appt.access_token,
      customer_id: appt.customer_id,
      customer_name: appt.full_name,
      customer_email: appt.email,
      customer_phone: appt.phone,
      staff_id: assignedStaff.id,
      staff_name: assignedStaff.name,
      service_id: appt.service_id,
      booked_service_name: appt.booked_service_name,
      booked_price: appt.booked_price,
      booked_price_type: appt.booked_price_type,
      booked_duration_minutes: appt.booked_duration_minutes,
      booked_buffer_minutes: appt.booked_buffer_minutes,
      start_time: targetSlot.startUtc,
      end_time: targetSlot.endUtc,
      status: 'confirmed',
      notes: appt.notes,
      policy_accepted: Boolean(appt.policy_accepted),
      marketing_consent: Boolean(appt.marketing_consent),
      patch_test_acknowledged: Boolean(appt.patch_test_acknowledged),
      created_at: appt.created_at,
      updated_at: nowIso,
    };

    // Queue email
    const londonDate = utcToLondon(updated.start_time);
    queueNotification({
      appointmentId: updated.id,
      recipientEmail: updated.customer_email,
      type: 'reschedule',
      subject: `Appointment Rescheduled: ${updated.booked_service_name} (${updated.booking_reference})`,
      content: `Your appointment has been successfully rescheduled to ${londonDate.displayDate} at ${londonDate.displayTime} with ${updated.staff_name} at George Davis Hairdressing, Bromsgrove.`,
    });

    return updated;
  });
}

/**
 * Cancel appointment safely and release slot
 */
export async function cancelAppointment(params: {
  appointmentId: string;
  reason?: string;
  actorEmail: string;
  isAdmin?: boolean;
}): Promise<void> {
  const db = await getDb();

  await runWithLock(async () => {
    const apptRes = db.exec(`
      SELECT a.*, c.full_name, c.email, st.name as staff_name
      FROM appointments a
      JOIN customers c ON a.customer_id = c.id
      JOIN staff st ON a.staff_id = st.id
      WHERE a.id = '${params.appointmentId.replace(/'/g, "''")}'
    `);
    if (!apptRes.length || !apptRes[0].values.length) {
      throw new Error('Appointment not found');
    }
    const cols = apptRes[0].columns;
    const vals = apptRes[0].values[0];
    const appt: Record<string, any> = {};
    cols.forEach((c, idx) => (appt[c] = vals[idx]));

    if (appt.status === 'cancelled') {
      return; // Already cancelled
    }

    if (!params.isAdmin) {
      const apptStartMs = new Date(appt.start_time).getTime();
      const nowMs = Date.now();
      const hoursRemaining = (apptStartMs - nowMs) / (1000 * 60 * 60);
      if (hoursRemaining < 24) {
        throw new Error('Appointments within 24 hours cannot be cancelled online. Please telephone the salon directly on 01527 577000.');
      }
    }

    const nowIso = new Date().toISOString();
    db.run(
      `UPDATE appointments
       SET status = 'cancelled', cancelled_at = ?, cancellation_reason = ?, updated_at = ?
       WHERE id = ?`,
      [nowIso, params.reason?.trim() || 'Cancelled by customer', nowIso, appt.id],
    );

    // Audit log
    db.run(
      `INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `audit_${crypto.randomUUID()}`,
        params.actorEmail,
        'APPOINTMENT_CANCELLED',
        'appointment',
        appt.id,
        `Cancelled appointment ${appt.booking_reference}. Reason: ${params.reason || 'None provided'}`,
        nowIso,
      ],
    );

    // Queue cancellation email
    const cancelLondon = utcToLondon(appt.start_time);
    const cancelHtml = generateCancellationHtml({
      customerName: appt.full_name,
      bookingReference: appt.booking_reference,
      serviceName: appt.booked_service_name,
      staffName: appt.staff_name,
      displayDate: cancelLondon.displayDate,
      displayTime: cancelLondon.displayTime,
      reason: params.reason,
    });

    queueNotification({
      appointmentId: appt.id,
      recipientEmail: appt.email,
      type: 'cancellation',
      subject: `Appointment Cancelled: ${appt.booked_service_name} (${appt.booking_reference})`,
      content: `Your appointment (${appt.booking_reference}) scheduled for ${cancelLondon.displayDate} at ${cancelLondon.displayTime} has been cancelled as requested. If you wish to rebook, please visit our website or telephone 01527 577000.`,
      html: cancelHtml,
    });
  });
}
