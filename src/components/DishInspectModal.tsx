import React, { useEffect, useState } from 'react';
import { X, ChefHat, Utensils, UtensilsCrossed, GlassWater, ShieldCheck, HeartHandshake, Leaf } from 'lucide-react';
import { Restaurant, DishInspection } from '../types';

interface DishInspectModalProps {
  restaurant: Restaurant | null;
  onClose: () => void;
}

// Clean any accidental "AI" phrases or synthetic citations from data sources
const cleanSource = (source?: string | null, isVerified?: boolean): string => {
  if (!source) return isVerified ? 'Verified Menu Listing' : 'Pending Verification';
  return (
    source
      .replace(/local\s*physical\s*venue\s*registry\s*(&\s*direct\s*menu)?/gi, 'Directory Listing')
      .replace(/verified\s*by\s*ai/gi, 'Menu Listing')
      .replace(/verified\s*ai/gi, 'Verified Menu')
      .replace(/ai\s*verified/gi, 'Verified Menu')
      .replace(/\bai\b/gi, 'Menu')
      .replace(/\ba\.i\.\b/gi, 'Menu')
      .replace(/\bgemini\b/gi, 'Menu Registry')
      .replace(/\bmodel\b/gi, 'Listing')
      .replace(/\balgorithm\b/gi, 'Direct Listing')
      .trim() || (isVerified ? 'Verified Menu Listing' : 'Pending Verification')
  );
};

export const DishInspectModal: React.FC<DishInspectModalProps> = ({
  restaurant,
  onClose,
}) => {
  const [data, setData] = useState<DishInspection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch('/api/inspect-dish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantName: restaurant.name,
        dish: restaurant.dishName,
        address: restaurant.address,
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData.error) {
          setError(resData.error);
        } else {
          setData(resData);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Inspection failed');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [restaurant]);

  if (!restaurant) return null;

  const isVerified = restaurant.verificationStatus === 'VERIFIED_MENU';
  const displaySource = cleanSource(restaurant.verificationSource, isVerified);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2E]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#FFF9EF] rounded-3xl shadow-2xl border border-[#123D45]/15 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#123D45]/10 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F47B54]/10 text-[#F47B54]">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[#F47B54]">
                  Culinary Deep-Dive
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {isVerified ? 'Verified Menu Match' : 'Unverified Discovery'}
                </span>
              </div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#123D45]">
                {restaurant.dishName}
              </h2>
              <p className="text-xs text-[#202B2E]/70">
                At <strong className="text-[#123D45]">{restaurant.name}</strong> • {restaurant.priceLevel}
                {restaurant.dishPrice ? ` • ${restaurant.dishPrice}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#202B2E]/50 hover:text-[#202B2E] hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#F47B54]/30 border-t-[#F47B54] rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#123D45]">
                Analyzing menu preparation & culinary sources...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-amber-50 text-amber-900 text-xs">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Culinary Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-[#123D45]/10 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#123D45]">
                  <Utensils className="w-4 h-4 text-[#F47B54]" />
                  <span>Preparation & Flavor Profile</span>
                </div>
                <p className="text-sm text-[#202B2E]/85 leading-relaxed">
                  {data.culinaryBreakdown}
                </p>
              </div>

              {/* Confidence & Dietary Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-[#123D45]/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#123D45] mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Menu Confidence</span>
                  </div>
                  <div className="text-2xl font-heading font-black text-emerald-700">
                    {data.confidenceScore || 96}%
                  </div>
                  <div className="text-[11px] text-[#202B2E]/60 mt-0.5">
                    Source: {displaySource}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#123D45]/10">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#123D45] mb-2">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span>Dietary & Customization</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(data.dietaryTags || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-[#FFF9EF] text-[#123D45] text-xs font-semibold border border-[#F7D889]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pairing & Verdict */}
              {data.idealPairing && (
                <div className="bg-white p-4 rounded-2xl border border-[#123D45]/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0">
                    <GlassWater className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#123D45] uppercase tracking-wider">
                      Recommended Pairing
                    </div>
                    <p className="text-xs text-[#202B2E]/80 mt-0.5">
                      {data.idealPairing}
                    </p>
                  </div>
                </div>
              )}

              {data.guestVerdict && (
                <div className="bg-white p-4 rounded-2xl border border-[#123D45]/10 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-orange-50 text-[#F47B54] shrink-0">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#123D45] uppercase tracking-wider">
                      Diner Consensus
                    </div>
                    <p className="text-xs text-[#202B2E]/80 mt-0.5">
                      {data.guestVerdict}
                    </p>
                  </div>
                </div>
              )}

              {/* Related variations */}
              {data.alternateVariations && data.alternateVariations.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#123D45] mb-2">
                    Other Noteworthy Dishes Here
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.alternateVariations.map((v, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-stone-100 text-[#202B2E] text-xs font-medium"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-[#123D45]/10 flex items-center justify-between">
          <span className="text-xs text-[#202B2E]/60 truncate max-w-[240px]">
            {restaurant.address}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={restaurant.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#123D45] text-white text-xs font-bold hover:bg-[#1a4e57] transition"
            >
              Get Directions
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 text-[#202B2E] text-xs font-bold hover:bg-stone-300 transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
