import React from 'react';
import { ArrowRight, Clock, MapPin, Phone, ShieldCheck, Sparkles, User, Scissors, HeartHandshake } from 'lucide-react';
import type { SalonConfig, Service, Staff } from '../types';
import { HomeFAQ } from '../components/HomeFAQ';
import { StaffSpotlight } from '../components/StaffSpotlight';
import { HomeGallerySlider } from '../components/HomeGallerySlider';
import { TestimonialCarousel } from '../components/TestimonialCarousel';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { SectionDivider } from '../components/common/SectionDivider';

interface Props {
  config: SalonConfig | null;
  services: Service[];
  staff: Staff[];
  onNavigate: (view: string, context?: any) => void;
  onBookService: (serviceId: string, staffId?: string) => void;
}

export const HomeView: React.FC<Props> = ({ config, services, staff, onNavigate, onBookService }) => {
  const featuredServices = services.slice(0, 4);

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 md:pb-28 border-b border-[#242424]">
        <ScrollReveal animation="fade" duration={800}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Editorial Headline & Copy */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
                  <span>14 St John Street</span>
                  <span aria-hidden="true">·</span>
                  <span>Bromsgrove, Worcestershire</span>
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif-heading font-normal tracking-tight text-[#F5F1EA] leading-[1.08] text-balance">
                  Beautiful hair. <br className="hidden sm:inline" />
                  <span className="italic font-normal text-[#D9D1C5]">Considered care.</span>
                </h1>

                <p className="text-base sm:text-lg text-[#A69B8D] leading-relaxed max-w-xl">
                  Personalised precision cutting, dimensional bespoke colour, seamless human hair extensions, and specialist men's hair replacement in Bromsgrove.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                  <button
                    onClick={() => onNavigate('book')}
                    className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-sm transition-all shadow-md flex items-center justify-center gap-2 text-center cursor-pointer active:translate-y-px"
                  >
                    <span>Book an Appointment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigate('services')}
                    className="border border-[#4A453E] hover:border-[#D9D1C5] text-[#F5F1EA] font-semibold text-xs uppercase tracking-wider px-8 py-4 rounded-sm transition-colors text-center cursor-pointer"
                  >
                    Explore Services
                  </button>
                </div>

                {/* Trust Indicators */}
                <div className="pt-8 border-t border-[#262626] grid grid-cols-3 gap-6 text-xs text-[#8C8273]">
                  <div>
                    <span className="block font-serif-heading text-lg text-[#F5F1EA]">6 Specialists</span>
                    <span>Bespoke 1-on-1 focus</span>
                  </div>
                  <div>
                    <span className="block font-serif-heading text-lg text-[#F5F1EA]">48hr Patch Test</span>
                    <span>Allergy safety priority</span>
                  </div>
                  <div>
                    <span className="block font-serif-heading text-lg text-[#F5F1EA]">St John Street</span>
                    <span>Central Bromsgrove</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Editorial Visual Showcase */}
              <div className="lg:col-span-5 relative">
                <div className="relative aspect-[4/5] bg-gradient-to-br from-[#24221F] to-[#141414] border border-[#332F2A] rounded-sm p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
                  <div className="space-y-3">
                    <div className="w-12 h-0.5 bg-[#9B8058]" />
                    <span className="text-[11px] uppercase tracking-widest text-[#BFA57D] block">
                      Boutique Craftsmanship
                    </span>
                    <h3 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA] leading-snug">
                      "Every appointment begins with listening. Tailored to your texture, lifestyle, and facial architecture."
                    </h3>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-[#2A2622]">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#8C8273] block text-[11px]">Director</span>
                        <strong className="text-[#F5F1EA]">George Snr</strong>
                      </div>
                      <div>
                        <span className="text-[#8C8273] block text-[11px]">Systems & Barbering</span>
                        <strong className="text-[#F5F1EA]">George Jnr</strong>
                      </div>
                      <div>
                        <span className="text-[#8C8273] block text-[11px]">Bespoke Colour</span>
                        <strong className="text-[#F5F1EA]">Kirstin</strong>
                      </div>
                      <div>
                        <span className="text-[#8C8273] block text-[11px]">Extensions & Texture</span>
                        <strong className="text-[#F5F1EA]">Lisa, Leah & Rob</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-[#A69B8D]">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#9B8058]" />
                        Good Salon Guide Listed
                      </span>
                      <button
                        onClick={() => onNavigate('team')}
                        className="text-[#BFA57D] underline hover:text-white cursor-pointer"
                      >
                        Meet the Team
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Section Transition 01 */}
      <SectionDivider number="01" label="Core Treatments" icon="scissors" />

      {/* Featured Services Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D] block mb-2">
                Tailored Catalogue
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA]">
                Core Salon Services
              </h2>
            </div>
            <button
              onClick={() => onNavigate('services')}
              className="text-xs font-semibold uppercase tracking-wider text-[#BFA57D] hover:text-white transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <span>View Full Service Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredServices.map((service, idx) => (
            <ScrollReveal key={service.id} animation="fade-up" delay={idx * 90}>
              <div
                className="bg-[#191919] border border-[#2B2925] p-6 rounded-sm flex flex-col justify-between hover:border-[#9B8058]/50 transition-all duration-300 group h-full shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#8C8273]">
                    <span>{service.duration_minutes} mins</span>
                    {service.requires_patch_test && (
                      <span className="text-[#BFA57D]">48h Test</span>
                    )}
                  </div>

                  <h3 className="font-serif-heading text-xl text-[#F5F1EA] group-hover:text-[#BFA57D] transition-colors">
                    {service.name}
                  </h3>

                  <p className="text-xs text-[#A69B8D] leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#262420] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#8C8273] block">
                      {service.price_type === 'consultation'
                        ? 'Consultation'
                        : service.price_type === 'from'
                        ? 'From'
                        : 'Fixed'}
                    </span>
                    <span className="text-lg font-serif-heading text-[#F5F1EA] font-mono-numbers">
                      {service.price_type === 'consultation' ? 'Free' : `£${service.price.toFixed(2)}`}
                    </span>
                  </div>

                  <button
                    onClick={() => onBookService(service.id)}
                    className="text-xs font-semibold text-[#141414] bg-[#D9D1C5] hover:bg-white px-3.5 py-1.5 rounded-sm transition-colors cursor-pointer"
                  >
                    Book
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Section Transition 02 */}
      <SectionDivider number="02" label="Salon Ethos & Health" icon="diamond" />

      {/* Salon Pillars & Craft Ethos */}
      <section className="bg-gradient-to-b from-[#131211] via-[#121212] to-[#141414] py-20 border-y border-[#242424] relative overflow-hidden">
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-[#9B8058]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal animation="fade-up">
            <div className="max-w-2xl mb-14">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D] block mb-2">
                Our Ethos
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA] mb-4">
                Dedicated to Hair Health & Individual Balance
              </h2>
              <p className="text-sm text-[#A69B8D] leading-relaxed">
                We reject high-volume, rushed appointments. Each client receives genuine consultation time, clear realistic timelines, and respectful advice.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ScrollReveal animation="fade-up" delay={0}>
              <div className="space-y-4 p-7 bg-[#161616] border border-[#262626] rounded-sm h-full hover:border-[#9B8058]/40 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-sm bg-[#222] flex items-center justify-center text-[#BFA57D]">
                  <Scissors className="w-5 h-5" />
                </div>
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Precision Scissor & Razor Craft
                </h3>
                <p className="text-xs text-[#A69B8D] leading-relaxed">
                  From George Snr’s decades of architectural cutting to George Jnr’s master barbering and curly hair shapes, we cut with structure that grows out gracefully.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={120}>
              <div className="space-y-4 p-7 bg-[#161616] border border-[#262626] rounded-sm h-full hover:border-[#9B8058]/40 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-sm bg-[#222] flex items-center justify-center text-[#BFA57D]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Bespoke Dimensional Colour
                </h3>
                <p className="text-xs text-[#A69B8D] leading-relaxed">
                  Kirstin and Leah create seamless hand-painted balayage, luminous blonde foils, and soft root melts. Every colour is preceded by our strict 48-hour patch test standard.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={240}>
              <div className="space-y-4 p-7 bg-[#161616] border border-[#262626] rounded-sm h-full hover:border-[#9B8058]/40 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-sm bg-[#222] flex items-center justify-center text-[#BFA57D]">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Men's Hair Replacement Systems
                </h3>
                <p className="text-xs text-[#A69B8D] leading-relaxed">
                  George Jnr offers discreet, private 1-on-1 consultations for non-surgical human hair systems, providing undetectable scalp blending and bespoke maintenance.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Section Transition 03 */}
      <SectionDivider number="03" label="Stylist Spotlight" icon="sparkles" />

      {/* Staff Spotlight Feature */}
      <ScrollReveal animation="fade-up">
        <StaffSpotlight
          staff={staff}
          onBookStylist={(staffId) => onNavigate('book', { preSelectedStaffId: staffId })}
          onViewTeam={() => onNavigate('team')}
        />
      </ScrollReveal>

      {/* Section Transition 04 */}
      <SectionDivider number="04" label="Hairstyle Lookbook" icon="scissors" />

      {/* Interactive Lookbook & Hairstyle Gallery Slider */}
      <ScrollReveal animation="fade-up">
        <HomeGallerySlider
          staff={staff}
          onBookStyle={(stylistId, serviceId) =>
            onNavigate('book', { preSelectedStaffId: stylistId, preSelectedServiceId: serviceId })
          }
          onViewPortfolio={() => onNavigate('gallery')}
        />
      </ScrollReveal>

      {/* Section Transition 05 */}
      <SectionDivider number="05" label="Bromsgrove Specialists" icon="diamond" />

      {/* Team Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D] block mb-2">
                The Team
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA]">
                Meet Our Stylists in Bromsgrove
              </h2>
            </div>
            <button
              onClick={() => onNavigate('team')}
              className="text-xs font-semibold uppercase tracking-wider text-[#BFA57D] hover:text-white transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
            >
              <span>View All Profiles & Specialties</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member, idx) => (
            <ScrollReveal key={member.id} animation="fade-up" delay={idx * 80}>
              <div
                className="bg-[#181818] border border-[#292929] rounded-sm overflow-hidden flex flex-col justify-between hover:border-[#9B8058]/50 transition-all duration-300 group shadow-md h-full"
              >
                <div className="relative h-56 w-full overflow-hidden bg-[#24221F]">
                  {member.image_url ? (
                    <img
                      src={member.image_url}
                      alt={member.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif-heading text-4xl text-[#554E44]">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[10px] text-[#BFA57D] uppercase font-semibold tracking-wider block">
                      {member.role_title}
                    </span>
                    <h3 className="font-serif-heading text-2xl text-[#F5F1EA]">
                      {member.name}
                    </h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {member.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[11px] text-[#A69B8D] bg-[#222] px-2 py-0.5 rounded-xs"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => onNavigate('book', { staffId: member.id })}
                      className="w-full text-center text-xs font-semibold uppercase tracking-wider py-2.5 bg-[#262420] hover:bg-[#9B8058] hover:text-[#141414] text-[#D9D1C5] rounded-sm transition-colors cursor-pointer"
                    >
                      Book with {member.name}
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Section Transition 06 */}
      <SectionDivider number="06" label="Verified Client Reviews" icon="sparkles" />

      {/* Verified Client Testimonials Carousel */}
      <ScrollReveal animation="fade-up">
        <TestimonialCarousel
          staff={staff}
          onBookClick={(staffId) => onNavigate('book', staffId ? { preSelectedStaffId: staffId } : undefined)}
          onExploreServices={() => onNavigate('services')}
          onNavigate={onNavigate}
        />
      </ScrollReveal>

      {/* Section Transition 07 */}
      <SectionDivider number="07" label="Client Inquiries & Guidance" icon="diamond" />

      {/* Frequently Asked Questions */}
      <ScrollReveal animation="fade-up">
        <HomeFAQ onNavigate={onNavigate} />
      </ScrollReveal>

      {/* Section Transition 08 */}
      <SectionDivider number="08" label="Find Us & Schedule" icon="scissors" />

      {/* Location & Opening Hours Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal animation="fade-up">
          <div className="bg-[#161616] border border-[#2B2925] rounded-sm p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-lg">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D] block">
                Find Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA]">
                14 St John Street, Bromsgrove
              </h2>
              <p className="text-sm text-[#A69B8D] leading-relaxed">
                Conveniently located in Bromsgrove town centre with nearby public parking on St John Street and surrounding council facilities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#D9D1C5] pt-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#9B8058] shrink-0 mt-0.5" />
                  <span>
                    14 St John Street<br />
                    Bromsgrove, B61 8QY
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-[#9B8058] shrink-0 mt-0.5" />
                  <div>
                    <a href="tel:+441527577000" className="hover:text-white font-medium block">
                      01527 577000
                    </a>
                    <span className="text-[11px] text-[#8C8273]">Telephone for enquiries</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <a
                  href="https://maps.app.goo.gl/jbP1sHY4TQzf17aJ8"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] px-5 py-2.5 rounded-sm transition-colors"
                >
                  <span>Open in Google Maps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => onNavigate('contact')}
                  className="text-xs font-semibold text-[#D9D1C5] hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  Parking & Transit Info
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#1C1A17] p-6 rounded-sm border border-[#302B24] space-y-4">
              <div className="flex items-center justify-between border-b border-[#2C2822] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#BFA57D]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F5F1EA]">
                    Salon Schedule
                  </h3>
                </div>
                {!config?.salon.hours_confirmed ? (
                  <span className="text-[10px] text-[#A69B8D] border border-[#443E36] px-2 py-0.5 rounded">
                    Good Salon Guide Draft
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                    Confirmed Schedule
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs text-[#A69B8D] font-mono-numbers">
                {config?.hours && config.hours.length > 0 ? (
                  [...config.hours]
                    .sort((a, b) => {
                      const orderA = a.day_of_week === 0 ? 7 : a.day_of_week;
                      const orderB = b.day_of_week === 0 ? 7 : b.day_of_week;
                      return orderA - orderB;
                    })
                    .map((h) => (
                      <div
                        key={h.day_of_week}
                        className={`flex justify-between py-0.5 ${h.is_open ? 'text-[#F5F1EA]' : 'text-[#8C8273]'}`}
                      >
                        <span>{h.day_name}:</span>
                        {h.is_open ? (
                          <span>
                            {h.open_time} – {h.close_time}
                            {parseInt(h.close_time.split(':')[0], 10) >= 20 && ' (Late Night)'}
                          </span>
                        ) : (
                          <span className="text-[#8C8273]">Closed</span>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-xs text-[#8C8273]">Loading salon schedule...</div>
                )}
              </div>

              {config?.closures && config.closures.length > 0 && (
                <div className="pt-2 text-[11px] border-t border-[#2C2822] space-y-1">
                  <span className="font-semibold text-[#BFA57D] uppercase tracking-wider block text-[10px]">
                    Scheduled Holiday Closures
                  </span>
                  {config.closures.slice(0, 3).map((c) => (
                    <div key={c.id} className="text-xs flex justify-between text-[#D9D1C5]">
                      <span className="font-mono text-[#BFA57D]">{c.date}:</span>
                      <span>{c.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-[11px] text-[#8C8273] border-t border-[#2C2822]">
                {!config?.salon.hours_confirmed ? (
                  <span>Schedule unconfirmed by owner. Live availability activates upon admin confirmation.</span>
                ) : (
                  <span>Confirmed salon schedule. Timezone: Europe/London.</span>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};
