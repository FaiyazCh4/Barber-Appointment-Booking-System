import React, { useState } from 'react';
import { ArrowRight, Calendar, Sparkles, X, UserCheck, ShieldCheck } from 'lucide-react';
import type { Staff } from '../types';
import { ScrollReveal } from '../components/common/ScrollReveal';

interface Props {
  staff: Staff[];
  onBookStylist: (staffId: string) => void;
}

export const TeamView: React.FC<Props> = ({ staff, onBookStylist }) => {
  const [activeModalMember, setActiveModalMember] = useState<Staff | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
      <ScrollReveal animation="fade-up">
        <div className="space-y-4 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
            Bromsgrove Creative Team
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif-heading text-[#F5F1EA]">
            Meet the Specialists
          </h1>
          <p className="text-sm sm:text-base text-[#A69B8D] leading-relaxed">
            Our team brings together decades of architectural precision cutting, modern dimensional colour, seamless extensions, and specialist men's non-surgical hair replacement.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staff.map((member, idx) => (
          <ScrollReveal key={member.id} animation="fade-up" delay={idx * 100}>
            <div
              className="bg-[#181818] border border-[#262626] rounded-sm overflow-hidden flex flex-col justify-between hover:border-[#9B8058]/60 transition-all duration-300 group shadow-lg h-full"
            >
              {/* Editorial Portrait Header */}
              <div
                onClick={() => setActiveModalMember(member)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-[#24221F] cursor-pointer"
              >
                {member.image_url ? (
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-serif-heading text-5xl text-[#554E44]">
                    {member.name.charAt(0)}
                  </div>
                )}
                {/* Subtle Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/20 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BFA57D] block mb-0.5">
                    {member.role_title}
                  </span>
                  <h3 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA] drop-shadow-sm flex items-center justify-between">
                    <span>{member.name}</span>
                    <span className="text-[10px] text-[#A69B8D] font-mono tracking-normal opacity-0 group-hover:opacity-100 transition-opacity">
                      View Profile →
                    </span>
                  </h3>
                </div>
              </div>

              <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-5">
                <p className="text-xs sm:text-sm text-[#A69B8D] leading-relaxed line-clamp-3">
                  {member.bio_text}
                </p>

                <button
                  type="button"
                  onClick={() => setActiveModalMember(member)}
                  className="text-left text-[11px] text-[#BFA57D] hover:text-white underline underline-offset-4 cursor-pointer self-start"
                >
                  Read Complete Story & Profile
                </button>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2 pt-2 border-t border-[#242424]">
                    <span className="text-[10px] uppercase tracking-wider text-[#8C8273] font-semibold block">
                      Key Specialties
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="text-[11px] text-[#D9D1C5] bg-[#222] border border-[#2D2D2D] px-2.5 py-1 rounded-xs"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onBookStylist(member.id)}
                    className="w-full bg-[#23211E] hover:bg-[#9B8058] hover:text-[#141414] text-[#F5F1EA] font-semibold text-xs uppercase tracking-wider py-3 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:translate-y-px"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book with {member.name}</span>
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>

      {/* Complete Profile Modal */}
      {activeModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#181818] border border-[#3E382E] rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button
              onClick={() => setActiveModalMember(null)}
              className="absolute top-4 right-4 z-20 p-2 text-[#8C8273] hover:text-white bg-[#141414]/80 rounded-full border border-white/10 transition-colors cursor-pointer"
              title="Close Profile"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Image Header */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#24221F]">
              {activeModalMember.image_url ? (
                <img
                  src={activeModalMember.image_url}
                  alt={activeModalMember.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-serif-heading text-6xl text-[#554E44]">
                  {activeModalMember.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D] block mb-1">
                  {activeModalMember.role_title}
                </span>
                <h2 className="font-serif-heading text-3xl sm:text-4xl text-[#F5F1EA]">
                  {activeModalMember.name}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#BFA57D]">
                  About & Background
                </h4>
                <p className="text-sm text-[#D9D1C5] leading-relaxed">
                  {activeModalMember.bio_text}
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-[#282828]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8C8273]">
                  Core Specialties & Expertise
                </h4>
                <div className="flex flex-wrap gap-2">
                  {activeModalMember.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="text-xs text-[#F5F1EA] bg-[#222] border border-[#353535] px-3 py-1.5 rounded-xs"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 border-t border-[#282828]">
                <button
                  type="button"
                  onClick={() => {
                    const id = activeModalMember.id;
                    setActiveModalMember(null);
                    onBookStylist(id);
                  }}
                  className="w-full sm:flex-1 bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider py-3.5 rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book with {activeModalMember.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModalMember(null)}
                  className="w-full sm:w-auto px-6 py-3.5 border border-[#3A3A3A] hover:border-white text-xs uppercase tracking-wider font-medium text-[#A69B8D] hover:text-white rounded-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advisory on Schedule Activation */}
      <div className="bg-[#151515] border border-[#2B2925] p-6 rounded-sm text-xs text-[#8C8273] leading-relaxed space-y-2">
        <strong className="text-[#D9D1C5] block font-medium">Individual Availability Notice</strong>
        <p>
          Each stylist manages dedicated working hours, specialized consultation slots, and training rotations. When booking online, our system computes real-time availability based on active shifts, pre-set breaks, and minimum preparation intervals.
        </p>
      </div>
    </div>
  );
};
