import React, { useEffect, useState } from 'react';
import { Search, AlertCircle, Utensils, UtensilsCrossed, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  dishQuery: string;
  locationName: string;
}

const LOADING_STEPS = [
  'Querying local restaurant and dining database...',
  'Scanning verified dinner, lunch & specialty menus...',
  'Matching exact culinary preparations & ingredient profiles...',
  'Calculating real driving distances & geo-coordinates...',
  'Verifying menu sources & separating unverified suggestions...',
];

export const LoadingState: React.FC<LoadingStateProps> = ({ dishQuery, locationName }) => {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-16 px-4 text-center max-w-lg mx-auto">
      <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
        {/* Animated radar circles */}
        <div className="absolute inset-0 rounded-full border-2 border-[#F47B54]/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border border-[#123D45]/30 animate-pulse" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-[#123D45] text-white shadow-xl shadow-[#123D45]/30">
          <Utensils className="w-8 h-8 text-[#F7D889] animate-bounce" />
        </div>
      </div>

      <h3 className="font-heading text-2xl sm:text-3xl font-black text-[#123D45] mb-2">
        Searching for {dishQuery} and similar menu names…
      </h3>
      <p className="text-sm text-[#202B2E]/70 mb-5">
        Comparing actual restaurant menus near <strong className="text-[#123D45]">{locationName}</strong>
      </p>

      {/* Dynamic step ticker */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-[#123D45]/10 shadow-xs text-xs font-semibold text-[#123D45]">
        <div className="w-3.5 h-3.5 border-2 border-[#F47B54] border-t-transparent rounded-full animate-spin" />
        <span>{LOADING_STEPS[stepIdx]}</span>
      </div>
    </div>
  );
};

interface EmptyStateProps {
  dishQuery: string;
  onSelectSuggestion: (dish: string) => void;
  onOpenLocation: () => void;
  locationName: string;
  radiusMiles?: number;
  onSelectRadius?: (miles: number) => void;
  onOpenDiagnostics?: () => void;
}

const EXPANDED_EMPTY_SUGGESTIONS = [
  'Spicy rigatoni',
  'Birria tacos',
  'Crispy rice with spicy tuna',
  'Smash burger',
  'Truffle parmesan fries',
  'French onion soup',
  'Cacio e pepe',
  'Pork belly bao',
  'Dan dan noodles',
  'Steak frites',
];

export const EmptyState: React.FC<EmptyStateProps> = ({
  dishQuery,
  onSelectSuggestion,
  onOpenLocation,
  locationName,
  radiusMiles = 5,
  onSelectRadius,
  onOpenDiagnostics,
}) => {
  const nextRadiusOptions = [1, 3, 5, 10, 25].filter((r) => r > radiusMiles);

  return (
    <div className="py-12 px-4 text-center max-w-lg mx-auto bg-white/90 rounded-3xl border border-[#123D45]/10 shadow-sm animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-2xl bg-[#FFF9EF] border border-[#F7D889] text-[#123D45] flex items-center justify-center mx-auto mb-4">
        <Search className="w-6 h-6 text-[#F47B54]" />
      </div>

      <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#123D45] mb-2">
        No verified matches within {radiusMiles} mile{radiusMiles > 1 ? 's' : ''}
      </h3>
      <p className="text-xs sm:text-sm text-[#202B2E]/70 mb-5 leading-relaxed">
        None of the active menus near <strong className="text-[#123D45]">{locationName}</strong> had confirmed offerings for “<strong>{dishQuery}</strong>” within your selected <strong>{radiusMiles}-mile radius</strong>.
      </p>

      {/* Immediate Radius Expansion Action Buttons */}
      {nextRadiusOptions.length > 0 && onSelectRadius && (
        <div className="mb-6 p-4 rounded-2xl bg-[#FFF9EF] border border-[#F7D889]/60">
          <div className="text-xs font-bold text-[#123D45] uppercase tracking-wider mb-2.5">
            Expand your search radius:
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {nextRadiusOptions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onSelectRadius(r)}
                className="px-3.5 py-2 rounded-xl bg-[#123D45] hover:bg-[#1a4e57] text-white text-xs font-bold transition shadow-xs hover:shadow-sm"
              >
                Expand to {r} miles →
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {onOpenDiagnostics && (
          <button
            type="button"
            onClick={onOpenDiagnostics}
            className="w-full py-2.5 rounded-xl bg-[#123D45] hover:bg-[#1a4e57] text-[#F7D889] text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>View Search Diagnostics & Visited Websites</span>
          </button>
        )}

        <button
          onClick={onOpenLocation}
          className="w-full py-2.5 rounded-xl bg-white border border-[#123D45]/20 hover:border-[#123D45] text-[#123D45] text-xs font-bold transition shadow-2xs"
        >
          Change Street Address or Use GPS
        </button>

        <div className="pt-4 text-xs font-bold uppercase tracking-wider text-[#123D45]/60">
          Or try popular cravings nearby:
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          {EXPANDED_EMPTY_SUGGESTIONS.map((item) => (
            <button
              key={item}
              onClick={() => onSelectSuggestion(item)}
              className="px-3 py-1.5 rounded-xl bg-[#FFF9EF] border border-[#123D45]/10 text-xs font-semibold text-[#123D45] hover:border-[#F47B54] transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="py-12 px-4 text-center max-w-md mx-auto bg-white/90 rounded-3xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>

      <h3 className="font-heading text-lg font-bold text-red-900 mb-2">
        Search Interrupted
      </h3>
      <p className="text-xs text-red-700/80 mb-5 leading-relaxed">
        {error}
      </p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123D45] text-white text-xs font-bold hover:bg-[#1a4e57] transition shadow-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
