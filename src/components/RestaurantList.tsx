import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  HelpCircle,
  ArrowUpDown,
  ShieldCheck,
  ChevronDown,
  Activity,
  Layers,
  MapPin,
  Search,
} from 'lucide-react';
import { Restaurant, SearchDiagnostics } from '../types';
import { RestaurantCard } from './RestaurantCard';

interface RestaurantListProps {
  restaurants: Restaurant[];
  dishQuery: string;
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onInspectRestaurant: (restaurant: Restaurant) => void;
  diagnostics?: SearchDiagnostics;
  onSearchMore?: () => void;
  isSearchingMore?: boolean;
}

type TabFilter = 'ALL' | 'EXACT' | 'SIMILAR' | 'UNVERIFIED';
type SortOption = 'DISTANCE' | 'RATING' | 'PRICE';

export const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  dishQuery,
  selectedRestaurant,
  onSelectRestaurant,
  onInspectRestaurant,
  diagnostics,
  onSearchMore,
  isSearchingMore,
}) => {
  const [activeTab, setActiveTab] = useState<TabFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DISTANCE');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [showDiagnosticsDetail, setShowDiagnosticsDetail] = useState<boolean>(false);

  const exactCount = useMemo(
    () => restaurants.filter((r) => r.matchType === 'EXACT_OR_EQUIVALENT').length,
    [restaurants]
  );
  const similarCount = useMemo(
    () => restaurants.filter((r) => r.matchType === 'SIMILAR').length,
    [restaurants]
  );
  const unverifiedCount = useMemo(
    () => restaurants.filter((r) => r.matchType === 'UNVERIFIED' || r.verificationStatus !== 'VERIFIED_MENU').length,
    [restaurants]
  );

  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];

    if (activeTab === 'EXACT') {
      list = list.filter((r) => r.matchType === 'EXACT_OR_EQUIVALENT');
    } else if (activeTab === 'SIMILAR') {
      list = list.filter((r) => r.matchType === 'SIMILAR');
    } else if (activeTab === 'UNVERIFIED') {
      list = list.filter((r) => r.matchType === 'UNVERIFIED' || r.verificationStatus !== 'VERIFIED_MENU');
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'DISTANCE') {
        return a.distanceMiles - b.distanceMiles;
      }
      if (sortBy === 'RATING') {
        return b.rating - a.rating;
      }
      if (sortBy === 'PRICE') {
        return a.priceLevel.length - b.priceLevel.length;
      }
      return 0;
    });

    return list;
  }, [restaurants, activeTab, sortBy]);

  const displayedList = filteredRestaurants.slice(0, visibleCount);
  const hasMoreToRevealLocally = visibleCount < filteredRestaurants.length;

  const handleRevealMore = () => {
    setVisibleCount((prev) => Math.min(prev + 6, filteredRestaurants.length));
  };

  const interpretation = diagnostics?.interpretation;

  return (
    <div className="space-y-4">
      {/* Search Diagnostics Bar */}
      {diagnostics && (
        <div className="bg-white rounded-2xl border border-[#123D45]/15 p-3.5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#123D45]/10 text-[#123D45]">
                <Activity className="w-4 h-4 text-[#F47B54]" />
              </div>
              <span className="font-heading font-bold text-sm text-[#123D45]">
                Discovery Diagnostics
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#202B2E]/75">
              <span className="bg-[#FFF9EF] px-2.5 py-1 rounded-lg border border-[#123D45]/10 font-semibold">
                Candidates: <strong>{diagnostics.candidatesEvaluated}</strong>
              </span>
              <span className="bg-[#FFF9EF] px-2.5 py-1 rounded-lg border border-[#123D45]/10 font-semibold">
                Menus Inspected: <strong>{diagnostics.menusChecked}</strong>
              </span>
              <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200 font-bold">
                Exact: {exactCount}
              </span>
              {similarCount > 0 && (
                <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded-lg border border-blue-200 font-bold">
                  Similar: {similarCount}
                </span>
              )}
              <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded-lg border border-amber-200 font-bold">
                Possible: {unverifiedCount}
              </span>

              <button
                type="button"
                onClick={() => setShowDiagnosticsDetail(!showDiagnosticsDetail)}
                className="text-xs text-[#F47B54] font-bold hover:underline flex items-center gap-1 ml-1"
              >
                <span>{showDiagnosticsDetail ? 'Hide Queries' : 'Inspect Queries'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showDiagnosticsDetail ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Collapsible Diagnostics Detail */}
          {showDiagnosticsDetail && (
            <div className="mt-3 pt-3 border-t border-[#123D45]/10 space-y-2.5 text-xs text-[#202B2E]/80 animate-in fade-in duration-150">
              {interpretation && (
                <div className="bg-[#FFF9EF] p-2.5 rounded-xl border border-[#F7D889]/60">
                  <span className="font-bold text-[#123D45] block mb-1">
                    Semantic Intent & Modifiers:
                  </span>
                  <p className="text-[11px] text-[#202B2E]/80 leading-relaxed mb-1.5">
                    {interpretation.explanation}
                  </p>
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    <span className="font-semibold text-[#123D45]">Core Ingredients:</span>
                    {interpretation.coreIngredients.map((ing, i) => (
                      <span key={i} className="bg-white px-1.5 py-0.5 rounded border border-[#123D45]/10 font-medium">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="font-bold text-[#123D45] block mb-1">
                  Intelligent Dish Variations Searched:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {diagnostics.dishVariationsSearched.map((v, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#FFF9EF] border border-[#F7D889] text-[11px] font-semibold text-[#123D45]"
                    >
                      “{v}”
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-[#123D45] block mb-1">
                  Neighborhoods & Corridors Investigated:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {diagnostics.neighborhoodsCovered.map((n, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] font-medium text-[#202B2E]"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Meta & Tabs */}
      <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-3 sm:p-4 border border-[#123D45]/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-black text-[#123D45]">
              {restaurants.length} Spots for “{interpretation?.canonicalDish || dishQuery}”
            </h2>
            <p className="text-xs text-[#202B2E]/65 mt-0.5">
              Ranked by match quality (Exact menu items first, then similar dishes and unverified candidates).
            </p>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#123D45]/60" />
            <span className="text-xs font-semibold text-[#123D45]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs font-semibold bg-stone-100 border border-[#123D45]/10 rounded-xl px-2.5 py-1.5 text-[#123D45] focus:outline-hidden focus:border-[#F47B54]"
            >
              <option value="DISTANCE">Closest Distance</option>
              <option value="RATING">Highest Rated</option>
              <option value="PRICE">Price (Low to High)</option>
            </select>
          </div>
        </div>

        {/* Tab Filters: All / Exact / Similar / Unverified */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#123D45]/5 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('ALL');
              setVisibleCount(10);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'ALL'
                ? 'bg-[#123D45] text-white shadow-xs'
                : 'bg-stone-100 text-[#202B2E]/70 hover:bg-stone-200'
            }`}
          >
            All Results ({restaurants.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('EXACT');
              setVisibleCount(10);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'EXACT'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Exact or Equivalent Match ({exactCount})</span>
          </button>

          {similarCount > 0 && (
            <button
              onClick={() => {
                setActiveTab('SIMILAR');
                setVisibleCount(10);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === 'SIMILAR'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Similar Dish ({similarCount})</span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('UNVERIFIED');
              setVisibleCount(10);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTab === 'UNVERIFIED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Possible Match — Unverified ({unverifiedCount})</span>
          </button>
        </div>
      </div>

      {/* Trust Notice */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#FFF9EF] border border-[#F7D889] text-[11px] text-[#202B2E]/75">
        <ShieldCheck className="w-4 h-4 text-[#123D45] shrink-0" />
        <span>
          <strong className="text-[#123D45]">Evidence-Grounded Search:</strong> Results are evaluated against official menus, online ordering (Toast, DoorDash, Uber Eats), and public transcripts. Unconfirmed candidates are clearly marked under Possible Matches.
        </span>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {displayedList.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#123D45]/10">
            <p className="text-sm text-[#202B2E]/70 mb-3">
              No spots found under the selected filter tab.
            </p>
            <button
              onClick={() => setActiveTab('ALL')}
              className="px-4 py-2 rounded-xl bg-[#123D45] text-white text-xs font-bold shadow-xs hover:bg-[#1a4e57] transition"
            >
              View All Results ({restaurants.length})
            </button>
          </div>
        ) : (
          displayedList.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isSelected={selectedRestaurant?.id === restaurant.id}
              onSelect={onSelectRestaurant}
              onInspect={onInspectRestaurant}
            />
          ))
        )}
      </div>

      {/* Pagination & Live Search More Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        {hasMoreToRevealLocally && (
          <button
            onClick={handleRevealMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-[#123D45]/15 hover:border-[#123D45] text-[#123D45] font-bold text-xs shadow-xs transition"
          >
            <span>Show Next Batch ({filteredRestaurants.length - visibleCount} more loaded)</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {onSearchMore && (
          <button
            onClick={onSearchMore}
            disabled={isSearchingMore}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#123D45] hover:bg-[#1a4e57] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#123D45]/20 hover:shadow-lg transition active:scale-[0.98]"
          >
            {isSearchingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Searching Additional Neighborhoods...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-[#F7D889]" />
                <span>Expand Search / Discover More Restaurants</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
