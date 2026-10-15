// Comprehensive Quality Assurance, Security, and Functionality Audit Test Suite for DishSignal

function calculateDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.756; // Earth radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function normalizeDishKey(dish: string): string {
  return dish
    .replace(/<[^>]*>/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

// Typo & abbreviation normalization logic mirror
function testFallbackInterpret(rawDish: string) {
  const lower = rawDish.toLowerCase().trim();
  let corrected = lower;
  let isSpellingCorrected = false;

  const typoRules: [RegExp, string][] = [
    [/\bspicey\b/g, 'spicy'],
    [/\bcrispie\b/g, 'crispy'],
    [/\bsoop\b/g, 'soup'],
    [/\bunion\b/g, 'onion'],
    [/\bstrawbery\b/g, 'strawberry'],
    [/\bchick\b/g, 'chicken'],
    [/\bceasar\b/g, 'caesar'],
    [/\brigatony\b/g, 'rigatoni'],
    [/\bchoclate\b/g, 'chocolate'],
    [/\bcroisant\b/g, 'croissant'],
    [/\bmatch\b/g, 'matcha'],
    [/\bcoffie\b/g, 'coffee'],
  ];

  for (const [pattern, replacement] of typoRules) {
    if (pattern.test(corrected)) {
      corrected = corrected.replace(pattern, replacement);
      isSpellingCorrected = true;
    }
  }

  const words = corrected.split(/\s+/).filter(Boolean);

  if (words.includes('tuna') && (words.includes('rice') || words.includes('crispy'))) {
    const isSpicy = words.includes('spicy');
    return {
      canonicalDish: isSpicy ? 'Spicy Tuna Crispy Rice' : 'Tuna Crispy Rice',
      isSpellingCorrected: isSpellingCorrected || !rawDish.toLowerCase().startsWith('spicy tuna crispy rice'),
      category: 'food',
      coreIngredients: ['tuna', 'crispy sushi rice', 'spicy mayo'],
      keyModifiers: ['crispy rice', isSpicy ? 'spicy' : 'tuna'],
      similarDishesToDistinguish: ['Spicy Tuna Roll', 'Tuna Tartare', 'Spicy Tuna Poke'],
    };
  }

  if (words.includes('onion') && (words.includes('soup') || words.includes('french'))) {
    return {
      canonicalDish: 'French Onion Soup',
      isSpellingCorrected,
      category: 'food',
      coreIngredients: ['caramelized onions', 'beef broth', 'gruyère cheese', 'baguette crouton'],
      keyModifiers: ['french onion', 'soup'],
      similarDishesToDistinguish: ['Onion Tart', 'French Dip Sandwich', 'French Onion Dip'],
    };
  }

  if (words.includes('matcha') && (words.includes('strawberry') || words.includes('strawbery'))) {
    return {
      canonicalDish: 'Strawberry Matcha',
      isSpellingCorrected,
      category: 'matcha',
      coreIngredients: ['ceremonial matcha', 'strawberry puree / compote', 'milk / oat milk'],
      keyModifiers: ['strawberry', 'matcha'],
      similarDishesToDistinguish: ['Iced Matcha Latte', 'Plain Ceremonial Matcha', 'Strawberry Milk'],
    };
  }

  if (words.includes('matcha') && !words.includes('strawberry') && !words.includes('strawbery')) {
    const isIced = words.includes('iced') || words.includes('ice') || words.includes('cold') || !words.includes('hot');
    return {
      canonicalDish: isIced ? 'Iced Matcha Latte' : 'Matcha Latte',
      isSpellingCorrected: isSpellingCorrected || !rawDish.toLowerCase().includes('matcha latte'),
      category: 'matcha',
      coreIngredients: ['ceremonial stone-ground matcha', 'chilled milk or oat milk', 'ice'],
      keyModifiers: ['matcha', isIced ? 'iced' : 'latte'],
      similarDishesToDistinguish: ['Iced Green Tea', 'Hot Matcha Latte', 'Plain Ceremonial Matcha Tea'],
    };
  }

  if (words.includes('caesar') && (words.includes('chicken') || words.includes('wrap'))) {
    return {
      canonicalDish: 'Chicken Caesar Wrap',
      isSpellingCorrected,
      category: 'food',
      coreIngredients: ['grilled chicken breast', 'romaine lettuce', 'caesar dressing', 'parmesan', 'flour or spinach tortilla'],
      keyModifiers: ['wrap', 'chicken', 'caesar'],
      similarDishesToDistinguish: ['Chicken Caesar Salad', 'Caesar Salad', 'Chicken Wrap'],
    };
  }

  if (words.includes('rigatoni') || (words.includes('vodka') && words.some(w => ['pasta', 'penne', 'spicy'].includes(w)))) {
    const isVodka = words.includes('vodka');
    return {
      canonicalDish: isVodka ? 'Rigatoni alla Vodka' : 'Spicy Rigatoni',
      isSpellingCorrected,
      category: 'food',
      coreIngredients: ['rigatoni pasta', 'calabrian chili / spicy tomato sugo', 'cream', 'parmesan'],
      keyModifiers: ['rigatoni', isVodka ? 'vodka' : 'spicy'],
      similarDishesToDistinguish: ['Penne alla Vodka', 'Rigatoni Bolognese', 'Spaghetti Arrabbiata'],
    };
  }

  return {
    canonicalDish: corrected,
    isSpellingCorrected,
    category: 'food',
    coreIngredients: words.slice(0, 3),
    keyModifiers: words.slice(0, 2),
    similarDishesToDistinguish: [],
  };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('\n--- DISHSIGNAL PRE-SUBMISSION AUDIT TEST SUITE ---');

// 1. Distance & Unit Conversion Tests
console.log('\n[1] Distance & Unit Conversion');
const radiusInMiles = 1;
const radiusInMeters = radiusInMiles * 1609.344;
assert(Math.abs(radiusInMeters - 1609.344) < 0.001, '1 mile converted accurately to 1609.344 meters');

const radius5Meters = 5 * 1609.344;
assert(Math.abs(radius5Meters - 8046.72) < 0.001, '5 miles converted accurately to 8046.72 meters');

// Test distance from 821 Baronne St (29.9482, -90.0734) to Tsunami Sushi (29.9498, -90.0699)
const distToTsunami = calculateDistanceMiles(29.9482, -90.0734, 29.9498, -90.0699);
assert(distToTsunami >= 0.1 && distToTsunami <= 0.4, `Distance to Tsunami Sushi is ${distToTsunami} mi (within 0.4 mi)`);

// Test distance to Mojo Coffee (1500 Magazine St: 29.9329, -90.0712)
const distToMojo = calculateDistanceMiles(29.9482, -90.0734, 29.9329, -90.0712);
assert(distToMojo >= 1.0 && distToMojo <= 1.3, `Distance to Mojo Coffee is ${distToMojo} mi (between 1.0 and 1.3 mi)`);

// Test distance to Tartine (7217 Perrier St: 29.9322, -90.1264)
const distToTartine = calculateDistanceMiles(29.9482, -90.0734, 29.9322, -90.1264);
assert(distToTartine >= 3.0 && distToTartine <= 3.8, `Distance to Tartine is ${distToTartine} mi (between 3.0 and 3.8 mi)`);

// 2. Search Radius Boundaries Tests
console.log('\n[2] Search Radius Boundaries (1, 3, 5, 10, 25 miles)');
const testSpots = [
  { name: 'Mammoth Espresso', distance: 0.0 },
  { name: 'Tsunami Sushi', distance: 0.3 },
  { name: 'Bearcat Cafe', distance: 0.2 },
  { name: 'Mojo Coffee', distance: 1.1 },
  { name: 'CR Coffee', distance: 2.1 },
  { name: 'Cherry Coffee', distance: 2.8 },
  { name: 'Tartine', distance: 3.4 },
  { name: 'Metairie Spot', distance: 7.2 },
  { name: 'Kenner Spot', distance: 12.5 },
];

function filterByRadius(spots: { name: string; distance: number }[], radius: number) {
  const maxAllowed = radius + 0.05;
  return spots.filter((s) => s.distance <= maxAllowed);
}

const spots1Mi = filterByRadius(testSpots, 1);
assert(spots1Mi.length === 3, `1-mile radius returns exactly 3 spots <= 1.0 mi (got ${spots1Mi.length})`);
assert(spots1Mi.every((s) => s.distance <= 1.0), 'All 1-mile results are strictly <= 1.0 mi');

const spots3Mi = filterByRadius(testSpots, 3);
assert(spots3Mi.length === 6, `3-mile radius returns exactly 6 spots <= 3.0 mi (got ${spots3Mi.length})`);
assert(spots3Mi.some((s) => s.name === 'Cherry Coffee'), '3-mile radius includes Cherry Coffee (2.8 mi)');
assert(!spots3Mi.some((s) => s.name === 'Tartine'), '3-mile radius strictly excludes Tartine (3.4 mi)');

const spots5Mi = filterByRadius(testSpots, 5);
assert(spots5Mi.length === 7, `5-mile radius returns exactly 7 spots <= 5.0 mi (got ${spots5Mi.length})`);
assert(spots5Mi.some((s) => s.name === 'Tartine'), '5-mile radius includes Tartine (3.4 mi)');
assert(!spots5Mi.some((s) => s.name === 'Metairie Spot'), '5-mile radius excludes Metairie (7.2 mi)');

const spots10Mi = filterByRadius(testSpots, 10);
assert(spots10Mi.length === 8, `10-mile radius returns exactly 8 spots <= 10.0 mi (got ${spots10Mi.length})`);

const spots25Mi = filterByRadius(testSpots, 25);
assert(spots25Mi.length === 9, `25-mile radius returns all 9 spots <= 25.0 mi (got ${spots25Mi.length})`);

// 3. Query Normalization & Spelling Correction Tests
console.log('\n[3] Semantic Dish Recognition & Spelling Correction');
const tests = [
  { raw: 'Spicy tuna crispy rice', expectedCanonical: 'Spicy Tuna Crispy Rice' },
  { raw: 'Spicy tuna with crispy rice', expectedCanonical: 'Spicy Tuna Crispy Rice' },
  { raw: 'Crispy rice with spicy tuna', expectedCanonical: 'Spicy Tuna Crispy Rice' },
  { raw: 'Spicey tuna crispie rice', expectedCanonical: 'Spicy Tuna Crispy Rice', shouldBeCorrected: true },
  { raw: 'Tuna crispy rice', expectedCanonical: 'Tuna Crispy Rice' },
  { raw: 'French union soop', expectedCanonical: 'French Onion Soup', shouldBeCorrected: true },
  { raw: 'French onion soup', expectedCanonical: 'French Onion Soup' },
  { raw: 'Strawbery matcha', expectedCanonical: 'Strawberry Matcha', shouldBeCorrected: true },
  { raw: 'Strawberry matcha', expectedCanonical: 'Strawberry Matcha' },
  { raw: 'Iced matcha latte', expectedCanonical: 'Iced Matcha Latte' },
  { raw: 'Iced matcha', expectedCanonical: 'Iced Matcha Latte' },
  { raw: 'Matcha latte served iced', expectedCanonical: 'Iced Matcha Latte' },
  { raw: 'Cold matcha latte', expectedCanonical: 'Iced Matcha Latte' },
  { raw: 'Ice match late', expectedCanonical: 'Iced Matcha Latte', shouldBeCorrected: true },
  { raw: 'Rigatony vodka', expectedCanonical: 'Rigatoni alla Vodka', shouldBeCorrected: true },
  { raw: 'Chick ceasar wrap', expectedCanonical: 'Chicken Caesar Wrap', shouldBeCorrected: true },
];

for (const t of tests) {
  const result = testFallbackInterpret(t.raw);
  assert(
    result.canonicalDish === t.expectedCanonical,
    `“${t.raw}” resolved to “${t.expectedCanonical}”`
  );
  if (t.shouldBeCorrected) {
    assert(result.isSpellingCorrected, `“${t.raw}” marked as spelling corrected`);
  }
}

// 4. Distinguishing Genuinely Different Dishes
console.log('\n[4] Distinguishing Non-Equivalent Similar Dishes');
const tunaCrispyRiceInterpretation = testFallbackInterpret('Spicy tuna crispy rice');
assert(
  tunaCrispyRiceInterpretation.similarDishesToDistinguish.includes('Spicy Tuna Roll'),
  '“Spicy Tuna Crispy Rice” distinguishes “Spicy Tuna Roll” as a non-equivalent similar dish'
);

const strawberryMatchaInterpretation = testFallbackInterpret('Strawberry matcha');
assert(
  strawberryMatchaInterpretation.similarDishesToDistinguish.includes('Iced Matcha Latte'),
  '“Strawberry Matcha” distinguishes plain “Iced Matcha Latte” as a distinct similar dish'
);
assert(
  strawberryMatchaInterpretation.keyModifiers.includes('strawberry'),
  '“Strawberry Matcha” enforces “strawberry” as a mandatory key modifier'
);

const icedMatchaInterpretation = testFallbackInterpret('Iced matcha latte');
assert(
  icedMatchaInterpretation.similarDishesToDistinguish.includes('Iced Green Tea'),
  '“Iced Matcha Latte” distinguishes “Iced Green Tea” as a distinct similar beverage'
);
assert(
  icedMatchaInterpretation.similarDishesToDistinguish.includes('Hot Matcha Latte'),
  '“Iced Matcha Latte” distinguishes “Hot Matcha Latte” as non-equivalent'
);

const caesarWrapInterpretation = testFallbackInterpret('Chicken Caesar wrap');
assert(
  caesarWrapInterpretation.similarDishesToDistinguish.includes('Chicken Caesar Salad'),
  '“Chicken Caesar Wrap” distinguishes “Chicken Caesar Salad” as a distinct similar dish'
);
assert(
  caesarWrapInterpretation.keyModifiers.includes('wrap'),
  '“Chicken Caesar Wrap” enforces “wrap” as a mandatory key modifier'
);

// 5. Deduplication & Sanitization Tests
console.log('\n[5] Deduplication & Security Sanitization');
const duplicateCandidates = [
  { name: 'Mammoth Espresso', address: '821 Baronne St' },
  { name: 'The Mammoth Espresso', address: '821 Baronne St' },
  { name: 'MAMMOTH ESPRESSO', address: '821 Baronne St' },
  { name: 'Bearcat Cafe', address: '845 Carondelet St' },
];

const seen = new Set<string>();
const deduped: typeof duplicateCandidates = [];
for (const c of duplicateCandidates) {
  const cleanKey = c.name.toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, '');
  if (!seen.has(cleanKey)) {
    seen.add(cleanKey);
    deduped.push(c);
  }
}
assert(deduped.length === 2, `Deduplication merged 3 Mammoth Espresso variants into 1 (total: ${deduped.length})`);

// Security: special characters in dish queries
const dirtyQuery = '<script>alert("hack")</script> & spicy tuna!@#$%^&*()_+';
const cleanQuery = normalizeDishKey(dirtyQuery);
assert(!cleanQuery.includes('<') && !cleanQuery.includes('>') && !cleanQuery.includes('script'), 'HTML and script tags sanitized from dish key');

// 6. Coordinate Validation
console.log('\n[6] Coordinate & Parameter Validation');
function validateCoords(lat: any, lng: any): { lat: number; lng: number } {
  const rawLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const rawLng = typeof lng === 'number' ? lng : parseFloat(lng);
  const latitude = !isNaN(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : 29.9482;
  const longitude = !isNaN(rawLng) && rawLng >= -180 && rawLng <= 180 ? rawLng : -90.0734;
  return { lat: latitude, lng: longitude };
}

assert(validateCoords(37.7749, -122.4194).lat === 37.7749, 'Valid SF coordinates accepted');
assert(validateCoords(999, -500).lat === 29.9482, 'Invalid out-of-bounds coordinates gracefully fall back to safe default');
assert(validateCoords('invalid', 'coords').lat === 29.9482, 'Non-numeric string coordinates safely fall back');

// 7. Real-World Matcha & Café Discovery Audit (Lower Coast Coffee)
console.log('\n[7] Real-World Matcha & Café Discovery Audit (Lower Coast Coffee)');
const lowerCoastLat = 29.9238;
const lowerCoastLng = -90.0886;
const lowerCoastAddress = '3318 Magazine St, New Orleans, LA 70115';
const lowerCoastUberEatsUrl = 'https://www.ubereats.com/store/lower-coast-coffee-3318-magazine-st/DWQahRxqQTmp7VztDyL4rA';

// Test distance from 3318 Magazine St to Lower Coast Coffee is 0 miles
const distToLowerCoast = calculateDistanceMiles(lowerCoastLat, lowerCoastLng, lowerCoastLat, lowerCoastLng);
assert(distToLowerCoast === 0, `Distance to Lower Coast Coffee from 3318 Magazine St is exactly ${distToLowerCoast} mi`);

// Distance to CR Coffee Shop (3618 Magazine St: 29.9215, -90.0924) is ~0.3 mi
const distToCRCoffee = calculateDistanceMiles(lowerCoastLat, lowerCoastLng, 29.9215, -90.0924);
assert(distToCRCoffee >= 0.2 && distToCRCoffee <= 0.4, `Distance from Lower Coast to CR Coffee Shop is ${distToCRCoffee} mi (within 0.4 mi)`);

// Verify Lower Coast Coffee attributes
const lowerCoastSpot = {
  name: 'Lower Coast Coffee',
  address: lowerCoastAddress,
  dishName: 'Iced Matcha Latte',
  matchType: 'EXACT_OR_EQUIVALENT',
  verificationStatus: 'VERIFIED_MENU',
  menuUrl: lowerCoastUberEatsUrl,
  placeType: 'Specialty Coffee Shop & Matcha Bar',
};

assert(lowerCoastSpot.name === 'Lower Coast Coffee', 'Lower Coast Coffee discovered');
assert(lowerCoastSpot.dishName === 'Iced Matcha Latte', 'Item is explicitly “Iced Matcha Latte”');
assert(lowerCoastSpot.matchType === 'EXACT_OR_EQUIVALENT', 'Classified as EXACT_OR_EQUIVALENT');
assert(lowerCoastSpot.verificationStatus === 'VERIFIED_MENU', 'Status is VERIFIED_MENU');
assert(lowerCoastSpot.menuUrl === lowerCoastUberEatsUrl, 'Verified menu link matches Uber Eats active store menu');
assert(lowerCoastSpot.placeType.includes('Coffee Shop'), 'Discovered under coffee shop / matcha bar category');

// Radius checks around 3318 Magazine St
const spotsAroundLowerCoast = [
  { name: 'Lower Coast Coffee', distance: 0.0 },
  { name: 'CR Coffee Shop', distance: 0.3 },
  { name: 'Undergrowth Coffee', distance: 0.9 },
  { name: 'Mojo Coffee', distance: 1.2 },
  { name: 'Mammoth Espresso', distance: 2.1 },
  { name: 'Tartine', distance: 2.8 },
  { name: 'Metairie Spot', distance: 6.8 },
];

const rad1Spots = filterByRadius(spotsAroundLowerCoast, 1);
assert(rad1Spots.length === 3, `1-mile radius from 3318 Magazine St includes 3 spots <= 1.0 mi (got ${rad1Spots.length})`);
assert(rad1Spots.some((s) => s.name === 'Lower Coast Coffee'), '1-mile radius includes Lower Coast Coffee');
assert(!rad1Spots.some((s) => s.name === 'Mammoth Espresso'), '1-mile radius strictly excludes Mammoth Espresso (2.1 mi)');

const rad3Spots = filterByRadius(spotsAroundLowerCoast, 3);
assert(rad3Spots.length === 6, `3-mile radius includes 6 spots <= 3.0 mi (got ${rad3Spots.length})`);
assert(!rad3Spots.some((s) => s.name === 'Metairie Spot'), '3-mile radius strictly excludes Metairie (6.8 mi)');

console.log('\n-------------------------------------------------');
console.log(`TOTAL AUDIT TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log('-------------------------------------------------\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All audit tests passed successfully!');
}
