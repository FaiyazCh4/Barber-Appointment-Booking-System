import React, { useState } from 'react';
import { Camera, Sparkles, Info } from 'lucide-react';

export const GalleryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('all');

  const galleryItems = [
    {
      id: 1,
      category: 'colour',
      categoryLabel: 'Bespoke Colour',
      title: 'Multidimensional Honey Balayage',
      stylist: 'Kirstin & Leah',
      description: 'Hand-painted sunlit ribbons on natural brunette base with tailored gloss toner.',
    },
    {
      id: 2,
      category: 'cuts',
      categoryLabel: 'Precision Cutting',
      title: 'Architectural Geometric Bob',
      stylist: 'George Snr',
      description: 'Clean scissor-over-skin perimeter lines with internal weight reduction for natural movement.',
    },
    {
      id: 3,
      category: 'mens',
      categoryLabel: "Men's Hair Systems",
      title: 'Non-Surgical Hair Replacement Integration',
      stylist: 'George Jnr',
      description: 'Custom hairline graduation and seamless crown density matching on 100% human hair.',
    },
    {
      id: 4,
      category: 'extensions',
      categoryLabel: 'Human Hair Extensions',
      title: 'Seamless Density & Length Enhancement',
      stylist: 'Lisa & Leah',
      description: 'Micro-tape method ensuring natural distribution and zero tension on scalp follicles.',
    },
    {
      id: 5,
      category: 'texture',
      categoryLabel: 'Curly Hair Craft',
      title: 'Dry Curl-by-Curl Architectural Shape',
      stylist: 'George Snr & Lisa',
      description: 'Shaped in its dry natural curl spring pattern, sealed with deep hydrating finish.',
    },
    {
      id: 6,
      category: 'colour',
      categoryLabel: 'Bespoke Colour',
      title: 'Luminous Nordic Blonde Foil Placement',
      stylist: 'Leah',
      description: 'Ultra-fine micro weaves with bond fortification and soft natural root shadow.',
    },
    {
      id: 7,
      category: 'mens',
      categoryLabel: "Men's Barbering",
      title: "Scissor-Over-Comb Taper & Texturised Crown",
      stylist: 'George Jnr',
      description: "Traditional British barbering precision paired with modern matte clay styling.",
    },
    {
      id: 8,
      category: 'texture',
      categoryLabel: 'Keratin Smoothing',
      title: 'Silk Protein Cuticle Realignment',
      stylist: 'Lisa',
      description: 'Formaldehyde-free smoothing eliminating frizz while preserving natural bounce and volume.',
    },
  ];

  const filteredItems = galleryItems.filter(
    (item) => activeTab === 'all' || item.category === activeTab,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-12">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
          Editorial Showcase
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif-heading text-[#F5F1EA]">
          Craft & Style Portfolio
        </h1>
        <p className="text-sm sm:text-base text-[#A69B8D] leading-relaxed">
          A selection of bespoke colour balances, architectural cutting, non-surgical hair replacement integrations, and texture work created at 14 St John Street.
        </p>
      </div>

      {/* Asset Attribution & Approval Notice */}
      <div className="bg-[#191919] border border-[#2B2925] p-4 rounded-sm flex items-start gap-3 text-xs text-[#A69B8D]">
        <Info className="w-4 h-4 text-[#BFA57D] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#D9D1C5]">Preview Visual Note:</strong> In accordance with our asset integrity standards, photography and portfolio displays in this preview are placeholders illustrating salon art direction until official client release authorizations are published by the salon owner.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#262626]">
        {[
          { id: 'all', label: 'All Work' },
          { id: 'colour', label: 'Colour & Balayage' },
          { id: 'cuts', label: 'Precision Cuts' },
          { id: 'mens', label: "Men's Systems & Barbering" },
          { id: 'extensions', label: 'Hair Extensions' },
          { id: 'texture', label: 'Curls & Keratin' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#9B8058] text-[#141414] font-bold'
                : 'bg-[#1C1C1C] text-[#D9D1C5] hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#181818] border border-[#262626] rounded-sm overflow-hidden flex flex-col justify-between hover:border-[#9B8058]/50 transition-colors group"
          >
            {/* Visual Box Container */}
            <div className="aspect-[4/3] bg-gradient-to-br from-[#24211D] to-[#121212] p-5 flex flex-col justify-between relative overflow-hidden border-b border-[#262626]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#BFA57D] font-mono-numbers">
                  REF GD-{String(item.id).padStart(2, '0')}
                </span>
                <Camera className="w-3.5 h-3.5 text-[#8C8273]" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-[#A69B8D] block font-medium">
                  {item.categoryLabel}
                </span>
                <h4 className="font-serif-heading text-lg text-[#F5F1EA] leading-tight group-hover:text-[#BFA57D] transition-colors">
                  {item.title}
                </h4>
              </div>
            </div>

            {/* Caption */}
            <div className="p-5 space-y-3">
              <p className="text-xs text-[#A69B8D] leading-relaxed">
                {item.description}
              </p>
              <div className="pt-2 border-t border-[#242424] flex items-center justify-between text-[11px]">
                <span className="text-[#8C8273]">Specialist:</span>
                <span className="text-[#D9D1C5] font-medium">{item.stylist}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
