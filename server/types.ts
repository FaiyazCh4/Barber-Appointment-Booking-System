export type UserRole = 'owner_admin' | 'receptionist' | 'stylist' | 'customer';

export type PriceType = 'fixed' | 'from' | 'consultation';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface SalonSettings {
  salon_name: string;
  salon_address: string;
  salon_phone: string;
  salon_phone_intl: string;
  salon_email: string;
  currency: string;
  timezone: string;
  hours_confirmed: boolean;
  online_booking_active: boolean;
  min_lead_time_hours: number;
  max_advance_days: number;
  cancellation_window_hours: number;
  patch_test_required_hours: number;
  saloniq_authoritative: boolean;
  saloniq_cutover_confirmed: boolean;
  notice_banner?: string;
}

export interface SalonHour {
  day_of_week: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  day_name: string;
  open_time: string; // '09:00'
  close_time: string; // '17:30'
  is_open: boolean;
  is_confirmed: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export interface Service {
  id: string;
  category_id: string;
  category_name?: string;
  name: string;
  slug: string;
  description: string;
  duration_minutes: number;
  buffer_minutes: number;
  price: number;
  price_type: PriceType;
  requires_consultation: boolean;
  requires_patch_test: boolean;
  active: boolean;
  online_booking_enabled: boolean;
  image_url?: string;
  sort_order: number;
}

export interface Staff {
  id: string;
  name: string;
  slug: string;
  role_title: string;
  bio: string;
  specialties: string[];
  image_url?: string;
  active: boolean;
  consultation_only: boolean;
  sort_order: number;
}

export interface StaffWorkingHour {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

export interface StaffBreak {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string;
}

export interface StaffTimeOff {
  id: string;
  staff_id: string;
  staff_name?: string;
  start_datetime: string; // ISO string
  end_datetime: string; // ISO string
  reason: string;
}

export interface SalonClosure {
  id: string;
  date: string; // 'YYYY-MM-DD'
  reason: string;
  all_day: boolean;
  start_time?: string;
  end_time?: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  booking_reference: string;
  access_token: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  staff_id: string;
  staff_name: string;
  service_id: string;
  booked_service_name: string;
  booked_price: number;
  booked_price_type: PriceType;
  booked_duration_minutes: number;
  booked_buffer_minutes: number;
  start_time: string; // UTC ISO
  end_time: string; // UTC ISO
  status: AppointmentStatus;
  notes?: string;
  internal_notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  policy_accepted: boolean;
  marketing_consent: boolean;
  patch_test_acknowledged: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReservationHold {
  id: string;
  staff_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  session_id: string;
  expires_at: string;
}

export interface NotificationLog {
  id: string;
  appointment_id?: string;
  recipient_email: string;
  type: 'confirmation' | 'cancellation' | 'reschedule' | 'reminder';
  status: 'sent' | 'failed' | 'simulated';
  subject: string;
  content: string;
  provider: string;
  error_details?: string;
  attempts: number;
  last_attempt_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}
