import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client-Side Supabase Client for George Davis Hairdressing
 * Connected to project: trdmxjurfvzhjeqmaoir
 * API URL: https://trdmxjurfvzhjeqmaoir.supabase.co
 */
function normalizeClientSupabaseUrl(rawUrl?: string): string {
  const defaultUrl = 'https://trdmxjurfvzhjeqmaoir.supabase.co';
  if (!rawUrl) return defaultUrl;
  const trimmed = rawUrl.trim();
  if (trimmed.includes('supabase.com/dashboard/project/')) {
    const match = trimmed.match(/project\/([a-z0-9_-]+)/i);
    const pid = match ? match[1] : 'trdmxjurfvzhjeqmaoir';
    return `https://${pid}.supabase.co`;
  }
  return trimmed;
}

const SUPABASE_URL = normalizeClientSupabaseUrl(
  (import.meta as any).env?.VITE_SUPABASE_URL
);

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
