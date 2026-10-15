import React from 'react';
import { MapPin, Navigation, Utensils, Activity } from 'lucide-react';
import { UserLocation } from '../types';

interface HeaderProps {
  location: UserLocation;
  onOpenLocationModal: () => void;
  radiusMiles: number;
  onSelectRadius: (miles: number) => void;
  onOpenDiagnostics?: () => void;
  diagnosticsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  location,
  onOpenLocationModal,
  radiusMiles,
  onSelectRadius,
  onOpenDiagnostics,
  diagnosticsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FFF9EF]/95 backdrop-blur-md border-b border-[#123D45]/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-[#123D45] text-white shadow-md shadow-[#123D45]/20">
              {/* Minimalist food + radar signal logo */}
              <svg
                viewBox="0 0 24 24"
                className="w-6 h-6 text-[#F7D889]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Cloche / Bowl base */}
                <path d="M4 17h16" />
                <path d="M5 17a7 7 0 0 1 14 0" />
                {/* Radar signal waves radiating above */}
                <path d="M12 9V5" stroke="#F47B54" strokeWidth="2.5" />
                <path d="M8 5a6 6 0 0 1 8 0" stroke="#F47B54" strokeWidth="1.75" />
                <circle cx="12" cy="4" r="1.5" fill="#F47B54" stroke="none" />
              </svg>
              {/* Small active pulse dot */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F47B54] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F47B54] border-2 border-[#FFF9EF]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-2xl font-black tracking-tight text-[#123D45]">
                  DishSignal
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#F7D889]/40 text-[#123D45] border border-[#F7D889]">
                  <Utensils className="w-3 h-3 text-[#F47B54]" />
                  Verified Menus
                </span>
              </div>
              <p className="text-xs text-[#202B2E]/75 font-medium -mt-0.5">
                Find exactly what you're craving.
              </p>
            </div>
          </div>

          {/* Location, Diagnostics, & Radius Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Search Diagnostics Button in Header */}
            {onOpenDiagnostics && (
              <button
                type="button"
                onClick={onOpenDiagnostics}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#123D45] hover:bg-[#1a4e57] text-[#F7D889] text-xs font-bold shadow-xs hover:shadow-sm transition cursor-pointer"
                title="View Search Diagnostics (crawled restaurant websites, menus parsed vs skipped)"
              >
                <Activity className="w-4 h-4 text-[#F47B54] animate-pulse" />
                <span className="hidden md:inline">View Diagnostics</span>
                <span className="inline md:hidden">Diagnostics</span>
                {diagnosticsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-[#F7D889] text-[#123D45] text-[10px] font-black rounded-full">
                    {diagnosticsCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#123D45]/15 hover:border-[#F47B54] text-[#123D45] text-xs sm:text-sm font-semibold shadow-xs transition hover:shadow-sm cursor-pointer"
              title="Change search location"
            >
              {location.isGps ? (
                <Navigation className="w-4 h-4 text-[#F47B54] fill-[#F47B54]/20 animate-pulse" />
              ) : (
                <MapPin className="w-4 h-4 text-[#123D45]" />
              )}
              <span className="max-w-[110px] sm:max-w-[190px] truncate text-left">
                {location.name}
              </span>
              <span className="text-[11px] text-[#202B2E]/60 bg-[#123D45]/5 px-1.5 py-0.5 rounded-md font-mono">
                ±{radiusMiles}mi
              </span>
            </button>

            {/* Quick Radius Selector (Dropdown / Pills) */}
            <div className="hidden lg:flex items-center bg-white/80 p-1 rounded-xl border border-[#123D45]/10 text-xs font-semibold">
              <span className="px-2 text-[11px] uppercase tracking-wider text-[#202B2E]/50">
                Radius:
              </span>
              {[1, 3, 5, 10, 25].map((r) => (
                <button
                  key={r}
                  onClick={() => onSelectRadius(r)}
                  className={`px-2.5 py-1 rounded-lg transition text-xs ${
                    radiusMiles === r
                      ? 'bg-[#123D45] text-white shadow-xs'
                      : 'text-[#202B2E]/70 hover:text-[#123D45] hover:bg-[#123D45]/5'
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
