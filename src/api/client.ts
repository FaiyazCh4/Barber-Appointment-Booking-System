import type {
  AvailableSlot,
  SalonConfig,
  Service,
  ServiceCategory,
  Staff,
  UserProfile,
  Testimonial,
  TestimonialStats,
  NewTestimonialPayload,
} from '../types';
import { supabase } from '../lib/supabase';

const API_BASE = '/api';

export async function fetchSalonConfig(): Promise<SalonConfig> {
  const res = await fetch(`${API_BASE}/config`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load salon configuration');
  return res.json();
}

export async function fetchServices(): Promise<{ categories: ServiceCategory[]; services: Service[] }> {
  const res = await fetch(`${API_BASE}/services`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load services catalogue');
  return res.json();
}

export async function fetchStaff(): Promise<{ staff: Staff[] }> {
  const res = await fetch(`${API_BASE}/staff`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load team members');
  return res.json();
}

export async function fetchTestimonials(params?: {
  category?: string;
  stylistId?: string;
  limit?: number;
}): Promise<{ testimonials: Testimonial[]; stats: TestimonialStats }> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') {
    query.set('category', params.category);
  }
  if (params?.stylistId && params.stylistId !== 'all') {
    query.set('stylistId', params.stylistId);
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/testimonials${queryString}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load customer reviews');
  }
  return res.json();
}

export async function submitTestimonial(data: NewTestimonialPayload): Promise<{ success: boolean; testimonial: Testimonial }> {
  const res = await fetch(`${API_BASE}/testimonials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit review');
  }
  return res.json();
}

export async function fetchAvailability(params: {
  serviceId: string;
  staffId?: string;
  date: string;
}): Promise<{
  dateStr: string;
  service: Service;
  slots: AvailableSlot[];
  salonNotice?: string;
  isConfirmedHours: boolean;
}> {
  const query = new URLSearchParams({
    serviceId: params.serviceId,
    date: params.date,
  });
  if (params.staffId && params.staffId !== 'any') {
    query.set('staffId', params.staffId);
  }

  const res = await fetch(`${API_BASE}/availability?${query.toString()}`, { cache: 'no-store' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to check appointment availability');
  }
  return res.json();
}

export async function createHold(params: {
  serviceId: string;
  staffId: string;
  dateStr: string;
  timeStr: string;
  sessionId: string;
}) {
  const res = await fetch(`${API_BASE}/holds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to hold time slot');
  }
  return res.json();
}

export async function submitBooking(params: {
  idempotencyKey: string;
  serviceId: string;
  staffId: string;
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
}) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'idempotency-key': params.idempotencyKey,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to confirm appointment');
  }
  return res.json();
}

export async function lookupBooking(reference: string, email?: string, token?: string) {
  const query = new URLSearchParams();
  if (email) query.set('email', email);
  if (token) query.set('token', token);

  const res = await fetch(`${API_BASE}/bookings/${reference}?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Booking lookup failed');
  }
  return res.json();
}

export async function cancelBooking(params: {
  reference: string;
  email?: string;
  token?: string;
  reason?: string;
}) {
  const res = await fetch(`${API_BASE}/bookings/${params.reference}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Cancellation failed');
  }
  return res.json();
}

export async function rescheduleBooking(params: {
  reference: string;
  email?: string;
  token?: string;
  newDateStr: string;
  newTimeStr: string;
  newStaffId?: string;
}) {
  const res = await fetch(`${API_BASE}/bookings/${params.reference}/reschedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Reschedule failed');
  }
  return res.json();
}

const TOKEN_KEY = 'gd_auth_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!res.ok) {
      clearAuthToken();
      return null;
    }
    const data = await res.json();
    if (!data.authenticated) {
      clearAuthToken();
      return null;
    }
    return data.user;
  } catch {
    return null;
  }
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Invalid credentials');
  }
  const data = await res.json();
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function fetchAdminSlotStatus(): Promise<{
  slotAvailable: boolean;
  slotClaimed: boolean;
  adminExists: boolean;
}> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/auth/admin-slot-status`, {
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to verify admin slot status');
  }
  return res.json();
}

export async function registerAdminAccount(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Failed to register admin account');
  }
  const result = await res.json();
  if (result.token) {
    setAuthToken(result.token);
  }
  return result;
}

export async function claimDefaultAdmin() {
  const res = await fetch(`${API_BASE}/auth/claim-default-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Failed to initialize default admin');
  }
  const result = await res.json();
  if (result.token) {
    setAuthToken(result.token);
  }
  return result;
}

export async function resetAdminSlot() {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/auth/reset-admin-slot`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Failed to reset admin slot');
  }
  clearAuthToken();
  return res.json();
}

export async function logoutUser(): Promise<void> {
  const token = getAuthToken();
  clearAuthToken();

  // 1. Explicitly call Supabase auth.signOut() to destroy Supabase session and tokens
  try {
    if (supabase?.auth) {
      await supabase.auth.signOut();
    }
  } catch (supabaseErr) {
    console.warn('Supabase auth.signOut warning:', supabaseErr);
  }

  // 2. Clear any Supabase local storage tokens and keys
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase.auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch {}

  // 3. Clear application server session cookie and token
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    clearAuthToken();
  }
}

export async function subscribeNewsletter(email: string, firstName?: string): Promise<{ success: boolean; message: string; alreadySubscribed?: boolean }> {
  const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, firstName }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to complete newsletter subscription');
  }
  return data;
}

export async function fetchCustomerLoyalty(params: { email?: string; reference?: string }): Promise<{ loyalty: any }> {
  const query = new URLSearchParams();
  if (params.email) query.set('email', params.email);
  if (params.reference) query.set('reference', params.reference);

  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/customer/loyalty?${query.toString()}`, {
    headers,
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch customer loyalty profile');
  }
  return data;
}

export async function purchaseGiftVoucher(payload: any): Promise<{ voucher: any }> {
  const res = await fetch(`${API_BASE}/vouchers/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to complete gift voucher purchase');
  }
  return data;
}

export async function validateGiftVoucher(code: string): Promise<{ valid: boolean; voucher?: any; error?: string }> {
  const res = await fetch(`${API_BASE}/vouchers/${encodeURIComponent(code)}/validate`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Voucher validation failed');
  }
  return data;
}

export async function redeemGiftVoucher(code: string, amountToDeduct: number, bookingReference?: string): Promise<{ success: boolean; newBalance: number }> {
  const res = await fetch(`${API_BASE}/vouchers/${encodeURIComponent(code)}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountToDeduct, bookingReference }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to redeem voucher');
  }
  return data;
}


