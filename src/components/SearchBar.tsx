import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowRight,
  MapPin,
  Navigation,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Flame,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { VenueCategory, AddressSuggestion, UserLocation } from '../types';

interface SearchBarProps {
  onSearch: (dish: string, address?: string | AddressSuggestion) => void;
  onSelectLocation?: (location: UserLocation) => void;
  isLoading: boolean;
  currentQuery: string;
  radiusMiles: number;
  onSelectRadius: (miles: number) => void;
  onOpenLocationModal: () => void;
  locationName: string;
  onUseGps: () => void;
  isGps: boolean;
}

interface DishCraving {
  label: string;
  icon: string;
  category: 'food' | 'coffee' | 'matcha' | 'bakery';
  tag: string;
}

const CATEGORY_SHORTCUTS: {
  id: VenueCategory;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    id: 'all',
    label: 'All Cravings',
    icon: '✨',
    description: 'Food, drinks, coffee & sweets',
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍽️',
    description: 'Restaurants, pastas & comfort dishes',
  },
  {
    id: 'coffee',
    label: 'Coffee',
    icon: '☕',
    description: 'Espresso bars & specialty roasters',
  },
  {
    id: 'matcha',
    label: 'Matcha & Tea',
    icon: '🍵',
    description: 'Matcha cafés & artisan tea houses',
  },
  {
    id: 'bakery',
    label: 'Bakeries & Sweets',
    icon: '🥐',
    description: 'Pastries, croissants & fresh bakes',
  },
];

const POPULAR_CRAVINGS: DishCraving[] = [
  // Matcha & Tea
  { label: 'Strawberry matcha', icon: '🍓', category: 'matcha', tag: 'Top Craved' },
  { label: 'Iced matcha latte', icon: '🍵', category: 'matcha', tag: 'Ceremonial' },
  { label: 'Pistachio matcha', icon: '🥜', category: 'matcha', tag: 'Specialty' },
  { label: 'Matcha lemonade', icon: '🍋', category: 'matcha', tag: 'Refreshing' },
  { label: 'Chai latte', icon: '🫖', category: 'matcha', tag: 'Spiced' },
  { label: 'Mango matcha latte', icon: '🥭', category: 'matcha', tag: 'Tropical' },
  { label: 'London fog', icon: '🫖', category: 'matcha', tag: 'Earl Grey' },
  { label: 'Jasmine milk tea', icon: '🧋', category: 'matcha', tag: 'Floral' },

  // Coffee & Espresso
  { label: 'Vanilla iced latte', icon: '☕', category: 'coffee', tag: 'Signature' },
  { label: 'Brown sugar shaken espresso', icon: '🧊', category: 'coffee', tag: 'Trending' },
  { label: 'Lavender latte', icon: '🪻', category: 'coffee', tag: 'Floral' },
  { label: 'Cold brew', icon: '☕', category: 'coffee', tag: 'Smooth' },
  { label: 'Cortado', icon: '☕', category: 'coffee', tag: 'Balanced' },
  { label: 'Pistachio latte', icon: '🥜', category: 'coffee', tag: 'Nutty' },
  { label: 'Espresso tonic', icon: '🍋', category: 'coffee', tag: 'Bright' },
  { label: 'Oat milk flat white', icon: '🥛', category: 'coffee', tag: 'Velvety' },

  // Bakeries & Sweets
  { label: 'Chocolate croissant', icon: '🥐', category: 'bakery', tag: 'Classic' },
  { label: 'Almond croissant', icon: '🥐', category: 'bakery', tag: 'Twice-Baked' },
  { label: 'Breakfast sandwich', icon: '🥪', category: 'bakery', tag: 'Morning' },
  { label: 'Kouign-amann', icon: '🧈', category: 'bakery', tag: 'Caramelized' },
  { label: 'Cinnamon cardamom bun', icon: '🥨', category: 'bakery', tag: 'Scandinavian' },
  { label: 'Matcha mille crepe', icon: '🍰', category: 'bakery', tag: 'Layers' },
  { label: 'Churros with dark chocolate', icon: '🍫', category: 'bakery', tag: 'Warm' },
  { label: 'Sourdough cruffin', icon: '🧁', category: 'bakery', tag: 'Artisan' },

  // Food Dishes
  { label: 'Spicy rigatoni', icon: '🍝', category: 'food', tag: 'Trending' },
  { label: 'Birria tacos', icon: '🌮', category: 'food', tag: 'Consomé' },
  { label: 'Crispy rice with spicy tuna', icon: '🍣', category: 'food', tag: 'Crispy' },
  { label: 'Smash burger', icon: '🍔', category: 'food', tag: 'Crispy Edges' },
  { label: 'French onion soup', icon: '🍲', category: 'food', tag: 'Gratinée' },
  { label: 'Steak frites', icon: '🥩', category: 'food', tag: 'Bistro' },
  { label: 'Cacio e pepe', icon: '🧀', category: 'food', tag: 'Pecorino' },
  { label: 'Wood-fired margherita pizza', icon: '🍕', category: 'food', tag: 'Neapolitan' },
  { label: 'Tonkotsu ramen', icon: '🍜', category: 'food', tag: 'Rich Broth' },
  { label: 'Nashville hot chicken', icon: '🍗', category: 'food', tag: 'Spicy' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSelectLocation,
  isLoading,
  currentQuery,
  radiusMiles,
  onSelectRadius,
  onOpenLocationModal,
  locationName,
  onUseGps,
  isGps,
}) => {
  const [dishInput, setDishInput] = useState(currentQuery || '');
  const [addressInput, setAddressInput] = useState(locationName);
  const [selectedCategory, setSelectedCategory] = useState<VenueCategory>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dishInputRef = useRef<HTMLInputElement>(null);

  // Address Autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState<boolean>(false);
  const [isSearchingAddresses, setIsSearchingAddresses] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  // Sync inputs with parent state
  useEffect(() => {
    setDishInput(currentQuery || '');
  }, [currentQuery]);

  useEffect(() => {
    setAddressInput(locationName);
    setSelectedSuggestion(null);
  }, [locationName]);

  // Click outside to close address suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressContainerRef.current &&
        !addressContainerRef.current.contains(event.target as Node)
      ) {
        setShowAddressDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address autocomplete fetcher for instant USA address popups
  useEffect(() => {
    const query = addressInput ? addressInput.trim() : '';
    if (!query || query.length < 2 || (selectedSuggestion && query === selectedSuggestion.label)) {
      setAddressSuggestions([]);
      setShowAddressDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddresses(true);
      try {
        const res = await fetch(
          `/api/address-autocomplete?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setAddressSuggestions(data.suggestions);
            setShowAddressDropdown(true);
            setActiveSuggestionIndex(-1);
          } else {
            setAddressSuggestions([]);
          }
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setIsSearchingAddresses(false);
      }
    }, 160);

    return () => clearTimeout(timer);
  }, [addressInput, selectedSuggestion]);

  const handleSelectAddressSuggestion = (sugg: AddressSuggestion) => {
    setAddressInput(sugg.label);
    setSelectedSuggestion(sugg);
    setShowAddressDropdown(false);
    setActiveSuggestionIndex(-1);

    // Update global app state immediately
    if (onSelectLocation) {
      onSelectLocation({
        lat: sugg.lat,
        lng: sugg.lng,
        name: sugg.label,
        isGps: false,
      });
    }

    if (dishInput.trim()) {
      onSearch(dishInput.trim(), sugg);
    } else {
      // Focus the dish input so user can enter craving next
      dishInputRef.current?.focus();
    }
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAddressDropdown || addressSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < addressSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : addressSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < addressSuggestions.length) {
        e.preventDefault();
        handleSelectAddressSuggestion(addressSuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowAddressDropdown(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dishInput.trim()) {
      const locTarget = selectedSuggestion || (addressInput.trim() !== locationName ? addressInput.trim() : undefined);
      onSearch(dishInput.trim(), locTarget);
      setShowAddressDropdown(false);
    }
  };

  const handleSuggestionClick = (itemTitle: string) => {
    setDishInput(itemTitle);
    const locTarget = selectedSuggestion || (addressInput.trim() !== locationName ? addressInput.trim() : undefined);
    onSearch(itemTitle, locTarget);
    setShowAddressDropdown(false);
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredCravings =
    selectedCategory === 'all'
      ? POPULAR_CRAVINGS
      : POPULAR_CRAVINGS.filter((item) => item.category === selectedCategory);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-4">
      {/* Home Screen Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#123D45]/5 text-[#123D45] text-xs font-semibold uppercase tracking-wider mb-3">
          <Utensils className="w-3.5 h-3.5 text-[#F47B54]" />
          Food, Coffee, Matcha & Bakery Radar
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black text-[#123D45] tracking-tight leading-tight">
          What dish is signaling you?
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#202B2E]/70 max-w-2xl mx-auto">
          Find restaurants, coffee shops, matcha cafés & bakeries serving the exact food, drink, or pastry you want near your{' '}
          <span className="font-semibold text-[#123D45]">exact address</span>.
        </p>
      </div>

      {/* Interactive Category Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5 mb-5">
        {CATEGORY_SHORTCUTS.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#123D45] text-white border-[#123D45] shadow-md shadow-[#123D45]/20 scale-[1.02]'
                  : 'bg-white hover:bg-stone-50 text-[#202B2E] border-[#123D45]/10 hover:border-[#F47B54]/50 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xl sm:text-2xl">{cat.icon}</span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#F47B54] animate-pulse" />
                )}
              </div>
              <div
                className={`font-heading font-bold text-xs sm:text-sm leading-tight ${
                  isActive ? 'text-[#F7D889]' : 'text-[#123D45]'
                }`}
              >
                {cat.label}
              </div>
              <div
                className={`text-[10px] mt-0.5 line-clamp-1 ${
                  isActive ? 'text-white/80' : 'text-[#202B2E]/60'
                }`}
              >
                {cat.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Dual Search Bar Container: Dish/Drink + Street Address */}
      <form
        onSubmit={handleSubmit}
        className="relative group bg-white rounded-3xl shadow-xl shadow-[#123D45]/10 border-2 border-[#123D45]/15 focus-within:border-[#F47B54] transition-all duration-300 p-2 sm:p-2.5"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          {/* Dish / Drink Input */}
          <div className="md:col-span-6 flex items-center gap-2 pl-3 sm:pl-4">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[#F47B54] shrink-0" />
            <input
              ref={dishInputRef}
              type="text"
              value={dishInput}
              onChange={(e) => setDishInput(e.target.value)}
              placeholder="What dish is signaling you?"
              className="w-full bg-transparent text-[#202B2E] text-sm sm:text-base font-semibold placeholder:text-[#202B2E]/40 focus:outline-hidden py-2.5"
              disabled={isLoading}
            />
            {dishInput && (
              <button
                type="button"
                onClick={() => setDishInput('')}
                className="p-1 rounded-full text-[#202B2E]/40 hover:text-[#202B2E] hover:bg-gray-100 transition mr-2 cursor-pointer"
                title="Clear dish input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Divider on Desktop */}
          <div className="hidden md:block w-px h-8 bg-[#123D45]/15" />

          {/* Street Address Input with Live USA Autocomplete Pop-up */}
          <div
            ref={addressContainerRef}
            className="relative md:col-span-4 flex items-center gap-2 pl-3 border-t md:border-t-0 pt-2 md:pt-0 border-[#123D45]/10"
          >
            <MapPin className="w-5 h-5 text-[#123D45] shrink-0" />
            <div className="relative flex-1">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  setSelectedSuggestion(null);
                }}
                onKeyDown={handleAddressKeyDown}
                onFocus={() => {
                  if (addressSuggestions.length > 0) setShowAddressDropdown(true);
                }}
                placeholder="Type street address (e.g. 3318 Mag...)"
                className="w-full bg-transparent text-[#202B2E] text-xs sm:text-sm font-medium placeholder:text-[#202B2E]/40 focus:outline-hidden py-2 pr-6"
                disabled={isLoading}
              />
              {addressInput && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressInput('');
                    setSelectedSuggestion(null);
                    setAddressSuggestions([]);
                    setShowAddressDropdown(false);
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[#202B2E]/40 hover:text-[#202B2E] transition cursor-pointer"
                  title="Clear address"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {isSearchingAddresses && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#F47B54] border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <button
              type="button"
              onClick={onUseGps}
              className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                isGps
                  ? 'bg-[#F47B54]/10 text-[#F47B54]'
                  : 'hover:bg-stone-100 text-[#202B2E]/50 hover:text-[#123D45]'
              }`}
              title="Use current GPS"
            >
              <Navigation className="w-4 h-4" />
            </button>

            {/* Floating Live Address Options Dropdown (Strictly USA) */}
            {showAddressDropdown && addressSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2.5 bg-white rounded-2xl shadow-2xl border-2 border-[#123D45]/15 z-50 overflow-hidden max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-2 bg-stone-50 border-b border-[#123D45]/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#123D45]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Suggested US Addresses</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-stone-200 text-[#123D45] text-[9px] font-black">
                      USA ONLY
                    </span>
                  </div>
                  <span className="text-[#F47B54] font-semibold">Select or press Enter</span>
                </div>
                <div className="divide-y divide-[#123D45]/5">
                  {addressSuggestions.map((sugg, idx) => {
                    const isHighlighted = activeSuggestionIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectAddressSuggestion(sugg);
                        }}
                        className={`w-full text-left p-3 transition flex items-start gap-2.5 cursor-pointer group ${
                          isHighlighted ? 'bg-[#FFF2DE]' : 'hover:bg-[#FFF9EF]'
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg transition-colors shrink-0 mt-0.5 ${
                            isHighlighted
                              ? 'bg-[#F47B54] text-white'
                              : 'bg-[#123D45]/5 text-[#F47B54] group-hover:bg-[#F47B54] group-hover:text-white'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-xs font-bold truncate transition-colors ${
                              isHighlighted
                                ? 'text-[#F47B54]'
                                : 'text-[#123D45] group-hover:text-[#F47B54]'
                            }`}
                          >
                            {sugg.primaryText}
                          </div>
                          <div className="text-[11px] text-[#202B2E]/70 truncate flex items-center gap-1.5 mt-0.5">
                            <span>{sugg.secondaryText}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-[#123D45]/40 font-mono shrink-0 uppercase">
                          US
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="md:col-span-2 pt-1 md:pt-0">
            <button
              type="submit"
              disabled={isLoading || !dishInput.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#F47B54] hover:bg-[#e0663f] disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-[#F47B54]/30 hover:shadow-lg transition active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Searching...</span>
                </div>
              ) : (
                <>
                  <span>Signal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Controls Sub-bar */}
        <div className="mt-2 pt-2 border-t border-[#123D45]/5 flex flex-wrap items-center justify-between gap-2 px-2 text-xs text-[#202B2E]/70">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#123D45]" />
            <span className="font-semibold text-[#123D45]">Search Radius:</span>
            <div className="flex items-center gap-1">
              {[1, 3, 5, 10, 25].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => onSelectRadius(r)}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    radiusMiles === r
                      ? 'bg-[#123D45] text-white shadow-xs'
                      : 'bg-stone-100 text-[#202B2E]/70 hover:bg-stone-200'
                  }`}
                >
                  {r} mi
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenLocationModal}
            className="hover:underline font-medium text-[#123D45] flex items-center gap-1"
          >
            Searching near <span className="font-bold underline decoration-[#F47B54] truncate max-w-[180px] sm:max-w-[280px]">{locationName}</span> (More Options)
          </button>
        </div>
      </form>

      {/* Expanded Popular Cravings Carousel */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs uppercase tracking-wider font-bold text-[#123D45]">
              <Flame className="w-3.5 h-3.5 text-[#F47B54]" />
              {selectedCategory === 'all'
                ? 'Popular Food & Drink Cravings'
                : `${CATEGORY_SHORTCUTS.find((c) => c.id === selectedCategory)?.label} Cravings`}
            </span>
            <span className="text-[11px] bg-[#123D45]/10 text-[#123D45] font-semibold px-2 py-0.5 rounded-full">
              {filteredCravings.length} options
            </span>
          </div>

          {/* Desktop Carousel Navigation */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-1.5 rounded-xl bg-white border border-[#123D45]/15 text-[#123D45] hover:bg-stone-100 transition shadow-2xs"
              title="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-1.5 rounded-xl bg-white border border-[#123D45]/15 text-[#123D45] hover:bg-stone-100 transition shadow-2xs"
              title="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tappable Dish & Drink Cards */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
        >
          {filteredCravings.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSuggestionClick(item.label)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border border-[#123D45]/10 hover:border-[#F47B54] text-[#123D45] hover:text-[#F47B54] text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition shrink-0 active:scale-95 group text-left"
            >
              <span className="text-xl group-hover:scale-110 transition shrink-0">{item.icon}</span>
              <div>
                <span className="block font-bold leading-tight">{item.label}</span>
                <span className="block text-[10px] text-[#202B2E]/50 font-normal mt-0.5">
                  {item.tag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
