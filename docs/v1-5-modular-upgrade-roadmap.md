# Gimme The Loop: V1.5 Modular Upgrade Roadmap

**Date:** March 2026  
**Purpose:** Execute "Option A" - Trashing the `App.tsx` monolith in favor of a clean, structured React Router architecture. This roadmap also explicitly targets and completes the outstanding features from V1.2 (Night Ride moderation, Community Membership, and Offline Resilience).

---

## Phase 1: Structural Foundation & Routing
*Goal: Introduce professional state management and URL routing without breaking existing functionality.*

- [ ] Install `react-router-dom` and `zustand` dependencies.
- [ ] Create directory structure: `/src/pages/`, `/src/components/`, `/src/store/`, `/src/hooks/`.
- [ ] Configure `BrowserRouter` inside `main.tsx`.
- [ ] Establish base App `<Layout />` containing TopBar and BurgerMenu.
- [ ] Wire empty route stubs for `/`, `/loop`, `/messenger`, `/account`, `/cities`, `/wall`, `/leaderboard`, `/night`, `/admin`.

---

## Phase 2: State Extraction (The Zustand Move)
*Goal: Remove global states from React render cycles.*

- [ ] **`useAuthStore`:** Extract `supabase.auth.getSession()` logic, `accessToken`, and `user` state.
- [ ] **`useCreditStore`:** Extract `Usage` polling, `donation` success listener, and credit balance limits.
- [ ] **`useAlleycatStore`:** Localize `messengerManifest`, `messengerRun`, check-in validations, and `clockNow` logic.
- [ ] **`useUIStore`:** Extract global UI states (`showLanguageMenu`, `menuOpen`, `mobileHeaderVisible`).

---

## Phase 3: Slicing the Monolith
*Goal: Move 4.6k lines of `App.tsx` logic into isolated, fast rendering pages.*

- [ ] Extract **Home Page** (`/`): Move Hero badges, swift product cards, and step counts.
- [ ] Extract **Loop Builder** (`/loop`): Move map generation logic, coordinate extraction, and suggestion dropdowns.
- [ ] Extract **Alleycat Mode** (`/messenger`): Move manifest generation, share code logic, and the "live run" interface.
- [ ] Extract **Wall of Fame** (`/wall`): Move public proof grid, city filter modals, and thumbnail components.
- [ ] Extract **Cities Directory** (`/cities`): Move live/ready lane views and city demand requests.
- [ ] Extract **Leaderboards** (`/leaderboard`): Move ranking queries and public rider profile overlay.
- [ ] Extract **Account Suite** (`/account`): Move profile editing, credit top-ups, loop history, and quarter ranks.
- [ ] Extract **Admin Dashboard** (`/admin.html`): Segment into `/admin` route with nested views for moderations and credits.

---

## Phase 4: Completing V1.2 Outstanding Features
*Goal: Dedicate focus to the features that lagged behind the rollout, solidifying community and offline stability.*

- [ ] **Night Ride Moderation Integration:** Connect the existing backend `api/admin/night-ride-moderation.js` logic completely with the Admin Dashboard UI. Render proper flag/delete controls.
- [ ] **Community Membership Launch:** Handle the Discord `/membership=success` stripe callback cleanly within the new routing setup. Explicitly render the "Community Funnel Card" on Home for eligible users.
- [ ] **Offline Alleycat Validation:** Expand `useAlleycatStore` to persist active manifest details and validated checkpoint images locally to `localStorage` (or `IndexedDB` if heavy) so progress survives cellular dropouts in heavy urban routes.
- [ ] **Mobile Navigation Rethink (V1.2 Phase 6):** Ensure the final extracted burger menu overlay is glitch-free on mobile dimensions without triggering horizontal scrolling.

---

## Phase 5: Final QA & Cloudflare Validation
*Goal: Ensure the API connections and builds match Cloudflare's requirements.*

- [ ] Trigger local `npm run build` to verify no TypeScript/Vite routing compilation errors exist.
- [ ] Deploy staging build to Cloudflare Pages.
- [ ] Verify Direct URL Navigation (Ensure hitting `/messenger` directly from the address bar loads correctly without 404ing). 
- [ ] End-to-end Alleycat Check-in test.
- [ ] End-to-end Stripe Membership verify test.
