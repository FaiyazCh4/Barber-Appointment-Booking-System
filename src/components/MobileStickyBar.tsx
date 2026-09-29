import React from 'react';
import { Calendar, Phone } from 'lucide-react';

interface Props {
  onBookClick: () => void;
}

export const MobileStickyBar: React.FC<Props> = ({ onBookClick }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161616]/95 backdrop-blur-md border-t border-[#2D2D2D] px-4 py-2.5 shadow-2xl safe-area-bottom">
      <div className="flex items-center gap-3 max-w-md mx-auto">
        <a
          href="tel:+441527577000"
          className="flex-1 flex items-center justify-center gap-2 h-11 text-xs font-semibold uppercase tracking-wider text-[#D9D1C5] border border-[#3A3A3A] bg-[#202020] rounded-sm active:bg-[#2A2A2A] transition-colors"
          aria-label="Telephone salon directly on 01527 577000"
        >
          <Phone className="w-3.5 h-3.5 text-[#BFA57D]" />
          <span>Call Salon</span>
        </a>

        <button
          onClick={onBookClick}
          className="flex-[2] flex items-center justify-center gap-2 h-11 text-xs font-bold uppercase tracking-wider text-[#141414] bg-[#9B8058] rounded-sm active:bg-[#856C47] transition-colors shadow-sm"
          aria-label="Book an appointment online"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Appointment</span>
        </button>
      </div>
    </div>
  );
};
