# DishSignal — AI-Powered Menu Discovery Radar

> **Find exactly what you're craving.**  
> Real-time semantic dish recognition, menu verification, and hyper-local restaurant radar.

DishSignal is an AI-powered culinary discovery engine that bridges the gap between what users mean and how menus are actually written. Instead of requiring exact keyword matching, DishSignal interprets the culinary essence of any craving, generates authentic menu synonyms, checks real menus within a precise user-selected radius, and presents verified dishes alongside an interactive map.

---

## 🌟 Key Features

### 1. Intelligent Dish & Beverage Recognition (Gemini AI)
- **General-Purpose Semantic Understanding**: Interprets any craving across food, third-wave coffee, ceremonial matcha, and artisan bakeries.
- **Typo Tolerance & Spelling Correction**: Recognizes obvious misspellings (e.g., `"french union soop"` → `"French Onion Soup"`, `"strawbery matcha"` → `"Strawberry Matcha"`, `"rigatony vodka"` → `"Rigatoni alla Vodka"`, `"chick ceasar wrap"` → `"Chicken Caesar Wrap"`).
- **Word Order & Phrasing Flexibility**: Treats `"spicy tuna crispy rice"`, `"spicy tuna with crispy rice"`, `"crispy rice with spicy tuna"`, and `"spicey tuna crispie rice"` as equivalent search intents.
- **Culinary Distinctions**: Accurately distinguishes non-equivalent dishes (e.g., spicy tuna crispy rice vs. spicy tuna rolls, strawberry matcha vs. plain matcha, chicken Caesar wrap vs. plated Caesar salad).

### 2. Precise Geographic Radius & Distance
- **Selectable Radii**: 1 mile, 3 miles, 5 miles, 10 miles, 25 miles.
- **Accurate Distance Mathematics**: Uses the Haversine formula (`3958.756` miles Earth radius) and strict unit conversion (`radiusInMeters = radiusInMiles * 1609.344`).
- **Strict Radius Enforcement**: Ensures results never leak outside the selected radius.
- **Friendly Radius-Expansion Guidance**: When no verified matches exist within a tight 1-mile circle, DishSignal provides helpful guidance with 1-click radius expansion buttons rather than generic errors.

### 3. Three-Tier Match Quality Categorization
- **Exact or Equivalent Match**: Verified menu line items confirming the exact preparation and ingredients.
- **Similar Dish**: Related menu items that share culinary traits but differ in a meaningful way (clearly explained in the UI).
- **Possible Match — Unverified**: Establishments recognized for culinary excellence in the category whose specific menu item is unconfirmed on public menus.

### 4. Interactive Map & Deep Culinary Dive
- **Synchronized Map & List**: Leaflet interactive map with custom numbered pins, active selection states, and dynamic radius circles.
- **Culinary Inspection Modal**: In-depth breakdown of preparation methods, dietary notes (Gluten-Free, Dairy-Free, Vegan), flavor profiles, and pairing suggestions.
- **Mobile Responsive**: Dual split-screen desktop layout with seamless List/Map mobile view toggle.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Leaflet
- **Backend**: Node.js, Express, TSX
- **AI & Grounding**: Google GenAI SDK (`@google/genai`) with Gemini models
- **Geocoding & Maps**: OpenStreetMap Nominatim, Leaflet tiles, Google Maps deep-links

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- A Google Gemini API Key (`GEMINI_API_KEY`)

### Installation & Setup
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd dishsignal
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```bash
   GEMINI_API_KEY="your-api-key-here"
   PORT=3000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:3000`.

---

## 🧪 Testing

DishSignal includes an automated test suite verifying distance calculation, radius boundaries, semantic normalization, spelling correction, distinguishing non-equivalent dishes, deduplication, and coordinate validation:

```bash
npm test
```

To run TypeScript verification:
```bash
npm run lint
```

---

## 🔒 Security & Privacy

- Secret API keys (`GEMINI_API_KEY`) are kept strictly on the backend and are never bundled into client-side code.
- User input is sanitized against script and HTML injection attacks.
- Geolocation coordinates are used solely in memory for real-time distance calculations and are never persisted or logged.

---

## 📄 License
MIT License. Created for AI Studio coursework.
