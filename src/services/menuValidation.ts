// DishSignal Server-Side Menu Evidence & Anti-Fabrication Validation Engine
// Strictly enforces accuracy: No AI hallucinations, no fake citations, no estimated prices,
// and zero tolerance for mismatched restaurant-dish records.

import { DishInterpretation, VerifiedMenuEvidence, MatchType } from '../types';

export interface RawCandidate {
  id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMiles?: number;
  dishName?: string;
  actualMenuWording?: string;
  dishDescription?: string;
  dishPrice?: string | null;
  verificationStatus?: 'VERIFIED_MENU' | 'UNVERIFIED_SUGGESTION' | string;
  verificationSource?: string;
  matchType?: MatchType | string;
  matchExplanation?: string;
  evidenceUrl?: string | null;
  evidenceSummary?: string;
  menuUrl?: string | null;
  cuisine?: string;
  placeType?: string;
  itemCategory?: 'food' | 'coffee' | 'matcha' | 'bakery' | 'beverage';
  priceLevel?: string;
  rating?: number;
  reviewCount?: number;
  mapsUrl?: string;
  directionsUrl?: string;
  phone?: string | null;
  highlights?: string[];
  dietaryNotes?: string[];
  menuEvidence?: VerifiedMenuEvidence | null;
}

export interface ValidationOutcome {
  isValid: boolean;
  status: 'VERIFIED_MENU' | 'UNVERIFIED_SUGGESTION';
  matchType: MatchType;
  actualMenuWording: string;
  dishPrice: string | null;
  sanitizedSource: string;
  evidenceSummary: string;
  evidenceUrl: string | null;
  menuEvidence: VerifiedMenuEvidence | null;
  matchExplanation: string;
  rejectionReason?: string;
}

// Banned fake source citations that were previously used as synthetic cover
const BANNED_FAKED_CITATIONS = [
  'local physical venue registry',
  'local physical venue registry & direct menu',
  'physical venue registry',
  'direct registry',
  'verified by ai',
  'ai verified',
  'gemini',
];

/**
 * Normalizes text for lenient keyword matching (lowercased, stripped punctuation, normalized whitespace)
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates that a numeric price was actually found in the retrieved menu text.
 * Never allows estimated or fabricated prices.
 */
export function validatePriceAgainstEvidence(
  priceCandidate: string | null | undefined,
  evidenceText: string | null | undefined
): string | null {
  if (!priceCandidate || typeof priceCandidate !== 'string') return null;

  const trimmed = priceCandidate.trim();
  if (!trimmed || trimmed === 'Price on menu' || trimmed.toLowerCase() === 'unlisted') {
    return null;
  }

  // Reject price ranges like "$6 - $16" or estimated phrases
  if (trimmed.includes('-') || /estimate|approx|average|\$/i.test(trimmed) && trimmed.length > 10) {
    // If it's a range like "$6 - $16", reject it
    if (trimmed.includes('-')) return null;
  }

  // Extract clean number from price candidate (e.g. "$16.00" -> "16", "16.00")
  const numMatch = trimmed.match(/(\d+(?:\.\d{2})?)/);
  if (!numMatch) return null;

  const numericValue = numMatch[1];
  const wholeValue = numericValue.split('.')[0];

  // If we have actual evidence text, verify the number appears in the evidence
  if (evidenceText) {
    const cleanEvidence = normalizeText(evidenceText);
    const hasExact = cleanEvidence.includes(numericValue);
    const hasWhole = cleanEvidence.includes(wholeValue);

    if (hasExact || hasWhole) {
      return trimmed.startsWith('$') ? trimmed : `$${trimmed}`;
    }
    // Number was not present in the retrieved evidence text -> REJECT fabricated price
    return null;
  }

  // If no evidence text exists at all, we cannot prove this price
  return null;
}

/**
 * Checks if a restaurant cuisine / identity has an obvious mismatch with the dish
 * (e.g. Japanese/sushi restaurant selling "Wood-fired Margherita Pizza" without proof)
 */
export function isCuisineBlatantMismatch(
  restaurantName: string,
  cuisine: string | undefined,
  dishCanonical: string
): boolean {
  const normName = normalizeText(restaurantName);
  const normCuisine = normalizeText(cuisine || '');
  const normDish = normalizeText(dishCanonical);

  // Pizza craving vs Japanese/Sushi restaurant
  if (normDish.includes('pizza') || normDish.includes('margherita') || normDish.includes('calzone')) {
    if (
      (normName.includes('sake cafe') || normName.includes('sushi') || normName.includes('ramen') || normName.includes('teriyaki') || normName.includes('hibachi')) ||
      (normCuisine.includes('sushi') || normCuisine.includes('japanese'))
    ) {
      return true;
    }
  }

  // Sushi craving vs Pizzeria / Mexican taqueria
  if (normDish.includes('sushi') || normDish.includes('sashimi') || normDish.includes('nigiri') || normDish.includes('crispy rice')) {
    if (
      normName.includes('pizzeria') || normName.includes('pizza') || normName.includes('taqueria') ||
      normCuisine.includes('pizza') || normCuisine.includes('mexican')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Validates that retrieved menu evidence explicitly mentions the requested dish or accepted variation.
 */
export function verifyDishInEvidence(
  dishCanonical: string,
  searchVariations: string[],
  evidenceText: string
): { found: boolean; matchedWording?: string } {
  if (!evidenceText) return { found: false };

  const normEvidence = normalizeText(evidenceText);
  const normCanonical = normalizeText(dishCanonical);

  if (normEvidence.includes(normCanonical)) {
    return { found: true, matchedWording: dishCanonical };
  }

  for (const variation of searchVariations) {
    const normVar = normalizeText(variation);
    if (normVar && normEvidence.includes(normVar)) {
      return { found: true, matchedWording: variation };
    }
  }

  // Also check significant word combinations (e.g. "margherita" and "pizza")
  const words = normCanonical.split(/\s+/).filter((w) => w.length > 2);
  if (words.length >= 2 && words.every((w) => normEvidence.includes(w))) {
    return { found: true, matchedWording: dishCanonical };
  }

  // Also check if primary distinctive word (e.g. "margherita" for "Margherita Pizza") is in evidence
  const primaryDescriptor = normCanonical.replace(/\b(pizza|soup|latte|wrap|salad|pasta|sandwich)\b/g, '').trim();
  if (primaryDescriptor.length >= 4 && normEvidence.includes(primaryDescriptor)) {
    return { found: true, matchedWording: dishCanonical };
  }

  return { found: false };
}

/**
 * Validates the Restaurant-Dish Connection to prevent cross-contamination.
 * Verifies that the menu evidence belongs to THIS restaurant and not a neighbor.
 */
export function validateRestaurantIdentityOnEvidence(
  restaurantName: string,
  restaurantAddress: string,
  evidence: VerifiedMenuEvidence | null | undefined
): { matches: boolean; reason?: string } {
  if (!evidence) {
    return { matches: false, reason: 'No menu evidence attached.' };
  }

  if (evidence.restaurantName) {
    const normCandName = normalizeText(restaurantName);
    const normEvName = normalizeText(evidence.restaurantName);

    // If evidence explicitly names a DIFFERENT establishment (e.g. Pizza Domenica vs Sake Cafe)
    const candWords = normCandName.split(/\s+/).filter((w) => w.length > 3);
    const evWords = normEvName.split(/\s+/).filter((w) => w.length > 3);

    const hasCommonSignificantWord = candWords.some((w) => evWords.includes(w));
    if (!hasCommonSignificantWord && candWords.length > 0 && evWords.length > 0) {
      return {
        matches: false,
        reason: `Menu source restaurant mismatch: Evidence belongs to "${evidence.restaurantName}", not candidate "${restaurantName}".`,
      };
    }
  }

  return { matches: true };
}

/**
 * Validates whether a source URL is genuine, resolvable, and not a generic map/search link.
 */
export function validateSourceUrl(url: string | null | undefined): {
  isValid: boolean;
  sourceType: 'Official Website' | 'Online Menu' | 'Uber Eats' | 'Toast POS' | 'DoorDash';
} {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { isValid: false, sourceType: 'Official Website' };
  }

  // Generic Google Maps queries are NOT proof of a specific menu
  if (url.includes('google.com/maps/search') || url.includes('maps.google.com/?q=')) {
    return { isValid: false, sourceType: 'Online Menu' };
  }

  let sourceType: 'Official Website' | 'Online Menu' | 'Uber Eats' | 'Toast POS' | 'DoorDash' = 'Official Website';
  if (url.includes('ubereats.com')) sourceType = 'Uber Eats';
  else if (url.includes('toasttab.com')) sourceType = 'Toast POS';
  else if (url.includes('doordash.com')) sourceType = 'DoorDash';
  else if (url.includes('menu')) sourceType = 'Online Menu';

  return { isValid: true, sourceType };
}

/**
 * Master Server-Side Validator for Candidate Dishes.
 * Evaluates candidate data, validates evidence, rejects AI hallucinations,
 * and strips estimated prices or fake citations.
 */
export function validateCandidateRecord(
  candidate: RawCandidate,
  interpretation: DishInterpretation
): ValidationOutcome {
  const normDish = normalizeText(interpretation.canonicalDish);
  const normCandDish = normalizeText(candidate.dishName || candidate.actualMenuWording || '');

  // 1. Check for banned fake source citations
  const rawSource = (candidate.verificationSource || '').toLowerCase().trim();
  const isBannedSource = BANNED_FAKED_CITATIONS.some((b) => rawSource.includes(b));

  // 2. Validate URL
  const targetUrl = candidate.evidenceUrl || candidate.menuUrl || null;
  const urlValidation = validateSourceUrl(targetUrl);

  // 3. Check for blatant cuisine mismatch (e.g. Sake Cafe matched to Margherita pizza)
  const isMismatch = isCuisineBlatantMismatch(
    candidate.name,
    candidate.cuisine || candidate.placeType,
    interpretation.canonicalDish
  );

  // 4. Check for attached menu evidence
  let evidence = candidate.menuEvidence || null;
  let evidenceText = evidence?.retrievedText || candidate.evidenceSummary || '';

  // If evidence summary contains banned citation words or generic placeholder text, invalidate it
  if (
    evidenceText.toLowerCase().includes('verified physical establishment located within search radius') ||
    evidenceText.toLowerCase().includes('handcrafted preparation matching craving')
  ) {
    evidenceText = '';
    evidence = null;
  }

  // 5. Cross-contamination check: Ensure evidence belongs to this restaurant
  const identityCheck = validateRestaurantIdentityOnEvidence(
    candidate.name,
    candidate.address,
    evidence
  );

  if (!identityCheck.matches) {
    // Cross-contamination detected! Reject verified status immediately.
    return {
      isValid: false,
      status: 'UNVERIFIED_SUGGESTION',
      matchType: 'UNVERIFIED',
      actualMenuWording: candidate.dishName || interpretation.canonicalDish,
      dishPrice: null, // Never carry over a price from a mismatched restaurant
      sanitizedSource: 'Unverified Listing',
      evidenceSummary: identityCheck.reason || 'Evidence belongs to a different establishment.',
      evidenceUrl: null,
      menuEvidence: null,
      matchExplanation: 'Unverified: Evidence source does not match this establishment.',
      rejectionReason: identityCheck.reason,
    };
  }

  // 6. Check if dish is explicitly supported by retrieved menu evidence
  const dishCheck = verifyDishInEvidence(
    interpretation.canonicalDish,
    interpretation.searchVariations,
    evidenceText
  );

  // 7. Validate price against evidence
  const validatedPrice = validatePriceAgainstEvidence(candidate.dishPrice, evidenceText);

  // DECISION LOGIC: Can this result be labeled VERIFIED_MENU?
  // MUST have:
  // - No blatant cuisine mismatch (unless strong explicit menu evidence exists)
  // - Genuine verifiable source URL (not generic maps search)
  // - Not a banned fake citation
  // - Evidence text explicitly confirming the dish
  // - Identity match confirmed

  const canBeVerified =
    !isBannedSource &&
    urlValidation.isValid &&
    !isMismatch &&
    dishCheck.found &&
    evidenceText.length > 0;

  if (canBeVerified) {
    const verifiedEvidenceObj: VerifiedMenuEvidence = {
      retrievedText: evidenceText,
      sourceUrl: targetUrl!,
      sourceType: urlValidation.sourceType,
      retrievalStatus: 'SUCCESS',
      dateChecked: evidence?.dateChecked || new Date().toISOString(),
      actualPrice: validatedPrice,
      restaurantName: candidate.name,
      restaurantAddress: candidate.address,
    };

    const actualWording = dishCheck.matchedWording || candidate.actualMenuWording || candidate.dishName || interpretation.canonicalDish;

    return {
      isValid: true,
      status: 'VERIFIED_MENU',
      matchType: 'EXACT_OR_EQUIVALENT',
      actualMenuWording: actualWording,
      dishPrice: validatedPrice,
      sanitizedSource: candidate.verificationSource && !isBannedSource
        ? candidate.verificationSource
        : `${urlValidation.sourceType} Menu`,
      evidenceSummary: evidenceText,
      evidenceUrl: targetUrl,
      menuEvidence: verifiedEvidenceObj,
      matchExplanation: `Verified menu match: Confirmed on ${candidate.name}'s active menu as "${actualWording}"${validatedPrice ? ` (${validatedPrice})` : ''}.`,
    };
  }

  // If it's a blatant cuisine mismatch with NO real menu evidence (like Sake Cafe + Margherita Pizza)
  if (isMismatch && !dishCheck.found) {
    return {
      isValid: false,
      status: 'UNVERIFIED_SUGGESTION',
      matchType: 'UNVERIFIED',
      actualMenuWording: interpretation.canonicalDish,
      dishPrice: null,
      sanitizedSource: 'Menu Unavailable',
      evidenceSummary: `No menu evidence found for "${interpretation.canonicalDish}" at ${candidate.name} (${candidate.cuisine || 'different cuisine'}).`,
      evidenceUrl: null,
      menuEvidence: null,
      matchExplanation: `Unverified: ${candidate.name} is a ${candidate.cuisine || 'venue'} with no menu evidence for ${interpretation.canonicalDish}.`,
      rejectionReason: `Blatant category mismatch: ${candidate.name} does not serve ${interpretation.canonicalDish}.`,
    };
  }

  // Otherwise, it's an unverified candidate: Do NOT label VERIFIED_MENU, do NOT estimate prices, do NOT use fake sources
  const fallbackWording = candidate.actualMenuWording || candidate.dishName || interpretation.canonicalDish;

  return {
    isValid: true, // Still a discovered physical spot, but strictly unverified
    status: 'UNVERIFIED_SUGGESTION',
    matchType: 'UNVERIFIED',
    actualMenuWording: fallbackWording,
    dishPrice: validatedPrice, // will be null if not in evidence
    sanitizedSource: 'Pending Menu Verification',
    evidenceSummary: 'Menu details unconfirmed from active digital source.',
    evidenceUrl: urlValidation.isValid ? targetUrl : null,
    menuEvidence: null,
    matchExplanation: `Possible match: Menu unavailable or unverified for "${fallbackWording}". Call venue to confirm.`,
    rejectionReason: !dishCheck.found
      ? 'Dish not found in retrieved menu text.'
      : isBannedSource
      ? 'Banned synthetic citation detected.'
      : !urlValidation.isValid
      ? 'No valid direct menu URL provided.'
      : undefined,
  };
}
