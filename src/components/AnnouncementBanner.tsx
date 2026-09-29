import React, { useState } from 'react';
import { AlertCircle, Clock, X } from 'lucide-react';
import type { SalonConfig } from '../types';

interface Props {
  config: SalonConfig | null;
  onNavigate: (view: string) => void;
}

export const AnnouncementBanner: React.FC<Props> = ({ config, onNavigate }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !config) return null;

  const isHoursDraft = !config.salon.hours_confirmed;

  return (
    <aside aria-label="Salon notices" className="bg-[#1C1A17] border-b border-[#9B8058]/30 text-xs text-[#D9D1C5] px-4 py-2 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isHoursDraft ? (
            <Clock className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />
          )}
          <span>
            {isHoursDraft ? (
              <>
                <strong className="text-[#F5F1EA] font-medium">Opening Hours Notice:</strong> Currently displaying Good Salon Guide draft hours pending owner confirmation.{' '}
                <button
                  onClick={() => onNavigate('admin')}
                  className="underline hover:text-white transition-colors ml-1 font-medium text-[#BFA57D]"
                >
                  Admin Setup & Confirm
                </button>
              </>
            ) : (
              <>
                <strong className="text-[#F5F1EA] font-medium">Salon Advisory:</strong> Skin allergy patch tests are mandatory 48 hours prior to any colour appointment.
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#A69B8D] shrink-0 self-end sm:self-auto">
          <span>14 St John St, Bromsgrove · 01527 577000</span>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
