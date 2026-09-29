import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { env } from '../src/config/env.js';
import { getDb, runWithLock } from './db.js';
import type { NotificationLog } from './types.js';

export interface EmailProviderStatus {
  activeProvider: 'resend' | 'smtp' | 'simulated';
  configuredProvider: 'console' | 'resend' | 'smtp';
  fromEmail: string;
  resendConfigured: boolean;
  smtpConfigured: boolean;
  smtpHost: string | null;
  smtpPort: number;
  description: string;
}

export function getEmailProviderStatus(): EmailProviderStatus {
  const resendKey = env.RESEND_API_KEY;
  const smtpHost = env.SMTP_HOST;
  const configuredProvider = env.NOTIFICATION_PROVIDER;

  let activeProvider: 'resend' | 'smtp' | 'simulated' = 'simulated';
  let description = '';

  if (resendKey && resendKey.trim().length > 5) {
    activeProvider = 'resend';
    description = `Resend API configured and active (sender: ${env.NOTIFICATION_FROM_EMAIL})`;
  } else if (smtpHost && smtpHost.trim().length > 0) {
    activeProvider = 'smtp';
    description = `SMTP transport active (${smtpHost}:${env.SMTP_PORT}, user: ${env.SMTP_USER || 'anonymous'})`;
  } else {
    activeProvider = 'simulated';
    description = 'Local outbox simulation (set RESEND_API_KEY or SMTP_HOST in .env for live external email delivery)';
  }

  return {
    activeProvider,
    configuredProvider,
    fromEmail: env.NOTIFICATION_FROM_EMAIL,
    resendConfigured: Boolean(resendKey && resendKey.trim().length > 5),
    smtpConfigured: Boolean(smtpHost && smtpHost.trim().length > 0),
    smtpHost: smtpHost || null,
    smtpPort: env.SMTP_PORT,
    description,
  };
}

/**
 * Dispatches an email using either Resend API or SMTP (Nodemailer),
 * or falls back to a simulated outbox entry if neither is configured.
 */
async function dispatchEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{
  provider: string;
  status: 'sent' | 'failed' | 'simulated';
  errorDetails: string;
}> {
  const resendKey = env.RESEND_API_KEY?.trim();
  const smtpHost = env.SMTP_HOST?.trim();

  // 1. Resend API Provider
  if (resendKey && resendKey.length > 5) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.NOTIFICATION_FROM_EMAIL,
          to: [params.to],
          subject: params.subject,
          text: params.text,
          html: params.html || undefined,
        }),
      });

      if (resp.ok) {
        return {
          provider: 'resend',
          status: 'sent',
          errorDetails: '',
        };
      }

      const errorText = await resp.text();
      return {
        provider: 'resend',
        status: 'failed',
        errorDetails: `Resend API HTTP ${resp.status}: ${errorText}`,
      };
    } catch (err: any) {
      return {
        provider: 'resend',
        status: 'failed',
        errorDetails: `Resend network connection error: ${err?.message || err}`,
      };
    }
  }

  // 2. SMTP Transport Provider (Nodemailer)
  if (smtpHost && smtpHost.length > 0) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER && env.SMTP_USER.trim().length > 0
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASS || '',
            }
          : undefined,
      });

      await transporter.sendMail({
        from: env.NOTIFICATION_FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html || undefined,
      });

      return {
        provider: 'smtp',
        status: 'sent',
        errorDetails: '',
      };
    } catch (err: any) {
      return {
        provider: 'smtp',
        status: 'failed',
        errorDetails: `SMTP transmission failed (${smtpHost}:${env.SMTP_PORT}): ${err?.message || err}`,
      };
    }
  }

  // 3. Fallback Simulated Outbox
  console.log('[NOTIFICATION SIMULATED]', {
    to: params.to,
    subject: params.subject,
    preview: params.text.slice(0, 120),
  });

  return {
    provider: 'local_outbox_simulated',
    status: 'simulated',
    errorDetails:
      'Live email provider credentials (RESEND_API_KEY or SMTP_HOST) are not configured in environment variables. Email logged to outbox database.',
  };
}

/**
 * Gorgeous, responsive HTML email template for salon booking confirmation
 */
export function generateBookingConfirmationHtml(params: {
  customerName: string;
  bookingReference: string;
  serviceName: string;
  staffName: string;
  displayDate: string;
  displayTime: string;
  durationMinutes: number;
  price: number;
  priceType?: string;
  patchTestAcknowledged?: boolean;
  appUrl?: string;
}): string {
  const appBaseUrl = params.appUrl || env.APP_URL || 'http://localhost:3000';
  const manageUrl = `${appBaseUrl}/#manage?ref=${encodeURIComponent(params.bookingReference)}`;
  const icsUrl = `${appBaseUrl}/api/bookings/${encodeURIComponent(params.bookingReference)}/ics`;

  const priceDisplay =
    params.priceType === 'consultation'
      ? 'Complimentary Consultation'
      : params.priceType === 'from'
      ? `From £${params.price.toFixed(2)}`
      : `£${params.price.toFixed(2)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed - George Davis Hairdressing</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0E0E0E; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E8E2D8; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0E0E0E; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #171614; border: 1px solid #2B2720; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 36px 30px 24px; text-align: center; border-bottom: 1px solid #2A251D; background: linear-gradient(180deg, #1C1A17 0%, #151412 100%);">
              <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; color: #F5F1EA; font-weight: 500; display: block;">
                George Davis
              </span>
              <span style="font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #BFA57D; font-weight: 600; display: block; margin-top: 4px;">
                Hairdressing · Bromsgrove
              </span>
            </td>
          </tr>

          <!-- Confirmation Status Kicker -->
          <tr>
            <td style="padding: 30px 30px 10px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #242018; border-left: 3px solid #9B8058; padding: 12px 16px; border-radius: 2px;">
                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #BFA57D; font-weight: 700; display: block;">
                      Booking Confirmed
                    </span>
                    <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #F5F1EA; font-weight: 600; display: block; margin-top: 4px;">
                      We look forward to welcoming you, ${escapeHtml(params.customerName)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Booking Details Card -->
          <tr>
            <td style="padding: 20px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #121110; border: 1px solid #26221C; border-radius: 4px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 12px; color: #8C8273;">Booking Reference</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 14px; font-weight: 700; color: #BFA57D; font-family: monospace; text-align: right;">${escapeHtml(params.bookingReference)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 12px; color: #8C8273;">Treatment / Service</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 13px; font-weight: 600; color: #F5F1EA; text-align: right;">${escapeHtml(params.serviceName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 12px; color: #8C8273;">Stylist</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 13px; color: #E8E2D8; text-align: right;">${escapeHtml(params.staffName)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 12px; color: #8C8273;">Date & Time (UK Time)</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 13px; font-weight: 600; color: #F5F1EA; text-align: right;">${escapeHtml(params.displayDate)} at ${escapeHtml(params.displayTime)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 12px; color: #8C8273;">Duration</td>
                  <td style="padding: 8px 12px; border-bottom: 1px solid #221E19; font-size: 13px; color: #E8E2D8; text-align: right;">${params.durationMinutes} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-size: 12px; color: #8C8273;">Estimated Price</td>
                  <td style="padding: 8px 12px; font-size: 14px; font-weight: 700; color: #F5F1EA; text-align: right;">${priceDisplay}</td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            params.patchTestAcknowledged
              ? `<!-- Patch Test Advisory -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #241D17; border: 1px solid #4A3A25; border-radius: 4px; padding: 14px 16px;">
                <tr>
                  <td>
                    <span style="font-size: 12px; font-weight: 700; color: #E5C396; display: block; text-transform: uppercase; letter-spacing: 0.5px;">
                      ⚠️ Mandatory Skin Allergy Patch Test
                    </span>
                    <span style="font-size: 12px; color: #D9CEBF; line-height: 1.5; display: block; margin-top: 4px;">
                      For your safety, a skin patch test must be carried out in salon at least 48 hours prior to colour services if you are a new colour client or have not had colour with us in the past 6 months.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 10px 30px 30px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${manageUrl}" style="display: inline-block; background-color: #9B8058; color: #141414; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 13px 28px; text-decoration: none; border-radius: 2px;">
                      View / Manage Appointment
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${icsUrl}" style="color: #BFA57D; font-size: 12px; text-decoration: underline;">
                      📅 Add to Calendar (.ics download)
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Salon Location & Contact -->
          <tr>
            <td style="background-color: #121110; border-top: 1px solid #24201A; padding: 24px 30px; font-size: 12px; color: #8C8273; line-height: 1.6;">
              <strong style="color: #D9D1C5; font-size: 13px; display: block; margin-bottom: 6px;">Salon Location & Contact</strong>
              George Davis Hairdressing<br>
              14 St John Street, Bromsgrove, Worcestershire, B61 8QY<br>
              Direct Telephone: <a href="tel:01527577000" style="color: #BFA57D; text-decoration: none;">01527 577000</a><br>
              Email: <a href="mailto:georgedavisbromsgrove@gmail.com" style="color: #BFA57D; text-decoration: none;">georgedavisbromsgrove@gmail.com</a>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #1F1B16; font-size: 11px; color: #6E6659;">
                Cancellation policy: Please give at least 24 hours notice should you need to amend or cancel your reservation.
              </div>
            </td>
          </tr>

        </table>

        <!-- Micro Footer -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin-top: 20px;">
          <tr>
            <td style="text-align: center; font-size: 11px; color: #5C5549;">
              Member of the Good Salon Guide · Bromsgrove, UK<br>
              © 2026 George Davis Hairdressing. All rights reserved.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * HTML email template for appointment cancellation
 */
export function generateCancellationHtml(params: {
  customerName: string;
  bookingReference: string;
  serviceName: string;
  staffName: string;
  displayDate: string;
  displayTime: string;
  reason?: string;
  appUrl?: string;
}): string {
  const appBaseUrl = params.appUrl || env.APP_URL || 'http://localhost:3000';
  const bookUrl = `${appBaseUrl}/#book`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Appointment Cancelled - George Davis Hairdressing</title>
</head>
<body style="margin:0; padding:0; background-color:#0E0E0E; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#E8E2D8;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0E0E0E; padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px; background-color:#171614; border:1px solid #2B2720; border-radius:4px; overflow:hidden;">
          <tr>
            <td style="padding:32px 30px 20px; text-align:center; border-bottom:1px solid #2A251D; background-color:#1C1A17;">
              <span style="font-family:Georgia, serif; font-size:22px; color:#F5F1EA; letter-spacing:2px; text-transform:uppercase;">George Davis Hairdressing</span>
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <div style="background-color:#261817; border-left:3px solid #E05252; padding:12px 16px; margin-bottom:20px;">
                <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#F87171; font-weight:bold;">Appointment Cancelled</span>
                <span style="font-size:16px; color:#F5F1EA; display:block; margin-top:4px;">Reference: ${escapeHtml(params.bookingReference)}</span>
              </div>
              <p style="font-size:13px; line-height:1.6; color:#D9D1C5;">
                Dear ${escapeHtml(params.customerName)},<br><br>
                Your appointment for <strong>${escapeHtml(params.serviceName)}</strong> with <strong>${escapeHtml(params.staffName)}</strong> scheduled for <strong>${escapeHtml(params.displayDate)} at ${escapeHtml(params.displayTime)}</strong> has been cancelled.
                ${params.reason ? `<br><br><em>Reason: ${escapeHtml(params.reason)}</em>` : ''}
              </p>
              <div style="text-align:center; margin:30px 0 10px;">
                <a href="${bookUrl}" style="background-color:#9B8058; color:#141414; padding:12px 24px; text-decoration:none; font-weight:bold; font-size:12px; text-transform:uppercase; letter-spacing:1px; border-radius:2px; display:inline-block;">
                  Book a New Appointment
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#121110; border-top:1px solid #24201A; padding:20px 30px; font-size:11px; color:#8C8273; text-align:center;">
              George Davis Hairdressing · 14 St John St, Bromsgrove · 01527 577000
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * HTML email template for sending an admin diagnostic test email
 */
export function generateTestEmailHtml(params: {
  recipientEmail: string;
  provider: string;
  timestamp: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Test Notification - George Davis Hairdressing</title>
</head>
<body style="margin:0; padding:0; background-color:#0E0E0E; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#E8E2D8;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0E0E0E; padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:540px; background-color:#171614; border:1px solid #3E3425; border-radius:4px; padding:30px;">
          <tr>
            <td>
              <h2 style="font-family:Georgia, serif; color:#9B8058; margin:0 0 10px;">George Davis Hairdressing</h2>
              <h3 style="color:#F5F1EA; margin:0 0 15px;">Email Notification System Verified ✅</h3>
              <p style="font-size:13px; line-height:1.6; color:#D9D1C5;">
                This test message confirms that your automated transactional email notification system is functioning correctly.
              </p>
              <div style="background-color:#121110; border:1px solid #2A251D; padding:15px; border-radius:3px; font-size:12px; font-family:monospace; color:#BFA57D; margin:20px 0;">
                Active Dispatch Provider: ${escapeHtml(params.provider)}<br>
                Target Recipient: ${escapeHtml(params.recipientEmail)}<br>
                Timestamp: ${escapeHtml(params.timestamp)}
              </div>
              <p style="font-size:11px; color:#8C8273;">
                George Davis Hairdressing · Bromsgrove · Automated Notification Engine
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main queue / dispatch function called whenever a booking or event happens
 */
export async function queueNotification(params: {
  appointmentId?: string;
  recipientEmail: string;
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'reminder';
  subject: string;
  content: string;
  html?: string;
}): Promise<NotificationLog> {
  const db = await getDb();
  const id = `notif_${crypto.randomUUID()}`;

  // Execute delivery via configured Resend or SMTP provider
  const dispatchResult = await dispatchEmail({
    to: params.recipientEmail,
    subject: params.subject,
    text: params.content,
    html: params.html,
  });

  const now = new Date().toISOString();

  await runWithLock(() => {
    db.run(
      `INSERT INTO notification_logs (
        id, appointment_id, recipient_email, type, status, subject, content,
        provider, error_details, attempts, last_attempt_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        params.appointmentId || null,
        params.recipientEmail,
        params.type,
        dispatchResult.status,
        params.subject,
        params.content,
        dispatchResult.provider,
        dispatchResult.errorDetails,
        now,
        now,
      ],
    );
  });

  return {
    id,
    appointment_id: params.appointmentId,
    recipient_email: params.recipientEmail,
    type: params.type,
    status: dispatchResult.status,
    subject: params.subject,
    content: params.content,
    provider: dispatchResult.provider,
    error_details: dispatchResult.errorDetails,
    attempts: 1,
    last_attempt_at: now,
    created_at: now,
  };
}

/**
 * Retries a previous notification log entry
 */
export async function retryNotification(id: string): Promise<boolean> {
  const db = await getDb();
  const res = db.exec(`SELECT * FROM notification_logs WHERE id = '${id.replace(/'/g, "''")}'`);
  if (!res.length || !res[0].values.length) return false;

  const row = res[0].values[0];
  const recipientEmail = row[2] as string;
  const subject = row[5] as string;
  const content = row[6] as string;
  const attempts = ((row[9] as number) || 1) + 1;

  const dispatchResult = await dispatchEmail({
    to: recipientEmail,
    subject,
    text: content,
  });

  const now = new Date().toISOString();
  await runWithLock(() => {
    db.run(
      `UPDATE notification_logs
       SET status = ?, provider = ?, error_details = ?, attempts = ?, last_attempt_at = ?
       WHERE id = ?`,
      [dispatchResult.status, dispatchResult.provider, dispatchResult.errorDetails, attempts, now, id],
    );
  });

  return dispatchResult.status === 'sent';
}

/**
 * Admin diagnostic tool: triggers a live test email to verify credentials
 */
export async function sendTestNotification(recipientEmail: string): Promise<{
  success: boolean;
  provider: string;
  status: 'sent' | 'failed' | 'simulated';
  errorDetails?: string;
}> {
  const now = new Date().toISOString();
  const providerStatus = getEmailProviderStatus();
  const subject = `Test Notification: George Davis Hairdressing Email System (${providerStatus.activeProvider})`;
  const textContent = `George Davis Hairdressing - Automated Notification System Diagnostic Test\n\nThis test message confirms that your automated email dispatch (${providerStatus.activeProvider}) is operational.\nTarget: ${recipientEmail}\nTimestamp: ${now}`;
  const htmlContent = generateTestEmailHtml({
    recipientEmail,
    provider: providerStatus.activeProvider,
    timestamp: now,
  });

  const log = await queueNotification({
    recipientEmail,
    type: 'reminder',
    subject,
    content: textContent,
    html: htmlContent,
  });

  return {
    success: log.status === 'sent' || log.status === 'simulated',
    provider: log.provider,
    status: log.status,
    errorDetails: log.error_details || undefined,
  };
}
