import React from 'react';

interface LogoProps {
  className?: string;
  size?: number; // width & height in pixels (default 40)
  variant?: 'emblem' | 'full';
}

export const SalonLogo: React.FC<LogoProps> = ({ className = '', size = 42, variant = 'emblem' }) => {
  return (
    <div className={`inline-flex items-center gap-3 shrink-0 ${className}`}>
      {/* Handcrafted Vector Luxury Salon Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 group-hover:scale-105"
        role="img"
        aria-label="George Davis Hairdressing Logo"
      >
        <defs>
          {/* Rich metallic brushed bronze-gold gradient */}
          <linearGradient id="gdGoldMain" x1="10%" y1="5%" x2="90%" y2="95%">
            <stop offset="0%" stopColor="#F5E7CA" />
            <stop offset="25%" stopColor="#D4AF37" />
            <stop offset="60%" stopColor="#BFA57D" />
            <stop offset="100%" stopColor="#876735" />
          </linearGradient>

          {/* Dark luxury background disc gradient */}
          <radialGradient id="gdBgRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#25211B" />
            <stop offset="85%" stopColor="#141311" />
            <stop offset="100%" stopColor="#0D0C0B" />
          </radialGradient>

          {/* Subtle gold glow outline */}
          <linearGradient id="gdBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2D0A6" />
            <stop offset="50%" stopColor="#9B8058" />
            <stop offset="100%" stopColor="#4A3B24" />
          </linearGradient>
        </defs>

        {/* Outer Circular Medallion */}
        <circle cx="50" cy="50" r="48" fill="url(#gdBgRadial)" />
        <circle cx="50" cy="50" r="48" stroke="url(#gdBorderGrad)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="44.5" stroke="#BFA57D" strokeOpacity="0.35" strokeWidth="0.75" strokeDasharray="1.5 2" />

        {/* 4 Cardinal Diamond Accents */}
        <polygon points="50,9 52,12 50,15 48,12" fill="url(#gdGoldMain)" />
        <polygon points="50,85 52,88 50,91 48,88" fill="url(#gdGoldMain)" />
        <polygon points="9,50 12,48 15,50 12,52" fill="url(#gdGoldMain)" />
        <polygon points="85,50 88,48 91,50 88,52" fill="url(#gdGoldMain)" />

        {/* Subtle Stylist Shear Sheen Motif in background (scissor blades silhouette) */}
        <path
          d="M32 28 L68 72 M68 28 L32 72"
          stroke="url(#gdGoldMain)"
          strokeWidth="0.8"
          strokeOpacity="0.25"
          strokeLinecap="round"
        />

        {/* Monogram 'G' */}
        <path
          d="M48 31 C36 31 27 39 27 50 C27 61 36 69 48 69 C55 69 61 65 63 60 L63 52 L48 52"
          stroke="url(#gdGoldMain)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 'G' Serif Head Accent */}
        <path
          d="M44 31 L50 31"
          stroke="url(#gdGoldMain)"
          strokeWidth="3.2"
          strokeLinecap="square"
        />

        {/* Monogram 'D' Intertwined */}
        <path
          d="M48 31 L48 69 M48 31 C63 31 73 39 73 50 C73 61 63 69 48 69"
          stroke="url(#gdGoldMain)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 'D' Serif Terminals */}
        <path
          d="M44 31 L52 31 M44 69 L52 69"
          stroke="url(#gdGoldMain)"
          strokeWidth="3.2"
          strokeLinecap="square"
        />

        {/* Center Sparkle / Crest Crown Point */}
        <circle cx="50" cy="50" r="1.5" fill="#F5E7CA" />
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col">
          <span className="font-serif-heading text-lg sm:text-xl font-medium tracking-tight text-[#F5F1EA] leading-tight">
            George Davis
          </span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#BFA57D] font-medium">
            Hairdressing · Est. 1987
          </span>
        </div>
      )}
    </div>
  );
};
