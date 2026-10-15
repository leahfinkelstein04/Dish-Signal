export type VenueCategory = 'all' | 'food' | 'coffee' | 'matcha' | 'bakery';

export type MatchType = 'EXACT_OR_EQUIVALENT' | 'SIMILAR' | 'UNVERIFIED';

export interface DishInterpretation {
  originalQuery: string;
  canonicalDish: string;
  isSpellingCorrected: boolean;
  didYouMean?: string | null;
  category: 'food' | 'coffee' | 'matcha' | 'bakery' | 'beverage';
  coreIngredients: string[];
  keyModifiers: string[];
  searchVariations: string[];
  similarDishesToDistinguish: string[];
  explanation: string;
}

export interface VerifiedMenuEvidence {
  retrievedText: string;
  sourceUrl: string;
  sourceType: 'Official Website' | 'Online Menu' | 'Uber Eats' | 'Toast POS' | 'DoorDash';
  retrievalStatus: 'SUCCESS' | 'UNRETRIEVED' | 'NOT_FOUND_ON_MENU';
  dateChecked: string;
  actualPrice: string | null;
  restaurantName: string;
  restaurantAddress: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMiles: number;
  dishName: string;
  actualMenuWording: string;
  dishDescription: string;
  dishPrice: string | null;
  verificationStatus: 'VERIFIED_MENU' | 'UNVERIFIED_SUGGESTION';
  verificationSource: string;
  matchType: MatchType;
  matchExplanation: string;
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
  menuEvidence?: VerifiedMenuEvidence | null;
}

export interface VisitedWebsiteAudit {
  restaurantName: string;
  websiteUrl: string;
  sourceType: 'Official Website' | 'Online Menu' | 'Uber Eats' | 'Toast POS' | 'DoorDash' | 'Google Places / Registry';
  parseStatus: 'PARSED_SUCCESS' | 'SKIPPED_NO_MENU' | 'PARSED_PARTIAL' | 'UNAVAILABLE';
  reasonOrDetails: string;
  itemsDiscoveredCount: number;
  responseTimeMs?: number;
}

export interface PipelineStep {
  step: string;
  status: 'completed' | 'in_progress' | 'skipped';
  details: string;
}

export interface SearchDiagnostics {
  candidatesEvaluated: number;
  menusChecked: number;
  verifiedCount: number;
  unverifiedCount: number;
  exactMatchCount: number;
  similarMatchCount: number;
  dishVariationsSearched: string[];
  neighborhoodsCovered: string[];
  searchMethod: string;
  apiStatus: string;
  hasMoreToSearch: boolean;
  page: number;
  radiusMiles?: number;
  radiusMeters?: number;
  interpretation?: DishInterpretation;
  visitedWebsites?: VisitedWebsiteAudit[];
  pipelineSteps?: PipelineStep[];
  geoAccuracy?: {
    resolvedCity: string;
    coordinates: { lat: number; lng: number };
    radiusMiles: number;
  };
}

export interface SearchResponse {
  query: string;
  interpretation: DishInterpretation;
  locationName: string;
  userLocation: {
    lat: number;
    lng: number;
  };
  radiusMiles: number;
  totalCount: number;
  exactCount: number;
  similarCount: number;
  verifiedCount: number;
  unverifiedCount: number;
  restaurants: Restaurant[];
  diagnostics: SearchDiagnostics;
}

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  isGps: boolean;
  accuracyMeters?: number;
}

export interface AddressSuggestion {
  label: string;
  primaryText: string;
  secondaryText: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  zip?: string;
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

