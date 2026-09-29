import React from 'react';
import { Scissors, Sparkles, Diamond } from 'lucide-react';

interface SectionDividerProps {
  label?: string;
  number?: string;
  icon?: 'scissors' | 'diamond' | 'sparkles' | 'none';
  variant?: 'minimal' | 'ornate' | 'gradient';
  className?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  label,
  number,
  icon = 'diamond',
  variant = 'ornate',
  className = '',
}) => {
  return (
    <div className={`relative py-8 md:py-12 w-full overflow-hidden flex items-center justify-center select-none ${className}`}>
      {/* Ambient background soft glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-16 bg-[#9B8058]/5 blur-2xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 flex items-center justify-center">
        {variant === 'minimal' ? (
          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#2E2820] to-[#3E3529]" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#9B8058]/60 shrink-0" />
            <div className="flex-1 h-px bg-gradient-to-r from-[#3E3529] via-[#2E2820] to-transparent" />
          </div>
        ) : (
          <div className="w-full flex items-center gap-3 sm:gap-6">
            {/* Left hairline */}
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#3B3327] to-[#9B8058]/40" />

            {/* Center Emblem / Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#332A1F] rounded-full shadow-md text-[#BFA57D]">
              {icon === 'scissors' && <Scissors className="w-3 h-3 text-[#9B8058]" />}
              {icon === 'sparkles' && <Sparkles className="w-3 h-3 text-[#9B8058]" />}
              {icon === 'diamond' && (
                <div className="w-1.5 h-1.5 rotate-45 bg-[#BFA57D]" />
              )}

              {number && (
                <span className="font-mono text-[10px] text-[#8C8273] tracking-wider">
                  {number}
                </span>
              )}

              {number && label && <span className="text-[#4E4436]">·</span>}

              {label && (
                <span className="text-[10px] uppercase font-semibold tracking-widest text-[#D9D1C5]">
                  {label}
                </span>
              )}
            </div>

            {/* Right hairline */}
            <div className="flex-1 h-px bg-gradient-to-r from-[#9B8058]/40 via-[#3B3327] to-transparent" />
          </div>
        )}
      </div>
    </div>
  );
};
