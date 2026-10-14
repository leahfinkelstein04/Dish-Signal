import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Restaurant, UserLocation } from '../types';
import { LocateFixed, Navigation } from 'lucide-react';

interface InteractiveMapProps {
  restaurants: Restaurant[];
  userLocation: UserLocation;
  selectedRestaurant: Restaurant | null;
  onSelectRestaurant: (restaurant: Restaurant) => void;
  onInspectRestaurant: (restaurant: Restaurant) => void;
  radiusMiles: number;
  mobileView?: 'list' | 'map';
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  restaurants,
  userLocation,
  selectedRestaurant,
  onSelectRestaurant,
  onInspectRestaurant,
  radiusMiles,
  mobileView,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default leaflet icons if any are referenced
    try {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    } catch {}

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        zoomControl: false,
      });

      // Standard, ultra-reliable OpenStreetMap tiles with retina support
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Use ResizeObserver so that any container size changes trigger invalidateSize immediately
    const resizeObserver = new ResizeObserver(() => {
      map?.invalidateSize();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const timers = [
      setTimeout(() => map?.invalidateSize(), 100),
      setTimeout(() => map?.invalidateSize(), 300),
      setTimeout(() => map?.invalidateSize(), 600),
    ];

    return () => {
      resizeObserver.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  // When mobileView changes (e.g. user toggles between list & map), invalidate size so tiles render immediately
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [mobileView]);

  // Update User Location, Recenter Map, & Update Radius Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = L.divIcon({
      className: 'user-gps-pin',
      html: `<div class="custom-user-marker" title="Your Address: ${userLocation.name}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const uMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    uMarker.bindTooltip(`📍 Address: ${userLocation.name}`, {
      permanent: false,
      direction: 'top',
    });
    userMarkerRef.current = uMarker;

    // Search Radius boundary circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove();
    }
    const meters = radiusMiles * 1609.344;
    const circle = L.circle([userLocation.lat, userLocation.lng], {
      radius: meters,
      color: '#123D45',
      weight: 2,
      opacity: 0.45,
      fillColor: '#F7D889',
      fillOpacity: 0.08,
      dashArray: '5, 8',
    }).addTo(map);
    radiusCircleRef.current = circle;

    // Pan & zoom appropriately for the selected radius
    if (restaurants.length === 0) {
      const zoom = radiusMiles <= 1 ? 15 : radiusMiles <= 3 ? 14 : radiusMiles <= 5 ? 13 : radiusMiles <= 10 ? 12 : 10;
      map.setView([userLocation.lat, userLocation.lng], zoom);
    }
  }, [userLocation, radiusMiles]);

  // Update Restaurant Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);

    restaurants.forEach((r, index) => {
      const isSelected = selectedRestaurant?.id === r.id;
      const isVerified = r.verificationStatus === 'VERIFIED_MENU';

      const markerHtml = `
        <div class="custom-dish-marker ${isSelected ? 'active' : ''}" style="width: 34px; height: 34px; font-size: 12px; background-color: ${
        isSelected ? '#F47B54' : isVerified ? '#123D45' : '#735F32'
      };">
          <span>${index + 1}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'dish-marker-wrapper',
        html: markerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([r.lat, r.lng], { icon: customIcon }).addTo(map);

      // Create Custom Popup Content
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-3.5 max-w-[270px] text-left';
      popupDiv.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background-color: ${
            isVerified ? '#dcfce7' : '#fef3c7'
          }; color: ${isVerified ? '#166534' : '#92400e'};">
            ${isVerified ? '✓ Verified Menu' : 'Suggested Match'}
          </span>
          <span style="font-size: 11px; font-weight: 700; color: #123D45;">
            ${r.distanceMiles} mi away
          </span>
        </div>
        <div style="font-family: Fraunces, Georgia, serif; font-size: 15px; font-weight: 700; color: #123D45; line-height: 1.2; margin-bottom: 2px;">
          ${r.name}
        </div>
        <div style="font-size: 10px; font-weight: 600; color: #777; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          ${r.placeType || r.cuisine}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #F47B54; margin-bottom: 4px;">
          ${(() => {
            const lower = (r.dishName + ' ' + (r.itemCategory || '') + ' ' + (r.placeType || '')).toLowerCase();
            if (lower.includes('matcha') || lower.includes('tea') || lower.includes('boba')) return '🍵';
            if (lower.includes('coffee') || lower.includes('latte') || lower.includes('espresso') || lower.includes('brew')) return '☕';
            if (lower.includes('croissant') || lower.includes('bakery') || lower.includes('pastry') || lower.includes('bun')) return '🥐';
            return '🍽️';
          })()} ${r.dishName} <span style="font-weight: 600; color: #123D45; background-color: #FFF9EF; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(18,61,69,0.15);">${r.dishPrice}</span>
        </div>
        <div style="font-size: 11px; color: #555; margin-bottom: 8px; line-height: 1.3;">
          ${r.address}
        </div>
        <div style="display: flex; gap: 6px;">
          <a href="${r.directionsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background-color: #123D45; color: white; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none;">
            Directions
          </a>
          <button id="inspect-btn-${r.id}" style="text-align: center; background-color: #FFF9EF; border: 1px solid #123D45; color: #123D45; padding: 6px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer;">
            Inspect
          </button>
        </div>
      `;

      // Attach inspect button handler in popup
      setTimeout(() => {
        const btn = document.getElementById(`inspect-btn-${r.id}`);
        if (btn) {
          btn.onclick = () => onInspectRestaurant(r);
        }
      }, 50);

      marker.bindPopup(popupDiv);

      marker.on('click', () => {
        onSelectRestaurant(r);
      });

      markersRef.current[r.id] = marker;
      bounds.extend([r.lat, r.lng]);
    });

    // Auto-fit bounds if we have restaurants
    if (restaurants.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      const zoom = radiusMiles <= 1 ? 15 : radiusMiles <= 3 ? 14 : radiusMiles <= 5 ? 13 : radiusMiles <= 10 ? 12 : 10;
      map.setView([userLocation.lat, userLocation.lng], zoom);
    }
  }, [restaurants, radiusMiles, userLocation]);

  // React to selected restaurant change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedRestaurant) return;

    const marker = markersRef.current[selectedRestaurant.id];
    if (marker) {
      map.flyTo([selectedRestaurant.lat, selectedRestaurant.lng], 15, {
        duration: 0.8,
      });
      marker.openPopup();
    }
  }, [selectedRestaurant]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([userLocation.lat, userLocation.lng], 13);
  };

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-3xl overflow-hidden shadow-lg border border-[#123D45]/15 bg-[#f1ede3]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />

      {/* Recenter & Map Controls Overlay */}
      <div className="absolute bottom-4 right-4 z-400 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-[#123D45]/15 hover:border-[#F47B54] text-[#123D45] text-xs font-bold transition hover:shadow-lg active:scale-95"
          title="Recenter to my address"
        >
          <LocateFixed className="w-4 h-4 text-[#F47B54]" />
          <span>Center My Location</span>
        </button>
      </div>

      {/* Legend Badge */}
      <div className="absolute top-4 left-4 z-400 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-md border border-[#123D45]/10 flex items-center gap-3 text-[11px] font-bold text-[#123D45]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#123D45]" />
          <span>Verified Menu</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#735F32]" />
          <span>Suggested</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
          <span>Your Address</span>
        </div>
      </div>
    </div>
  );
};
