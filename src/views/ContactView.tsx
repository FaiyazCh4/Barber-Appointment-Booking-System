import React from 'react';
import { Phone, Mail, MapPin, Clock, ExternalLink, ShieldCheck, CheckCircle2, Car, Compass } from 'lucide-react';
import type { SalonConfig } from '../types';
import { SalonLocationMap } from '../components/SalonLocationMap';

interface Props {
  config: SalonConfig | null;
}

export const ContactView: React.FC<Props> = ({ config }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
          Bromsgrove Town Centre
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif-heading text-[#F5F1EA]">
          Visit & Contact Us
        </h1>
        <p className="text-sm sm:text-base text-[#A69B8D] leading-relaxed">
          Conveniently located on St John Street in Bromsgrove. Telephone our reception desk directly or reach out via email for enquiries and consultation bookings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Contact Cards */}
        <div className="lg:col-span-6 space-y-8">
          <div className="bg-[#181818] border border-[#262626] rounded-sm p-6 sm:p-8 space-y-6">
            <h2 className="font-serif-heading text-2xl text-[#F5F1EA]">
              Salon Contact Details
            </h2>

            <div className="space-y-4 text-xs text-[#D9D1C5]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#9B8058] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm text-[#F5F1EA] block">Salon Address</strong>
                  <p className="text-[#A69B8D] leading-relaxed">
                    14 St John Street<br />
                    Bromsgrove, Worcestershire<br />
                    B61 8QY, United Kingdom
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#9B8058] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm text-[#F5F1EA] block">Telephone Reception</strong>
                  <p className="text-[#A69B8D] mb-1">
                    Bookings, telephone consultations, and general enquiries.
                  </p>
                  <a
                    href="tel:+441527577000"
                    className="text-[#F5F1EA] hover:text-[#BFA57D] font-mono-numbers font-medium text-sm transition-colors"
                  >
                    01527 577000
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#9B8058] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm text-[#F5F1EA] block">Email Correspondence</strong>
                  <p className="text-[#A69B8D] mb-1">
                    Non-urgent questions, supplier inquiries, and private feedback.
                  </p>
                  <a
                    href="mailto:georgedavisbromsgrove@gmail.com"
                    className="text-[#F5F1EA] hover:text-[#BFA57D] transition-colors"
                  >
                    georgedavisbromsgrove@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#262626]">
              <a
                href="https://maps.app.goo.gl/jbP1sHY4TQzf17aJ8"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] px-6 py-3 rounded-sm transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Parking & Transport */}
          <div className="bg-[#181818] border border-[#262626] rounded-sm p-6 sm:p-8 space-y-4 text-xs text-[#A69B8D]">
            <div className="flex items-center gap-2 text-[#F5F1EA]">
              <Car className="w-4 h-4 text-[#BFA57D]" />
              <h3 className="font-serif-heading text-lg">Parking & Arrival</h3>
            </div>
            <p>
              Short and long-stay pay & display parking is situated on St John Street and nearby Crown Close car parks. Bromsgrove bus station is within a 5-minute walk.
            </p>
            <p>
              For hair extension fittings or multi-stage colour transformations, we advise choosing a parking location supporting 3+ hours duration.
            </p>
          </div>
        </div>

        {/* Right Column: Opening Hours & Map */}
        <div className="lg:col-span-6 space-y-8">
          <div className="bg-[#181818] border border-[#262626] rounded-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#9B8058]" />
                <h2 className="font-serif-heading text-2xl text-[#F5F1EA]">
                  Opening Schedule
                </h2>
              </div>
              {!config?.salon.hours_confirmed ? (
                <span className="text-[10px] text-[#A69B8D] border border-[#3A332A] px-2 py-0.5 rounded">
                  Good Salon Guide Draft
                </span>
              ) : (
                <span className="text-[10px] text-[#9B8058] flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Confirmed
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
                      className={`flex justify-between py-1 border-b border-[#222] ${h.is_open ? 'text-[#F5F1EA]' : 'text-[#8C8273]'}`}
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
              <div className="pt-3 border-t border-[#262626] text-xs space-y-2">
                <span className="text-[10px] text-[#BFA57D] uppercase font-semibold tracking-wider block">
                  Scheduled Salon Closures & Holidays
                </span>
                <div className="divide-y divide-[#222]">
                  {config.closures.map((c) => (
                    <div key={c.id} className="py-1 flex items-center justify-between text-[#D9D1C5]">
                      <span className="font-mono text-[#BFA57D] font-medium mr-2">{c.date}</span>
                      <span className="text-[#A69B8D] text-right">{c.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-[11px] text-[#8C8273]">
              {!config?.salon.hours_confirmed ? (
                <span>These draft hours originate from directory listings. Salon owner schedule confirmation activates live availability.</span>
              ) : (
                <span>All appointments run on official Europe/London local time.</span>
              )}
            </div>
          </div>

          {/* Embedded Google Maps with Salon Dark Theme */}
          <div className="bg-[#181818] border border-[#262626] rounded-sm p-6 overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#9B8058]" />
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Salon Location Map
                </h3>
              </div>
              <span className="text-[11px] text-[#BFA57D] font-mono">Bromsgrove B61 8QY</span>
            </div>

            <SalonLocationMap />
          </div>
        </div>
      </div>
    </div>
  );
};
