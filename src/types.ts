export type VenueCategory = 'all' | 'food' | 'coffee' | 'matcha' | 'bakery';

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  dishName: string;
  dishDescription: string;
  dishPrice: string;
  verificationStatus: 'VERIFIED_MENU' | 'UNVERIFIED_SUGGESTION';
  verificationSource: string;
  evidenceUrl?: string | null;
  evidenceSummary?: string;
  matchedVariation?: string;
  cuisine: string;
  priceLevel: string;
  rating: number;
  reviewCount: number;
  menuUrl: string | null;
  mapsUrl: string;
  directionsUrl: string;
  phone: string | null;
  highlights: string[];
  dietaryNotes: string[];
  placeType?: string; // e.g. "Coffee Shop", "Matcha Café", "Bakery & Café", "Restaurant", "Tea House"
  itemCategory?: 'food' | 'coffee' | 'matcha' | 'bakery' | 'beverage';
}

export interface SearchDiagnostics {
  candidatesEvaluated: number;
  menusChecked: number;
  verifiedCount: number;
  unverifiedCount: number;
  dishVariationsSearched: string[];
  neighborhoodsCovered: string[];
  searchMethod: string;
  apiStatus: string;
  hasMoreToSearch: boolean;
  page: number;
}

export interface SearchResponse {
  query: string;
  locationName: string;
  userLocation: {
    lat: number;
    lng: number;
  };
  radiusMiles: number;
  totalCount: number;
  verifiedCount: number;
  unverifiedCount: number;
  restaurants: Restaurant[];
  groundingChunksCount: number;
  diagnostics?: SearchDiagnostics;
}

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  isGps: boolean;
  accuracyMeters?: number;
}

export interface DishInspection {
  dishTitle: string;
  culinaryBreakdown: string;
  dietaryTags: string[];
  idealPairing: string;
  guestVerdict: string;
  confidenceScore: number;
  alternateVariations: string[];
}
