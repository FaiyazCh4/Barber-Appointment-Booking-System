import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ArrowRight, RefreshCw, Scissors, Award, Clock, CheckCircle2 } from 'lucide-react';
import type { Staff } from '../types';

interface Props {
  staff: Staff[];
  onBookStylist: (staffId: string) => void;
  onViewTeam?: () => void;
}

export const StaffSpotlight: React.FC<Props> = ({ staff, onBookStylist, onViewTeam }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [fadeAnim, setFadeAnim] = useState<boolean>(true);

  // Randomly select a stylist on mount
  useEffect(() => {
    if (staff && staff.length > 0) {
      const randomIndex = Math.floor(Math.random() * staff.length);
      setCurrentIndex(randomIndex);
    }
  }, [staff]);

  if (!staff || staff.length === 0) {
    return null;
  }

  const currentStylist = staff[currentIndex] || staff[0];

  const handleNextStylist = () => {
    setFadeAnim(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % staff.length);
      setFadeAnim(true);
    }, 150);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative bg-gradient-to-br from-[#1C1A17] via-[#161513] to-[#121110] border border-[#3E3529] rounded-lg p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#9B8058]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Stylist Visual & Badge */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#BFA57D] bg-[#2A241C] px-3 py-1 rounded-full border border-[#3E3425]">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Stylist Spotlight</span>
            </div>

            {/* Stylist Monogram / Portrait Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#24201A] to-[#363026] border-2 border-[#9B8058] p-1 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full rounded-full bg-[#181613] overflow-hidden flex items-center justify-center">
                  {currentStylist.image_url ? (
                    <img
                      src={currentStylist.image_url}
                      alt={currentStylist.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <span className="font-serif-heading text-4xl sm:text-5xl text-[#F5F1EA]">
                      {currentStylist.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#141414] border border-[#443B2D] px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold text-[#BFA57D] shadow-sm whitespace-nowrap flex items-center gap-1">
                <Scissors className="w-2.5 h-2.5 text-[#9B8058]" />
                <span>Bromsgrove Pro</span>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA]">
                {currentStylist.name}
              </h3>
              <span className="text-xs sm:text-sm text-[#BFA57D] font-medium block mt-0.5">
                {currentStylist.role_title}
              </span>
            </div>

            {/* Quick shuffle button */}
            {staff.length > 1 && (
              <button
                type="button"
                onClick={handleNextStylist}
                className="text-[11px] text-[#8C8273] hover:text-[#D9D1C5] flex items-center gap-1.5 pt-1 transition-colors group cursor-pointer"
                title="View another team specialist"
              >
                <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500 text-[#9B8058]" />
                <span>Spotlight another stylist ({currentIndex + 1} of {staff.length})</span>
              </button>
            )}
          </div>

          {/* Right Column: Bio, Specialties & Direct Booking CTA */}
          <div
            className={`lg:col-span-8 space-y-6 transition-opacity duration-200 ${
              fadeAnim ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Bio quote */}
            <div className="space-y-3">
              <span className="text-[11px] uppercase tracking-wider text-[#8C8273] font-semibold block">
                Stylist Profile & Background
              </span>
              <p className="text-sm sm:text-base text-[#D9D1C5] leading-relaxed font-light">
                {currentStylist.bio_text ||
                  `${currentStylist.name} brings dedicated boutique hairdressing experience to George Davis Hairdressing, with tailored consultations tailored to your individual texture and lifestyle.`}
              </p>
            </div>

            {/* Specialties Badges */}
            {currentStylist.specialties && currentStylist.specialties.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#2A241C]">
                <span className="text-[11px] uppercase tracking-wider text-[#8C8273] font-semibold block">
                  Signature Focus & Specialties
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentStylist.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs text-[#E5DFD5] bg-[#221E19] border border-[#3A3326] px-3 py-1.5 rounded-sm"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#9B8058]" />
                      <span>{spec}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Appointment Perks / Trust Signals */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-[#8C8273]">
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />
                <span>1-on-1 Dedicated Chair</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />
                <span>Real-Time Live Slots</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />
                <span>Bespoke Consultation</span>
              </div>
            </div>

            {/* Direct Conversion Call-to-Action */}
            <div className="pt-4 border-t border-[#2E2820] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => onBookStylist(currentStylist.id)}
                className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:translate-y-px"
              >
                <Calendar className="w-4 h-4" />
                <span>Book with {currentStylist.name}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>

              {onViewTeam && (
                <button
                  type="button"
                  onClick={onViewTeam}
                  className="border border-[#443B2D] hover:border-[#D9D1C5] text-[#D9D1C5] hover:text-white text-xs font-semibold uppercase tracking-wider px-5 py-3.5 rounded-sm transition-colors text-center cursor-pointer"
                >
                  Meet All 6 Stylists
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
