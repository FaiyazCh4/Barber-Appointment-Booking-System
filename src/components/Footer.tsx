import React from 'react';
import { Phone, Mail, MapPin, Clock, ShieldCheck, ExternalLink, Lock, LogOut } from 'lucide-react';
import type { SalonConfig, UserProfile } from '../types';
import { NewsletterSignup } from './NewsletterSignup';
import { SocialFollow } from './SocialFollow';
import { SalonLogo } from './SalonLogo';

interface Props {
  config: SalonConfig | null;
  user?: UserProfile | null;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
}

export const Footer: React.FC<Props> = ({ config, user, onNavigate, onLogout }) => {
  return (
    <footer className="bg-[#0E0E0E] text-[#D9D1C5] border-t border-[#262626] pt-14 pb-24 lg:pb-16 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Client Newsletter Signup & Social Follow */}
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <NewsletterSignup />
          </div>
          <div className="lg:col-span-4">
            <SocialFollow />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          {/* Col 1: Brand & Heritage */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SalonLogo size={36} className="shrink-0" />
              <h3 className="font-serif-heading text-2xl text-[#F5F1EA] tracking-wide leading-tight">
                George Davis Hairdressing
              </h3>
            </div>
            <p className="text-xs text-[#A69B8D] leading-relaxed">
              Boutique hair salon situated in the heart of Bromsgrove. Dedicated to tailored precision cutting, dimensional bespoke colour, extensions, and specialist men's hair replacement.
            </p>
            <div className="pt-2 text-xs text-[#8C8273]">
              <span>Member of the Good Salon Guide</span> · <span>Bromsgrove, Worcestershire</span>
            </div>
          </div>

          {/* Col 2: Contact & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
              Visit & Contact
            </h4>
            <div className="space-y-2.5 text-xs text-[#D9D1C5]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#9B8058] shrink-0 mt-0.5" />
                <span>
                  14 St John Street<br />
                  Bromsgrove, Worcestershire<br />
                  B61 8QY, United Kingdom
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#9B8058] shrink-0" />
                <a href="tel:+441527577000" className="hover:text-white transition-colors">
                  01527 577000
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#9B8058] shrink-0" />
                <a href="mailto:georgedavisbromsgrove@gmail.com" className="hover:text-white transition-colors truncate">
                  georgedavisbromsgrove@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Col 3: Salon Hours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
                Opening Hours
              </h4>
              {!config?.salon.hours_confirmed ? (
                <span className="text-[10px] text-[#A69B8D] border border-[#3A352F] px-1.5 py-0.5 rounded">
                  Draft
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-mono">
                  Live
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-xs text-[#A69B8D] font-mono-numbers">
              {config?.hours && config.hours.length > 0 ? (
                [...config.hours]
                  .sort((a, b) => {
                    const orderA = a.day_of_week === 0 ? 7 : a.day_of_week;
                    const orderB = b.day_of_week === 0 ? 7 : b.day_of_week;
                    return orderA - orderB;
                  })
                  .map((h) => {
                    const shortName = h.day_name
                      ? h.day_name.slice(0, 3)
                      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][h.day_of_week];
                    return (
                      <div key={h.day_of_week} className="flex justify-between">
                        <span className={h.is_open ? 'text-[#D9D1C5]' : 'text-[#8C8273]'}>
                          {shortName}:
                        </span>
                        {h.is_open ? (
                          <span className="text-[#F5F1EA]">
                            {h.open_time} – {h.close_time}
                          </span>
                        ) : (
                          <span className="text-[#8C8273]">Closed</span>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="text-[11px] text-[#8C8273]">Loading hours...</div>
              )}
            </div>
            {config?.closures && config.closures.length > 0 && (
              <div className="pt-2 border-t border-[#262626] text-[10px] text-[#BFA57D]">
                <span className="block font-medium">Holiday Closures:</span>
                <span className="text-[#A69B8D]">
                  {config.closures.slice(0, 2).map((c) => `${c.date} (${c.reason})`).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Col 4: Quick Navigation & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
              Navigation & Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-white transition-colors">
                  Services & Pricing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('team')} className="hover:text-white transition-colors">
                  Meet the Stylists
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('manage')} className="hover:text-white transition-colors">
                  Manage Existing Booking
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('vouchers')} className="text-[#BFA57D] hover:text-white transition-colors">
                  Buy Gift Vouchers
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policies')} className="hover:text-white transition-colors">
                  Booking & Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policies')} className="hover:text-white transition-colors">
                  Skin Patch Testing (48hrs)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('policies')} className="hover:text-white transition-colors">
                  Privacy & Data Retention
                </button>
              </li>
              <li className="pt-2 border-t border-[#262626] flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigate('admin')}
                  className="flex items-center gap-1.5 text-[#BFA57D] hover:text-[#F5F1EA] font-medium transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-[#9B8058]" />
                  <span>
                    {user && (user.role === 'owner_admin' || user.role === 'receptionist')
                      ? `Admin Portal (${user.full_name.split(' ')[0]})`
                      : 'Admin Portal (Login / Sign Up)'}
                  </span>
                </button>
                {user && (
                  <button
                    onClick={onLogout}
                    className="text-xs text-[#8C8273] hover:text-red-300 transition-colors flex items-center gap-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-3 h-3 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* SalonIQ Migration transparency note & Bottom Bar */}
        <div className="border-t border-[#262626] pt-6 pb-6 text-xs text-[#8C8273] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#9B8058] shrink-0" />
            <span>
              Direct online booking system. If you booked via the previous SalonIQ booking portal, your appointment remains valid.{' '}
              <a
                href="https://s-iq.co/BookingPortal/dist/?salonid=e319696e-dc88-4da6-9dd5-d7232d7efe68&tab=book"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-white inline-flex items-center gap-1"
              >
                SalonIQ Portal <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('admin')}
              className="text-[#8C8273] hover:text-[#BFA57D] transition-colors flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-[#9B8058]" />
              <span>{user ? 'Admin Hub' : 'Admin Login / Sign Up'}</span>
            </button>
            {user && (
              <button
                onClick={onLogout}
                className="text-[#8C8273] hover:text-red-300 transition-colors flex items-center gap-1"
              >
                <LogOut className="w-3 h-3 text-red-400" />
                <span>Sign Out</span>
              </button>
            )}
            <span>© {new Date().getFullYear()} George Davis Hairdressing. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
