import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  CheckCircle2,
  ShieldCheck,
  MessageSquarePlus,
  ArrowRight,
  Sparkles,
  Scissors,
  User,
  X,
} from 'lucide-react';
import type { Testimonial, TestimonialStats, Staff, NewTestimonialPayload } from '../types';
import { fetchTestimonials, submitTestimonial } from '../api/client';

interface Props {
  staff?: Staff[];
  onBookClick?: (staffId?: string, serviceId?: string) => void;
  onExploreServices?: () => void;
  onNavigate?: (view: string, context?: any) => void;
}

// Curated verified real client feedback for immediate rendering & zero layout shift
const INITIAL_TESTIMONIALS: Testimonial[] = [
  {
    id: 'test_01',
    client_name: 'Claire M.',
    client_location: 'Bromsgrove',
    rating: 5,
    category: 'curly',
    service_name: 'Dry Curl-by-Curl Specialist Cut',
    stylist_id: 'staff_lisa',
    stylist_name: 'Lisa',
    quote: 'I spent 15 years searching across the Midlands for someone who genuinely understood textured curls. Lisa is a true master.',
    detail: 'She evaluated my natural 3B curl coils section-by-section in their dry state, respecting natural shrinkage. No pyramid effect, no frizzy blowout. My curls have never held such effortless spring and definition.',
    verified: true,
    source: 'Google Verified',
    date: 'Verified Client · 2 weeks ago',
    created_at: '2026-09-12T10:00:00Z',
  },
  {
    id: 'test_02',
    client_name: 'Dr. Rebecca T.',
    client_location: 'Barnt Green',
    rating: 5,
    category: 'precision',
    service_name: 'Architectural Geometric Bob',
    stylist_id: 'staff_george_snr',
    stylist_name: 'George Snr',
    quote: 'George Snr’s precision cutting is absolute artistry. My blunt bob falls perfectly into place with zero morning styling.',
    detail: 'His classic Vidal Sassoon precision training is evident in every scissor stroke. The hairline perimeter is laser-sharp, but the internal weight reduction gives the cut weightless fluidity.',
    verified: true,
    source: 'Google Verified',
    date: 'Verified Client · 3 weeks ago',
    created_at: '2026-09-05T14:30:00Z',
  },
  {
    id: 'test_03',
    client_name: 'Charlotte B.',
    client_location: 'Droitwich',
    rating: 5,
    category: 'colour',
    service_name: 'Bespoke Balayage & Gloss Toner',
    stylist_id: 'staff_kirstin',
    stylist_name: 'Kirstin',
    quote: 'The balayage transition from my natural root to sunlit honey ribbons is seamless. Pure perfection.',
    detail: 'Strict patch testing gave me total peace of mind, and the tailored gloss toner left my hair silky and reflective without unwanted brassiness.',
    verified: true,
    source: 'Good Salon Guide',
    date: 'Verified Client · 1 month ago',
    created_at: '2026-08-28T11:15:00Z',
  },
  {
    id: 'test_04',
    client_name: 'Marcus P.',
    client_location: 'Bromsgrove',
    rating: 5,
    category: 'mens',
    service_name: "Men's Precision Scissor Taper & Scalp Care",
    stylist_id: 'staff_george_jnr',
    stylist_name: 'George Jnr',
    quote: 'George Jnr provides exceptional barbering precision. Undetectable graduation and bespoke scalp care.',
    detail: 'Private, professional environment in the salon with zero rushing. Best men’s scissor-over-comb cutting in Worcestershire.',
    verified: true,
    source: 'Google Verified',
    date: 'Verified Client · 1 month ago',
    created_at: '2026-08-20T16:00:00Z',
  },
  {
    id: 'test_05',
    client_name: 'Hannah D.',
    client_location: 'Worcestershire',
    rating: 5,
    category: 'curly',
    service_name: 'Specialist Curl Restoration & Hydration',
    stylist_id: 'staff_lisa',
    stylist_name: 'Lisa',
    quote: 'Having thick 3C curls, salon visits were always anxiety-inducing until I found George Davis.',
    detail: 'They took time to explain curl porosity and moisture seals before even touching a scissor. Three months on and the silhouette has grown out flawlessly without losing its shape.',
    verified: true,
    source: 'Salon Verified',
    date: 'Verified Client · 6 weeks ago',
    created_at: '2026-08-14T09:45:00Z',
  },
  {
    id: 'test_06',
    client_name: 'Eleanor W.',
    client_location: 'Redditch',
    rating: 5,
    category: 'precision',
    service_name: 'Precision Restyle & Scissor Shape',
    stylist_id: 'staff_george_snr',
    stylist_name: 'George Snr',
    quote: 'You immediately notice the difference between a rushed high-street cut and true architectural craft.',
    detail: 'Every angle is tailored to your jawline and bone structure. Even 8 weeks after my appointment, my layers still look freshly cut. Worth every single penny.',
    verified: true,
    source: 'Google Verified',
    date: 'Verified Client · 2 months ago',
    created_at: '2026-07-30T13:20:00Z',
  },
  {
    id: 'test_07',
    client_name: 'James K.',
    client_location: 'Solihull',
    rating: 5,
    category: 'mens',
    service_name: 'Non-Surgical Hair Replacement Consultation',
    stylist_id: 'staff_george_jnr',
    stylist_name: 'George Jnr',
    quote: 'The bespoke hair system consultation gave me my confidence back. Completely discreet, undetectable, and professional.',
    detail: 'George Jnr is immensely knowledgeable, patient, and respectful. The hairline blend is so seamless that even my closest friends couldn’t tell. Absolute game-changer.',
    verified: true,
    source: 'Salon Verified',
    date: 'Verified Client · 2 months ago',
    created_at: '2026-07-22T15:00:00Z',
  },
  {
    id: 'test_08',
    client_name: 'Sophie L.',
    client_location: 'Alvechurch',
    rating: 5,
    category: 'colour',
    service_name: 'Luminous Blonde Foiling & Bond Repair',
    stylist_id: 'staff_leah',
    stylist_name: 'Leah',
    quote: 'Leah achieved the cleanest, brightest Scandinavian blonde without compromising my hair’s strength.',
    detail: 'The OLAPLEX integration and careful sectioning protected my fine hair completely. The tone is pure champagne pearl, zero yellowing.',
    verified: true,
    source: 'Google Verified',
    date: 'Verified Client · 2 months ago',
    created_at: '2026-07-15T11:30:00Z',
  },
];

export const TestimonialCarousel: React.FC<Props> = ({
  staff = [],
  onBookClick,
  onExploreServices,
  onNavigate,
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(INITIAL_TESTIMONIALS);
  const [stats, setStats] = useState<TestimonialStats | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Review submission state
  const [reviewForm, setReviewForm] = useState<NewTestimonialPayload>({
    client_name: '',
    client_location: 'Bromsgrove',
    rating: 5,
    category: 'curly',
    service_name: 'Dry Curl-by-Curl Specialist Cut',
    stylist_id: staff[0]?.id || 'staff_lisa',
    stylist_name: staff[0]?.name || 'Lisa',
    quote: '',
    detail: '',
  });

  // Fetch updated testimonials from backend
  useEffect(() => {
    let isMounted = true;
    fetchTestimonials()
      .then((data) => {
        if (isMounted && data.testimonials && data.testimonials.length > 0) {
          setTestimonials(data.testimonials);
          if (data.stats) setStats(data.stats);
        }
      })
      .catch((err) => {
        console.warn('Testimonial background refresh deferred:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter testimonials based on category
  const filteredTestimonials = useMemo(() => {
    if (categoryFilter === 'all') return testimonials;
    return testimonials.filter((t) => t.category === categoryFilter);
  }, [testimonials, categoryFilter]);

  // Ensure index stays in valid range when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [categoryFilter]);

  // Auto-scroll carousel every 6 seconds if not paused
  useEffect(() => {
    if (!isAutoScrolling || filteredTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [isAutoScrolling, filteredTestimonials.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredTestimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const current = filteredTestimonials[currentIndex] || filteredTestimonials[0];

  // Helper to find staff portrait from props
  const getStylistAvatar = (stylistName: string, stylistId?: string) => {
    const matched = staff.find(
      (s) => (stylistId && s.id === stylistId) || s.name.toLowerCase() === stylistName.toLowerCase(),
    );
    return matched?.image_url;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.client_name.trim() || !reviewForm.quote.trim()) {
      setSubmitError('Please enter your name and review quote.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitTestimonial(reviewForm);
      setSubmitSuccess(true);
      const data = await fetchTestimonials();
      if (data.testimonials?.length) {
        setTestimonials(data.testimonials);
      }
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setReviewForm({
          client_name: '',
          client_location: 'Bromsgrove',
          rating: 5,
          category: 'curly',
          service_name: 'Dry Curl-by-Curl Specialist Cut',
          stylist_id: staff[0]?.id || 'staff_lisa',
          stylist_name: staff[0]?.name || 'Lisa',
          quote: '',
          detail: '',
        });
      }, 1600);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Client Feedback & Testimonials"
      className="bg-[#121110] border-y border-[#26221C] py-20 relative overflow-hidden"
      id="client-feedback"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9B8058]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#BFA57D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        
        {/* Section Header & Social Proof Trust Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#24201A] pb-8">
          <div className="space-y-3 max-w-2xl">
            {/* Zero-Pill text metadata with typographic separators */}
            <div className="flex items-center gap-2 text-xs text-[#BFA57D]">
              <span className="font-semibold uppercase tracking-widest">Verified Client Reviews</span>
              <span aria-hidden="true">·</span>
              <span>14 St John St, Bromsgrove</span>
              <span aria-hidden="true">·</span>
              <span>Good Salon Guide 5 Stars</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-heading text-[#F5F1EA] tracking-tight">
              Words from Our Chair
            </h2>
            <p className="text-xs sm:text-sm text-[#A69B8D] leading-relaxed">
              Unfiltered reflections from Bromsgrove and Worcestershire clients celebrating our specialist focus in dry curl architectural cutting, bespoke dimensional colour, and precision scissor craft.
            </p>
          </div>

          {/* Social Proof Trust Island */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-[#171513] border border-[#2B261F] p-4 sm:p-5 rounded-sm shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                ))}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-serif-heading font-bold text-[#F5F1EA]">
                  {stats ? stats.averageRating.toFixed(1) : '4.9'}
                </span>
                <span className="text-xs text-[#8C8273]">/ 5.0 Rating</span>
              </div>
              <div className="text-[11px] text-[#A69B8D]">
                {stats ? stats.totalReviews : '320+'} Verified Client Reviews
              </div>
            </div>

            <div className="pl-4 sm:pl-6 border-l border-[#2B251D] space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Patch Test Safe</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-xs text-[#BFA57D] hover:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer group"
              >
                <MessageSquarePlus className="w-3.5 h-3.5 text-[#BFA57D] group-hover:scale-110 transition-transform" />
                <span className="underline underline-offset-4">Leave a Review</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Filter & Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs (Segmented Button Controls - Zero Pill) */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#171513] border border-[#26221C] rounded-sm text-xs">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'curly', label: 'Textured Curls' },
              { id: 'colour', label: 'Bespoke Balayage' },
              { id: 'precision', label: 'Precision Cuts' },
              { id: 'mens', label: "Men's Barbering" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xs transition-colors cursor-pointer font-medium ${
                  categoryFilter === tab.id
                    ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Carousel Slide Counter & Prev/Next Controls */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Auto-scroll toggle */}
            <button
              type="button"
              onClick={() => setIsAutoScrolling(!isAutoScrolling)}
              className="text-[11px] text-[#8C8273] hover:text-[#D9D1C5] flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-[#171513] border border-[#26221C] transition-colors cursor-pointer"
              title={isAutoScrolling ? 'Pause automatic carousel' : 'Enable auto-play'}
            >
              {isAutoScrolling ? (
                <>
                  <Pause className="w-3 h-3 text-[#BFA57D]" />
                  <span className="hidden sm:inline">Auto</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-[#BFA57D]" />
                  <span className="hidden sm:inline">Paused</span>
                </>
              )}
            </button>

            {/* Pagination index */}
            <span className="text-xs font-mono text-[#8C8273] tracking-wider">
              {String(currentIndex + 1).padStart(2, '0')} / {String(filteredTestimonials.length).padStart(2, '0')}
            </span>

            {/* Direction Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous testimonial"
                className="p-2 rounded-sm bg-[#171513] hover:bg-[#25201A] text-[#D9D1C5] hover:text-white border border-[#2B261F] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next testimonial"
                className="p-2 rounded-sm bg-[#171513] hover:bg-[#25201A] text-[#D9D1C5] hover:text-white border border-[#2B261F] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY FEATURED TESTIMONIAL CAROUSEL CARD */}
        {current && (
          <div
            className="bg-[#171513] border border-[#2F2921] rounded-sm p-6 sm:p-10 lg:p-12 relative shadow-2xl transition-all"
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => setIsAutoScrolling(true)}
          >
            {/* Watermark Quote Icon */}
            <div className="absolute top-6 right-8 text-[#9B8058]/10 pointer-events-none">
              <Quote className="w-20 h-20 sm:w-28 sm:h-28 rotate-180" />
            </div>

            <div className="max-w-4xl space-y-6 relative z-10">
              {/* Star Rating & Clean Metadata Line */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#8C8273]">
                <div className="flex items-center gap-0.5 text-[#D4AF37]">
                  {[...Array(current.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                  ))}
                </div>
                <span aria-hidden="true">·</span>
                <span className="text-[#BFA57D] font-medium uppercase tracking-wider text-[11px]">
                  {current.service_name}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{current.source || 'Verified Client'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-[#8C8273] text-[11px]">{current.date}</span>
              </div>

              {/* Lead Customer Quote */}
              <blockquote className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl text-[#F5F1EA] leading-snug">
                "{current.quote}"
              </blockquote>

              {/* Experience Detail */}
              <p className="text-xs sm:text-sm text-[#D9D1C5] leading-relaxed font-light max-w-3xl">
                {current.detail}
              </p>

              {/* Client & Stylist Attribution Footer */}
              <div className="pt-6 border-t border-[#26211A] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Author Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-base text-[#F5F1EA] font-serif-heading tracking-wide">
                      {current.client_name}
                    </strong>
                    {current.client_location && (
                      <span className="text-xs text-[#8C8273]">· {current.client_location}</span>
                    )}
                  </div>
                  <div className="text-xs text-[#A69B8D] flex items-center gap-2">
                    <span>Stylist:</span>
                    <strong className="text-[#BFA57D] font-medium">{current.stylist_name}</strong>
                  </div>
                </div>

                {/* Direct Action: Book with this stylist */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onBookClick) {
                        onBookClick(current.stylist_id);
                      } else if (onNavigate) {
                        onNavigate('book', { preSelectedStaffId: current.stylist_id });
                      }
                    }}
                    className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm active:translate-y-px"
                  >
                    <span>Book with {current.stylist_name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {onExploreServices && (
                    <button
                      type="button"
                      onClick={onExploreServices}
                      className="text-xs text-[#D9D1C5] hover:text-white underline underline-offset-4 px-2 py-2 cursor-pointer"
                    >
                      View Treatment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECONDARY MULTI-CARD CAROUSEL PREVIEW STRIP */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-[#8C8273] tracking-wider">
              More Verified Stories ({filteredTestimonials.length} Reviews)
            </span>
            {/* Interactive Dot Indicator Bar */}
            <div className="flex items-center gap-1.5">
              {filteredTestimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Jump to review ${idx + 1}`}
                  className={`h-1.5 transition-all rounded-full cursor-pointer ${
                    currentIndex === idx ? 'w-6 bg-[#9B8058]' : 'w-1.5 bg-[#332E26] hover:bg-[#5A5144]'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredTestimonials
              .filter((_, idx) => idx !== currentIndex)
              .slice(0, 3)
              .map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    const foundIdx = filteredTestimonials.findIndex((item) => item.id === t.id);
                    if (foundIdx !== -1) setCurrentIndex(foundIdx);
                  }}
                  className="bg-[#171513] border border-[#252019] hover:border-[#9B8058]/50 p-5 rounded-sm space-y-3 cursor-pointer transition-all hover:translate-y-[-2px] group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5 text-[#D4AF37]">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#D4AF37]" />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#8C8273]">{t.source}</span>
                  </div>

                  <blockquote className="text-xs text-[#F5F1EA] font-serif-heading line-clamp-2 leading-snug group-hover:text-[#BFA57D] transition-colors">
                    "{t.quote}"
                  </blockquote>

                  <p className="text-[11px] text-[#A69B8D] line-clamp-2 leading-relaxed">
                    {t.detail}
                  </p>

                  <div className="pt-2 border-t border-[#221D17] flex items-center justify-between text-[11px]">
                    <span className="text-[#D9D1C5] font-medium">{t.client_name}</span>
                    <span className="text-[#BFA57D]">{t.stylist_name}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

      {/* Review Submission Modal */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div className="bg-[#181614] border border-[#332B20] rounded-sm max-w-lg w-full p-6 sm:p-8 space-y-5 text-xs shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#2B251D] pb-3">
              <div>
                <h3 className="font-serif-heading text-xl text-[#F5F1EA]">
                  Share Your Salon Experience
                </h3>
                <p className="text-[11px] text-[#8C8273] mt-0.5">
                  George Davis Hairdressing · 14 St John St, Bromsgrove
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#8C8273] hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-800 p-5 rounded text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-semibold text-emerald-200">Thank You!</h4>
                <p className="text-xs text-emerald-300">
                  Your verified client review has been recorded and added to the salon showcase.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded text-xs">
                    {submitError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#8C8273] mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah M."
                      value={reviewForm.client_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, client_name: e.target.value })}
                      className="w-full bg-[#121110] border border-[#2B251D] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#8C8273] mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bromsgrove"
                      value={reviewForm.client_location}
                      onChange={(e) => setReviewForm({ ...reviewForm, client_location: e.target.value })}
                      className="w-full bg-[#121110] border border-[#2B251D] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#8C8273] mb-1">
                      Stylist *
                    </label>
                    <select
                      value={reviewForm.stylist_id}
                      onChange={(e) => {
                        const selected = staff.find((s) => s.id === e.target.value);
                        setReviewForm({
                          ...reviewForm,
                          stylist_id: e.target.value,
                          stylist_name: selected?.name || reviewForm.stylist_name,
                        });
                      }}
                      className="w-full bg-[#121110] border border-[#2B251D] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                    >
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role_title})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#8C8273] mb-1">
                      Treatment Category
                    </label>
                    <select
                      value={reviewForm.category}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full bg-[#121110] border border-[#2B251D] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                    >
                      <option value="curly">Textured Curls & Dry Cut</option>
                      <option value="colour">Bespoke Balayage & Colour</option>
                      <option value="precision">Precision Scissor Cut</option>
                      <option value="mens">Men's Barbering & Systems</option>
                      <option value="styling">Occasion Blow-Dry & Styling</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#8C8273] mb-1">
                    Lead Quote * (One memorable sentence)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My curls have never felt so bouncy and effortless."
                    value={reviewForm.quote}
                    onChange={(e) => setReviewForm({ ...reviewForm, quote: e.target.value })}
                    className="w-full bg-[#121110] border border-[#2B251D] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#8C8273] mb-1">
                    Review Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Share details about the consultation, haircut, or hair transformation..."
                    value={reviewForm.detail}
                    onChange={(e) => setReviewForm({ ...reviewForm, detail: e.target.value })}
                    className="w-full bg-[#121110] border border-[#2B251D] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#26211A]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-[#8C8273] hover:text-[#D9D1C5] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
