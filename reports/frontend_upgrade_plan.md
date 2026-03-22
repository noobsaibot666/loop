# Frontend Upgrade Architecture & Plan
**Target:** Transform the 4.6k-line `App.tsx` monolithic file into a modular, highly scalable React application utilizing React Router and decoupled state management. 

---

## 1. The Target Architecture Stack
- **Framework:** React 18 
- **Build Tool:** Vite (Already active)
- **Routing:** `react-router-dom` v6+ (Replaces custom `pageView` & `window.history` logic)
- **State Management:** `Zustand` (Replaces heavy `useState` hooks handling global auth and loop generation)
- **Data Fetching:** Standard `fetch` + Custom SWR/React Query for aggressive API caching.
- **Hosting:** Cloudflare Pages (Static export + `functions/api/`)

---

## 2. Execution Phases

### Phase 1: Structural Setup & Routing Foundation
1. Install `react-router-dom` and `zustand`.
2. Map out the `react-router` configuration.
    - `/` -> `Home.tsx`
    - `/loop` -> `LoopBuilder.tsx`
    - `/messenger` -> `AlleycatMode.tsx`
    - `/wall` -> `WallOfFame.tsx`
    - `/cities` -> `CitiesHub.tsx`
    - `/account` -> `RiderAccount.tsx`
    - `/admin` -> `AdminDashboard.tsx`
3. Create the foundational `/src/pages/` grouping directory.
4. Move the top-tier navigation (`TopBar` / `BurgerMenu`) into a persistent `<Layout />` wrapper in the Router so it doesn't re-render on page switches.

### Phase 2: State Extraction (The "Zustand" Migration)
1. **`useAuthStore`:** Extract all `supabase.auth.getSession()` logic, user data, access tokens, and permission states from `App.tsx`.
2. **`useCreditStore`:** Extract the `Usage` API polling, stripe session success listening, and credit balance tracking.
3. **`useAlleycatStore`:** Localize the extremely massive data payloads (`messengerManifest`, `messengerRun`, Check-in state logic) here. This is crucial for offline-hydration (so a user doesn't lose run progress if they close the app).

### Phase 3: Slicing the Monolith
We will surgically extract the isolated code blocks from `App.tsx` into their new `/pages/` and `/components/` equivalents:
1. `Home.tsx` - Move the Hero blocks and swift product cards here.
2. Extract the `WallOfFame`, `Cities`, and `Leaderboard` views. Because these do heavy array-mapping and image loading, putting them in their own files will dramatically improve isolated rendering speeds.
3. Move `Alleycat` and `Loop` builders.
4. Move `Account` suites (Profile, Quarter Ranks, Payment actions).

### Phase 4: Quality Assurance & Cloudflare Pipeline
- Verify deep-linking (e.g. visiting `loop.app/cities` directly loads the cities page instead of failing fallback).
- Test Stripe redirects (does going back via the browser history break the payment states?).
- Ensure `functions/api/*` is completely untouched and receiving local requests correctly from the modular components.
