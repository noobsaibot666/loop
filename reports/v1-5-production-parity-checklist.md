# V1.5 Production Parity Checklist

Date created: 2026-03-23

Status legend:
- `[x]` done
- `[ ]` not started
- `[-]` intentionally deferred

Related docs:
- [v1-5-modular-upgrade-roadmap.md](/Users/alan/_localDEV/Loop/docs/v1-5-modular-upgrade-roadmap.md)
- [v1-5-production-parity-audit.md](/Users/alan/_localDEV/Loop/reports/v1-5-production-parity-audit.md)

## Phase 5A: Backend parity blockers
- [x] Replace or add `/api/admin/check`
- [x] Replace or add `/api/admin/night-rides`
- [x] Replace or add `/api/admin/night-ride-moderation`
- [x] Replace or add `/api/stripe/portal`
- [x] Wire Night Ride history to `/api/night-rides/mine`
- [x] Attach Bearer auth automatically in the shared React request layer

## Phase 5B: Shared app-shell parity
- [x] Recreate production mobile header visibility behavior in [MainLayout.tsx](/Users/alan/_localDEV/Loop/src/components/MainLayout.tsx)
- [x] Audit desktop navigation parity
- [x] Audit auth modal parity
- [x] Remove route-level inline styling where it creates visual drift
- [x] Remove remaining inline guest/login control styling in [MainLayout.tsx](/Users/alan/_localDEV/Loop/src/components/MainLayout.tsx)
- [x] Pull builder control sizing and spacing back toward the original production layout
- [x] Make builder option groups dynamic enough for translated button labels and mixed option counts

## Phase 5C: Route parity
- [x] Home
- [x] Loop Builder
- [x] Street Hunt / Messenger
- [x] Night Ride route rebuilt and functionally validated
- [x] Night Ride visual parity signoff
- [x] Wall
- [x] Cities
- [x] Leaderboard
- [x] Rider Profile
- [x] Account route rebuilt and functionally validated
- [x] Account visual parity signoff
- [x] Admin route rebuilt and functionally validated
- [x] Admin visual parity signoff

## Phase 5D: Translation parity
- [x] Remove hardcoded strings from `Home`
- [x] Remove hardcoded strings from `LoopBuilder`
- [x] Remove hardcoded strings from `AlleycatMode`
- [x] Remove hardcoded strings from `NightRide`
- [x] Remove hardcoded strings from `RiderAccount`
- [x] Remove hardcoded strings from `AdminDashboard`
- [x] Remove hardcoded Street Hunt challenge summary strings from `AlleycatMode`
- [-] Final `en`, `pt`, `es` signoff deferred to finalization

## Phase 5E: Functional parity
- [x] Fix loop Google Maps fallback in [useLoopStore.ts](/Users/alan/_localDEV/Loop/src/store/useLoopStore.ts)
- [x] Add Night Ride create/join API compatibility for the current modular page
- [x] Verify direct route navigation for every page
- [x] Verify account state after login/logout
- [x] Verify credit consumption and summary sync
- [x] Verify Street Hunt run lifecycle end to end
- [x] Verify Night Ride end to end
- [x] Audit Street Hunt builder options end to end
- [x] Audit Loop builder options end to end
- [x] Audit Night Ride builder options end to end
- [x] Restore Street Hunt city-prefill from `/messenger?city=...`
- [x] Harden Street Hunt share-code modal flow
- [x] Restore public city scope from route query on Wall and Leaderboard
- [x] Apply Wall city scope to the Night Ride feed
- [x] Expand Admin to expose city pack, checkpoint, request, preview, and archive controls already present in the backend
- [x] Smoke-test public feeds and route APIs against the local backend
- [x] Smoke-test rider account summary, Loop generation, Street Hunt generation, and Night Ride create/history against the local backend
- [x] Smoke-test admin check, overview, city-pack, checkpoint, request, proof, and night endpoints against the local backend
- [-] Live Night Ride moderation with real posts deferred to finalization

Remaining admin gap:
- [-] Validate Night Ride moderation actions against live night posts, not only proof moderation

## Phase 5F: Release gate
- [x] Desktop parity signoff
- [x] Mobile parity signoff
- [x] Backend parity signoff for local modular runtime
- [-] Final translation signoff deferred to finalization
- [-] Cloudflare staging deploy deferred until after cleanup

## Phase 6: Clean Up Planning
- [x] Inventory legacy static surfaces and reference-only docs
- [x] Define the archive folder structure for legacy consultation material
- [x] Separate active React runtime code from archive-only legacy artifacts
- [x] Migrate or remove any remaining links to legacy-only static pages before archive
- [x] Archive legacy static `admin.html` and `membership.html`
- [x] Archive legacy footer help/legal/support HTML pages after migrating them into React routes
- [x] Archive historical roadmaps, old checklists, and superseded readiness docs
- [x] Re-run build and smoke after archive moves
