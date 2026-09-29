import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, Phone, Mail } from 'lucide-react';

export const PoliciesView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Header */}
      <div className="space-y-4 max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
          Transparency & Client Care
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif-heading text-[#F5F1EA]">
          Salon Policies & Terms
        </h1>
        <p className="text-sm sm:text-base text-[#A69B8D] leading-relaxed">
          Clear standards protecting your safety, ensuring fair scheduling for our stylists, and handling your personal information responsibly in accordance with UK law.
        </p>
      </div>

      {/* Policy 1: Patch Testing Protocol */}
      <section className="bg-[#181818] border border-[#2B2925] rounded-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#262420] pb-4">
          <ShieldCheck className="w-5 h-5 text-[#9B8058]" />
          <h2 className="font-serif-heading text-2xl text-[#F5F1EA]">
            1. Mandatory 48-Hour Skin Allergy Patch Testing
          </h2>
        </div>

        <div className="space-y-4 text-xs text-[#D9D1C5] leading-relaxed">
          <p>
            Your health and safety are paramount. In strict compliance with UK cosmetic safety regulations and manufacturer guidelines, George Davis Hairdressing operates a mandatory 48-hour allergy alert test (AAT) policy for all clients receiving colour, bleach, toner, or chemical texture services.
          </p>

          <div className="bg-[#1C1A17] border border-[#3A332A] p-4 rounded-sm space-y-2">
            <strong className="text-[#F5F1EA] block text-sm">When is a patch test required?</strong>
            <ul className="list-disc pl-4 space-y-1 text-[#A69B8D]">
              <li>You are a new client having any colour or chemical service with us.</li>
              <li>You have not had a colour service at our salon within the previous 6 months.</li>
              <li>You have recently had a black henna tattoo or experienced any skin reaction.</li>
              <li>You have had a change in your medical history or started new medications.</li>
            </ul>
          </div>

          <p>
            The test takes less than 2 minutes. Simply pop into the salon at 14 St John Street at least 48 hours prior to your scheduled appointment. We apply a small dab of colour formula behind your ear or inside your elbow crease. If any irritation, redness, or itching occurs, wash off immediately and contact us.
          </p>
        </div>
      </section>

      {/* Policy 2: Booking & Cancellations */}
      <section className="bg-[#181818] border border-[#2B2925] rounded-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#262420] pb-4">
          <FileText className="w-5 h-5 text-[#9B8058]" />
          <h2 className="font-serif-heading text-2xl text-[#F5F1EA]">
            2. Booking & Cancellation Terms
          </h2>
        </div>

        <div className="space-y-4 text-xs text-[#D9D1C5] leading-relaxed">
          <p>
            When you book an appointment with George Davis Hairdressing, that dedicated time is reserved exclusively for you.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#141414] p-4 rounded-sm border border-[#242424] space-y-2">
              <strong className="text-[#F5F1EA] block">24-Hour Notice Window</strong>
              <p className="text-[#8C8273]">
                We request at least 24 hours notice to cancel or reschedule an appointment. You can do this easily online using your booking reference or by telephoning 01527 577000.
              </p>
            </div>

            <div className="bg-[#141414] p-4 rounded-sm border border-[#242424] space-y-2">
              <strong className="text-[#F5F1EA] block">Punctuality & Late Arrival</strong>
              <p className="text-[#8C8273]">
                If you arrive more than 15 minutes late, we may need to modify your treatment (e.g. dry styling rather than full blow-dry) or reschedule to avoid delaying subsequent clients.
              </p>
            </div>
          </div>

          <p>
            Payment is completed at the salon following your service. We accept all major debit and credit cards, contactless mobile payments, and cash.
          </p>
        </div>
      </section>

      {/* Policy 3: Privacy & GDPR */}
      <section className="bg-[#181818] border border-[#2B2925] rounded-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-[#262420] pb-4">
          <CheckCircle2 className="w-5 h-5 text-[#9B8058]" />
          <h2 className="font-serif-heading text-2xl text-[#F5F1EA]">
            3. Privacy & UK GDPR Notice
          </h2>
        </div>

        <div className="space-y-4 text-xs text-[#D9D1C5] leading-relaxed">
          <p>
            George Davis Hairdressing is committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and Data Protection Act 2018.
          </p>

          <p>
            <strong className="text-[#F5F1EA]">What information we collect:</strong> We collect your full name, telephone number, email address, appointment history, colour formulations, patch test records, and any notes relevant to your hair health or scalp condition.
          </p>

          <p>
            <strong className="text-[#F5F1EA]">How your data is used:</strong> Strictly to manage your appointments, provide safe hairdressing treatments, deliver transactional confirmations, and contact you if schedule adjustments are necessary. We never sell or share your data with third-party marketing companies.
          </p>

          <p>
            <strong className="text-[#F5F1EA]">Your Rights:</strong> You have the right to request a copy of your personal data, request correction of inaccurate records, or request erasure of your customer profile. To exercise these rights, please email{' '}
            <a href="mailto:georgedavisbromsgrove@gmail.com" className="text-[#BFA57D] underline">
              georgedavisbromsgrove@gmail.com
            </a>.
          </p>
        </div>
      </section>

      <div className="text-xs text-[#8C8273] text-center pt-4">
        <span>George Davis Hairdressing · 14 St John Street, Bromsgrove, B61 8QY · Tel: 01527 577000</span>
      </div>
    </div>
  );
};
