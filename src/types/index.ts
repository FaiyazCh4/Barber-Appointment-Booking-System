export type UserRole = 'owner_admin' | 'receptionist' | 'stylist' | 'customer';

export type PriceType = 'fixed' | 'from' | 'consultation';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface SalonConfig {
  salon: {
    name: string;
    address: string;
    phone: string;
    phone_intl: string;
    email: string;
    currency: string;
    timezone: string;
    hours_confirmed: boolean;
    online_booking_active: boolean;
    saloniq_cutover_confirmed: boolean;
    notice_banner?: string;
  };
  hours: SalonHour[];
  closures: SalonClosure[];
}

export interface SalonHour {
  day_of_week: number;
  day_name: string;
  open_time: string;
  close_time: string;
  is_open: boolean;
  is_confirmed: boolean;
}

export interface SalonClosure {
  id: string;
  date: string;
  reason: string;
  all_day: boolean;
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
  bio_text?: string;
  specialties: string[];
  image_url?: string;
  consultation_only: boolean;
  service_ids: string[];
}

export interface AvailableSlot {
  timeStr: string;
  startUtc: string;
  endUtc: string;
  availableStaff: {
    id: string;
    name: string;
    roleTitle: string;
  }[];
}

export interface Appointment {
  id: string;
  booking_reference: string;
  access_token?: string;
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
  start_time: string;
  end_time: string;
  london_date?: string;
  london_time?: string;
  status: AppointmentStatus;
  notes?: string;
  internal_notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
}

export interface LoyaltyPerk {
  id: string;
  title: string;
  pointsRequired: number;
  description: string;
  category: string;
  unlocked: boolean;
}

export interface LoyaltyHistoryItem {
  booking_reference: string;
  service_name: string;
  date: string;
  points_earned: number;
  amount: number;
  status: string;
}

export interface CustomerLoyaltyData {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  pointsBalance: number;
  lifetimePoints: number;
  totalSpend: number;
  totalVisits: number;
  tier: string;
  tierColor: string;
  nextTier: string;
  nextTierThreshold: number;
  progressPercent: number;
  pointsToNextReward: number;
  welcomeBonus: number;
  perks: LoyaltyPerk[];
  history: LoyaltyHistoryItem[];
}

export type VoucherTheme = 'bronze' | 'gold' | 'champagne';

export interface GiftVoucher {
  id: string;
  code: string;
  amount: number;
  remaining_balance: number;
  voucher_type: 'amount' | 'service';
  service_id?: string;
  service_name?: string;
  recipient_name: string;
  recipient_email: string;
  sender_name: string;
  sender_email: string;
  message?: string;
  theme: VoucherTheme;
  delivery_date?: string;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  expires_at: string;
  created_at: string;
}

export interface PurchaseVoucherPayload {
  amount: number;
  voucherType: 'amount' | 'service';
  serviceId?: string;
  serviceName?: string;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  senderEmail: string;
  message?: string;
  theme: VoucherTheme;
  deliveryDate?: string;
}

export interface Testimonial {
  id: string;
  client_name: string;
  client_location?: string;
  rating: number;
  category: 'curly' | 'precision' | 'colour' | 'mens' | 'styling';
  service_name: string;
  stylist_name: string;
  stylist_id?: string;
  quote: string;
  detail: string;
  verified: boolean;
  source: string;
  date: string;
  created_at: string;
}

export interface TestimonialStats {
  averageRating: number;
  totalReviews: number;
  verifiedPercentage: number;
  googleRating: number;
  categories: {
    id: string;
    label: string;
    count: number;
  }[];
}

export interface NewTestimonialPayload {
  client_name: string;
  client_location?: string;
  rating: number;
  category: 'curly' | 'precision' | 'colour' | 'mens' | 'styling';
  service_name: string;
  stylist_id?: string;
  stylist_name: string;
  quote: string;
  detail: string;
}

