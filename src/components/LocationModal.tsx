import React, { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserLocation, AddressSuggestion } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
}

const POPULAR_ADDRESS_EXAMPLES = [
  { label: '821 Baronne St, New Orleans, LA 70113', name: 'Downtown / Warehouse District, New Orleans', lat: 29.9482, lng: -90.0734 },
  { label: '3318 Magazine St, New Orleans, LA 70115', name: 'Lower Coast Coffee / Magazine St, NOLA', lat: 29.9238, lng: -90.0886 },
  { label: '100 Pine St, San Francisco, CA', name: 'Financial District, SF', lat: 37.7925, lng: -122.4001 },
  { label: '350 5th Ave, New York, NY', name: 'Empire State Building, NY', lat: 40.7484, lng: -73.9857 },
  { label: '111 W Wacker Dr, Chicago, IL', name: 'The Loop, Chicago', lat: 41.8867, lng: -87.6322 },
  { label: '1100 Congress Ave, Austin, TX', name: 'Downtown Austin, TX', lat: 30.2747, lng: -97.7404 },
  { label: '6801 Hollywood Blvd, Los Angeles, CA', name: 'Hollywood, CA', lat: 34.1016, lng: -118.3398 },
  { label: '1912 Pike Pl, Seattle, WA', name: 'Pike Place, Seattle', lat: 47.6101, lng: -122.3421 },
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}) => {
  const [addressInput, setAddressInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isRequestingGps, setIsRequestingGps] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Address Autocomplete State
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState<boolean>(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced address autocomplete for USA addresses
  useEffect(() => {
    if (!addressInput || addressInput.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const res = await fetch(
          `/api/address-autocomplete?q=${encodeURIComponent(addressInput.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
            setShowDropdown(true);
            setActiveIdx(-1);
          } else {
            setSuggestions([]);
          }
        }
      } catch (err) {
        console.warn('Modal autocomplete error:', err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 160);

    return () => clearTimeout(timer);
  }, [addressInput]);

  if (!isOpen) return null;

  const handleUseGps = () => {
    setErrorMsg(null);
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsRequestingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsRequestingGps(false);
        const { latitude, longitude, accuracy } = position.coords;
        let displayName = 'Current GPS Location';
        try {
          const revRes = await fetch(`/api/reverse-geocode?lat=${latitude}&lng=${longitude}`);
          if (revRes.ok) {
            const revData = await revRes.json();
            if (revData.displayName) {
              displayName = revData.displayName;
            }
          }
        } catch {
          // fallback
        }

        onSelectLocation({
          lat: latitude,
          lng: longitude,
          name: displayName,
          isGps: true,
          accuracyMeters: Math.round(accuracy),
        });
        onClose();
      },
      (err) => {
        setIsRequestingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMsg(
            'GPS location permission was denied. You can enter a street address or ZIP code below.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setErrorMsg('Location information is unavailable. Please type your street address.');
        } else {
          setErrorMsg('Location request timed out. Please enter a street address manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;

    setErrorMsg(null);
    setIsGeocoding(true);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(addressInput.trim())}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to find that address.');
      }

      onSelectLocation({
        lat: data.lat,
        lng: data.lng,
        name: data.displayName || data.city || addressInput.trim(),
        isGps: false,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resolve that address. Please include street, city, or ZIP.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSelectExample = (ex: (typeof POPULAR_ADDRESS_EXAMPLES)[0]) => {
    onSelectLocation({
      lat: ex.lat,
      lng: ex.lng,
      name: ex.label,
      isGps: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202B2E]/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#FFF9EF] rounded-3xl shadow-2xl border border-[#123D45]/15 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#123D45]/10 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#123D45]/10 text-[#123D45]">
              <MapPin className="w-5 h-5 text-[#F47B54]" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-[#123D45]">
                Set Street Address
              </h2>
              <p className="text-xs text-[#202B2E]/65">
                Exact coordinates allow accurate map pins and true distance calculation
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Manual Street Address input */}
          <form onSubmit={handleManualSearch} className="space-y-2">
            <label className="block text-xs font-bold text-[#123D45] uppercase tracking-wide">
              Street Address, Cross Street, or Landmark
            </label>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onKeyDown={(e) => {
                  if (!showDropdown || suggestions.length === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setActiveIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
                  } else if (e.key === 'Enter') {
                    if (activeIdx >= 0 && activeIdx < suggestions.length) {
                      e.preventDefault();
                      const chosen = suggestions[activeIdx];
                      onSelectLocation({
                        lat: chosen.lat,
                        lng: chosen.lng,
                        name: chosen.label,
                        isGps: false,
                      });
                      onClose();
                    }
                  } else if (e.key === 'Escape') {
                    setShowDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="e.g. 3318 Magazine St, New Orleans or 350 5th Ave, NY"
                className="w-full pl-10 pr-28 py-3.5 rounded-2xl bg-white border border-[#123D45]/20 focus:border-[#F47B54] focus:outline-hidden text-sm text-[#202B2E] placeholder:text-[#202B2E]/40"
              />
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#F47B54]" />

              {addressInput && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressInput('');
                    setSuggestions([]);
                    setShowDropdown(false);
                  }}
                  className="absolute right-24 top-1/2 -translate-y-1/2 p-1 text-[#202B2E]/40 hover:text-[#202B2E] transition cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="submit"
                disabled={isGeocoding || !addressInput.trim()}
                className="absolute right-1.5 top-1.5 px-4 py-2 rounded-xl bg-[#F47B54] hover:bg-[#e0663f] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {isGeocoding ? 'Finding...' : 'Set Address'}
              </button>

              {/* Autocomplete suggestions dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border-2 border-[#123D45]/15 z-50 overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-2 bg-stone-50 border-b border-[#123D45]/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#123D45]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Matching Address Options</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-stone-200 text-[#123D45] text-[9px] font-black">
                        USA ONLY
                      </span>
                    </div>
                    <span className="text-[#F47B54]">Click or Enter to select</span>
                  </div>
                  <div className="divide-y divide-[#123D45]/5">
                    {suggestions.map((sugg, idx) => {
                      const isHighlighted = activeIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            onSelectLocation({
                              lat: sugg.lat,
                              lng: sugg.lng,
                              name: sugg.label,
                              isGps: false,
                            });
                            onClose();
                          }}
                          className={`w-full text-left p-3 transition flex items-start gap-2.5 cursor-pointer group ${
                            isHighlighted ? 'bg-[#FFF2DE]' : 'hover:bg-[#FFF9EF]'
                          }`}
                        >
                          <div
                            className={`p-1 rounded-lg transition-colors shrink-0 mt-0.5 ${
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
                            <div className="text-[11px] text-[#202B2E]/65 truncate">
                              {sugg.secondaryText}
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
            <p className="text-[11px] text-[#202B2E]/60 pl-1">
              Tip: Start typing your street address to pick from live matching options across the United States.
            </p>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#123D45]/10" />
            </div>
            <span className="relative px-3 bg-[#FFF9EF] text-xs uppercase tracking-wider font-bold text-[#202B2E]/40">
              Or Use Device GPS
            </span>
          </div>

          {/* Primary GPS button */}
          <div>
            <button
              onClick={handleUseGps}
              disabled={isRequestingGps}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#123D45] hover:bg-[#1a4e57] text-white font-bold transition shadow-md shadow-[#123D45]/20 group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 group-hover:bg-white/20 transition">
                  <Navigation className="w-5 h-5 text-[#F7D889]" />
                </div>
                <div className="text-left">
                  <div className="text-sm">Use Phone's Real GPS</div>
                  <div className="text-xs text-white/70 font-normal">
                    Auto-detect latitude & longitude with browser permission
                  </div>
                </div>
              </div>
              {isRequestingGps ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : currentLocation.isGps ? (
                <CheckCircle2 className="w-5 h-5 text-[#F7D889]" />
              ) : (
                <span className="text-xs text-[#F7D889] font-semibold">Enable</span>
              )}
            </button>
          </div>

          {/* Example Addresses to try */}
          <div>
            <div className="text-xs font-bold text-[#123D45] uppercase tracking-wide mb-2.5">
              Sample Addresses to Test
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_ADDRESS_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => handleSelectExample(ex)}
                  className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition ${
                    currentLocation.name === ex.label
                      ? 'bg-[#123D45] text-white border-[#123D45]'
                      : 'bg-white border-[#123D45]/10 text-[#202B2E] hover:border-[#F47B54] hover:text-[#F47B54]'
                  }`}
                >
                  <div className="font-bold truncate">{ex.name}</div>
                  <div className="text-[11px] opacity-75 truncate">{ex.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-[#123D45]/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-[#202B2E] text-xs font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
