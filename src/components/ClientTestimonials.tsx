import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  CheckCircle2,
  Scissors,
  Sparkles,
  Award,
  ArrowRight,
  Heart,
  Grid,
  Layers,
  MessageSquarePlus,
  X,
  ShieldCheck,
  User,
  Palette,
  MapPin,
  Calendar,
} from 'lucide-react';
import type { Testimonial, TestimonialStats, Staff, NewTestimonialPayload } from '../types';
import { fetchTestimonials, submitTestimonial } from '../api/client';

interface Props {
  staff?: Staff[];
  onBookClick?: (staffId?: string, serviceId?: string) => void;
  onExploreServices?: () => void;
}

export const ClientTestimonials: React.FC<Props> = ({
  staff = [],
  onBookClick,
  onExploreServices,
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stats, setStats] = useState<TestimonialStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stylistFilter, setStylistFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'spotlight' | 'grid'>('spotlight');

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);

  // Review submission modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<NewTestimonialPayload>({
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

  // Fetch reviews on mount and when filter changes
  const loadTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTestimonials({
        category: categoryFilter,
        stylistId: stylistFilter,
      });
      setTestimonials(data.testimonials);
      setStats(data.stats);
    } catch (err: any) {
      console.error('Error fetching testimonials:', err);
      setError(err.message || 'Could not load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, [categoryFilter, stylistFilter]);

  // Auto-scroll through spotlight carousel every 7 seconds
  useEffect(() => {
    if (!isAutoScrolling || viewMode !== 'spotlight' || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [isAutoScrolling, viewMode, testimonials.length]);

  // Reset index if out of range
  useEffect(() => {
    if (currentIndex >= testimonials.length) {
      setCurrentIndex(0);
    }
  }, [testimonials.length, currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const current = testimonials[currentIndex] || testimonials[0];

  // Helper to find staff portrait from props
  const getStylistAvatar = (stylistName: string, stylistId?: string) => {
    const matched = staff.find(
      (s) => (stylistId && s.id === stylistId) || s.name.toLowerCase() === stylistName.toLowerCase(),
    );
    return matched?.image_url;
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name.trim() || !formData.quote.trim()) {
      setSubmitError('Please provide your name and review feedback.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      await submitTestimonial(formData);
      setSubmitSuccess(true);
      await loadTestimonials();
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
        setFormData({
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
      }, 1800);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#131210] py-20 border-y border-[#29241D] relative overflow-hidden" id="testimonials">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#9B8058]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#BFA57D]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
        {/* Section Header & Trust Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-[#28231C] pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[#BFA57D]">
              <span className="font-semibold uppercase tracking-widest">Client Testimonials</span>
              <span aria-hidden="true">·</span>
              <span>14 St John St, Bromsgrove</span>
              <span aria-hidden="true">·</span>
              <span>Good Salon Guide 5 Stars</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif-heading text-[#F5F1EA] tracking-tight">
              Words from Our Chair
            </h2>
            <p className="text-xs sm:text-sm text-[#A69B8D] leading-relaxed">
              Genuine reflections from Bromsgrove and Worcestershire clients celebrating our specialist focus in curl-by-curl architectural cutting, bespoke dimensional colour, and precision scissor craft.
            </p>
          </div>

          {/* Social Proof Trust Island */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 bg-[#181614] border border-[#2E2820] p-4 sm:p-5 rounded-sm shrink-0">
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
                <span className="text-xs text-[#8C8273]">/ 5.0 rating</span>
              </div>
              <div className="text-[11px] text-[#A69B8D]">
                {stats ? stats.totalReviews : '320+'} Verified Google & Salon Reviews
              </div>
            </div>

            <div className="pl-4 sm:pl-6 border-l border-[#2B251D] space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Patch-Tested Safe</span>
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

        {/* Filter Controls Bar (Zero-Pill Compliance: segmented button tabs) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#181614] border border-[#26221C] rounded-sm">
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('all');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              All Client Stories {stats ? `(${stats.categories.find((c) => c.id === 'all')?.count || testimonials.length})` : ''}
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoryFilter('curly');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'curly'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Curly Hair Craft</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoryFilter('precision');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'precision'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Precision Cutting</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoryFilter('colour');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'colour'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Bespoke Colour</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategoryFilter('mens');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'mens'
                  ? 'bg-[#9B8058] text-[#141414] font-bold shadow-xs'
                  : 'text-[#8C8273] hover:text-[#D9D1C5]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Men's & Systems</span>
            </button>
          </div>

          {/* View Mode & Carousel Controls */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* View Mode Segmented Switch */}
            <div className="flex items-center bg-[#181614] border border-[#26221C] p-0.5 rounded-sm text-xs">
              <button
                type="button"
                onClick={() => setViewMode('spotlight')}
                className={`p-1.5 rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'spotlight'
                    ? 'bg-[#29241D] text-[#F5F1EA]'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
                title="Spotlight Carousel View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Spotlight</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-[#29241D] text-[#F5F1EA]'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
                title="Browse All Reviews in Grid"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All ({testimonials.length})</span>
              </button>
            </div>

            {viewMode === 'spotlight' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                  className="text-[11px] text-[#8C8273] hover:text-[#D9D1C5] flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-[#181614] border border-[#26221C] transition-colors cursor-pointer"
                  title={isAutoScrolling ? 'Pause automatic scroll' : 'Enable auto-scroll'}
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

                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-sm bg-[#181614] hover:bg-[#26221C] text-[#D9D1C5] border border-[#26221C] transition-colors cursor-pointer"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-sm bg-[#181614] hover:bg-[#26221C] text-[#D9D1C5] border border-[#26221C] transition-colors cursor-pointer"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-[#181614] border border-[#29241D] rounded-lg p-10 animate-pulse space-y-4">
            <div className="h-4 bg-[#2A241C] w-1/4 rounded" />
            <div className="h-8 bg-[#2A241C] w-3/4 rounded" />
            <div className="h-16 bg-[#2A241C] w-full rounded" />
          </div>
        )}

        {/* SPOTLIGHT CAROUSEL VIEW */}
        {!loading && viewMode === 'spotlight' && current && (
          <div
            className="bg-[#181614] border border-[#332B20] rounded-lg p-6 sm:p-10 lg:p-12 relative shadow-2xl transition-all"
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => setIsAutoScrolling(true)}
          >
            {/* Elegant Quotation Mark Watermark */}
            <div className="absolute top-6 right-8 text-[#9B8058]/10 pointer-events-none">
              <Quote className="w-24 h-24 rotate-180" />
            </div>

            <div className="max-w-4xl space-y-6 relative z-10">
              {/* Star Rating & Quiet Text Metadata (Zero-Pill Compliance) */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C8273]">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(current.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                  ))}
                </div>
                <span aria-hidden="true">·</span>
                <span className="text-[#BFA57D] font-medium uppercase tracking-wider text-[11px]">
                  {current.category === 'curly' && 'Curly Hair Specialist Cut'}
                  {current.category === 'precision' && 'Precision Scissor Craft'}
                  {current.category === 'colour' && 'Bespoke Balayage & Colour'}
                  {current.category === 'mens' && "Men's Barbering & Hair System"}
                  {current.category === 'styling' && 'Occasion Styling & Blow-Dry'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{current.source || 'Verified Appointment'}</span>
                </span>
              </div>

              {/* Lead Quote */}
              <blockquote className="font-serif-heading text-2xl sm:text-3xl lg:text-4xl text-[#F5F1EA] leading-snug">
                "{current.quote}"
              </blockquote>

              {/* In-Depth Experience Detail */}
              <p className="text-xs sm:text-sm text-[#D9D1C5] leading-relaxed font-light">
                {current.detail}
              </p>

              {/* Author & Stylist Attribution Bar */}
              <div className="pt-6 border-t border-[#29241D] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                {/* Client & Service */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-base text-[#F5F1EA] font-serif-heading">
                      {current.client_name}
                    </strong>
                    {current.client_location && (
                      <span className="text-xs text-[#8C8273]">({current.client_location})</span>
                    )}
                  </div>
                  <div className="text-xs text-[#A69B8D] flex items-center gap-2">
                    <span className="text-[#BFA57D]">{current.service_name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{current.date}</span>
                  </div>
                </div>

                {/* Stylist Profile & Direct Booking Action */}
                <div className="flex items-center gap-3 bg-[#131210] border border-[#2B251D] px-4 py-2.5 rounded-sm">
                  {/* Stylist Avatar Thumbnail */}
                  <div className="w-10 h-10 rounded-full bg-[#26221C] border border-[#3E3529] overflow-hidden shrink-0 flex items-center justify-center">
                    {getStylistAvatar(current.stylist_name, current.stylist_id) ? (
                      <img
                        src={getStylistAvatar(current.stylist_name, current.stylist_id)}
                        alt={current.stylist_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-serif-heading text-base text-[#BFA57D]">
                        {current.stylist_name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-[#8C8273] uppercase tracking-wider block">
                      Dedicated Stylist
                    </span>
                    <span className="text-xs font-semibold text-[#F5F1EA] block">
                      {current.stylist_name}
                    </span>
                  </div>

                  {onBookClick && (
                    <button
                      type="button"
                      onClick={() => onBookClick(current.stylist_id)}
                      className="ml-2 text-[11px] font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] px-3 py-1.5 rounded-xs transition-colors cursor-pointer shrink-0"
                    >
                      Book Chair
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stepper Dots */}
            <div className="flex items-center gap-2 pt-8">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'w-8 bg-[#9B8058]'
                      : 'w-2 bg-[#332A1F] hover:bg-[#9B8058]/50'
                  }`}
                  aria-label={`Jump to review ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ALL REVIEWS GRID VIEW */}
        {!loading && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="bg-[#181614] border border-[#2A241C] p-6 rounded-sm space-y-4 hover:border-[#9B8058]/40 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Rating & Source */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#D4AF37]">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37]" />
                      ))}
                    </div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{item.source}</span>
                    </span>
                  </div>

                  {/* Headline Quote */}
                  <h3 className="font-serif-heading text-lg text-[#F5F1EA] leading-snug">
                    "{item.quote}"
                  </h3>

                  {/* Experience Detail */}
                  <p className="text-xs text-[#A69B8D] leading-relaxed line-clamp-4">
                    {item.detail}
                  </p>
                </div>

                {/* Footer Attribution & Stylist Link */}
                <div className="pt-4 border-t border-[#252019] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-[#F5F1EA] block">{item.client_name}</strong>
                      <span className="text-[11px] text-[#8C8273]">{item.client_location || 'Bromsgrove'}</span>
                    </div>
                    <span className="text-[10px] text-[#8C8273]">{item.date.split('·')[1] || item.date}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#26221C] border border-[#3E3529] overflow-hidden shrink-0 flex items-center justify-center">
                        {getStylistAvatar(item.stylist_name, item.stylist_id) ? (
                          <img
                            src={getStylistAvatar(item.stylist_name, item.stylist_id)}
                            alt={item.stylist_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-serif-heading text-xs text-[#BFA57D]">
                            {item.stylist_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#D9D1C5]">
                        Stylist: <strong className="text-[#F5F1EA]">{item.stylist_name}</strong>
                      </span>
                    </div>

                    {onBookClick && (
                      <button
                        type="button"
                        onClick={() => onBookClick(item.stylist_id)}
                        className="text-[11px] text-[#BFA57D] hover:text-white font-medium underline underline-offset-2 cursor-pointer"
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continuous Horizontal Scrolling Ticker Strip */}
        <div className="relative overflow-hidden bg-[#161411] border border-[#282219] py-4 rounded-sm">
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap text-xs text-[#A69B8D]">
            <div className="flex items-center gap-8 shrink-0">
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Scissors className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Best precision bob in Worcestershire"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Transformed my 3B curly pattern without heat damage"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Award className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Good Salon Guide 5-Star Accredited"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Strict 48h allergy testing standard"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Heart className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Zero rushing, 1-on-1 private consultations"
              </span>
              <span>·</span>
            </div>

            {/* Repeat for seamless ticker loop */}
            <div className="flex items-center gap-8 shrink-0">
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Scissors className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Best precision bob in Worcestershire"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Transformed my 3B curly pattern without heat damage"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Award className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Good Salon Guide 5-Star Accredited"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Strict 48h allergy testing standard"
              </span>
              <span>·</span>
              <span className="flex items-center gap-2 text-[#D9D1C5] font-medium">
                <Heart className="w-3.5 h-3.5 text-[#BFA57D]" />
                "Zero rushing, 1-on-1 private consultations"
              </span>
              <span>·</span>
            </div>
          </div>
        </div>

        {/* Bottom Call to Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#262119]">
          <div className="text-xs text-[#A69B8D] text-center sm:text-left">
            Have you visited George Davis recently? We invite every client to share their experience.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-semibold uppercase tracking-wider text-[#BFA57D] hover:text-white px-4 py-2 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Share Experience</span>
            </button>

            {onExploreServices && (
              <button
                type="button"
                onClick={onExploreServices}
                className="text-xs font-semibold uppercase tracking-wider text-[#D9D1C5] hover:text-white px-4 py-2 transition-colors cursor-pointer"
              >
                Browse Treatments
              </button>
            )}

            {onBookClick && (
              <button
                type="button"
                onClick={() => onBookClick()}
                className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-sm transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:translate-y-px"
              >
                <span>Book Your Chair</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SUBMIT REVIEW MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#181614] border border-[#3E3426] rounded-md max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#8C8273] hover:text-white p-1 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#BFA57D]">
                George Davis Hairdressing
              </span>
              <h3 className="font-serif-heading text-2xl text-[#F5F1EA]">
                Share Your Salon Experience
              </h3>
              <p className="text-xs text-[#8C8273]">
                Your feedback supports our craft and helps new clients find the right specialist.
              </p>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 p-4 rounded text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-semibold text-sm">Thank You for Your Feedback!</h4>
                <p className="text-xs text-emerald-300">
                  Your verified client review has been recorded and added to the salon showcase.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-red-950/70 border border-red-800 text-red-200 text-xs rounded">
                    {submitError}
                  </div>
                )}

                {/* Rating Stars Selector */}
                <div>
                  <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1 cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= formData.rating
                              ? 'fill-[#D4AF37] text-[#D4AF37]'
                              : 'text-[#443E36]'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-[#BFA57D] font-mono ml-2">
                      {formData.rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah J."
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full bg-[#12110F] border border-[#2D2821] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                      Town / Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bromsgrove, Barnt Green"
                      value={formData.client_location}
                      onChange={(e) => setFormData({ ...formData, client_location: e.target.value })}
                      className="w-full bg-[#12110F] border border-[#2D2821] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                      Stylist Who Looked After You
                    </label>
                    <select
                      value={formData.stylist_id}
                      onChange={(e) => {
                        const stId = e.target.value;
                        const match = staff.find((s) => s.id === stId);
                        setFormData({
                          ...formData,
                          stylist_id: stId,
                          stylist_name: match ? match.name : 'Salon Stylist',
                        });
                      }}
                      className="w-full bg-[#12110F] border border-[#2D2821] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058] cursor-pointer"
                    >
                      {staff.length > 0 ? (
                        staff.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name} ({st.role_title.split('&')[0]})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="staff_george_snr">George Snr (Salon Director)</option>
                          <option value="staff_lisa">Lisa (Texture Specialist)</option>
                          <option value="staff_george_jnr">George Jnr (Master Barber)</option>
                          <option value="staff_kirstin">Kirstin (Colour Specialist)</option>
                          <option value="staff_leah">Leah (Colourist & Extensions)</option>
                          <option value="staff_rob">Rob (Senior Stylist)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                      Specialty Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full bg-[#12110F] border border-[#2D2821] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058] cursor-pointer"
                    >
                      <option value="curly">Curly Hair Specialist Cut</option>
                      <option value="precision">Precision Cutting & Bob</option>
                      <option value="colour">Balayage & Dimensional Colour</option>
                      <option value="mens">Men's Barbering / Hair Systems</option>
                      <option value="styling">Occasion Styling & Blow-Dry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                    Treatment / Service Received
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dry Curl Cut, Bespoke Balayage, Precision Restyle"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    className="w-full bg-[#12110F] border border-[#2D2821] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                    Headline Summary *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The best curly haircut I have ever received in the Midlands!"
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    className="w-full bg-[#12110F] border border-[#2D2821] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#D9D1C5] font-medium block mb-1">
                    Your Full Experience / Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about the consultation, the cutting technique, or how your hair feels now..."
                    value={formData.detail}
                    onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    className="w-full bg-[#12110F] border border-[#2D2821] rounded px-3 py-2 text-xs text-[#F5F1EA] focus:outline-none focus:border-[#9B8058]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-[#8C8273] hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#9B8058] hover:bg-[#856C47] disabled:opacity-50 text-[#141414] font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-sm transition-colors cursor-pointer shadow-md"
                  >
                    {submitting ? 'Submitting...' : 'Post Review'}
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
