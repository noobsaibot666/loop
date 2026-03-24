# Gimme The Loop: V1.5 Modular Upgrade Roadmap - STATUS UPDATE

**Date:** March 2026  
**Status:** Phase 4 Complete, Phase 5 Complete, Phase 6 Planned.

---

## Phase 1: Structural Foundation & Routing (COMPLETE)
- [x] Install `react-router-dom` and `zustand` dependencies.
- [x] Create directory structure.
- [x] Configure `BrowserRouter`.
- [x] Establish base App `<Layout />`.

## Phase 2: State Extraction (COMPLETE)
- [x] **`useAuthStore`:** Authentication and sessions.
- [x] **`useCreditStore`:** Credits and membership summaries.
- [x] **`useAlleycatStore`:** Local runs and offline persistence.
- [x] **`useUIStore`:** Navigation and global UI.

## Phase 3: Slicing the Monolith (COMPLETE)
- [x] Extract all pages (Home, Loop Builder, Alleycat, Wall, Cities, Leaderboard, Account, Admin).

## Phase 4: Completing V1.2 Outstanding Features (COMPLETE)
- [x] **Night Ride Moderation Integration:** Dashboard functional with `live/flagged/hidden` controls.
- [x] **Community Membership Launch:** Handle Stripe session verify + Home page conversion funnel.
- [x] **Offline Alleycat Validation:** Manual retry for proof drafts implemented in UI.
- [x] **Mobile Navigation Rethink:** Scroll lock on menu open verified.

---

## Phase 5: Production Parity Audit & Hardening (COMPLETE)
- [x] Local build verification.
- [x] React route shell is live with `react-router-dom`.
- [x] Initial parity audit started across pages, stores, and backend contracts.
- [x] Rebuild the major protected/product routes onto production-capable React surfaces.
- [-] Final translation signoff deferred to finalization.
- [x] Align shared UI exactly with the production version:
  - builders
  - cards
  - hero treatments
  - auth modal
  - login/account/admin surfaces
  - shared button palette and states
- [x] Validate desktop and mobile interaction parity page by page.
- [x] Validate image parity:
  - hero assets
  - card imagery
  - wall/feed presentation
- [x] Validate backend parity for all React routes against `server/index.js`.
- [x] Close missing API gaps before any Cloudflare staging deploy.
- [x] Run final local end-to-end walkthrough before finalization.

## Phase 5.A: Blockers Found In Audit
- [x] `AdminDashboard` endpoint blockers added to `server/index.js`:
  - `/api/admin/check`
  - `/api/admin/night-rides`
  - `/api/admin/night-ride-moderation`
- [x] `RiderAccount` server support added for `/api/stripe/portal`.
- [x] `NightRide` history and create/join compatibility are wired.
- [x] `Home`, `LoopBuilder`, and `AlleycatMode` are now approved bespoke React routes with production-parity signoff.
- [x] `RiderAccount` and `AdminDashboard` are rebuilt around the current backend contracts and functionally validated.
- [x] Signed-in Account topbar copy and Admin sparse-data empty states are aligned to the live modular surfaces.
- [x] Shared mobile header behavior in `MainLayout` is now wired to scroll-state logic.
- [x] Shared route-shell classes now replace the old inline layout wrappers in `LoopBuilder` and `AlleycatMode`.
- [x] Loop Builder and Street Hunt store-driven status copy now runs through `en`, `pt`, and `es` translation keys.
- [x] Street Hunt route now restores production-grade share/reset/challenge surface behavior already supported by the backend.
- [x] Street Hunt route now uses route-specific code-entry copy and closes the custom city picker on `Esc`.
- [x] Night Ride route is now aligned to the crew-only product model and no longer carries a dead membership handoff.
- [x] Night Ride post/code modals now match the shared route-modal behavior more closely.
- [x] Shared builder controls are tightened back toward production sizing and spacing across Loop, Street Hunt, and Night Ride.
- [x] Builder option groups now use dynamic per-count layouts instead of fixed oversized pill rows, so translated labels stay inside the original production rhythm.
- [x] Street Hunt builder options were re-audited end to end; city deep-link prefill and share-code modal/auth flow are now restored.
- [x] Loop builder controls now inherit the Street Hunt reference sizing, mobile margins, and no longer carry the dead membership handoff.
- [x] Loop builder now restores the full four-step route flow and no longer leaks account-surface copy into the result lane.
- [x] Night Ride builder controls now inherit the Street Hunt reference sizing, and join-by-code now follows the same modal-based pattern instead of an inline field.
- [x] Shared React API calls now resolve through `API_BASE`, so local modular route validation hits the real backend.
- [x] Public backend alias gaps are patched for Night Ride feed and public leaderboard.
- [x] Public Wall and Leaderboard routes now restore city scope from the URL instead of relying on stale local feed defaults.
- [x] Night Ride feed now respects the active Wall city scope.
- [x] Wall and Leaderboard city pickers now match the production modal behavior: outside-close, `Esc` close, and body-scroll lock.
- [x] Direct route navigation has been verified across the modular public and protected routes.
- [x] Admin login/logout and account summary behavior are verified in the modular runtime.
- [x] Street Hunt manifest generation and run start are verified against the real backend.
- [x] Night Ride crew build and history loading are verified against the real backend.
- [x] Rider login is verified in the modular runtime.
- [x] Rider credit grant, consumption, and summary sync are verified against the real backend.
- [x] Rider Night Ride join flow is verified against the real backend.
- [x] Admin proof visibility moderation is verified end to end with restore.
- [x] Supabase query-builder crash paths exposed by live validation are hardened in `server/index.js`.
- [x] Remaining inline guest/login shell styling is pushed into shared CSS classes.
- [x] Shared button palette and state styling are corrected back toward the production dark treatment.
- [x] Admin now exposes the backend control lanes for city packs, checkpoints, city requests, AI drafting, manifest preview, and proof month archive.
- [x] Home hero badge copy and community CTAs are now translation-driven and semantic, removing the last `window.open(...)`/hardcoded-label drift from that route.
- [x] Street Hunt result and board summary surfaces are now translation-driven instead of leaking hardcoded English status and time placeholders.
- [-] Admin Night Ride moderation with real live posts is deferred to finalization.

## Phase 5.B: Page Parity Targets
- [x] Home
- [x] Loop Builder
- [x] Street Hunt / Messenger
- [x] Night Ride visual parity signoff
- [x] Wall
- [x] Cities
- [x] Leaderboard
- [x] Rider Profile
- [x] Account visual parity signoff
- [x] Admin visual parity signoff

## Phase 5.C: Exit Criteria Before Deploy
- [x] Visual parity confirmed against the current production app.
- [x] Functional parity confirmed for the core authenticated and admin workflows in local modular runtime.
- [-] Final translation signoff is deferred to finalization.
- [x] No React parity blockers remain in active product routes; remaining legacy/static cleanup is moved to the next phase.
- [x] No React page currently under validation depends on a missing backend endpoint.
- [x] Direct route navigation verified for every public and protected page.
- [-] Live Night Ride moderation with real posts is deferred to finalization.
- [-] Cloudflare staging is intentionally deferred until after cleanup.

## Phase 6: Clean Up & Archive Legacy Surfaces (PLANNED)
- [ ] Inventory what still belongs to the legacy static system versus the active React app.
- [ ] Move legacy reference-only assets and documents into an archive folder kept for consultation only.
- [ ] Keep active runtime code in the main project tree only:
  - `src`
  - `server`
  - `shared`
  - active config/build files
- [ ] Decide which static `public/*.html` routes must be migrated into React before archive.
- [ ] Remove dead links and references that still point to legacy-only pages.
- [ ] Reduce duplicate docs/checklists from prior phases after preserving what is still useful as historical reference.
- [ ] Re-run build and route smoke after cleanup to ensure archive work does not break the active React system.
