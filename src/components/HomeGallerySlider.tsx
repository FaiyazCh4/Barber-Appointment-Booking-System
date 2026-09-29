import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Sparkles,
  Scissors,
  Calendar,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  Pause,
  Play,
  Layers,
} from 'lucide-react';
import type { Staff } from '../types';

interface GallerySlide {
  id: string;
  category: 'colour' | 'cuts' | 'mens' | 'curls' | 'styling';
  categoryLabel: string;
  title: string;
  stylistName: string;
  stylistRole: string;
  stylistId?: string;
  serviceId?: string;
  imageUrl: string;
  technique: string;
  description: string;
  duration: string;
  finishProducts: string;
}

const GALLERY_SLIDES: GallerySlide[] = [
  {
    id: 'slide-1',
    category: 'colour',
    categoryLabel: 'Bespoke Balayage',
    title: 'Multidimensional Honey Balayage & Seamless Blend',
    stylistName: 'Kirstin',
    stylistRole: 'Creative Colour Director',
    stylistId: 'staff-kirstin',
    imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1400&q=85',
    technique: 'Freehand feathering with soft root transition & custom gloss toner',
    description: 'Sunlit dimensional ribbons created through tailored balayage painting, designed for a low-maintenance grow-out with radiant shine and bouncy salon finish.',
    duration: '150 mins',
    finishProducts: 'Olaplex No.7 Bonding Oil & Moroccan Styling Cream',
  },
  {
    id: 'slide-2',
    category: 'cuts',
    categoryLabel: 'Precision Cutting',
    title: 'Architectural Geometric Scissor-Over-Skin Bob',
    stylistName: 'George Snr',
    stylistRole: 'Founder & Master Stylist',
    stylistId: 'staff-george-snr',
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1400&q=85',
    technique: 'Vidal Sassoon classic precision line with internal point weight removal',
    description: 'A striking jaw-skimming bob cut with razor-sharp horizontal perimeters. Sculpted to follow the natural bone structure and swing effortlessly with every movement.',
    duration: '45 mins',
    finishProducts: 'Kerastase Elixir Ultime & Smoothing Thermal Serum',
  },
  {
    id: 'slide-3',
    category: 'mens',
    categoryLabel: "Men's Hair Replacement",
    title: 'Non-Surgical Hair System & Undetectable Blending',
    stylistName: 'George Jnr',
    stylistRole: 'Salon Director & Hair Replacement Specialist',
    stylistId: 'staff-george-jnr',
    imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1400&q=85',
    technique: 'Ultra-thin polyurethane skin membrane with hand-injected real hair graduation',
    description: 'Custom fitted non-surgical hair replacement system providing undetectable transition at the temples and hairline, matched perfectly to client density and natural texture.',
    duration: '120 mins',
    finishProducts: 'Matte Clay & Weightless System Scalp Tonic',
  },
  {
    id: 'slide-4',
    category: 'curls',
    categoryLabel: 'Curly Hair Craft',
    title: 'Curl-by-Curl Dry Sculpt & Deep Moisture Infusion',
    stylistName: 'Lisa',
    stylistRole: 'Senior Stylist & Texture Specialist',
    stylistId: 'staff-lisa',
    imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=1400&q=85',
    technique: 'Dry architectural curl cutting respecting individual spring patterns',
    description: 'Every curl cluster evaluated in its natural dry state to eliminate pyramid shape and create balanced, weightless volume with high-definition curl definition.',
    duration: '60 mins',
    finishProducts: 'Curl Glaze Defining Cream & Diffuser Heat Treatment',
  },
  {
    id: 'slide-5',
    category: 'colour',
    categoryLabel: 'Luminous Blonding',
    title: 'Nordic Vanilla Micro-Foils & Glaze Fortification',
    stylistName: 'Leah',
    stylistRole: 'Senior Stylist & Colourist',
    stylistId: 'staff-leah',
    imageUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=85',
    technique: 'Ultra-fine back-to-back weaves with bond builder and pearl gloss finish',
    description: 'Luminous bright blonde reflection without brassiness. Engineered with internal bond preservation to protect hair cuticle integrity and provide velvet soft movement.',
    duration: '180 mins',
    finishProducts: 'Acidic Bonding Concentrate & Velvet Blow-dry Mist',
  },
  {
    id: 'slide-6',
    category: 'styling',
    categoryLabel: 'Occasion & Dimensional Gloss',
    title: 'Rich Chestnut Gloss, Curtain Fringe & Hollywood Waves',
    stylistName: 'Rob',
    stylistRole: 'Master Stylist & Barber',
    stylistId: 'staff-rob',
    imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1400&q=85',
    technique: 'Thermal brush beveling, soft face-framing layers & shine gloss seal',
    description: 'Dimensional brunette tones with high-gloss mirror shine. Sculpted face-framing curtain bangs with bouncy voluminous movement for red-carpet styling.',
    duration: '50 mins',
    finishProducts: 'GHD Thermal Protect Spray & High-Gloss Finishing Serum',
  },
];

interface Props {
  staff?: Staff[];
  onBookStyle?: (stylistId?: string, serviceId?: string) => void;
  onViewPortfolio?: () => void;
}

export const HomeGallerySlider: React.FC<Props> = ({ staff, onBookStyle, onViewPortfolio }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [lightboxSlide, setLightboxSlide] = useState<GallerySlide | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const filteredSlides = activeCategory === 'all'
    ? GALLERY_SLIDES
    : GALLERY_SLIDES.filter((s) => s.category === activeCategory);

  // Auto-play interval timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredSlides.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPlaying, filteredSlides.length]);

  // Adjust index if category filter leaves index out of bounds
  useEffect(() => {
    if (currentIndex >= filteredSlides.length) {
      setCurrentIndex(0);
    }
  }, [filteredSlides.length, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredSlides.length);
  };

  const currentSlide = filteredSlides[currentIndex] || filteredSlides[0];

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Editorial Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2A2620] pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#BFA57D] bg-[#231F19] px-3 py-1 rounded-full border border-[#3E3425]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Salon Lookbook & Portfolio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-heading text-[#F5F1EA] tracking-tight">
            Recent Work from Our Chair
          </h2>
          <p className="text-xs sm:text-sm text-[#A69B8D] leading-relaxed">
            Explore recent bespoke haircuts, dimensional colour transformations, and non-surgical hair systems handcrafted by our boutique stylists at 14 St John Street, Bromsgrove.
          </p>
        </div>

        {/* Filter Pills & View All Link */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-1.5 bg-[#161616] p-1 rounded-sm border border-[#2B2925]">
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs rounded-xs font-medium transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              All Styles
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('colour');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs rounded-xs font-medium transition-all cursor-pointer ${
                activeCategory === 'colour'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              Colour
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('cuts');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs rounded-xs font-medium transition-all cursor-pointer ${
                activeCategory === 'cuts'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              Precision Cuts
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('mens');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs rounded-xs font-medium transition-all cursor-pointer ${
                activeCategory === 'mens'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              Men's Systems
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('curls');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs rounded-xs font-medium transition-all cursor-pointer ${
                activeCategory === 'curls'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              Curls
            </button>
          </div>

          {onViewPortfolio && (
            <button
              type="button"
              onClick={onViewPortfolio}
              className="text-xs font-semibold uppercase tracking-wider text-[#BFA57D] hover:text-white transition-colors flex items-center gap-1.5 py-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Full Portfolio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Showcase Carousel */}
      <div
        className="relative bg-[#171614] border border-[#2E2820] rounded-lg overflow-hidden shadow-2xl transition-all"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[460px] lg:min-h-[520px]">
          {/* Left Column: Hairstyle High-Resolution Presentation */}
          <div className="lg:col-span-7 relative group overflow-hidden bg-[#100F0E] flex items-center justify-center">
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title}
              className="w-full h-full object-cover object-center max-h-[380px] lg:max-h-[520px] transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />

            {/* Subtle luxury gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-black/20 pointer-events-none" />

            {/* Category Tag Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="bg-[#141414]/90 backdrop-blur-md border border-[#443828] text-[#BFA57D] text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-sm shadow-md">
                {currentSlide.categoryLabel}
              </span>
            </div>

            {/* Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setLightboxSlide(currentSlide)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-[#141414]/85 text-[#D9D1C5] hover:text-white hover:bg-[#9B8058] hover:text-[#141414] border border-white/10 transition-all opacity-0 group-hover:opacity-100 shadow-lg cursor-pointer"
              title="Expand high-res preview"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Slide Navigation Overlay Arrows */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 pointer-events-none">
              <button
                type="button"
                onClick={handlePrev}
                className="pointer-events-auto p-2.5 rounded-full bg-[#141414]/80 text-[#D9D1C5] hover:text-white hover:bg-[#9B8058] hover:text-[#141414] border border-[#3E3425] transition-all backdrop-blur-sm cursor-pointer shadow-md"
                aria-label="Previous hairstyle"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="pointer-events-auto p-2.5 rounded-full bg-[#141414]/80 text-[#D9D1C5] hover:text-white hover:bg-[#9B8058] hover:text-[#141414] border border-[#3E3425] transition-all backdrop-blur-sm cursor-pointer shadow-md"
                aria-label="Next hairstyle"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Progress indicators at bottom of photo */}
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-[#A69B8D]">
              <div className="flex items-center gap-1.5">
                {filteredSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx
                        ? 'w-6 bg-[#9B8058]'
                        : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Jump to hairstyle ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="bg-[#141414]/80 px-2.5 py-0.5 rounded-full border border-white/10 font-mono text-[10px]">
                {currentIndex + 1} / {filteredSlides.length}
              </div>
            </div>
          </div>

          {/* Right Column: Hairstyle Editorial Details & Instant Booking CTA */}
          <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Stylist Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const matchedStaff = staff?.find(
                      (s) =>
                        s.name.toLowerCase() === currentSlide.stylistName.toLowerCase() ||
                        (currentSlide.stylistId && s.id === currentSlide.stylistId) ||
                        (currentSlide.stylistId && s.slug === currentSlide.stylistId.replace('staff-', '')) ||
                        s.id.includes(currentSlide.stylistName.toLowerCase()),
                    );
                    const avatarUrl = matchedStaff?.image_url;
                    return (
                      <div className="w-8 h-8 rounded-full bg-[#2A241C] border border-[#443828] text-[#BFA57D] flex items-center justify-center font-serif-heading text-xs font-semibold overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={currentSlide.stylistName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          currentSlide.stylistName.charAt(0)
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <span className="text-xs font-semibold text-[#F5F1EA] block">
                      Crafted by {currentSlide.stylistName}
                    </span>
                    <span className="text-[10px] text-[#A69B8D] block">
                      {currentSlide.stylistRole}
                    </span>
                  </div>
                </div>

                {/* Auto-play pause toggle */}
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-[10px] text-[#8C8273] hover:text-[#D9D1C5] flex items-center gap-1 px-2 py-1 rounded bg-[#201D19] border border-[#2F2922] transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-2.5 h-2.5" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5" />
                      <span>Autoplay</span>
                    </>
                  )}
                </button>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 pt-1">
                <h3 className="text-2xl sm:text-3xl font-serif-heading text-[#F5F1EA] leading-tight">
                  {currentSlide.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#D9D1C5] leading-relaxed font-light">
                  {currentSlide.description}
                </p>
              </div>

              {/* Technique & Formulation Highlights */}
              <div className="space-y-2.5 pt-3 border-t border-[#2A251D]">
                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C8273] font-semibold block">
                    Signature Technique
                  </span>
                  <div className="flex items-start gap-2 text-[#E5DFD5]">
                    <Scissors className="w-3.5 h-3.5 text-[#9B8058] shrink-0 mt-0.5" />
                    <span className="leading-snug">{currentSlide.technique}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-[#A69B8D]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />
                    <span>Duration: {currentSlide.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#BFA57D] shrink-0" />
                    <span>48-hr patch test compliant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Conversion CTA Section */}
            <div className="pt-4 border-t border-[#2A251D] flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => onBookStyle?.(currentSlide.stylistId, currentSlide.serviceId)}
                className="flex-1 bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:translate-y-px"
              >
                <Calendar className="w-4 h-4" />
                <span>Book This Look with {currentSlide.stylistName}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => setLightboxSlide(currentSlide)}
                className="border border-[#443828] hover:border-[#D9D1C5] text-[#D9D1C5] hover:text-white text-xs font-semibold uppercase tracking-wider px-4 py-3.5 rounded-sm transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#BFA57D]" />
                <span>Details</span>
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail Preview Strip below carousel */}
        <div className="hidden sm:flex items-center gap-2 p-3 bg-[#131210] border-t border-[#26211A] overflow-x-auto">
          <span className="text-[10px] uppercase tracking-wider text-[#8C8273] font-semibold px-2 shrink-0">
            Quick Select:
          </span>
          {filteredSlides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs transition-all shrink-0 cursor-pointer border ${
                currentIndex === idx
                  ? 'bg-[#262017] border-[#9B8058] text-[#F5F1EA] shadow-xs'
                  : 'bg-[#181613] border-transparent text-[#8C8273] hover:text-[#D9D1C5] hover:border-[#382F22]'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt=""
                className="w-5 h-5 rounded-xs object-cover"
              />
              <span className="truncate max-w-[140px] text-[11px] font-medium">
                {slide.title.split(' ')[0]} {slide.title.split(' ')[1]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-Screen High-Resolution Lightbox Modal */}
      {lightboxSlide && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-10 animate-fadeIn"
          onClick={() => setLightboxSlide(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#181613] border border-[#3E3425] rounded-lg overflow-hidden shadow-2xl space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLightboxSlide(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-[#D9D1C5] hover:text-white hover:bg-black/90 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative bg-black flex items-center justify-center min-h-[300px] md:min-h-[480px]">
                <img
                  src={lightboxSlide.imageUrl}
                  alt={lightboxSlide.title}
                  className="w-full h-full object-cover max-h-[500px]"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#BFA57D] bg-[#2A241C] px-2.5 py-0.5 rounded-full border border-[#443828]">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>{lightboxSlide.categoryLabel}</span>
                  </div>

                  <h3 className="font-serif-heading text-2xl sm:text-3xl text-[#F5F1EA]">
                    {lightboxSlide.title}
                  </h3>

                  <div className="text-xs text-[#BFA57D] font-medium flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>Stylist: {lightboxSlide.stylistName} ({lightboxSlide.stylistRole})</span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#D9D1C5] leading-relaxed">
                    {lightboxSlide.description}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-[#2A251D] text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#8C8273] block">
                        Technique & Method:
                      </span>
                      <span className="text-[#E5DFD5]">{lightboxSlide.technique}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#8C8273] block">
                        Recommended Finish Products:
                      </span>
                      <span className="text-[#E5DFD5]">{lightboxSlide.finishProducts}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2A251D]">
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxSlide(null);
                      onBookStyle?.(lightboxSlide.stylistId, lightboxSlide.serviceId);
                    }}
                    className="w-full bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book with {lightboxSlide.stylistName}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
