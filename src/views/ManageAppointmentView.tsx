import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Search,
  Phone,
  Gift,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  cancelBooking,
  fetchAvailability,
  lookupBooking,
  rescheduleBooking,
  fetchCustomerLoyalty,
} from '../api/client';
import type { AvailableSlot, UserProfile, CustomerLoyaltyData } from '../types';
import { LoyaltyRewardsModule } from '../components/LoyaltyRewardsModule';

interface Props {
  user: UserProfile | null;
  initialReference?: string;
  initialEmail?: string;
  onNavigate: (view: string, context?: any) => void;
}

export const ManageAppointmentView: React.FC<Props> = ({
  user,
  initialReference,
  initialEmail,
  onNavigate,
}) => {
  const [activePortalTab, setActivePortalTab] = useState<'appointment' | 'loyalty'>('appointment');
  const [reference, setReference] = useState<string>(initialReference || '');
  const [email, setEmail] = useState<string>(initialEmail || user?.email || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [loyalty, setLoyalty] = useState<CustomerLoyaltyData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Reschedule Modal State
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [newSlots, setNewSlots] = useState<AvailableSlot[]>([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState<AvailableSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [reschedulingSubmitting, setReschedulingSubmitting] = useState<boolean>(false);

  // Cancel Modal State
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancellingSubmitting, setCancellingSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialReference && (initialEmail || user?.email)) {
      handleLookup();
    }
  }, [initialReference]);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!reference.trim() || !email.trim()) {
      setErrorMessage('Please provide both your booking reference and email address.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await lookupBooking(reference.trim(), email.trim());
      setAppointment(res.appointment);
      if (res.loyalty) {
        setLoyalty(res.loyalty);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Appointment not found. Please check your reference and email.');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoyaltyLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() && !reference.trim()) {
      setErrorMessage('Please enter your client email address or booking reference.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const res = await fetchCustomerLoyalty({ email: email.trim(), reference: reference.trim() });
      setLoyalty(res.loyalty);
      setSuccessMessage('Customer loyalty profile loaded successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load loyalty rewards profile.');
      setLoyalty(null);
    } finally {
      setLoading(false);
    }
  };

  const openRescheduleModal = async () => {
    setIsRescheduling(true);
    setErrorMessage('');
    loadRescheduleSlots();
  };

  const loadRescheduleSlots = async () => {
    if (!appointment) return;
    setLoadingSlots(true);
    setSelectedNewSlot(null);
    try {
      const data = await fetchAvailability({
        serviceId: appointment.service_id,
        staffId: appointment.staff_id,
        date: newDate,
      });
      setNewSlots(data.slots);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load alternative slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!appointment || !selectedNewSlot) return;
    setReschedulingSubmitting(true);
    setErrorMessage('');
    try {
      const res = await rescheduleBooking({
        reference: appointment.booking_reference,
        email: appointment.customer_email,
        newDateStr: newDate,
        newTimeStr: selectedNewSlot.timeStr,
        newStaffId: selectedNewSlot.availableStaff[0]?.id || appointment.staff_id,
      });
      setAppointment(res.appointment);
      setSuccessMessage('Your appointment has been successfully rescheduled.');
      setIsRescheduling(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Rescheduling failed.');
    } finally {
      setReschedulingSubmitting(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!appointment) return;
    setCancellingSubmitting(true);
    setErrorMessage('');
    try {
      await cancelBooking({
        reference: appointment.booking_reference,
        email: appointment.customer_email,
        reason: cancelReason,
      });
      setAppointment({ ...appointment, status: 'cancelled' });
      setSuccessMessage('Your appointment has been cancelled and the slot released.');
      setIsCancelling(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Cancellation failed.');
    } finally {
      setCancellingSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
      <div className="space-y-4 max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
          Client Portal & Salon Circle
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA]">
          Client Account & Rewards
        </h1>
        <p className="text-sm text-[#A69B8D] leading-relaxed">
          Manage your appointment reservations, download calendar invitations, reschedule dates, and track your Salon Circle loyalty points and exclusive reward perks.
        </p>
      </div>

      {/* Portal Tab Switcher */}
      <div className="flex border-b border-[#262420] text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setActivePortalTab('appointment');
            setErrorMessage('');
          }}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 ${
            activePortalTab === 'appointment'
              ? 'border-[#9B8058] text-[#F5F1EA] font-semibold bg-[#1A1815]'
              : 'border-transparent text-[#8C8273] hover:text-[#D9D1C5]'
          }`}
        >
          <Calendar className="w-4 h-4 text-[#BFA57D]" />
          <span>Manage Existing Appointment</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActivePortalTab('loyalty');
            setErrorMessage('');
            if (email && !loyalty) {
              handleLoyaltyLookup();
            }
          }}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 ${
            activePortalTab === 'loyalty'
              ? 'border-[#9B8058] text-[#F5F1EA] font-semibold bg-[#1A1815]'
              : 'border-transparent text-[#8C8273] hover:text-[#D9D1C5]'
          }`}
        >
          <Award className="w-4 h-4 text-[#D4AF37]" />
          <span>Loyalty Rewards & Perks</span>
        </button>
      </div>

      {/* Lookup Form */}
      {activePortalTab === 'appointment' ? (
        <form
          onSubmit={handleLookup}
          className="bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <h3 className="font-serif-heading text-lg text-[#F5F1EA]">
              Find Your Booking
            </h3>
            <span className="text-[11px] text-[#8C8273]">Lookup with Reference & Email</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                Booking Reference *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GD-2026-B871"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs font-mono-numbers focus:outline-none focus:border-[#9B8058]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                Booking Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="sarah@example.co.uk"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#736B5E]">
              Booking reference was sent to your email during reservation.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors flex items-center gap-2"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{loading ? 'Finding Appointment...' : 'Lookup Booking'}</span>
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleLoyaltyLookup}
          className="bg-[#181818] border border-[#2B2925] p-6 rounded-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#242424] pb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#BFA57D]" />
              <h3 className="font-serif-heading text-lg text-[#F5F1EA]">
                Check Loyalty Rewards Balance
              </h3>
            </div>
            <span className="text-[11px] text-[#8C8273]">Lookup by Client Email</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                Registered Client Email Address *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter the email address you use for salon visits"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-[#141414] border border-[#2D2D2D] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? 'Retrieving Rewards...' : 'View Loyalty Profile'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-950/40 border border-red-800/80 p-4 rounded-sm flex items-start gap-3 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-950/40 border border-emerald-800/80 p-4 rounded-sm flex items-start gap-3 text-xs text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Loaded Appointment Card (Shown when an appointment is loaded) */}
      {appointment && activePortalTab === 'appointment' && (
        <div className="bg-[#181818] border border-[#2B2925] rounded-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262420] pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#8C8273] block">
                Booking Reference
              </span>
              <span className="font-serif-heading font-mono-numbers text-2xl text-[#BFA57D]">
                {appointment.booking_reference}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs uppercase font-semibold px-2.5 py-1 rounded-xs ${
                  appointment.status === 'confirmed'
                    ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-700/50'
                    : appointment.status === 'cancelled'
                    ? 'bg-red-900/50 text-red-200 border border-red-700/50'
                    : 'bg-[#2A2A2A] text-[#D9D1C5]'
                }`}
              >
                Status: {appointment.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                Service
              </span>
              <strong className="text-sm text-[#F5F1EA] block">
                {appointment.booked_service_name}
              </strong>
              <span className="text-[#A69B8D]">{appointment.booked_duration_minutes} minutes duration</span>
            </div>

            <div className="space-y-1">
              <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                Stylist
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <div className="w-6 h-6 rounded-full overflow-hidden border border-[#3E382E] shrink-0 bg-[#24211D]">
                  <img
                    src={`/images/stylists/${appointment.staff_id.replace('staff_', '').replace(/_/g, '-')}.jpg`}
                    alt={appointment.staff_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <strong className="text-sm text-[#F5F1EA] block">{appointment.staff_name}</strong>
              </div>
              <span className="text-[#8C8273]">George Davis Bromsgrove</span>
            </div>

            <div className="space-y-1">
              <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                Date & Local Time
              </span>
              <strong className="text-sm text-[#F5F1EA] block">
                {appointment.london_date}
              </strong>
              <span className="text-[#BFA57D] font-mono-numbers font-medium">
                {appointment.london_time} (Europe/London)
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                Estimated Price
              </span>
              <strong className="text-lg font-serif-heading text-[#F5F1EA] font-mono-numbers block">
                {appointment.booked_price_type === 'consultation'
                  ? 'Complimentary'
                  : appointment.booked_price_type === 'from'
                  ? `From £${appointment.booked_price.toFixed(2)}`
                  : `£${appointment.booked_price.toFixed(2)}`}
              </strong>
              <span className="text-[#8C8273]">Payable at the salon</span>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                Client & Contact
              </span>
              <p className="text-xs text-[#D9D1C5]">
                {appointment.customer_name} · {appointment.customer_email} · {appointment.customer_phone}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[#262420] flex flex-wrap items-center gap-3">
            <a
              href={`/api/bookings/${appointment.booking_reference}/ics`}
              download
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] px-4 py-2.5 rounded-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ics Calendar</span>
            </a>

            {appointment.status === 'confirmed' && (
              <>
                <button
                  onClick={openRescheduleModal}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#F5F1EA] border border-[#443E36] hover:border-white px-4 py-2.5 rounded-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reschedule Slot</span>
                </button>

                <button
                  onClick={() => setIsCancelling(true)}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-red-300 border border-red-900/60 hover:border-red-400 px-4 py-2.5 rounded-sm transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Appointment</span>
                </button>
              </>
            )}

            {appointment.status === 'cancelled' && (
              <button
                onClick={() => onNavigate('book', { serviceId: appointment.service_id })}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#141414] bg-[#D9D1C5] hover:bg-white px-5 py-2.5 rounded-sm transition-colors"
              >
                <span>Re-Book This Treatment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loyalty Rewards Module (Customer Profile) */}
      {loyalty && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <h2 className="font-serif-heading text-xl text-[#F5F1EA]">
                Customer Profile: Loyalty Rewards
              </h2>
            </div>
            {loyalty.customerName && (
              <span className="text-xs text-[#BFA57D] font-medium">
                Client: {loyalty.customerName}
              </span>
            )}
          </div>

          <LoyaltyRewardsModule loyalty={loyalty} onBookNext={() => onNavigate('book')} />
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {isRescheduling && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-[#2B2925] rounded-sm max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#262420] pb-3">
              <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                Reschedule Appointment
              </h3>
              <button
                onClick={() => setIsRescheduling(false)}
                className="text-xs text-[#8C8273] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#D9D1C5]">
              <p>
                Select a new date and available time slot for your appointment with{' '}
                <strong className="text-[#F5F1EA]">{appointment.staff_name}</strong>.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#BFA57D]">
                  Choose New Date
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setNewDate(e.target.value);
                    }}
                    className="flex-1 bg-[#141414] border border-[#2B2925] px-3 py-2 text-xs text-[#F5F1EA] rounded-sm font-mono-numbers"
                  />
                  <button
                    onClick={loadRescheduleSlots}
                    className="bg-[#262420] hover:bg-[#3A352F] text-[#D9D1C5] px-3 py-2 rounded-sm text-xs"
                  >
                    Check Date
                  </button>
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center text-[#8C8273]">
                  Loading availability...
                </div>
              ) : newSlots.length === 0 ? (
                <p className="text-amber-400/90 py-2">
                  No slots available for this date. Please try another day.
                </p>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#BFA57D]">
                    Available Times ({newSlots.length})
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    {newSlots.map((slot) => (
                      <button
                        key={slot.startUtc}
                        type="button"
                        onClick={() => setSelectedNewSlot(slot)}
                        className={`py-2 px-2 text-center rounded-sm font-mono text-xs border transition-colors ${
                          selectedNewSlot?.startUtc === slot.startUtc
                            ? 'bg-[#9B8058] text-[#141414] font-bold border-[#9B8058]'
                            : 'bg-[#141414] text-[#F5F1EA] border-[#2A2A2A] hover:border-[#9B8058]'
                        }`}
                      >
                        {slot.timeStr}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#262420] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                className="px-4 py-2 text-xs text-[#8C8273] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedNewSlot || reschedulingSubmitting}
                onClick={handleConfirmReschedule}
                className="px-5 py-2 text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] rounded-sm disabled:opacity-50"
              >
                {reschedulingSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {isCancelling && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-red-900/60 rounded-sm max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#262420] pb-3">
              <h3 className="font-serif-heading text-xl text-red-300">
                Cancel Appointment
              </h3>
              <button
                onClick={() => setIsCancelling(false)}
                className="text-xs text-[#8C8273] hover:text-white"
              >
                Back
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#D9D1C5]">
              <p>
                Are you sure you want to cancel booking{' '}
                <strong className="text-[#F5F1EA] font-mono">
                  {appointment.booking_reference}
                </strong>
                ? This will permanently release the stylist time slot.
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#BFA57D]">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict, unwell, rebooking later"
                  className="w-full bg-[#141414] border border-[#2B2925] p-2 text-xs text-[#F5F1EA] rounded-sm focus:outline-none focus:border-[#9B8058]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#262420] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCancelling(false)}
                className="px-4 py-2 text-xs text-[#8C8273] hover:text-white"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingSubmitting}
                onClick={handleConfirmCancel}
                className="px-5 py-2 text-xs font-semibold text-white bg-red-800 hover:bg-red-700 rounded-sm disabled:opacity-50"
              >
                {cancellingSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

