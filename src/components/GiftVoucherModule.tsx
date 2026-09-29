import React, { useState } from 'react';
import {
  Gift,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Heart,
  ArrowRight,
  ShieldCheck,
  Info,
  Clock,
  Printer,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import type { GiftVoucher, PurchaseVoucherPayload, Service, VoucherTheme } from '../types';
import { purchaseGiftVoucher } from '../api/client';

interface Props {
  services: Service[];
  onBookWithVoucher?: (voucherCode: string, serviceId?: string) => void;
  onClose?: () => void;
}

const PRESET_AMOUNTS = [25, 50, 75, 100, 150, 200];

export const GiftVoucherModule: React.FC<Props> = ({
  services,
  onBookWithVoucher,
  onClose,
}) => {
  // Mode: 'amount' or 'service'
  const [voucherType, setVoucherType] = useState<'amount' | 'service'>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || '');

  // Theme: 'bronze' | 'gold' | 'champagne'
  const [theme, setTheme] = useState<VoucherTheme>('bronze');

  // Form Fields
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [senderName, setSenderName] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  // Payment & Status
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [purchasedVoucher, setPurchasedVoucher] = useState<GiftVoucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Compute final amount
  const finalAmount =
    voucherType === 'service' && selectedService
      ? selectedService.price
      : customAmount
      ? parseFloat(customAmount) || 0
      : selectedAmount;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (finalAmount < 20 || finalAmount > 1000) {
      setErrorMessage('Please select or enter an amount between £20 and £1,000.');
      return;
    }

    if (!recipientName.trim() || !recipientEmail.trim()) {
      setErrorMessage("Please enter the recipient's name and email.");
      return;
    }

    if (!senderName.trim() || !senderEmail.trim()) {
      setErrorMessage('Please enter your name and email address.');
      return;
    }

    setLoading(true);
    try {
      const payload: PurchaseVoucherPayload = {
        amount: finalAmount,
        voucherType,
        serviceId: voucherType === 'service' ? selectedServiceId : undefined,
        serviceName: voucherType === 'service' ? selectedService?.name : undefined,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        message: message.trim() || undefined,
        theme,
        deliveryDate: deliveryDate || undefined,
      };

      const res = await purchaseGiftVoucher(payload);
      setPurchasedVoucher(res.voucher);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Card theme stylings
  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          wrapper: 'bg-gradient-to-br from-[#2D2415] via-[#1F190E] to-[#120F09] border-[#BFA57D]/70 text-[#F5F1EA]',
          badge: 'bg-[#BFA57D] text-[#141414]',
          accentText: 'text-[#D4AF37]',
          subtext: 'text-[#D9D1C5]',
          border: 'border-[#75623E]',
        };
      case 'champagne':
        return {
          wrapper: 'bg-gradient-to-br from-[#282725] via-[#1E1D1B] to-[#141413] border-[#D9D1C5]/60 text-[#F5F1EA]',
          badge: 'bg-[#E5DFD5] text-[#141414]',
          accentText: 'text-[#F5F1EA]',
          subtext: 'text-[#C7BFB5]',
          border: 'border-[#4D4A45]',
        };
      default: // bronze
        return {
          wrapper: 'bg-gradient-to-br from-[#211B14] via-[#191510] to-[#110E0B] border-[#9B8058]/60 text-[#F5F1EA]',
          badge: 'bg-[#9B8058] text-[#141414]',
          accentText: 'text-[#BFA57D]',
          subtext: 'text-[#A69B8D]',
          border: 'border-[#4E3F2E]',
        };
    }
  };

  const themeStyles = getThemeStyles();

  // If purchase complete, show the celebration & gift voucher card presentation
  if (purchasedVoucher) {
    return (
      <div className="bg-[#181818] border border-[#2B2925] rounded-sm p-6 sm:p-10 space-y-8 animate-fadeIn">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D] block">
            Digital Gift Voucher Created
          </span>
          <h2 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA]">
            Your Gift Voucher is Ready!
          </h2>
          <p className="text-xs text-[#A69B8D]">
            An electronic voucher card and confirmation receipt have been sent to{' '}
            <strong className="text-[#F5F1EA]">{purchasedVoucher.sender_email}</strong>.
            {purchasedVoucher.recipient_email && (
              <>
                {' '}A copy will also be delivered to{' '}
                <strong className="text-[#F5F1EA]">{purchasedVoucher.recipient_email}</strong>.
              </>
            )}
          </p>
        </div>

        {/* The Digital Gift Voucher Display Card */}
        <div className="max-w-xl mx-auto">
          <div
            className={`rounded-lg p-6 sm:p-8 border shadow-2xl relative overflow-hidden transition-all ${themeStyles.wrapper}`}
          >
            {/* Background luxury watermark */}
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-6 translate-y-6">
              <Gift className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 flex flex-col justify-between min-h-[260px] space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4 border-white/10">
                <div>
                  <span className="font-serif-heading text-xl sm:text-2xl tracking-tight text-[#F5F1EA] block">
                    George Davis Hairdressing
                  </span>
                  <span className="text-[11px] text-[#A69B8D] tracking-widest uppercase block mt-0.5">
                    14 St John Street · Bromsgrove
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[#A69B8D] block">
                    Voucher Value
                  </span>
                  <span className="font-serif-heading text-2xl sm:text-3xl font-mono-numbers text-[#F5F1EA]">
                    £{purchasedVoucher.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Recipient Details & Message */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-widest text-[#BFA57D] block">
                  Presented To:
                </span>
                <h3 className="font-serif-heading text-2xl text-[#F5F1EA]">
                  {purchasedVoucher.recipient_name}
                </h3>
                {purchasedVoucher.service_name && (
                  <span className="inline-block text-xs font-medium text-[#BFA57D] bg-black/40 px-2.5 py-0.5 rounded-sm border border-white/10">
                    Valid for: {purchasedVoucher.service_name}
                  </span>
                )}
                {purchasedVoucher.message && (
                  <p className="text-xs text-[#D9D1C5] italic bg-black/30 p-3 rounded-sm border border-white/5 mt-2">
                    "{purchasedVoucher.message}"
                  </p>
                )}
                <span className="text-[11px] text-[#A69B8D] block pt-1">
                  With love from <strong className="text-[#F5F1EA]">{purchasedVoucher.sender_name}</strong>
                </span>
              </div>

              {/* Voucher Code Footer */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#A69B8D] block">
                    Voucher Code (Quote upon booking):
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-[#BFA57D] bg-black/50 px-3 py-1 rounded-sm border border-[#BFA57D]/40">
                      {purchasedVoucher.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(purchasedVoucher.code)}
                      className="p-1.5 rounded-sm text-[#8C8273] hover:text-white transition-colors"
                      title="Copy Voucher Code"
                    >
                      {copiedCode ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right text-[10px] text-[#8C8273]">
                  <span>Valid for 12 months</span>
                  <span className="block font-mono">
                    Expires: {new Date(purchasedVoucher.expires_at).toLocaleDateString('en-GB')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-xl mx-auto pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onBookWithVoucher && (
            <button
              type="button"
              onClick={() => onBookWithVoucher(purchasedVoucher.code, purchasedVoucher.service_id)}
              className="w-full sm:w-auto bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Book Appointment with this Voucher</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto border border-[#443E36] hover:border-white text-[#D9D1C5] hover:text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Voucher</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPurchasedVoucher(null);
              setRecipientName('');
              setRecipientEmail('');
              setMessage('');
            }}
            className="w-full sm:w-auto text-xs text-[#8C8273] hover:text-white px-4 py-3 transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Buy Another Voucher</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181818] border border-[#2B2925] rounded-sm p-6 sm:p-10 space-y-8 shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262420] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#BFA57D] bg-[#2A241C] px-2.5 py-0.5 rounded-sm border border-[#3E3425]">
              <Gift className="w-3.5 h-3.5 text-[#9B8058]" />
              <span>Digital Gift Voucher</span>
            </span>
            <span className="text-[11px] text-[#8C8273]">Instant Online Delivery</span>
          </div>
          <h2 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA]">
            The Salon Gift Experience
          </h2>
          <p className="text-xs text-[#A69B8D] max-w-lg">
            Treat someone special to an exquisite boutique cut, dimensional colour, or relaxing scalp ritual at George Davis Hairdressing.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#8C8273] hover:text-[#F5F1EA] transition-colors self-start sm:self-center"
          >
            Back to Booking
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Configuration & Form */}
        <form onSubmit={handlePurchase} className="lg:col-span-7 space-y-6">
          {/* Step 1: Type Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
              1. Select Voucher Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVoucherType('amount')}
                className={`py-3 px-4 rounded-sm text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                  voucherType === 'amount'
                    ? 'bg-[#2A241C] border-[#9B8058] text-[#F5F1EA]'
                    : 'bg-[#141414] border-[#2A2A2A] text-[#8C8273] hover:border-[#443E36]'
                }`}
              >
                <span>Monetary Value</span>
                <span className="text-[10px] text-[#BFA57D] font-mono">Any Service</span>
              </button>

              <button
                type="button"
                onClick={() => setVoucherType('service')}
                className={`py-3 px-4 rounded-sm text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                  voucherType === 'service'
                    ? 'bg-[#2A241C] border-[#9B8058] text-[#F5F1EA]'
                    : 'bg-[#141414] border-[#2A2A2A] text-[#8C8273] hover:border-[#443E36]'
                }`}
              >
                <span>Treatment Experience</span>
                <span className="text-[10px] text-[#BFA57D] font-mono">Specific Service</span>
              </button>
            </div>
          </div>

          {/* Amount / Service Selector */}
          {voucherType === 'amount' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                2. Choose Gift Value
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount('');
                    }}
                    className={`py-2.5 px-3 text-center rounded-sm font-serif-heading text-sm sm:text-base border transition-colors ${
                      selectedAmount === amt && !customAmount
                        ? 'bg-[#9B8058] text-[#141414] font-bold border-[#9B8058]'
                        : 'bg-[#141414] border-[#2B2925] text-[#F5F1EA] hover:border-[#9B8058]'
                    }`}
                  >
                    £{amt}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8C8273]">Or custom amount:</span>
                  <div className="relative flex-1 max-w-[160px]">
                    <span className="absolute left-3 top-2.5 text-xs text-[#8C8273]">£</span>
                    <input
                      type="number"
                      min={20}
                      max={1000}
                      step={5}
                      placeholder="e.g. 120"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                      }}
                      className="w-full bg-[#141414] border border-[#2B2925] text-[#F5F1EA] pl-6 pr-3 py-2 rounded-sm text-xs font-mono focus:outline-none focus:border-[#9B8058]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
                2. Choose Signature Treatment
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full bg-[#141414] border border-[#2B2925] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name} — £{svc.price.toFixed(2)} ({svc.duration_minutes} mins)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Theme Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
              3. Select Card Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('bronze')}
                className={`py-2 px-3 rounded-sm text-xs font-medium border transition-colors text-center ${
                  theme === 'bronze'
                    ? 'bg-[#2A241C] border-[#9B8058] text-[#F5F1EA]'
                    : 'bg-[#141414] border-[#262626] text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
              >
                Signature Bronze
              </button>
              <button
                type="button"
                onClick={() => setTheme('gold')}
                className={`py-2 px-3 rounded-sm text-xs font-medium border transition-colors text-center ${
                  theme === 'gold'
                    ? 'bg-[#2A241C] border-[#D4AF37] text-[#F5F1EA]'
                    : 'bg-[#141414] border-[#262626] text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
              >
                Gilded Gold
              </button>
              <button
                type="button"
                onClick={() => setTheme('champagne')}
                className={`py-2 px-3 rounded-sm text-xs font-medium border transition-colors text-center ${
                  theme === 'champagne'
                    ? 'bg-[#2A241C] border-[#D9D1C5] text-[#F5F1EA]'
                    : 'bg-[#141414] border-[#262626] text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
              >
                Champagne Ivory
              </button>
            </div>
          </div>

          {/* Recipient & Sender Details */}
          <div className="space-y-4 pt-2 border-t border-[#262420]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#D9D1C5]">
              4. Recipient & Message
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-[#A69B8D] block">Recipient Full Name *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2B2925] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#A69B8D] block">Recipient Email Address *</span>
                <input
                  type="email"
                  required
                  placeholder="sarah@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2B2925] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-[#A69B8D] block">Personal Gift Message (Optional)</span>
              <textarea
                rows={2}
                placeholder="Happy Birthday Sarah! Enjoy your well-deserved pampering session with George Davis."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#141414] border border-[#2B2925] text-[#F5F1EA] p-3 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] text-[#A69B8D] block">Your Full Name (Sender) *</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emily Carter"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2B2925] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#A69B8D] block">Your Email (For Receipt) *</span>
                <input
                  type="email"
                  required
                  placeholder="emily@example.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2B2925] text-[#F5F1EA] px-3.5 py-2.5 rounded-sm text-xs focus:outline-none focus:border-[#9B8058]"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-950/40 border border-red-800/80 p-3 rounded-sm text-xs text-red-200">
              {errorMessage}
            </div>
          )}

          {/* Submit Checkout Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>
                {loading ? 'Processing Gift Card...' : `Complete Purchase (£${finalAmount.toFixed(2)})`}
              </span>
            </button>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#8C8273] mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#BFA57D]" />
              <span>Secure 256-bit encryption · Instant digital delivery</span>
            </div>
          </div>
        </form>

        {/* Right Column: Live Interactive Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#8C8273] font-semibold">
              Live Digital Voucher Preview
            </span>
            <span className="text-[10px] text-[#BFA57D]">Updates automatically</span>
          </div>

          {/* The Styled Voucher Card Preview */}
          <div
            className={`rounded-lg p-6 sm:p-7 border shadow-xl relative overflow-hidden transition-all ${themeStyles.wrapper}`}
          >
            {/* Watermark icon */}
            <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-4 translate-y-4">
              <Gift className="w-48 h-48 text-white" />
            </div>

            <div className="relative z-10 flex flex-col justify-between min-h-[280px] space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-3 border-white/10">
                <div>
                  <span className="font-serif-heading text-lg sm:text-xl tracking-tight text-[#F5F1EA] block">
                    George Davis Hairdressing
                  </span>
                  <span className="text-[10px] text-[#A69B8D] tracking-widest uppercase block">
                    Boutique Salon Voucher
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider text-[#A69B8D] block">
                    Value
                  </span>
                  <span className="font-serif-heading text-2xl font-mono-numbers text-[#F5F1EA]">
                    £{finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Recipient Details & Message */}
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase tracking-widest text-[#BFA57D] block">
                  For:
                </span>
                <h4 className="font-serif-heading text-xl text-[#F5F1EA]">
                  {recipientName.trim() || 'Valued Client'}
                </h4>
                {voucherType === 'service' && selectedService && (
                  <span className="inline-block text-[11px] font-medium text-[#BFA57D] bg-black/40 px-2 py-0.5 rounded-sm border border-white/10">
                    {selectedService.name}
                  </span>
                )}
                {message.trim() ? (
                  <p className="text-[11px] text-[#D9D1C5] italic bg-black/25 p-2 rounded-sm border border-white/5 line-clamp-3">
                    "{message.trim()}"
                  </p>
                ) : (
                  <p className="text-[11px] text-[#8C8273] italic">
                    "Enjoy your luxury treatment experience at George Davis."
                  </p>
                )}
                <span className="text-[10px] text-[#A69B8D] block pt-1">
                  From: <strong className="text-[#F5F1EA]">{senderName.trim() || 'A generous friend'}</strong>
                </span>
              </div>

              {/* Voucher Code Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px]">
                <div>
                  <span className="text-[#A69B8D] block">Code generated upon purchase:</span>
                  <span className="font-mono text-xs font-semibold text-[#BFA57D] tracking-wider">
                    GD-GIFT-••••-••••
                  </span>
                </div>
                <div className="text-right text-[#8C8273]">
                  <span>Valid for 12 months</span>
                  <span className="block">14 St John St, Bromsgrove</span>
                </div>
              </div>
            </div>
          </div>

          {/* Salon Trust Card info */}
          <div className="bg-[#141414] border border-[#242424] p-4 rounded-sm space-y-2 text-xs text-[#A69B8D]">
            <div className="flex items-center gap-2 text-[#D9D1C5] font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#BFA57D]" />
              <span>How Gift Vouchers Work at George Davis:</span>
            </div>
            <ul className="space-y-1 text-[11px] text-[#8C8273] list-disc list-inside">
              <li>Can be redeemed for any hair service or retail hair care product.</li>
              <li>Remaining balances are kept on file and never forfeited.</li>
              <li>Recipients can easily quote their voucher code when booking online.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
