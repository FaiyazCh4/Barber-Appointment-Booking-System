import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Info,
  Sparkles,
  Phone,
  Gift,
  Tag,
} from 'lucide-react';
import {
  createHold,
  fetchAvailability,
  submitBooking,
  validateGiftVoucher,
  redeemGiftVoucher,
} from '../api/client';
import type { AvailableSlot, SalonConfig, Service, Staff, UserProfile } from '../types';
import { BookingCalendar } from '../components/booking/BookingCalendar';
import { GiftVoucherModule } from '../components/GiftVoucherModule';

interface Props {
  config: SalonConfig | null;
  services: Service[];
  staff: Staff[];
  user: UserProfile | null;
  preSelectedServiceId?: string;
  preSelectedStaffId?: string;
  initialMode?: 'appointment' | 'voucher';
  onNavigate: (view: string, context?: any) => void;
}

export const BookingView: React.FC<Props> = ({
  config,
  services,
  staff,
  user,
  preSelectedServiceId,
  preSelectedStaffId,
  initialMode,
  onNavigate,
}) => {
  // Mode: appointment or voucher
  const [bookingMode, setBookingMode] = useState<'appointment' | 'voucher'>(initialMode || 'appointment');

  // Wizard steps: 1: Service, 2: Stylist, 3: Date & Time, 4: Client Info, 5: Review, 6: Confirmed
  const [step, setStep] = useState<number>(1);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preSelectedServiceId || '');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(preSelectedStaffId || 'any');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Tomorrow as initial date
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [activeHoldId, setActiveHoldId] = useState<string>('');
  const [sessionId] = useState<string>(() => `sess_${Math.random().toString(36).substring(2)}`);

  // Gift Voucher Redemption State
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [validatingVoucher, setValidatingVoucher] = useState<boolean>(false);
  const [voucherError, setVoucherError] = useState<string>('');

  // Client Details Form
  const [clientName, setClientName] = useState<string>(user?.full_name || '');
  const [clientEmail, setClientEmail] = useState<string>(user?.email || '');
  const [clientPhone, setClientPhone] = useState<string>(user?.phone || '');
  const [clientNotes, setClientNotes] = useState<string>('');

  // Consents (Strict separation per brief)
  const [policyAccepted, setPolicyAccepted] = useState<boolean>(false);
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);
  const [patchTestAcknowledged, setPatchTestAcknowledged] = useState<boolean>(false);

  // Async States
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [slotNotice, setSlotNotice] = useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Confirmation result
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Selected Service object
  const currentService = services.find((s) => s.id === selectedServiceId);
  const currentStaff = staff.find((s) => s.id === selectedStaffId);

  // Sync if preSelected changes
  useEffect(() => {
    if (preSelectedServiceId) setSelectedServiceId(preSelectedServiceId);
    if (preSelectedStaffId) setSelectedStaffId(preSelectedStaffId);
  }, [preSelectedServiceId, preSelectedStaffId]);

  useEffect(() => {
    if (initialMode) {
      setBookingMode(initialMode);
    }
  }, [initialMode]);

  // Load availability when service, staff, or date changes
  useEffect(() => {
    if (step === 3 && selectedServiceId && selectedDate) {
      loadSlots();
    }
  }, [step, selectedServiceId, selectedStaffId, selectedDate]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    setErrorMessage('');
    setSelectedSlot(null);
    try {
      const data = await fetchAvailability({
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        date: selectedDate,
      });
      setAvailableSlots(data.slots);
      setSlotNotice(data.salonNotice || '');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load availability');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setValidatingVoucher(true);
    setVoucherError('');
    try {
      const res = await validateGiftVoucher(voucherCodeInput.trim());
      if (res.valid && res.voucher) {
        setAppliedVoucher(res.voucher);
        setVoucherError('');
      } else {
        setVoucherError(res.error || 'Invalid or expired gift voucher code.');
        setAppliedVoucher(null);
      }
    } catch (err: any) {
      setVoucherError(err.message || 'Could not validate gift voucher.');
      setAppliedVoucher(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleBookWithVoucher = async (code: string, serviceId?: string) => {
    setBookingMode('appointment');
    if (serviceId) {
      setSelectedServiceId(serviceId);
    }
    setVoucherCodeInput(code);
    setValidatingVoucher(true);
    try {
      const res = await validateGiftVoucher(code);
      if (res.valid && res.voucher) {
        setAppliedVoucher(res.voucher);
      }
    } catch (err) {
      console.warn(err);
    } finally {
      setValidatingVoucher(false);
    }
    setStep(1);
  };

  // Step 3: Handle slot selection and create temporary hold
  const handleSelectSlot = async (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setErrorMessage('');
    try {
      const holdRes = await createHold({
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        dateStr: selectedDate,
        timeStr: slot.timeStr,
        sessionId,
      });
      setActiveHoldId(holdRes.hold.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not hold slot. Please pick another.');
      setSelectedSlot(null);
    }
  };

  // Step 5: Final Submission
  const handleConfirmBooking = async () => {
    if (!currentService || !selectedSlot) return;

    if (!clientName.trim() || !clientEmail.trim() || !clientPhone.trim()) {
      setErrorMessage('Please complete all contact details in Step 4.');
      setStep(4);
      return;
    }

    if (!policyAccepted) {
      setErrorMessage('Please accept the salon booking & cancellation policy.');
      setStep(4);
      return;
    }

    if (currentService.requires_patch_test && !patchTestAcknowledged) {
      setErrorMessage('Skin allergy patch test acknowledgment is required for colour services.');
      setStep(4);
      return;
    }

    setBookingSubmitting(true);
    setErrorMessage('');

    try {
      const idempotencyKey = `idem_${sessionId}_${selectedSlot.timeStr}`;
      const res = await submitBooking({
        idempotencyKey,
        serviceId: selectedServiceId,
        staffId: selectedStaffId,
        dateStr: selectedDate,
        timeStr: selectedSlot.timeStr,
        sessionId,
        customerName: clientName,
        customerEmail: clientEmail,
        customerPhone: clientPhone,
        notes: clientNotes,
        policyAccepted,
        marketingConsent,
        patchTestAcknowledged,
      });

      setConfirmedBooking(res.appointment);

      // Redeem voucher if applied
      if (appliedVoucher && currentService) {
        try {
          const discount = Math.min(appliedVoucher.remaining_balance, currentService.price);
          await redeemGiftVoucher(appliedVoucher.code, discount, res.appointment.booking_reference);
        } catch (vErr) {
          console.warn('Voucher deduction note:', vErr);
        }
      }

      setStep(6);
    } catch (err: any) {
      const msg = err.message || 'Booking submission failed. Please try again.';
      setErrorMessage(msg);
      // Only return to step 3 if the specific slot is genuinely unavailable or expired
      if (
        msg.toLowerCase().includes('no longer available') ||
        msg.toLowerCase().includes('choose another') ||
        msg.toLowerCase().includes('slot expired')
      ) {
        setStep(3);
        loadSlots();
      }
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Eligible stylists for the chosen service
  const eligibleStylists = staff.filter((st) =>
    selectedServiceId ? st.service_ids.includes(selectedServiceId) : true,
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-[#262420] text-xs font-medium">
        <button
          type="button"
          onClick={() => setBookingMode('appointment')}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            bookingMode === 'appointment'
              ? 'border-[#9B8058] text-[#F5F1EA] font-semibold bg-[#1A1815]'
              : 'border-transparent text-[#8C8273] hover:text-[#D9D1C5]'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-[#BFA57D]" />
          <span>Book Salon Appointment</span>
        </button>
        <button
          type="button"
          onClick={() => setBookingMode('voucher')}
          className={`py-3 px-5 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            bookingMode === 'voucher'
              ? 'border-[#9B8058] text-[#F5F1EA] font-semibold bg-[#1A1815]'
              : 'border-transparent text-[#8C8273] hover:text-[#D9D1C5]'
          }`}
        >
          <Gift className="w-4 h-4 text-[#BFA57D]" />
          <span>Buy Gift Voucher</span>
        </button>
      </div>

      {bookingMode === 'voucher' ? (
        <GiftVoucherModule
          services={services}
          onBookWithVoucher={handleBookWithVoucher}
          onClose={() => setBookingMode('appointment')}
        />
      ) : (
        <>
          {/* Wizard Header & Stepper */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
                Online Appointment Booking
              </span>
              <span className="text-xs font-mono-numbers text-[#8C8273]">
                {step <= 5 ? `Step ${step} of 5` : 'Booking Complete'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA]">
              {step === 1 && 'Choose Your Service'}
              {step === 2 && 'Select Stylist'}
              {step === 3 && 'Pick Date & Time'}
              {step === 4 && 'Your Details'}
              {step === 5 && 'Review & Confirm Appointment'}
              {step === 6 && 'Appointment Confirmed'}
            </h1>

            {/* Progress Bar */}
            {step <= 5 && (
              <div className="grid grid-cols-5 gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-xs transition-colors ${
                      step >= i ? 'bg-[#9B8058]' : 'bg-[#262626]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-red-950/40 border border-red-800/80 p-4 rounded-sm flex items-start gap-3 text-xs text-red-200">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* STEP 1: Select Service */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Gift Voucher Teaser Banner */}
          <div className="bg-[#1C1A17] border border-[#3E3529] p-4 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-sm bg-[#2A241C] border border-[#3E3425] text-[#BFA57D] flex items-center justify-center shrink-0">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-[#F5F1EA] block">Looking for a luxury gift for someone?</strong>
                <span className="text-[#A69B8D]">Purchase a digital gift voucher valid for any treatment or monetary value.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBookingMode('voucher')}
              className="bg-[#2A241C] hover:bg-[#382F22] border border-[#443828] text-[#BFA57D] hover:text-[#F5F1EA] px-3.5 py-2 rounded-sm font-semibold transition-colors shrink-0 text-center cursor-pointer"
            >
              Buy Gift Voucher
            </button>
          </div>

          <p className="text-xs text-[#A69B8D]">
            Select a service to view availability. Colour, extensions, and hair system services include mandatory consultation prerequisites.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((srv) => {
              const isSelected = selectedServiceId === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`p-5 rounded-sm border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-[#23201C] border-[#9B8058] shadow-md'
                      : 'bg-[#181818] border-[#262626] hover:border-[#3E3A33]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#8C8273]">
                      <span className="flex items-center gap-1 font-mono-numbers">
                        <Clock className="w-3 h-3 text-[#BFA57D]" />
                        {srv.duration_minutes}m
                      </span>
                      {srv.requires_patch_test && (
                        <span className="text-[10px] text-[#BFA57D] font-medium bg-[#2C241B] px-1.5 py-0.5 rounded-xs">
                          48h Patch Test
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                      {srv.name}
                    </h3>
                    <p className="text-xs text-[#A69B8D] leading-relaxed line-clamp-2">
                      {srv.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#242424] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8C8273] block uppercase">
                        {srv.price_type === 'consultation' ? 'Consultation' : srv.price_type === 'from' ? 'From' : 'Fixed'}
                      </span>
                      <span className="font-serif-heading text-lg text-[#F5F1EA] font-mono-numbers">
                        {srv.price_type === 'consultation' ? 'Free' : `£${srv.price.toFixed(2)}`}
                      </span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#9B8058] bg-[#9B8058] text-[#141414]'
                          : 'border-[#444]'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              disabled={!selectedServiceId}
              onClick={() => setStep(2)}
              className="bg-[#9B8058] hover:bg-[#856C47] disabled:opacity-40 text-[#141414] font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-sm transition-colors flex items-center gap-2"
            >
              <span>Continue to Stylist</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Stylist */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#A69B8D]">
            <span>
              Selected Treatment: <strong className="text-[#F5F1EA]">{currentService?.name}</strong>
            </span>
            <button
              onClick={() => setStep(1)}
              className="text-[#BFA57D] underline hover:text-white"
            >
              Change Service
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Any Available Stylist */}
            <div
              onClick={() => setSelectedStaffId('any')}
              className={`p-5 rounded-sm border cursor-pointer transition-all flex items-center justify-between ${
                selectedStaffId === 'any'
                  ? 'bg-[#23201C] border-[#9B8058] shadow-md'
                  : 'bg-[#181818] border-[#262626] hover:border-[#3E3A33]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#BFA57D]" />
                  <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                    Any Available Stylist
                  </h3>
                </div>
                <p className="text-xs text-[#A69B8D]">
                  Finds the earliest available appointment with any qualified stylist.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                  selectedStaffId === 'any'
                    ? 'border-[#9B8058] bg-[#9B8058] text-[#141414]'
                    : 'border-[#444]'
                }`}
              >
                {selectedStaffId === 'any' && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Individual Stylists */}
            {eligibleStylists.map((st) => {
              const isSelected = selectedStaffId === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStaffId(st.id)}
                  className={`p-5 rounded-sm border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#23201C] border-[#9B8058] shadow-md'
                      : 'bg-[#181818] border-[#262626] hover:border-[#3E3A33]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2A2722] border border-[#3E382E] overflow-hidden flex items-center justify-center font-serif-heading text-lg text-[#F5F1EA] shrink-0">
                      {st.image_url ? (
                        <img
                          src={st.image_url}
                          alt={st.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        st.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif-heading text-lg text-[#F5F1EA]">{st.name}</h3>
                      <span className="text-[11px] text-[#8C8273]">{st.role_title}</span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-3 ${
                      isSelected
                        ? 'border-[#9B8058] bg-[#9B8058] text-[#141414]'
                        : 'border-[#444]'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-xs uppercase tracking-wider font-semibold text-[#A69B8D] hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-sm transition-colors flex items-center gap-2"
            >
              <span>Continue to Date & Time</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pick Date & Time via Public-Facing Interactive Calendar */}
      {step === 3 && (
        <div className="space-y-6">
          <BookingCalendar
            config={config}
            service={currentService}
            staff={currentStaff}
            selectedStaffId={selectedStaffId}
            selectedDate={selectedDate}
            onSelectDate={(newDate) => {
              setSelectedDate(newDate);
              setSelectedSlot(null);
            }}
            availableSlots={availableSlots}
            loadingSlots={loadingSlots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSelectSlot}
            slotNotice={slotNotice}
            errorMessage={errorMessage}
          />

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-xs uppercase tracking-wider font-semibold text-[#A69B8D] hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
              className="bg-[#9B8058] hover:bg-[#856C47] disabled:opacity-40 text-[#141414] font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-sm transition-colors flex items-center gap-2"
            >
              <span>Continue to Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Client Details & Required Consent */}
      {step === 4 && (
        <div className="space-y-6">
          <p className="text-xs text-[#A69B8D]">
            Please enter your contact details. Required policy acceptance is strictly separated from optional marketing consent.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-[#191919] border border-[#2D2D2D] rounded-sm px-4 py-2.5 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="sarah@example.co.uk"
                className="w-full bg-[#191919] border border-[#2D2D2D] rounded-sm px-4 py-2.5 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
              />
              <span className="text-[10px] text-[#8C8273]">Booking confirmation will be sent here.</span>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                Mobile Telephone *
              </label>
              <input
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="07700 900123"
                className="w-full bg-[#191919] border border-[#2D2D2D] rounded-sm px-4 py-2.5 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
              />
              <span className="text-[10px] text-[#8C8273]">Used if the salon needs to reach you.</span>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                Appointment Notes or Hair History (Optional)
              </label>
              <textarea
                rows={3}
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                placeholder="Details on previous colour, curl patterns, or specific questions..."
                className="w-full bg-[#191919] border border-[#2D2D2D] rounded-sm px-4 py-2.5 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
              />
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-3 pt-4 border-t border-[#262626]">
            {currentService?.requires_patch_test && (
              <label className="flex items-start gap-3 p-3 bg-[#231E17] border border-[#44382A] rounded-sm text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={patchTestAcknowledged}
                  onChange={(e) => setPatchTestAcknowledged(e.target.checked)}
                  className="mt-0.5 accent-[#9B8058] rounded-xs"
                />
                <span className="text-[#D9D1C5]">
                  <strong className="text-[#F5F1EA] block">48-Hour Allergy Patch Test Acknowledgment *</strong>
                  I confirm that I understand this colour service requires an allergy patch test at least 48 hours before my appointment at 14 St John Street, Bromsgrove.
                </span>
              </label>
            )}

            <label className="flex items-start gap-3 p-3 bg-[#181818] border border-[#262626] rounded-sm text-xs cursor-pointer">
              <input
                type="checkbox"
                required
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="mt-0.5 accent-[#9B8058] rounded-xs"
              />
              <span className="text-[#D9D1C5]">
                <strong className="text-[#F5F1EA] block">Required Booking & Cancellation Policy Acceptance *</strong>
                I agree to the salon policy, which requires at least 24 hours notice to reschedule or cancel an appointment. Payment is settled at the salon following service completion.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 bg-[#181818] border border-[#262626] rounded-sm text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 accent-[#9B8058] rounded-xs"
              />
              <span className="text-[#A69B8D]">
                <span className="text-[#D9D1C5] font-medium block">Optional Salon Communications</span>
                I would like to receive occasional styling advice, seasonal updates, and promotional invitations from George Davis Hairdressing.
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              onClick={() => setStep(3)}
              className="text-xs uppercase tracking-wider font-semibold text-[#A69B8D] hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              disabled={
                !clientName ||
                !clientEmail ||
                !clientPhone ||
                !policyAccepted ||
                (Boolean(currentService?.requires_patch_test) && !patchTestAcknowledged)
              }
              onClick={() => setStep(5)}
              className="bg-[#9B8058] hover:bg-[#856C47] disabled:opacity-40 text-[#141414] font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-sm transition-colors flex items-center gap-2"
            >
              <span>Review Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Confirm */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="bg-[#191919] border border-[#2B2925] rounded-sm p-6 sm:p-8 space-y-6">
            <h3 className="font-serif-heading text-2xl text-[#F5F1EA] border-b border-[#262420] pb-4">
              Booking Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                  Service
                </span>
                <strong className="text-sm text-[#F5F1EA] block">{currentService?.name}</strong>
                <span className="text-[#A69B8D]">{currentService?.duration_minutes} minutes duration</span>
              </div>

              <div className="space-y-1">
                <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                  Estimated Price
                </span>
                <div className="flex items-baseline gap-2">
                  <strong className="text-xl font-serif-heading text-[#F5F1EA] block font-mono-numbers">
                    {currentService?.price_type === 'consultation'
                      ? 'Complimentary'
                      : appliedVoucher && currentService
                      ? `£${Math.max(0, currentService.price - Math.min(appliedVoucher.remaining_balance, currentService.price)).toFixed(2)}`
                      : currentService?.price_type === 'from'
                      ? `From £${currentService.price.toFixed(2)}`
                      : `£${(currentService?.price || 0).toFixed(2)}`}
                  </strong>
                  {appliedVoucher && currentService && currentService.price_type !== 'consultation' && (
                    <span className="text-xs text-[#8C8273] line-through font-mono">
                      £{currentService.price.toFixed(2)}
                    </span>
                  )}
                </div>
                <span className="text-[#8C8273]">
                  {appliedVoucher && currentService && currentService.price - Math.min(appliedVoucher.remaining_balance, currentService.price) <= 0
                    ? 'Fully covered by gift voucher'
                    : 'Payable at the salon'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                  Date & Local Time
                </span>
                <strong className="text-sm text-[#F5F1EA] block">
                  {selectedDate} at {selectedSlot?.timeStr}
                </strong>
                <span className="text-[#8C8273]">Europe/London Time</span>
              </div>

              <div className="space-y-1">
                <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                  Assigned Stylist
                </span>
                <div className="flex items-center gap-2 pt-0.5">
                  {selectedStaffId !== 'any' && currentStaff?.image_url && (
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#3E382E]">
                      <img src={currentStaff.image_url} alt={currentStaff.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <strong className="text-sm text-[#F5F1EA] block">
                    {selectedStaffId === 'any' ? 'Assigned automatically' : currentStaff?.name}
                  </strong>
                </div>
                <span className="text-[11px] text-[#8C8273]">George Davis Bromsgrove Team</span>
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-[#242424]">
                <span className="text-[#8C8273] block uppercase tracking-wider text-[10px]">
                  Client Details
                </span>
                <p className="text-xs text-[#D9D1C5]">
                  {clientName} · {clientEmail} · {clientPhone}
                </p>
                {clientNotes && (
                  <p className="text-[#8C8273] italic pt-1">Notes: "{clientNotes}"</p>
                )}
              </div>
            </div>

            {/* Gift Voucher Application Box */}
            <div className="bg-[#141414] border border-[#2B2925] p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D9D1C5] flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-[#BFA57D]" />
                  <span>Have a Gift Voucher or Salon Credit?</span>
                </span>
                {appliedVoucher && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Voucher Applied</span>
                  </span>
                )}
              </div>

              {!appliedVoucher ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter voucher code (e.g. GD-GIFT-A8B2-1029)"
                    value={voucherCodeInput}
                    onChange={(e) => {
                      setVoucherCodeInput(e.target.value.toUpperCase());
                      setVoucherError('');
                    }}
                    className="flex-1 bg-[#191919] border border-[#2D2D2D] rounded-sm px-3.5 py-2 text-xs font-mono text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                  />
                  <button
                    type="button"
                    disabled={validatingVoucher || !voucherCodeInput.trim()}
                    onClick={handleApplyVoucher}
                    className="bg-[#2A241C] hover:bg-[#3A3326] border border-[#3E3425] text-[#D9D1C5] hover:text-white px-4 py-2 rounded-sm text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    {validatingVoucher ? 'Checking...' : 'Apply Voucher'}
                  </button>
                </div>
              ) : (
                <div className="bg-[#1C1A17] border border-[#3A342B] p-3 rounded-sm flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-[#BFA57D] font-semibold block">{appliedVoucher.code}</span>
                    <span className="text-[11px] text-[#A69B8D]">
                      Available voucher balance: £{appliedVoucher.remaining_balance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-emerald-400">
                      -£{Math.min(appliedVoucher.remaining_balance, currentService?.price || 0).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedVoucher(null);
                        setVoucherCodeInput('');
                      }}
                      className="text-xs text-[#8C8273] hover:text-white underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {voucherError && (
                <p className="text-xs text-red-400">{voucherError}</p>
              )}
            </div>

            <div className="bg-[#141414] p-4 rounded-sm border border-[#242424] text-xs text-[#8C8273] space-y-1">
              <strong className="text-[#D9D1C5] block font-medium">Cancellation Terms</strong>
              <p>
                Cancellations or changes require at least 24 hours notice. If you need to make changes, use your booking reference or telephone 01527 577000.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              disabled={bookingSubmitting}
              onClick={() => setStep(4)}
              className="text-xs uppercase tracking-wider font-semibold text-[#A69B8D] hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              disabled={bookingSubmitting}
              onClick={handleConfirmBooking}
              className="bg-[#9B8058] hover:bg-[#856C47] disabled:opacity-40 text-[#141414] font-bold text-xs uppercase tracking-wider px-10 py-4 rounded-sm transition-all flex items-center gap-2 shadow-lg"
            >
              {bookingSubmitting ? (
                <span>Confirming Appointment...</span>
              ) : (
                <>
                  <span>Confirm Appointment</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Confirmation Screen */}
      {step === 6 && confirmedBooking && (
        <div className="bg-[#181818] border border-[#2B2925] rounded-sm p-8 sm:p-10 space-y-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#231F19] border border-[#9B8058] flex items-center justify-center text-[#9B8058] mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
              Appointment Confirmed
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA]">
              We Look Forward to Welcoming You
            </h2>
            <p className="text-xs sm:text-sm text-[#A69B8D] max-w-md mx-auto">
              Your appointment has been registered in our live calendar. A confirmation summary has been enqueued to your email.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-[#141414] border border-[#282622] p-6 rounded-sm max-w-md mx-auto space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-[#8C8273] block">
              Booking Reference
            </span>
            <div className="text-2xl font-serif-heading font-mono-numbers text-[#BFA57D] tracking-wider select-all">
              {confirmedBooking.booking_reference}
            </div>
            {/* Voucher Applied Notification */}
            {appliedVoucher && currentService && (
              <div className="bg-[#1C1A17] border border-[#3E3425] p-3 rounded-sm text-xs text-[#BFA57D]">
                <span>
                  Gift voucher <strong className="font-mono">{appliedVoucher.code}</strong> applied (-£{Math.min(appliedVoucher.remaining_balance, currentService.price).toFixed(2)} discount applied to booking)
                </span>
              </div>
            )}

            <div className="text-xs text-[#D9D1C5] pt-2 border-t border-[#222] space-y-1">
              <div>
                <strong>{confirmedBooking.booked_service_name}</strong> with {confirmedBooking.staff_name}
              </div>
              <div className="text-[#8C8273] font-mono-numbers">
                {confirmedBooking.start_time.split('T')[0]} at{' '}
                {new Date(confirmedBooking.start_time).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Europe/London',
                })}{' '}
                (Europe/London)
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={`/api/bookings/${confirmedBooking.booking_reference}/ics`}
              download
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#141414] bg-[#9B8058] hover:bg-[#856C47] px-6 py-3.5 rounded-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Add to Calendar (.ics)</span>
            </a>

            <button
              onClick={() =>
                onNavigate('manage', {
                  reference: confirmedBooking.booking_reference,
                  email: confirmedBooking.customer_email,
                })
              }
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F5F1EA] border border-[#3E382E] hover:border-white px-6 py-3.5 rounded-sm transition-colors"
            >
              <span>Manage Booking</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#242424] text-xs text-[#8C8273] space-y-1">
            <p>14 St John Street, Bromsgrove, B61 8QY · 01527 577000</p>
            <p>Please remember: 48-hour patch testing is required for all colour services.</p>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
