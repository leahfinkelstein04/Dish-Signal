import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { LocationModal } from './components/LocationModal';
import { RestaurantList } from './components/RestaurantList';
import { InteractiveMap } from './components/InteractiveMap';
import { DishInspectModal } from './components/DishInspectModal';
import { LoadingState, EmptyState, ErrorState } from './components/EmptyOrLoadingState';
import { Restaurant, UserLocation, SearchDiagnostics } from './types';
import { List, Map as MapIcon, Utensils, Compass } from 'lucide-react';

export default function App() {
  // Location State
  const [userLocation, setUserLocation] = useState<UserLocation>({
    lat: 29.9482,
    lng: -90.0734,
    name: '821 Baronne St, New Orleans, LA 70113',
    isGps: false,
  });
  const [radiusMiles, setRadiusMiles] = useState<number>(5);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);

  // Search State
  const [dishQuery, setDishQuery] = useState<string>('');
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSearchingMore, setIsSearchingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [diagnostics, setDiagnostics] = useState<SearchDiagnostics | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [inspectRestaurant, setInspectRestaurant] = useState<Restaurant | null>(null);

  // Mobile View Toggle: 'list' or 'map'
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Search API Call: can take an updated UserLocation or a raw address string to geocode
  const performSearch = async (
    dish: string,
    locOrAddress?: UserLocation | string,
    radius: number = radiusMiles
  ) => {
    if (!dish.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setDishQuery(dish);
    setHasSearched(true);
    setSelectedRestaurant(null);
    setCurrentPage(1);

    try {
      let targetLoc: UserLocation = userLocation;

      // If user typed a new address string in the search bar, geocode it first
      if (typeof locOrAddress === 'string' && locOrAddress.trim()) {
        try {
          const geoRes = await fetch(`/api/geocode?q=${encodeURIComponent(locOrAddress.trim())}`, {
            signal: abortControllerRef.current.signal,
          });
          const geoData = await geoRes.json();
          if (geoRes.ok && !geoData.error) {
            targetLoc = {
              lat: geoData.lat,
              lng: geoData.lng,
              name: geoData.displayName || geoData.city || locOrAddress.trim(),
              isGps: false,
            };
            setUserLocation(targetLoc);
          }
        } catch (geoErr) {
          console.warn('Geocoding error, falling back to existing location:', geoErr);
        }
      } else if (typeof locOrAddress === 'object' && locOrAddress !== null) {
        targetLoc = locOrAddress;
      }

      const res = await fetch('/api/search-dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dish: dish.trim(),
          lat: targetLoc.lat,
          lng: targetLoc.lng,
          radiusMiles: radius,
          locationName: targetLoc.name,
          page: 1,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to search restaurants.');
      }

      setRestaurants(data.restaurants || []);
      setDiagnostics(data.diagnostics);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Search error:', err);
      setError(err.message || 'An unexpected error occurred while searching menus.');
    } finally {
      setIsLoading(false);
    }
  };

  // Live "Search More" / "Expand Search" handler
  const handleSearchMore = async () => {
    if (isSearchingMore || !dishQuery) return;

    setIsSearchingMore(true);
    const nextPage = currentPage + 1;

    try {
      const res = await fetch('/api/search-dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dish: dishQuery.trim(),
          lat: userLocation.lat,
          lng: userLocation.lng,
          radiusMiles,
          locationName: userLocation.name,
          page: nextPage,
          expand: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.restaurants) {
        // Merge and deduplicate by clean name
        setRestaurants((prev) => {
          const existingIds = new Set(prev.map((r) => r.name.toLowerCase().trim()));
          const newUnique = data.restaurants.filter(
            (r: Restaurant) => !existingIds.has(r.name.toLowerCase().trim())
          );
          return [...prev, ...newUnique];
        });

        if (data.diagnostics) {
          setDiagnostics((prevDiag) => ({
            ...data.diagnostics,
            candidatesEvaluated: (prevDiag?.candidatesEvaluated || 0) + data.diagnostics.candidatesEvaluated,
            menusChecked: (prevDiag?.menusChecked || 0) + data.diagnostics.menusChecked,
          }));
        }

        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error('Search more error:', err);
    } finally {
      setIsSearchingMore(false);
    }
  };

  // GPS Locate helper
  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      setIsLocationModalOpen(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLoc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'Current GPS Location',
          isGps: true,
          accuracyMeters: Math.round(pos.coords.accuracy),
        };
        setUserLocation(newLoc);
        performSearch(dishQuery, newLoc, radiusMiles);
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setIsLocationModalOpen(true);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  // GPS is triggered only when user explicitly clicks "Use My Location" or GPS icon

  const handleSelectRadius = (miles: number) => {
    setRadiusMiles(miles);
    if (dishQuery) {
      performSearch(dishQuery, userLocation, miles);
    }
  };

  const handleSelectLocation = (loc: UserLocation) => {
    setUserLocation(loc);
    if (dishQuery) {
      performSearch(dishQuery, loc, radiusMiles);
    }
  };

  const handleSelectRestaurant = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9EF] text-[#202B2E]">
      {/* Navigation Header */}
      <Header
        location={userLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        radiusMiles={radiusMiles}
        onSelectRadius={handleSelectRadius}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
        {/* Search Bar with Dish + Street Address */}
        <SearchBar
          onSearch={(query, address) => performSearch(query, address)}
          isLoading={isLoading}
          currentQuery={dishQuery}
          radiusMiles={radiusMiles}
          onSelectRadius={handleSelectRadius}
          onOpenLocationModal={() => setIsLocationModalOpen(true)}
          locationName={userLocation.name}
          onUseGps={handleUseGps}
          isGps={userLocation.isGps}
        />

        {/* Semantic Query Interpretation & Spelling Correction Alert */}
        {hasSearched && !isLoading && diagnostics?.interpretation && (
          <div className="my-3 px-4 py-3 rounded-2xl bg-white/90 border border-[#123D45]/15 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#202B2E]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#123D45]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {diagnostics.interpretation.isSpellingCorrected ? 'Showing results for:' : 'Searching for:'}
              </span>
              <strong className="text-sm font-heading font-black text-[#123D45] bg-[#FFF9EF] px-2.5 py-0.5 rounded-lg border border-[#F7D889]">
                {diagnostics.interpretation.canonicalDish}
              </strong>
              {diagnostics.interpretation.isSpellingCorrected && (
                <span className="text-[#202B2E]/60 text-xs">
                  (interpreted from original input: “{dishQuery}”)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {diagnostics.interpretation.didYouMean &&
                diagnostics.interpretation.didYouMean.toLowerCase() !== dishQuery.toLowerCase() && (
                  <button
                    type="button"
                    onClick={() => performSearch(diagnostics.interpretation!.didYouMean!)}
                    className="text-xs text-[#F47B54] font-bold hover:underline bg-[#FFF9EF] px-2.5 py-1 rounded-lg border border-[#F47B54]/30"
                  >
                    Did you mean: {diagnostics.interpretation.didYouMean}?
                  </button>
                )}

              {diagnostics.interpretation.isSpellingCorrected && (
                <button
                  type="button"
                  onClick={() => performSearch(dishQuery)}
                  className="text-xs text-[#123D45]/70 hover:text-[#123D45] font-semibold underline"
                >
                  Search original query instead
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile View Toggle (List vs Map) */}
        {hasSearched && (
          <div className="lg:hidden flex items-center justify-center my-3">
            <div className="inline-flex p-1 bg-white rounded-2xl border border-[#123D45]/15 shadow-sm">
              <button
                onClick={() => setMobileView('list')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
                  mobileView === 'list'
                    ? 'bg-[#123D45] text-white shadow-xs'
                    : 'text-[#202B2E]/70 hover:text-[#123D45]'
                }`}
              >
                <List className="w-4 h-4" />
                <span>List View ({restaurants.length})</span>
              </button>
              <button
                onClick={() => setMobileView('map')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition ${
                  mobileView === 'map'
                    ? 'bg-[#F47B54] text-white shadow-xs'
                    : 'text-[#202B2E]/70 hover:text-[#123D45]'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span>Interactive Map</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 mt-4">
          {isLoading ? (
            <LoadingState dishQuery={dishQuery} locationName={userLocation.name} />
          ) : error ? (
            <ErrorState error={error} onRetry={() => performSearch(dishQuery)} />
          ) : hasSearched && restaurants.length === 0 ? (
            <EmptyState
              dishQuery={dishQuery}
              onSelectSuggestion={(dish) => performSearch(dish)}
              onOpenLocation={() => setIsLocationModalOpen(true)}
              locationName={userLocation.name}
              radiusMiles={radiusMiles}
              onSelectRadius={handleSelectRadius}
            />
          ) : restaurants.length > 0 ? (
            /* Split Screen Layout (Desktop: Side-by-Side; Mobile: Toggled) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Restaurant List */}
              <div
                className={`lg:col-span-7 xl:col-span-6 space-y-4 ${
                  mobileView === 'map' ? 'hidden lg:block' : 'block'
                }`}
              >
                <RestaurantList
                  restaurants={restaurants}
                  dishQuery={dishQuery}
                  selectedRestaurant={selectedRestaurant}
                  onSelectRestaurant={handleSelectRestaurant}
                  onInspectRestaurant={(r) => setInspectRestaurant(r)}
                  diagnostics={diagnostics}
                  onSearchMore={handleSearchMore}
                  isSearchingMore={isSearchingMore}
                />
              </div>

              {/* Right Column: Interactive Leaflet Map */}
              <div
                className={`lg:col-span-5 xl:col-span-6 sticky top-28 h-[550px] lg:h-[calc(100vh-140px)] ${
                  mobileView === 'list' ? 'hidden lg:block' : 'block'
                }`}
              >
                <InteractiveMap
                  restaurants={restaurants}
                  userLocation={userLocation}
                  selectedRestaurant={selectedRestaurant}
                  onSelectRestaurant={handleSelectRestaurant}
                  onInspectRestaurant={(r) => setInspectRestaurant(r)}
                  radiusMiles={radiusMiles}
                  mobileView={mobileView}
                />
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Culinary Deep Dive Inspection Modal */}
      <DishInspectModal
        restaurant={inspectRestaurant}
        onClose={() => setInspectRestaurant(null)}
      />

      {/* Location Settings Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        currentLocation={userLocation}
        onSelectLocation={handleSelectLocation}
      />

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-[#123D45]/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#123D45] text-[#F7D889]">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="font-heading font-black text-lg text-[#123D45]">
                DishSignal
              </div>
              <div className="text-xs text-[#202B2E]/60">
                Find exactly what you're craving.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#202B2E]/70 font-medium">
            <span className="flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#F47B54]" />
              Multi-Phase Food, Coffee, Matcha & Bakery Radar
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#123D45]" />
              Exact Street Address Positioning
            </span>
            <span>•</span>
            <span>Zero Hallucinated Menus</span>
          </div>

          <div className="text-xs text-[#202B2E]/50">
            © {new Date().getFullYear()} DishSignal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
