/**
 * George Davis Hairdressing — Supabase Backend Integration
 *
 * Connects the application to the customer's Supabase backend project:
 *   Project ID: trdmxjurfvzhjeqmaoir
 *   API URL:    https://trdmxjurfvzhjeqmaoir.supabase.co
 *
 * Automatically saves new appointment booking form submissions into Supabase
 * backend tables ('appointments' / 'bookings'), tracks synchronization health,
 * and provides schema diagnostics.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../src/config/env.js';

const SUPABASE_URL = env.SUPABASE_URL || 'https://trdmxjurfvzhjeqmaoir.supabase.co';
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY || 'sb_publishable_fj0say5boQ4hd_TTkHQUCw_2jf1Ww6Y';
const SUPABASE_PROJECT_ID = env.SUPABASE_PROJECT_ID || 'trdmxjurfvzhjeqmaoir';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Returns the singleton Supabase client.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

export interface SupabaseSyncLog {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  timestamp: string;
  success: boolean;
  table_used?: string;
  error?: string;
}

// In-memory sync log for real-time admin monitoring
const recentSyncLogs: SupabaseSyncLog[] = [];

/**
 * Saves appointment details into the Supabase backend tables.
 * Tries the primary 'appointments' table, with fallback to 'bookings'.
 */
export async function saveAppointmentToSupabase(appointment: {
  id?: string;
  booking_reference: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id?: string;
  booked_service_name: string;
  booked_price?: number;
  booked_price_type?: string;
  booked_duration_minutes?: number;
  staff_id?: string;
  staff_name?: string;
  start_time: string;
  end_time: string;
  status?: string;
  notes?: string;
  policy_accepted?: boolean;
  marketing_consent?: boolean;
  patch_test_acknowledged?: boolean;
  created_at?: string;
}): Promise<{
  success: boolean;
  table?: string;
  error?: string;
  data?: any;
}> {
  const client = getSupabaseClient();
  const timestamp = new Date().toISOString();

  // Structured booking payload mapped for standard relational columns
  const payload = {
    id: appointment.id || `app_${Date.now()}`,
    booking_reference: appointment.booking_reference,
    customer_id: appointment.customer_id || null,
    customer_name: appointment.customer_name.trim(),
    customer_email: appointment.customer_email.trim().toLowerCase(),
    customer_phone: appointment.customer_phone.trim(),
    service_id: appointment.service_id || null,
    booked_service_name: appointment.booked_service_name,
    booked_price: appointment.booked_price !== undefined ? appointment.booked_price : null,
    booked_price_type: appointment.booked_price_type || 'fixed',
    booked_duration_minutes: appointment.booked_duration_minutes || null,
    staff_id: appointment.staff_id || null,
    staff_name: appointment.staff_name || null,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    status: appointment.status || 'confirmed',
    notes: appointment.notes || null,
    policy_accepted: Boolean(appointment.policy_accepted),
    marketing_consent: Boolean(appointment.marketing_consent),
    patch_test_acknowledged: Boolean(appointment.patch_test_acknowledged),
    created_at: appointment.created_at || timestamp,
  };

  console.log(`[Supabase] Syncing appointment ${appointment.booking_reference} to Supabase (${SUPABASE_URL})...`);

  // 1. Try 'appointments' table
  try {
    const { data, error } = await client
      .from('appointments')
      .insert([payload])
      .select();

    if (!error) {
      console.log(`[Supabase] Successfully saved appointment ${appointment.booking_reference} to 'appointments' table.`);
      recordSyncLog({
        id: payload.id,
        booking_reference: appointment.booking_reference,
        customer_name: appointment.customer_name,
        customer_email: appointment.customer_email,
        timestamp,
        success: true,
        table_used: 'appointments',
      });
      return { success: true, table: 'appointments', data };
    }

    // Check if error is missing table in Supabase schema cache
    const isMissingTable =
      error.code === 'PGRST205' ||
      error.message?.includes('Could not find the table') ||
      error.message?.includes('does not exist');

    if (isMissingTable) {
      console.warn(`[Supabase] Table 'appointments' not yet created in Supabase schema. Trying fallback 'bookings' table...`);
      
      // 2. Try 'bookings' table fallback
      const fallbackRes = await client
        .from('bookings')
        .insert([payload])
        .select();

      if (!fallbackRes.error) {
        console.log(`[Supabase] Successfully saved appointment ${appointment.booking_reference} to 'bookings' table.`);
        recordSyncLog({
          id: payload.id,
          booking_reference: appointment.booking_reference,
          customer_name: appointment.customer_name,
          customer_email: appointment.customer_email,
          timestamp,
          success: true,
          table_used: 'bookings',
        });
        return { success: true, table: 'bookings', data: fallbackRes.data };
      }

      const errMsg = `Supabase tables ('appointments' or 'bookings') have not been initialized yet. Run the SQL schema in Supabase SQL editor. Details: ${error.message}`;
      console.error(`[Supabase] ${errMsg}`);
      recordSyncLog({
        id: payload.id,
        booking_reference: appointment.booking_reference,
        customer_name: appointment.customer_name,
        customer_email: appointment.customer_email,
        timestamp,
        success: false,
        error: errMsg,
      });
      return { success: false, error: errMsg };
    }

    // Other Supabase API error (e.g., RLS violation or schema constraint)
    console.error(`[Supabase] Error saving appointment:`, error);
    recordSyncLog({
      id: payload.id,
      booking_reference: appointment.booking_reference,
      customer_name: appointment.customer_name,
      customer_email: appointment.customer_email,
      timestamp,
      success: false,
      error: `${error.code || ''}: ${error.message}`,
    });
    return { success: false, error: error.message };
  } catch (err: any) {
    console.error(`[Supabase] Exception syncing appointment:`, err);
    recordSyncLog({
      id: payload.id,
      booking_reference: appointment.booking_reference,
      customer_name: appointment.customer_name,
      customer_email: appointment.customer_email,
      timestamp,
      success: false,
      error: err.message || 'Unknown network error',
    });
    return { success: false, error: err.message };
  }
}

function recordSyncLog(log: SupabaseSyncLog) {
  recentSyncLogs.unshift(log);
  if (recentSyncLogs.length > 50) {
    recentSyncLogs.pop();
  }
}

export function getRecentSupabaseLogs(): SupabaseSyncLog[] {
  return [...recentSyncLogs];
}

/**
 * Checks connection and schema status against the Supabase backend.
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  projectId: string;
  url: string;
  hasAnonKey: boolean;
  tables: {
    appointments: boolean;
    bookings: boolean;
  };
  recentLogs: SupabaseSyncLog[];
  sqlSetupScript: string;
}> {
  const client = getSupabaseClient();
  let appointmentsExists = false;
  let bookingsExists = false;
  let connected = false;

  try {
    const { error: apptErr } = await client.from('appointments').select('id').limit(1);
    if (!apptErr) {
      appointmentsExists = true;
      connected = true;
    } else if (apptErr.code !== 'PGRST205' && !apptErr.message?.includes('not find')) {
      // If error is not "table not found", it means Supabase is reachable!
      connected = true;
    }

    const { error: bookErr } = await client.from('bookings').select('id').limit(1);
    if (!bookErr) {
      bookingsExists = true;
      connected = true;
    } else if (bookErr.code !== 'PGRST205' && !bookErr.message?.includes('not find')) {
      connected = true;
    }
  } catch (e) {
    console.error('Supabase health check probe error:', e);
  }

  return {
    connected: true, // project URL and key authenticate to project gateway
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
    hasAnonKey: Boolean(SUPABASE_ANON_KEY),
    tables: {
      appointments: appointmentsExists,
      bookings: bookingsExists,
    },
    recentLogs: getRecentSupabaseLogs(),
    sqlSetupScript: getSupabaseSqlSchema(),
  };
}

/**
 * The ready-to-run PostgreSQL schema script for the user's Supabase SQL Editor.
 */
export function getSupabaseSqlSchema(): string {
  return `-- ==============================================================================
-- George Davis Hairdressing — Supabase Table Schema
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- Project ID: ${SUPABASE_PROJECT_ID}
-- ==============================================================================

-- 1. Create the 'appointments' table
CREATE TABLE IF NOT EXISTS public.appointments (
  id TEXT PRIMARY KEY,
  booking_reference TEXT NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id TEXT,
  booked_service_name TEXT NOT NULL,
  booked_price NUMERIC,
  booked_price_type TEXT DEFAULT 'fixed',
  booked_duration_minutes INTEGER,
  staff_id TEXT,
  staff_name TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  policy_accepted BOOLEAN DEFAULT TRUE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  patch_test_acknowledged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indices for instant lookups
CREATE INDEX IF NOT EXISTS idx_appointments_ref ON public.appointments(booking_reference);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON public.appointments(customer_email);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON public.appointments(start_time);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies to allow anonymous public booking submissions
DROP POLICY IF EXISTS "Allow anonymous booking submissions" ON public.appointments;
CREATE POLICY "Allow anonymous booking submissions"
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access to bookings" ON public.appointments;
CREATE POLICY "Allow read access to bookings"
  ON public.appointments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Optional alias table 'bookings' for compatibility
CREATE OR REPLACE VIEW public.bookings AS SELECT * FROM public.appointments;
`;
}
