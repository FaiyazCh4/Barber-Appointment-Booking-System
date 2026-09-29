import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client-Side Supabase Client for George Davis Hairdressing
 * Connected to project: trdmxjurfvzhjeqmaoir
 * API URL: https://trdmxjurfvzhjeqmaoir.supabase.co
 */
const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://trdmxjurfvzhjeqmaoir.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_fj0say5boQ4hd_TTkHQUCw_2jf1Ww6Y';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}
