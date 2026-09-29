import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { UserProfile } from '../types';
import { SalonLogo } from './SalonLogo';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<Props> = ({ currentView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'services', label: 'Services' },
    { id: 'team', label: 'Our Team' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'vouchers', label: 'Gift Vouchers' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Visit & Contact' },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#141414]/95 backdrop-blur-md border-b border-[#262626] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Zone 1: Logo & Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
          className="group flex items-center gap-2.5 sm:gap-3 text-lg sm:text-xl lg:text-[21px] xl:text-2xl font-serif-heading font-medium tracking-tight text-[#F5F1EA] hover:text-[#BFA57D] transition-colors shrink-0 whitespace-nowrap"
        >
          <SalonLogo size={34} className="shrink-0" />
          <span className="leading-none whitespace-nowrap tracking-wide">George Davis Hairdressing</span>
        </a>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-7 text-xs xl:text-sm font-medium text-[#D9D1C5] shrink-0">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className={`whitespace-nowrap transition-colors py-1 relative hover:text-[#F5F1EA] cursor-pointer ${
                currentView === link.id
                  ? 'text-[#F5F1EA] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#9B8058]'
                  : ''
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="hidden sm:flex items-center gap-2 xl:gap-3 shrink-0">
          <button
            onClick={() => handleNavClick('manage')}
            className={`whitespace-nowrap text-xs uppercase tracking-wider font-medium px-2.5 xl:px-3 py-2 transition-colors cursor-pointer ${
              currentView === 'manage' ? 'text-[#F5F1EA]' : 'text-[#D9D1C5] hover:text-[#F5F1EA]'
            }`}
          >
            Manage Booking
          </button>

          <button
            onClick={() => handleNavClick('book')}
            className="whitespace-nowrap bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-semibold text-xs uppercase tracking-wider px-3.5 xl:px-5 py-2.5 rounded-sm transition-all shadow-sm active:translate-y-px cursor-pointer"
          >
            Book Appointment
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => handleNavClick('book')}
            className="sm:hidden bg-[#9B8058] text-[#141414] font-semibold text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-sm"
          >
            Book
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 text-[#D9D1C5] hover:text-[#F5F1EA] focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#262626] bg-[#191919] px-4 pt-4 pb-6 space-y-3">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="block w-full text-left py-2.5 text-base font-medium text-[#D9D1C5] hover:text-white border-b border-[#262626]/40 whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => handleNavClick('manage')}
              className="w-full text-left py-2 text-sm text-[#BFA57D] font-medium whitespace-nowrap"
            >
              Manage Existing Appointment
            </button>
            <button
              onClick={() => handleNavClick('policies')}
              className="w-full text-left py-2 text-sm text-[#A69B8D] whitespace-nowrap"
            >
              Salon Policies & Patch Testing
            </button>
            <button
              onClick={() => handleNavClick('book')}
              className="w-full bg-[#9B8058] text-[#141414] text-center font-bold text-xs uppercase tracking-wider py-3 rounded-sm mt-2 whitespace-nowrap"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
