import React, { useState } from 'react';
import { X, Navigation, MapPin, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserLocation } from '../types';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onSelectLocation: (loc: UserLocation) => void;
}

const POPULAR_ADDRESS_EXAMPLES = [
  { label: '350 5th Ave, New York, NY', name: 'Empire State Building, NY', lat: 40.7484, lng: -73.9857 },
  { label: '100 Pine St, San Francisco, CA', name: 'Financial District, SF', lat: 37.7925, lng: -122.4001 },
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

  if (!isOpen) return null;

  const handleUseGps = () => {
    setErrorMsg(null);
    if (!('geolocation' in navigator)) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsRequestingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsRequestingGps(false);
        const { latitude, longitude, accuracy } = position.coords;
        onSelectLocation({
          lat: latitude,
          lng: longitude,
          name: 'Current GPS Location',
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
            <div className="relative">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="e.g. 350 5th Ave, New York, NY or 100 Market St, SF"
                className="w-full pl-10 pr-24 py-3.5 rounded-2xl bg-white border border-[#123D45]/20 focus:border-[#F47B54] focus:outline-hidden text-sm text-[#202B2E] placeholder:text-[#202B2E]/40"
              />
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#F47B54]" />
              <button
                type="submit"
                disabled={isGeocoding || !addressInput.trim()}
                className="absolute right-1.5 top-1.5 px-4 py-2 rounded-xl bg-[#F47B54] hover:bg-[#e0663f] disabled:opacity-50 text-white font-bold text-xs shadow-xs transition"
              >
                {isGeocoding ? 'Finding...' : 'Set Address'}
              </button>
            </div>
            <p className="text-[11px] text-[#202B2E]/60 pl-1">
              Tip: You can enter an exact address, building name, or intersection.
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
