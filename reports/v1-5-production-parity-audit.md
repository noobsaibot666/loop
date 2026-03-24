# V1.5 Production Parity Audit

Date: 2026-03-23

Scope:
- React modular app mounted through `src/App.tsx`
- Route pages in `src/pages/*`
- Production-grade modular surfaces in `src/components/pages/*`
- Shared stores and backend endpoints used by the React routes

## Executive summary

The modular migration is structurally successful, but Phase 5 cannot be treated as simple QA. The app is currently in a mixed state:

- some routes already delegate to production-grade modular page components
- some routes still use bespoke rebuilt pages with reduced scope, hardcoded copy, inline styling, and missing backend parity
- some React routes call backend endpoints that do not exist in `server/index.js`

This means the current Phase 5 target must shift from “final QA and Cloudflare validation” to “production parity hardening.”

Phase 5 is now being closed by product approval:

- visual parity is accepted
- local functional parity is accepted
- remaining work moves forward as finalization/cleanup, not as a Phase 5 blocker

After local live validation, the structural migration is no longer the main risk:

- admin authentication is working
- direct route navigation is working
- account summary and admin dashboards are working against the real backend
- Street Hunt manifest generation and run start are working against the real backend
- Night Ride crew build and history loading are working against the real backend
- rider authentication is working
- rider credit grant, consumption, and summary sync are working against the real backend
- rider Night Ride join flow is working against the real backend
- admin proof moderation toggle and restore are working against the real backend
- public feed and route APIs are working against the local backend
- Loop route generation is working against the local backend
- Street Hunt manifest generation is working against the local backend
- Night Ride crew creation and history loading are working against the local backend
- admin overview, proofs, city-pack, checkpoint, request, and night endpoints are working against the local backend

The main remaining blocker is now narrower:

- admin night-post moderation still needs explicit live validation against real night posts
- translation signoff still needs an explicit final pass
- legacy static surfaces still need a cleanup/archive phase before the React system can stand alone as the only active app

## What is already in place

- `react-router-dom` app shell is live in [src/App.tsx](/Users/alan/_localDEV/Loop/src/App.tsx)
- route-based pages exist for all major surfaces in [src/pages](/Users/alan/_localDEV/Loop/src/pages)
- production-grade page modules exist for:
  - [CitiesPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/CitiesPage.tsx)
  - [LeaderboardPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/LeaderboardPage.tsx)
  - [NightRidePage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/NightRidePage.tsx)
  - [RiderProfilePage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/RiderProfilePage.tsx)
  - [WallPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/WallPage.tsx)
- build currently succeeds with `npm run build`

## Blockers

### Backend contract blockers

These React pages originally depended on endpoints that did not exist in [server/index.js](/Users/alan/_localDEV/Loop/server/index.js):

- `/api/admin/check`
- `/api/admin/night-rides`
- `/api/admin/night-ride-moderation`
- `/api/stripe/portal`

These endpoint gaps are now patched in the server, but they still need route-level validation in the React app.

### Product-surface blockers

- [NightRide.tsx](/Users/alan/_localDEV/Loop/src/pages/NightRide.tsx) is now proven for crew build, rider join, and history loading, but the post/share surface still needs final visual parity review
- [AdminDashboard.tsx](/Users/alan/_localDEV/Loop/src/pages/AdminDashboard.tsx) now has translated metrics, rider controls, night moderation, and proof moderation wired, but live night-post moderation is still not proven because there were no night posts available in the QA data during validation

## Frontend audit by route

### Strong parity foundation

- [CitiesHub.tsx](/Users/alan/_localDEV/Loop/src/pages/CitiesHub.tsx)
  - thin wrapper around [CitiesPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/CitiesPage.tsx)
  - low structural risk
- [Leaderboard.tsx](/Users/alan/_localDEV/Loop/src/pages/Leaderboard.tsx)
  - thin wrapper around [LeaderboardPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/LeaderboardPage.tsx)
  - city query restoration and city-picker modal behavior are now hardened
  - low structural risk
- [WallOfFame.tsx](/Users/alan/_localDEV/Loop/src/pages/WallOfFame.tsx)
  - thin wrapper around [WallPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/WallPage.tsx)
  - city query restoration, night-feed scoping, and city-picker modal behavior are now hardened
  - low structural risk
- [RiderProfile.tsx](/Users/alan/_localDEV/Loop/src/pages/RiderProfile.tsx)
  - thin wrapper around [RiderProfilePage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/RiderProfilePage.tsx)
  - low structural risk

### Medium-risk parity routes

- [NightRide.tsx](/Users/alan/_localDEV/Loop/src/pages/NightRide.tsx)
  - uses production-grade [NightRidePage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/NightRidePage.tsx)
  - history wiring is now in place
  - route now enforces the crew-only product model
  - live build, join, and history validation are now proven
  - code/post modals now match the shared modal behavior more closely: outside-close, `Esc` close, and body-scroll lock
  - remaining signoff is mostly visual parity and post/share review
- [RiderAccount.tsx](/Users/alan/_localDEV/Loop/src/pages/RiderAccount.tsx)
  - rebuilt around the real `/api/account/summary` payload
  - profile save, password update/reset, community access, purchases, history, and feedback are now wired
  - login/logout, account summary behavior, and rider-side usage sync are now proven in local modular runtime
  - signed-in topbar copy is now aligned to the authenticated account surface instead of leaking guest copy
  - remaining signoff depends on final visual parity review
- [AdminDashboard.tsx](/Users/alan/_localDEV/Loop/src/pages/AdminDashboard.tsx)
  - rebuilt around the active admin endpoints already present in `server/index.js`
  - rider lookup, credit set/reset, night moderation, proof visibility, and proof delete are now wired
  - admin access, metrics, rider list, night moderation feed, proofs feed, rider credit set, and proof visibility moderation are now proven in local modular runtime
  - empty-state gaps in Night, Proofs, and Requests are now closed so the route stays readable under sparse QA data
  - live night-post moderation still needs explicit end-to-end validation
- [LoopBuilder.tsx](/Users/alan/_localDEV/Loop/src/pages/LoopBuilder.tsx)
  - route is bespoke, not a thin wrapper
  - shared route-shell classes now replace the old inline section wrappers
  - logic depends on [useLoopStore.ts](/Users/alan/_localDEV/Loop/src/store/useLoopStore.ts), which required a loop route fallback fix in this audit
  - route now restores the full four-step flow and no longer leaks account-surface copy into the loop result lane
- [AlleycatMode.tsx](/Users/alan/_localDEV/Loop/src/pages/AlleycatMode.tsx)
  - bespoke route page with local flow assembly
  - shared route-shell classes now replace the old inline section wrappers
  - required a late fix so the React route now geocodes and sends `start_lat/start_lng` like the backend expects
  - rider manifest generation, credit consumption, and run start are now proven in local modular runtime
  - share-code creation/load and challenge-board summary are now restored against the live backend
  - route now uses route-specific hero/code-entry copy and closes the custom city picker on `Esc`
  - likely parity drift risk now centers on final UI signoff rather than missing route behavior

### High-risk parity routes

- [Home.tsx](/Users/alan/_localDEV/Loop/src/pages/Home.tsx)
  - custom route implementation, not a direct production port
  - visual parity work is ongoing and still manually tuned
  - hero badge copy is now translation-driven and community CTAs use proper external link semantics instead of `window.open(...)`
- [AdminDashboard.tsx](/Users/alan/_localDEV/Loop/src/pages/AdminDashboard.tsx)
  - backend endpoint gaps are patched and core moderation controls are now wired
  - still remains a bespoke admin route, not yet a proven production-equivalent port

## Shared UI and mobile parity findings

- [MainLayout.tsx](/Users/alan/_localDEV/Loop/src/components/MainLayout.tsx)
  - mobile scroll-driven header visibility is now wired
  - guest/login controls now use shared CSS classes instead of inline styles
  - remaining shell drift is no longer in the header logic; primary shell validation now moves to final behavior checks
- [styles.css](/Users/alan/_localDEV/Loop/src/styles.css)
  - shared `primary`, `ghost`, `flat`, and `manifest-build` button treatments are now pulled back toward the production dark palette instead of the washed light-gray drift
- [AuthModal.tsx](/Users/alan/_localDEV/Loop/src/components/AuthModal.tsx)
  - now uses translated copy, real reset-password behavior, and shared modal/button/field styling
  - still needs production parity validation in live auth flows
- route pages such as [LoopBuilder.tsx](/Users/alan/_localDEV/Loop/src/pages/LoopBuilder.tsx) and [AlleycatMode.tsx](/Users/alan/_localDEV/Loop/src/pages/AlleycatMode.tsx) still rely on some inline layout styling
- route-shell inline styling has now been moved into shared CSS classes; remaining parity risk is in the bespoke route composition rather than layout wrappers
- remaining hardcoded-string risk is now concentrated in route visuals and smaller fallback states rather than the main shell/auth/account/admin surfaces

## Translation audit

Confirmed translation risk:

- [AdminDashboard.tsx](/Users/alan/_localDEV/Loop/src/pages/AdminDashboard.tsx)
  - hardcoded copy was replaced with `admin.*` translation keys, but route-level admin validation is still pending
- [LoopBuilder.tsx](/Users/alan/_localDEV/Loop/src/pages/LoopBuilder.tsx)
  - route-level result copy, step copy, and status messaging are now translated, but the page still remains a bespoke route rather than a production module wrapper
- [AlleycatMode.tsx](/Users/alan/_localDEV/Loop/src/pages/AlleycatMode.tsx)
  - route-level result copy, step copy, and status messaging are now translated, but the page still remains a bespoke route rather than a production module wrapper
- [NightRide.tsx](/Users/alan/_localDEV/Loop/src/pages/NightRide.tsx)
  - route-level hardcoded drift has been removed, but final behavior validation is still pending

Conclusion:
- translation parity is not complete until all route-level hardcoded strings are removed
- `en`, `pt`, and `es` route-level status keys are now in place for Loop, Street Hunt, Night Ride, Account, and Admin
- final translation signoff still depends on full rider walkthrough and page-by-page visual review

## Backend migration audit

### Confirmed aligned areas

- Messenger core endpoints are present in [server/index.js](/Users/alan/_localDEV/Loop/server/index.js)
- Loop generation endpoints are present in [server/index.js](/Users/alan/_localDEV/Loop/server/index.js)
- public wall, rider profile, city lanes, and public leaderboard endpoints are present in [server/index.js](/Users/alan/_localDEV/Loop/server/index.js)
- public smoke on `wall`, `leaderboard`, `city-demand`, `city-lanes`, `night-ride/feed`, `messenger/public-leaderboard`, and `geocode` returned `200` against the local backend
- auth-backed smoke on `account/summary`, `loop`, `messenger/generate`, `night-rides/create`, `night-rides/mine`, and core admin endpoints returned successful responses locally once the rider credit lane was restored

### Confirmed mismatches

- admin route expectations were missing server endpoints and are now patched, but still need end-to-end validation
- account subscription management route expectations were missing server support and are now patched, but still need end-to-end validation
- Night Ride route now consumes `GET /api/night-rides/mine`, but broader route parity still remains
- the shared React request layer originally posted to the frontend origin instead of `API_BASE`; this is now fixed in [routeUtils.ts](/Users/alan/_localDEV/Loop/src/utils/routeUtils.ts)
- public modular routes originally expected these backend aliases, which are now patched in [server/index.js](/Users/alan/_localDEV/Loop/server/index.js):
  - `/api/night-ride/feed`
  - `/api/messenger/public-leaderboard`
- stale Supabase refresh tokens originally produced route-load auth noise; invalid local auth state is now cleared in [useAuthStore.ts](/Users/alan/_localDEV/Loop/src/store/useAuthStore.ts)

## Fixes applied during this audit

- [useLoopStore.ts](/Users/alan/_localDEV/Loop/src/store/useLoopStore.ts)
  - fixed the fallback Google Maps loop URL logic so it no longer generates a degenerate same-origin/same-destination route
- [routeUtils.ts](/Users/alan/_localDEV/Loop/src/utils/routeUtils.ts)
  - protected API calls now attach the current Supabase Bearer token automatically
  - shared API calls now resolve through `API_BASE` instead of the current frontend origin
- [useAuthStore.ts](/Users/alan/_localDEV/Loop/src/store/useAuthStore.ts)
  - stale local Supabase refresh tokens are now cleared during initialization instead of leaking auth errors into every route load
- [server/index.js](/Users/alan/_localDEV/Loop/server/index.js)
  - added `/api/admin/check`
  - added `/api/admin/night-rides`
  - added `/api/admin/night-ride-moderation`
  - added `/api/stripe/portal`
  - added Night Ride create-route compatibility and join-code compatibility
  - added `/api/night-ride/feed`
  - added `/api/messenger/public-leaderboard`
  - replaced unsafe chained `.catch(...)` usage on Supabase query builders with guarded helpers after live runtime crashes exposed them
- [NightRide.tsx](/Users/alan/_localDEV/Loop/src/pages/NightRide.tsx)
  - wired real Night Ride history via `/api/night-rides/mine`
  - removed the dead membership handoff
  - aligned the route to the crew-only product model
  - moved step-shell layout off inline styles and into shared route-shell classes
- [NightRidePage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/NightRidePage.tsx)
  - replaced broken `/api/locations` calls with the real `/api/geocode` backend contract
  - hardened start/end suggestion behavior so stale search dropdowns now clear on short queries, outside click, and `Esc`
- [RiderAccount.tsx](/Users/alan/_localDEV/Loop/src/pages/RiderAccount.tsx)
  - rebuilt around the account summary contract and existing `account.*` translation keys
  - wired profile update, password update/reset, membership actions, purchases, activity, quarter board, ride history, crew history, and feedback
- [AdminDashboard.tsx](/Users/alan/_localDEV/Loop/src/pages/AdminDashboard.tsx)
  - added translated rider controls and wired proof visibility/delete moderation actions
  - expanded the modular admin surface to expose backend-backed city pack controls, checkpoint controls, city request handling, AI drafting, manifest preview, and proof month archiving
- [MainLayout.tsx](/Users/alan/_localDEV/Loop/src/components/MainLayout.tsx)
  - mobile header/menu now responds to scroll direction and idle time instead of staying static
  - desktop nav and mobile footer controls have now been moved fully onto shared shell classes
- [LoopBuilder.tsx](/Users/alan/_localDEV/Loop/src/pages/LoopBuilder.tsx)
  - removed route-level hardcoded result copy, moved route shell wrappers into shared CSS classes, and localized store-driven status messaging
- [AlleycatMode.tsx](/Users/alan/_localDEV/Loop/src/pages/AlleycatMode.tsx)
  - removed route-level hardcoded result copy, moved route shell wrappers into shared CSS classes, and localized store-driven status messaging
  - restored production-equivalent start-area geocoding so manifest generation now sends the coordinates the backend requires
  - restored backend-supported share-code generation/load and challenge-board summary behavior
  - restored city-prefill support from `/messenger?city=...` deep links generated by the Cities route
  - hardened the `Have a code?` flow so it auth-gates before opening the modal and only closes after a successful load
  - reworked ghost-rider handling so it is now an explicit opt-in builder option, with pressure only shown when ghost rider is enabled
- [LoopBuilder.tsx](/Users/alan/_localDEV/Loop/src/pages/LoopBuilder.tsx)
  - brought unit toggles, label sizing, and mobile builder rhythm closer to the Street Hunt reference
  - removed the dead `/membership.html` handoff and replaced it with the real crew Discord join lane
  - hardened suggestion behavior so stale location search dropdowns now clear on outside click and `Esc`
- [useLoopStore.ts](/Users/alan/_localDEV/Loop/src/store/useLoopStore.ts)
  - Loop generation now sends `terrain`, `surface`, and `vibe` through to the backend instead of treating those builder controls as history-only metadata
- [NightRidePage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/NightRidePage.tsx)
  - aligned route-mode, unit, and difficulty controls to the Street Hunt builder scale
  - replaced inline join-code entry with a proper `Have a code?` modal flow to match the current builder pattern
- [server/index.js](/Users/alan/_localDEV/Loop/server/index.js)
  - Loop route generation now uses builder context to vary round-trip point count and seed bias, so terrain/surface/vibe have a live effect on the generated line
- [Home.tsx](/Users/alan/_localDEV/Loop/src/pages/Home.tsx)
  - removed the last one-off inline Strava logo sizing so the route is fully driven by shared classes
  - removed the remaining hardcoded hero badge city label and non-semantic external CTA behavior from the community cards
- [AlleycatMode.tsx](/Users/alan/_localDEV/Loop/src/pages/AlleycatMode.tsx)
  - Street Hunt result and board surfaces no longer leak hardcoded English summary/status/time placeholders; those route-visible fragments now run through the shared translation layer
  - hardened suggestion behavior so stale start-area dropdowns now clear on outside click and `Esc`
- [MainLayout.tsx](/Users/alan/_localDEV/Loop/src/components/MainLayout.tsx)
  - removed the remaining inline guest/login control styling and moved it into shared CSS classes
- [styles.css](/Users/alan/_localDEV/Loop/src/styles.css)
  - corrected shared button palette, typography, and hover states so route CTAs no longer drift into the lighter gray rebuild treatment
  - tightened builder-specific inputs, pills, section spacing, and CTA sizing so Loop, Street Hunt, and Night Ride sit closer to the original production rhythm
  - added real builder grid primitives and per-count option layouts so 2-, 3-, 4-, and 6-option sections stay aligned across translations instead of falling back to oversized fixed pills
  - unified route-step, credit-card, button-fit, and mobile card-width behavior across Loop, Street Hunt, and Night Ride so the three builder routes now share the same visual system
- [Leaderboard.tsx](/Users/alan/_localDEV/Loop/src/pages/Leaderboard.tsx)
  - now restores city scope from the route query so public leaderboard views are shareable and stable
- [WallOfFame.tsx](/Users/alan/_localDEV/Loop/src/pages/WallOfFame.tsx)
  - now restores city scope from the route query and applies the same scope to Night Ride feed pulls
- [LeaderboardPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/LeaderboardPage.tsx)
  - city picker now behaves like the rest of the production modal surfaces: outside-click close, `Esc` close, and body-scroll lock
- [WallPage.tsx](/Users/alan/_localDEV/Loop/src/components/pages/WallPage.tsx)
  - city picker now behaves like the rest of the production modal surfaces: outside-click close, `Esc` close, and body-scroll lock
- [useFeedStore.ts](/Users/alan/_localDEV/Loop/src/store/useFeedStore.ts)
  - no longer defaults public feeds to Barcelona; wall state now starts from an all-cities neutral scope
- [RiderAccount.tsx](/Users/alan/_localDEV/Loop/src/pages/RiderAccount.tsx)
  - added a direct public rider-profile handoff from the modular account hero actions
- [useCreditStore.ts](/Users/alan/_localDEV/Loop/src/store/useCreditStore.ts)
  - fixed usage loading to call `/api/usage/check`, which matches the backend

## Next planned phase: Clean Up

Before any deploy, the repo needs a cleanup phase so the React app becomes the clearly active system and the legacy static surface becomes consultation-only reference material.

Current likely cleanup targets:

- `public/*.html` legacy static pages still referenced by footer links
- duplicate historical roadmap/checklist docs from earlier phases
- root-level reference notes such as [data.md](/Users/alan/_localDEV/Loop/data.md)
- any leftover legacy-only assets that are no longer part of the active React runtime

Cleanup must not remove active runtime dependencies:

- [src](/Users/alan/_localDEV/Loop/src)
- [server](/Users/alan/_localDEV/Loop/server)
- [shared](/Users/alan/_localDEV/Loop/shared)
- active config/build files

## Recommended Phase 5 order

1. Validate live night-post moderation actions when QA data contains night posts.
2. Finish visual one-to-one review for the remaining bespoke or high-touch routes:
   - Home
   - Loop Builder
   - Street Hunt / Messenger
3. Remove all hardcoded route-level copy and complete translation parity.
4. Verify page parity route by route on desktop and mobile.
5. Run final visual parity walkthroughs.
6. Only then stage to Cloudflare Pages.

## Street Hunt builder audit summary

- `City` is functional and supports route-prefill from the Cities route.
- `Start area` is functional and backed by live geocoding with suggestion assist.
- `Ride zone` is functional and drives live range-based manifest generation.
- `Ghost rider` is now a real toggle instead of an always-on assumption.
- `Pressure` now correctly behaves as a ghost-rider-only control.
- `Checkpoints` and `Pick your poison` are both wired and functional against the backend manifest generator.
- `Have a code?` is now a real modal flow with auth gating and success-only close behavior.

## Loop builder audit summary

- `Start point` is functional and backed by live geocoding with suggestion assist.
- `Distance` is functional and uses the same range rhythm and narrower unit toggle treatment as the Street Hunt reference.
- `Terrain`, `Surface`, and `Ride vibe` now affect loop generation instead of only being stored in history metadata.
- result actions are functional and no longer point to the dead membership page.

## Night Ride builder audit summary

- `Crew name` and `Crew members` remain functional and crew-only.
- `Route mode` is functional and still controls loop versus roulette generation.
- `Distance` and `Difficulty` remain connected to live backend route generation.
- code join is now handled through a modal flow instead of an inline field, matching the current builder pattern.
