import React from 'react';
import { Instagram, Facebook, ExternalLink, Sparkles } from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'card' | 'inline';
}

export const SocialFollow: React.FC<Props> = ({ className = '', variant = 'card' }) => {
  const socialChannels = [
    {
      name: 'Instagram',
      handle: '@georgedavishairdressing',
      subtitle: 'Transformations & Reel Previews',
      href: 'https://www.instagram.com/georgedavishairdressing',
      icon: Instagram,
      ariaLabel: 'Follow George Davis Hairdressing on Instagram',
    },
    {
      name: 'Facebook',
      handle: 'George Davis Hairdressing',
      subtitle: 'Salon Updates & Reviews',
      href: 'https://www.facebook.com/georgedavishairdressing',
      icon: Facebook,
      ariaLabel: 'Follow George Davis Hairdressing on Facebook',
    },
  ];

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {socialChannels.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={item.ariaLabel}
              className="w-9 h-9 rounded-sm bg-[#1A1815] border border-[#3E3425] hover:border-[#9B8058] text-[#BFA57D] hover:text-[#F5F1EA] hover:bg-[#2A2318] transition-all flex items-center justify-center group"
            >
              <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`h-full bg-[#181613] border border-[#2E2922] rounded-lg p-6 sm:p-7 shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
          <Sparkles className="w-3.5 h-3.5 text-[#9B8058]" />
          <span>Social Follow</span>
        </div>
        <h3 className="font-serif-heading text-xl text-[#F5F1EA] tracking-wide font-normal">
          Follow Our Salon Journey
        </h3>
        <p className="text-xs text-[#A69B8D] leading-relaxed">
          See weekly curl cuts, dimensional balayage, and discreet hair replacement transformations on our channels.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 mt-5">
        {socialChannels.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={item.ariaLabel}
              className="group bg-[#11100E] border border-[#3A342B] hover:border-[#9B8058] rounded-md p-3 transition-all flex items-center justify-between hover:bg-[#1F1C18]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#26211A] border border-[#3E3425] group-hover:border-[#BFA57D] text-[#BFA57D] group-hover:text-[#F5F1EA] flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#F5F1EA] group-hover:text-[#BFA57D] transition-colors block">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-[#8C8273] font-mono block">
                    {item.handle}
                  </span>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#8C8273] group-hover:text-[#BFA57D] transition-colors shrink-0" />
            </a>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-[#26221B] flex items-center justify-between text-[11px] text-[#786E5E]">
        <span>Tag us in your post:</span>
        <span className="font-mono text-[#BFA57D]">#GeorgeDavisHair</span>
      </div>
    </div>
  );
};
