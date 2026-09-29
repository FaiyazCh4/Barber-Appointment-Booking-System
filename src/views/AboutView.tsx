import React from 'react';
import { ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const AboutView: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
          Bromsgrove Boutique Heritage
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif-heading text-[#F5F1EA]">
          About George Davis Hairdressing
        </h1>
        <p className="text-base sm:text-lg text-[#A69B8D] leading-relaxed">
          Situated at 14 St John Street in Bromsgrove, George Davis Hairdressing was founded on an uncompromising principle: that exceptional hairdressing requires both technical mastery and considered personal care.
        </p>
      </div>

      {/* Main Narrative Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-7 space-y-6 text-sm text-[#D9D1C5] leading-relaxed">
          <h2 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA]">
            A Culture of Listening Before Cutting
          </h2>

          <p>
            In an era where salon visits often feel rushed and transactional, we preserve the unhurried craft of detailed consultation. We look carefully at hair texture, growth patterns, facial angles, daily routine, and personal aesthetic before introducing a comb or pair of scissors.
          </p>

          <p>
            Our Bromsgrove salon is home to a balanced team of dedicated specialists. From George Snr’s decades of architectural precision cutting, modern perming, and classic styling to George Jnr’s pioneering work in non-surgical human hair replacement and master barbering, every discipline is represented with authority.
          </p>

          <p>
            Colourists Kirstin and Leah formulate bespoke tones tailored to your natural complexion and maintenance expectations, upholding our rigorous 48-hour patch test standard for every client’s safety. Stylists Lisa and Rob lead in texture transformation, hair extensions, and elegant occasion finishing.
          </p>

          <div className="pt-4 flex items-center gap-4">
            <button
              onClick={() => onNavigate('book')}
              className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-sm transition-colors"
            >
              Book an Appointment
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="border border-[#443E36] hover:border-[#D9D1C5] text-[#F5F1EA] text-xs font-semibold uppercase tracking-wider px-6 py-3 rounded-sm transition-colors"
            >
              Location & Visit
            </button>
          </div>
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-5 bg-[#181818] border border-[#2B2925] p-8 rounded-sm space-y-6">
          <h3 className="font-serif-heading text-2xl text-[#F5F1EA] border-b border-[#262420] pb-4">
            Our Core Standards
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#BFA57D] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F5F1EA] block text-sm">Strict Patch Testing Protocol</strong>
                <p className="text-[#8C8273]">
                  We never compromise on client safety. Allergy alert tests are mandatory 48 hours before any colour appointment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Award className="w-4 h-4 text-[#BFA57D] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F5F1EA] block text-sm">Transparent Estimates</strong>
                <p className="text-[#8C8273]">
                  Clear guidance on pricing, required home care maintenance, and appointment duration before work commences.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Heart className="w-4 h-4 text-[#BFA57D] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#F5F1EA] block text-sm">Discreet Consultation</strong>
                <p className="text-[#8C8273]">
                  Sensitive services such as men’s hair systems and hair density assessments are conducted with complete privacy and discretion.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#262420] text-xs text-[#8C8273]">
            <span>14 St John Street, Bromsgrove, B61 8QY · 01527 577000</span>
          </div>
        </div>
      </div>
    </div>
  );
};
