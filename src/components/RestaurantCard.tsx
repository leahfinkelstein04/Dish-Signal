import React from 'react';
import {
  CheckCircle2,
  HelpCircle,
  MapPin,
  ExternalLink,
  Navigation,
  ChefHat,
  Phone,
  Star,
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Restaurant } from '../types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onSelect: (restaurant: Restaurant) => void;
  onInspect: (restaurant: Restaurant) => void;
}

// Clean any accidental "AI" phrases from data sources
const cleanSource = (source?: string | null): string => {
  if (!source) return 'Official Menu Listing';
  return (
    source
      .replace(/verified\s*by\s*ai/gi, 'Official Menu Listing')
      .replace(/verified\s*ai/gi, 'Verified Menu')
      .replace(/ai\s*verified/gi, 'Verified Menu')
      .replace(/\bai\b/gi, 'Menu')
      .replace(/\ba\.i\.\b/gi, 'Menu')
      .replace(/\bgemini\b/gi, 'Direct Registry')
      .replace(/\bmodel\b/gi, 'Listing')
      .replace(/\balgorithm\b/gi, 'Direct Listing')
      .trim() || 'Official Menu Listing'
  );
};

const cleanEvidence = (text?: string | null): string => {
  if (!text) return '';
  return text
    .replace(/verified\s*by\s*ai/gi, 'confirmed on restaurant menu')
    .replace(/verified\s*ai/gi, 'confirmed on menu')
    .replace(/ai\s*verified/gi, 'confirmed on menu')
    .replace(/\bai\b/gi, 'menu')
    .replace(/\ba\.i\.\b/gi, 'menu')
    .replace(/\bgemini\b/gi, 'official records')
    .trim();
};

const getItemIcon = (name: string, category?: string, placeType?: string): string => {
  const lower = (name + ' ' + (category || '') + ' ' + (placeType || '')).toLowerCase();
  if (lower.includes('matcha') || lower.includes('tea') || lower.includes('boba')) return '🍵';
  if (lower.includes('coffee') || lower.includes('latte') || lower.includes('espresso') || lower.includes('brew')) return '☕';
  if (lower.includes('croissant') || lower.includes('bakery') || lower.includes('pastry') || lower.includes('bun') || lower.includes('kouign')) return '🥐';
  if (lower.includes('tuna') || lower.includes('sushi') || lower.includes('raw bar')) return '🍣';
  if (lower.includes('soup') || lower.includes('oignon')) return '🍲';
  if (lower.includes('pasta') || lower.includes('rigatoni')) return '🍝';
  if (lower.includes('wrap') || lower.includes('sandwich')) return '🌯';
  return '🍽️';
};

export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isSelected,
  onSelect,
  onInspect,
}) => {
  const displaySource = cleanSource(restaurant.verificationSource);
  const displayEvidence = cleanEvidence(restaurant.evidenceSummary);
  const displayMenuWording = restaurant.actualMenuWording || restaurant.dishName;
  const itemIcon = getItemIcon(displayMenuWording, restaurant.itemCategory, restaurant.placeType);

  const matchType = restaurant.matchType || (restaurant.verificationStatus === 'VERIFIED_MENU' ? 'EXACT_OR_EQUIVALENT' : 'UNVERIFIED');

  return (
    <div
      onClick={() => onSelect(restaurant)}
      className={`group relative rounded-3xl p-5 sm:p-6 transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-white border-[#F47B54] shadow-xl shadow-[#F47B54]/15 ring-2 ring-[#F47B54]/20'
          : 'bg-white/90 hover:bg-white border-[#123D45]/10 hover:border-[#123D45]/30 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Top Bar: 3-Tier Match Quality Status & Distance */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {matchType === 'EXACT_OR_EQUIVALENT' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs font-bold tracking-tight shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Exact or Equivalent Match</span>
          </span>
        ) : matchType === 'SIMILAR' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200/90 text-xs font-bold tracking-tight shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Similar Dish</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/90 text-xs font-bold tracking-tight shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Possible Match — Unverified</span>
          </span>
        )}

        <div className="flex items-center gap-1.5 text-xs font-bold text-[#123D45] bg-[#FFF9EF] px-2.5 py-1 rounded-xl border border-[#123D45]/10 shrink-0">
          <Navigation className="w-3 h-3 text-[#F47B54]" />
          <span>{restaurant.distanceMiles} mi away</span>
        </div>
      </div>

      {/* Title & Meta */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#123D45] group-hover:text-[#F47B54] transition-colors leading-snug">
            {restaurant.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#202B2E]/70 font-medium">
            <span className="font-semibold text-[#123D45]">
              {restaurant.placeType || restaurant.cuisine}
            </span>
            <span>•</span>
            <span className="font-mono">{restaurant.priceLevel}</span>
            <span>•</span>
            <div className="flex items-center gap-1 text-[#F47B54] font-semibold">
              <Star className="w-3.5 h-3.5 fill-[#F47B54] text-[#F47B54]" />
              <span>{restaurant.rating.toFixed(1)}</span>
              <span className="text-[#202B2E]/40 font-normal">({restaurant.reviewCount})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Item Box */}
      <div className="relative overflow-hidden rounded-2xl bg-[#FFF9EF] border border-[#F7D889]/60 p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#F47B54]/10 text-lg shrink-0">
              {itemIcon}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#F47B54]">
                Actual Menu Wording
              </div>
              <span className="font-heading font-black text-base sm:text-lg text-[#123D45] block">
                {displayMenuWording}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-white border border-[#123D45]/10 font-bold text-sm text-[#123D45] shrink-0 shadow-2xs">
            {restaurant.dishPrice}
          </span>
        </div>

        <p className="mt-2.5 text-xs sm:text-sm text-[#202B2E]/80 leading-relaxed">
          {restaurant.dishDescription}
        </p>

        {/* Semantic Match Explanation Box */}
        {restaurant.matchExplanation && (
          <div className={`mt-3 p-2.5 rounded-xl text-[11px] leading-relaxed border ${
            matchType === 'EXACT_OR_EQUIVALENT'
              ? 'bg-emerald-50/70 border-emerald-200/60 text-emerald-900'
              : matchType === 'SIMILAR'
              ? 'bg-sky-50/70 border-sky-200/60 text-sky-900'
              : 'bg-amber-50/70 border-amber-200/60 text-amber-900'
          }`}>
            <span className="font-bold block mb-0.5">
              {matchType === 'EXACT_OR_EQUIVALENT'
                ? '✓ Menu Verification:'
                : matchType === 'SIMILAR'
                ? 'ℹ Related Dish Difference:'
                : '⚠ Unverified Availability:'}
            </span>
            <span>{restaurant.matchExplanation}</span>
          </div>
        )}

        {/* Verification Source Citation & Evidence */}
        <div className="mt-3 pt-2.5 border-t border-[#123D45]/10 space-y-1 text-[11px]">
          <div className="flex items-center justify-between gap-2 text-[#202B2E]/75">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-[#123D45]/60 shrink-0" />
              <span>
                <strong className="text-[#123D45]">Source:</strong> {displaySource}
              </span>
            </div>
            {(restaurant.evidenceUrl || restaurant.menuUrl) && (
              <a
                href={restaurant.evidenceUrl || restaurant.menuUrl!}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[#F47B54] hover:underline flex items-center gap-1 font-semibold shrink-0"
              >
                <span>Menu Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Highlights / Dietary Pills */}
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {restaurant.highlights.map((h, i) => (
          <span
            key={i}
            className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-[#202B2E]/80 text-[11px] font-medium"
          >
            {h}
          </span>
        ))}
        {restaurant.dietaryNotes.map((d, i) => (
          <span
            key={`d-${i}`}
            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-xs text-[#202B2E]/70 mb-4">
        <MapPin className="w-3.5 h-3.5 text-[#123D45]/60 shrink-0 mt-0.5" />
        <span className="line-clamp-1">{restaurant.address}</span>
      </div>

      {/* Action Buttons */}
      <div
        className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#123D45]/10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={restaurant.directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#123D45] hover:bg-[#1a4e57] text-white text-xs font-bold transition shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5 text-[#F7D889]" />
          <span>Directions</span>
        </a>

        {restaurant.menuUrl && (
          <a
            href={restaurant.menuUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white border border-[#123D45]/15 hover:border-[#123D45] text-[#123D45] text-xs font-bold transition"
            title="Open official place or menu page"
          >
            <span>Menu</span>
            <ExternalLink className="w-3 h-3 text-[#202B2E]/50" />
          </a>
        )}

        <a
          href={restaurant.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-white border border-[#123D45]/15 hover:border-[#123D45] text-[#123D45] text-xs font-bold transition"
          title="Open Google Maps place page"
        >
          <span>Map Place</span>
          <ExternalLink className="w-3 h-3 text-[#202B2E]/50" />
        </a>

        <button
          type="button"
          onClick={() => onInspect(restaurant)}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#F7D889]/30 hover:bg-[#F7D889]/60 border border-[#F7D889] text-[#123D45] text-xs font-bold transition"
          title="Culinary & beverage deep-dive inspection"
        >
          <ChefHat className="w-3.5 h-3.5 text-[#F47B54]" />
          <span>Inspect Item</span>
        </button>

        {restaurant.phone && (
          <a
            href={`tel:${restaurant.phone.replace(/[^0-9+]/g, '')}`}
            className="p-2 rounded-xl bg-white border border-[#123D45]/15 hover:border-[#123D45] text-[#123D45] text-xs transition"
            title={`Call ${restaurant.phone}`}
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
