import React, { useState } from 'react';
import { ChevronDown, Sparkles, HelpCircle, Scissors, HeartHandshake, ShieldCheck, ArrowRight } from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'curly' | 'replacement' | 'policies';
  categoryLabel: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  // Curly Hair Care
  {
    id: 'curly-prep',
    category: 'curly',
    categoryLabel: 'Curly Hair Care',
    question: 'How should I arrive prepared for a curl specialist appointment?',
    answer:
      'Please arrive with your curls completely dry, detangled, and styled in their natural curl pattern using minimal styling product. Avoid hair ties, clips, buns, or braids on the day of your appointment so George Jnr can evaluate your curl spring factor, shrinkage rate, and density in its organic state before cutting.',
  },
  {
    id: 'curly-cut-method',
    category: 'curly',
    categoryLabel: 'Curly Hair Care',
    question: 'How does your curly hair cutting technique differ from traditional haircuts?',
    answer:
      'We tailor the cut curl-by-curl while taking into account unique perimeter tension and crown bounce. Rather than stretching hair wet where tension masks shrinkage, we sculpt your silhouette to preserve natural volume, prevent triangle silhouettes, and ensure effortless wash-and-go styling at home.',
  },
  {
    id: 'curly-colour-safety',
    category: 'curly',
    categoryLabel: 'Curly Hair Care',
    question: 'Can I get highlights or colour without compromising my curl definition?',
    answer:
      'Absolutely. Our colourists map placement along individual curl ribbons rather than rigid foil lines. We integrate conditioning bond protectors to preserve the delicate lipid layer of curly hair, preventing dryness and ensuring your curl pattern retains its bounce and elasticity.',
  },

  // Hair Replacement Maintenance
  {
    id: 'replacement-process',
    category: 'replacement',
    categoryLabel: 'Hair Replacement',
    question: 'How does non-surgical hair replacement work, and will it look natural?',
    answer:
      'Non-surgical hair systems utilize a micro-thin, breathable membrane infused with 100% human hair matched precisely to your natural shade, follicle direction, and density. Bonded securely with hypoallergenic, dermatologically approved salon adhesives, the frontal hairline is virtually undetectable even up close.',
  },
  {
    id: 'replacement-maintenance',
    category: 'replacement',
    categoryLabel: 'Hair Replacement',
    question: 'How often is maintenance and refusion required for hair systems?',
    answer:
      'Most clients visit every 3 to 4 weeks for maintenance. During this private appointment, George Jnr carefully removes the unit, cleanses and exfoliates the scalp, conditions the system, replaces medical-grade tapes or liquid adhesive, and trims your natural hair for seamless blending.',
  },
  {
    id: 'replacement-lifestyle',
    category: 'replacement',
    categoryLabel: 'Hair Replacement',
    question: 'Can I swim, exercise, and shower normally with a hair system?',
    answer:
      'Yes. Once the initial 24-hour adhesive cure period has passed, you can shower, swim, exercise, and style your hair just as you would natural hair. We provide specialized sulfate-free cleansers and leave-in UV protectors to maximize the lifespan of your unit.',
  },
  {
    id: 'replacement-privacy',
    category: 'replacement',
    categoryLabel: 'Hair Replacement',
    question: 'Are hair replacement consultations discreet and confidential?',
    answer:
      'Yes, discretion is our utmost priority. All hair replacement consultations and refusion appointments are held in a private, dedicated 1-on-1 salon suite with George Jnr, with full privacy and zero obligation.',
  },

  // Booking & Salon Policies
  {
    id: 'patch-test-policy',
    category: 'policies',
    categoryLabel: 'Salon Policies',
    question: 'Why do I need a skin patch test 48 hours before my colour service?',
    answer:
      'Client safety and Good Salon Guide accreditation standards require a strict 48-hour allergy alert test prior to any oxidative colour or toner service. This applies to all new colour clients or existing clients who have not had colour with us within the last 6 months. It takes less than 2 minutes and ensures your complete safety.',
  },
  {
    id: 'cancellation-policy',
    category: 'policies',
    categoryLabel: 'Salon Policies',
    question: 'What is your appointment cancellation and rescheduling policy?',
    answer:
      'We kindly request at least 24 hours notice for any rescheduling or cancellations. This allows us to offer the reserved time slot to waiting clients. You can easily modify your appointment online using the booking reference sent in your confirmation email, or by calling our reception on 01527 577000.',
  },
  {
    id: 'pricing-structure',
    category: 'policies',
    categoryLabel: 'Salon Policies',
    question: 'How are service prices determined (Fixed vs "From")?',
    answer:
      'Standard cuts, finishes, and consultations feature clear fixed prices. Colour and transformation services are priced "From" based on stylist seniority, hair length, density, and product usage required. Every appointment begins with a full, honest price confirmation so there are never surprises at checkout.',
  },
];

interface Props {
  onNavigate: (view: string, params?: Record<string, any>) => void;
}

export const HomeFAQ: React.FC<Props> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'curly' | 'replacement' | 'policies'>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'curly-prep': true,
    'replacement-process': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = activeCategory === 'all'
    ? FAQ_DATA
    : FAQ_DATA.filter((item) => item.category === activeCategory);

  return (
    <section className="bg-[#121212] py-20 border-t border-[#262626]" aria-labelledby="faq-heading">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#BFA57D] mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-[#9B8058]" />
            <span>Client Knowledge Base</span>
          </div>
          <h2 id="faq-heading" className="text-3xl sm:text-4xl font-serif-heading text-[#F5F1EA] mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#A69B8D] leading-relaxed">
            Clear, honest guidance on our curl cutting craft, discreet hair system maintenance, and salon booking protocols in Bromsgrove.
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 text-xs font-medium rounded-sm transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#9B8058] text-[#141414] font-semibold'
                  : 'bg-[#1C1A17] text-[#A69B8D] hover:text-[#F5F1EA] border border-[#2E2820]'
              }`}
            >
              All Questions ({FAQ_DATA.length})
            </button>
            <button
              onClick={() => setActiveCategory('curly')}
              className={`px-4 py-2 text-xs font-medium rounded-sm transition-all flex items-center gap-1.5 ${
                activeCategory === 'curly'
                  ? 'bg-[#9B8058] text-[#141414] font-semibold'
                  : 'bg-[#1C1A17] text-[#A69B8D] hover:text-[#F5F1EA] border border-[#2E2820]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Curly Hair Care</span>
            </button>
            <button
              onClick={() => setActiveCategory('replacement')}
              className={`px-4 py-2 text-xs font-medium rounded-sm transition-all flex items-center gap-1.5 ${
                activeCategory === 'replacement'
                  ? 'bg-[#9B8058] text-[#141414] font-semibold'
                  : 'bg-[#1C1A17] text-[#A69B8D] hover:text-[#F5F1EA] border border-[#2E2820]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hair Replacement</span>
            </button>
            <button
              onClick={() => setActiveCategory('policies')}
              className={`px-4 py-2 text-xs font-medium rounded-sm transition-all flex items-center gap-1.5 ${
                activeCategory === 'policies'
                  ? 'bg-[#9B8058] text-[#141414] font-semibold'
                  : 'bg-[#1C1A17] text-[#A69B8D] hover:text-[#F5F1EA] border border-[#2E2820]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Booking & Policies</span>
            </button>
          </div>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isOpen = Boolean(openItems[item.id]);
            return (
              <div
                key={item.id}
                className="bg-[#181818] border border-[#292929] hover:border-[#3D372E] rounded-sm transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#9B8058]"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#BFA57D] font-semibold block">
                      {item.categoryLabel}
                    </span>
                    <h3 className="font-serif-heading text-base sm:text-lg text-[#F5F1EA]">
                      {item.question}
                    </h3>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#9B8058] text-[#141414]' : 'bg-[#262420] text-[#A69B8D]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#A69B8D] leading-relaxed border-t border-[#232323]">
                    <p className="pt-2">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Assistance Callout */}
        <div className="mt-12 bg-[#1A1815] border border-[#2E2820] rounded-sm p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-serif-heading text-lg text-[#F5F1EA]">
              Have a specific question about your hair journey?
            </h4>
            <p className="text-xs text-[#A69B8D]">
              Our team is always happy to speak with you or arrange a free 15-minute consultation.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('contact')}
              className="px-4 py-2 text-xs font-semibold text-[#D9D1C5] hover:text-white bg-[#262420] border border-[#3A342B] rounded-sm transition-colors"
            >
              Contact Reception
            </button>
            <button
              onClick={() => onNavigate('book')}
              className="px-4 py-2 text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] rounded-sm transition-colors flex items-center gap-1.5"
            >
              <span>Book Appointment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
