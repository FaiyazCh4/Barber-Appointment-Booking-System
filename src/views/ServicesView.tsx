import React, { useState } from 'react';
import { Search, Clock, ArrowRight, ShieldAlert, Tag, Check, Eye, EyeOff, X, Sparkles, LayoutGrid, List } from 'lucide-react';
import type { Service, ServiceCategory } from '../types';

interface Props {
  categories: ServiceCategory[];
  services: Service[];
  onBookService: (serviceId: string) => void;
  onNavigate: (view: string) => void;
}

function getPriceRangeDetails(service: Service) {
  if (service.price_type === 'consultation' || service.price === 0) {
    return {
      typeLabel: 'Consultation',
      rangeText: 'Complimentary',
      tierNote: 'Free comprehensive consultation',
    };
  }
  if (service.price_type === 'from') {
    // Realistic UK boutique salon spread across stylist seniority and hair length
    const upper = Math.round((service.price * 1.32) / 5) * 5;
    return {
      typeLabel: 'Price Range',
      rangeText: `£${service.price.toFixed(2)} – £${upper.toFixed(2)}`,
      tierNote: 'Varies by stylist seniority & hair length',
    };
  }
  return {
    typeLabel: 'Standard Rate',
    rangeText: `£${service.price.toFixed(2)}`,
    tierNote: 'Fixed price service',
  };
}

const POPULAR_SEARCH_TAGS = [
  'Balayage',
  'Precision Bob',
  'Curly Hair',
  "Men's Hair System",
  'Blonde Foils',
  'Consultation',
];

export const ServicesView: React.FC<Props> = ({ categories, services, onBookService, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPriceList, setShowPriceList] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  // Category mapping for category-name based search filtering
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const query = searchQuery.trim().toLowerCase();

  const filteredServices = services.filter((srv) => {
    const matchesCat = selectedCategory === 'all' || srv.category_id === selectedCategory;
    const catName = (categoryMap.get(srv.category_id) || srv.category_name || '').toLowerCase();

    // Matches service name, category name, or description
    const matchesSearch =
      !query ||
      srv.name.toLowerCase().includes(query) ||
      catName.includes(query) ||
      srv.description.toLowerCase().includes(query);

    return matchesCat && matchesSearch;
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#BFA57D]">
          Treatment & Styling Menu
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif-heading text-[#F5F1EA]">
          Services at George Davis
        </h1>
        <p className="text-sm sm:text-base text-[#A69B8D] leading-relaxed">
          From signature cutting and high-dimension colour to private non-surgical men's hair replacement and curly hair dry cuts. All services include comprehensive consultation time.
        </p>
      </div>

      {/* Advisory Note */}
      <div className="bg-[#1C1A17] border border-[#3A332A] p-4 rounded-sm flex items-start gap-3 text-xs text-[#D9D1C5]">
        <ShieldAlert className="w-5 h-5 text-[#BFA57D] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-[#F5F1EA] block">Colour & Chemical Safety Standard</strong>
          <p className="text-[#A69B8D]">
            All colour and chemical services require a mandatory skin allergy patch test at least 48 hours prior to appointment for new clients or returning clients after 6 months.{' '}
            <button
              onClick={() => onNavigate('policies')}
              className="text-[#BFA57D] underline hover:text-white"
            >
              Read our testing protocol
            </button>
          </p>
        </div>
      </div>

      {/* Dedicated Interactive Search & Filter Module */}
      <div className="bg-[#161513] border border-[#2A251D] p-5 sm:p-6 rounded-lg space-y-5 shadow-lg">
        {/* Row 1: Prominent Search Input & Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#BFA57D] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search treatments by name or category (e.g., Balayage, Precision Cut, Men's, Curls)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1916] border border-[#332C22] focus:border-[#9B8058] rounded-sm pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[#F5F1EA] placeholder-[#736B5E] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8273] hover:text-[#F5F1EA] p-1 cursor-pointer transition-colors"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Actions: Result Counter & Price List View Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <span className="text-xs text-[#8C8273] font-mono bg-[#1C1A17] border border-[#2F2922] px-3 py-2 rounded-sm whitespace-nowrap">
              {filteredServices.length} {filteredServices.length === 1 ? 'treatment' : 'treatments'}
            </span>

            {/* 'View Price List' Toggle Control */}
            <div className="inline-flex items-center bg-[#11100E] rounded p-0.5 border border-[#2F2922]">
              <button
                type="button"
                onClick={() => setShowPriceList(false)}
                className={`px-2.5 py-1 text-[11px] rounded transition-all flex items-center gap-1 cursor-pointer ${
                  !showPriceList
                    ? 'bg-[#3A332A] text-[#F5F1EA] font-medium shadow-xs'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
                title="View just service names"
              >
                <EyeOff className="w-3 h-3" />
                <span className="hidden sm:inline">Names</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPriceList(true)}
                className={`px-2.5 py-1 text-[11px] rounded transition-all flex items-center gap-1 cursor-pointer ${
                  showPriceList
                    ? 'bg-[#9B8058] text-[#141414] font-semibold shadow-xs'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
                title="View service names with associated price ranges"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">Prices</span>
              </button>
            </div>

            {/* Layout Mode Toggle Control (Grid vs List) */}
            <div className="inline-flex items-center bg-[#11100E] rounded p-0.5 border border-[#2F2922]">
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-[#9B8058] text-[#141414] shadow-xs'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  layoutMode === 'list'
                    ? 'bg-[#9B8058] text-[#141414] shadow-xs'
                    : 'text-[#8C8273] hover:text-[#D9D1C5]'
                }`}
                title="Salon Menu List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Popular Search Suggestion Tags */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] uppercase tracking-wider text-[#8C8273] font-semibold flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#BFA57D]" />
            <span>Popular:</span>
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => {
            const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(isSelected ? '' : tag);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#9B8058] text-[#141414] font-bold border-[#9B8058]'
                    : 'bg-[#1C1A17] border-[#2E2820] text-[#A69B8D] hover:text-[#F5F1EA] hover:border-[#4A3F30]'
                }`}
              >
                {tag}
              </button>
            );
          })}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-[11px] text-[#BFA57D] hover:underline ml-auto cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Row 3: Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#231F19] scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#9B8058] text-[#141414] font-bold'
                : 'bg-[#1C1A17] text-[#D9D1C5] hover:text-white hover:bg-[#25221E]'
            }`}
          >
            All Categories ({services.length})
          </button>
          {categories.map((cat) => {
            const countInCat = services.filter((s) => s.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#9B8058] text-[#141414] font-bold'
                    : 'bg-[#1C1A17] text-[#D9D1C5] hover:text-white hover:bg-[#25221E]'
                }`}
              >
                {cat.name} ({countInCat})
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Information Banner when viewing Names Only */}
      {!showPriceList && filteredServices.length > 0 && (
        <div className="flex items-center justify-between bg-[#191815] border border-[#2E2820] px-4 py-2.5 rounded-sm text-xs text-[#A69B8D]">
          <span>Currently displaying service names and descriptions only.</span>
          <button
            onClick={() => setShowPriceList(true)}
            className="text-[#BFA57D] hover:underline font-medium ml-2 shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Tag className="w-3 h-3" />
            <span>Show associated price ranges</span>
          </button>
        </div>
      )}

      {/* Services Grid or List */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#161513] border border-[#2A251D] rounded-sm space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#201D18] border border-[#3A3326] text-[#BFA57D] flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif-heading text-xl text-[#F5F1EA]">No Treatments Found</h3>
            <p className="text-xs text-[#8C8273]">
              {searchQuery
                ? `No services matched "${searchQuery}". Try searching by hair category (e.g., "Colour", "Cuts", "Curls") or clear the search.`
                : 'No services found for the selected category filter.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="bg-[#2A241C] hover:bg-[#382F22] border border-[#443828] text-[#BFA57D] hover:text-[#F5F1EA] text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-sm transition-colors cursor-pointer"
          >
            Clear Search & View All Services
          </button>
        </div>
      ) : layoutMode === 'list' ? (
        <div className="bg-[#181818] border border-[#2B2925] rounded-sm divide-y divide-[#262420]">
          {filteredServices.map((service) => {
            const pricing = getPriceRangeDetails(service);
            return (
              <div
                key={service.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#1E1C19] transition-colors group"
              >
                <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif-heading text-xl text-[#F5F1EA] group-hover:text-[#BFA57D] transition-colors">
                      {service.name}
                    </h3>
                    <span className="text-[10px] text-[#8C8273] px-2 py-0.5 rounded bg-[#121110] border border-[#2B2620]">
                      {service.category_name}
                    </span>
                    {service.requires_patch_test && (
                      <span className="text-[10px] text-[#BFA57D] font-medium bg-[#2C241B] px-2 py-0.5 rounded-xs">
                        48h Patch Test
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#A69B8D] leading-relaxed line-clamp-2 max-w-3xl">
                    {service.description}
                  </p>
                  <div className="text-[11px] text-[#8C8273] flex items-center gap-2 pt-0.5">
                    <Clock className="w-3 h-3 text-[#BFA57D]" />
                    <span>{service.duration_minutes} minutes duration</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 sm:self-center justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#242424]">
                  {showPriceList && (
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-serif-heading text-[#F5F1EA] font-mono-numbers block">
                        {pricing.rangeText}
                      </span>
                      <span className="text-[10px] text-[#8C8273] block">
                        {pricing.typeLabel}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onBookService(service.id)}
                    className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const pricing = getPriceRangeDetails(service);
            return (
              <div
                key={service.id}
                className="bg-[#191919] border border-[#262626] rounded-sm p-6 flex flex-col justify-between hover:border-[#9B8058]/50 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#8C8273]">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#BFA57D]" />
                      {service.duration_minutes} mins
                    </span>
                    {service.requires_patch_test && (
                      <span className="text-[11px] text-[#BFA57D] font-medium bg-[#2C241B] px-2 py-0.5 rounded-xs">
                        48h Patch Test
                      </span>
                    )}
                    {service.requires_consultation && !service.requires_patch_test && (
                      <span className="text-[11px] text-[#A69B8D] bg-[#222] px-2 py-0.5 rounded-xs">
                        Consultation
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif-heading text-2xl text-[#F5F1EA] leading-snug">
                      {service.name}
                    </h3>
                    <span className="text-[11px] text-[#8C8273] block mt-0.5">
                      {service.category_name}
                    </span>
                  </div>

                  <p className="text-xs text-[#A69B8D] leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Footer Area: Conditional based on 'View Price List' toggle */}
                {showPriceList ? (
                  <div className="pt-4 mt-6 border-t border-[#242424] flex items-end justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#BFA57D] font-semibold block">
                        {pricing.typeLabel}
                      </span>
                      <span className="text-xl font-serif-heading text-[#F5F1EA] font-mono-numbers block">
                        {pricing.rangeText}
                      </span>
                      <span className="text-[10px] text-[#8C8273] block mt-0.5">
                        {pricing.tierNote}
                      </span>
                    </div>

                    <button
                      onClick={() => onBookService(service.id)}
                      className="bg-[#9B8058] hover:bg-[#856C47] text-[#141414] font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <span>Book</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 mt-6 border-t border-[#242424] flex items-center justify-between">
                    <span className="text-[11px] text-[#736B5E] italic">
                      Price hidden in names view
                    </span>

                    <button
                      onClick={() => onBookService(service.id)}
                      className="bg-[#262420] hover:bg-[#9B8058] text-[#D9D1C5] hover:text-[#141414] border border-[#3D372E] font-semibold text-xs uppercase tracking-wider px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5"
                    >
                      <span>Book Service</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

