# LOOP Mobile V1 Roadmap

Date: 2026-03-19

This document is the source of truth for the new native mobile rebuild of LOOP.

## Goal
- Build a new cross-platform mobile app in `/Users/alan/_localDEV/APPS/LOOP/`.
- Keep the current web app in `/Users/alan/_localDEV/Loop` unchanged.
- Ship Android first.
- Add iOS second from the same shared codebase.
- Rebuild all current user-facing V1 features for mobile.

## Why this exists
- The current web app is a working product surface and should remain stable.
- Mobile requires native navigation, lifecycle handling, permissions, media flows, and store-compliant billing.
- The current React/Vite app is too web-specific to reuse directly without creating long-term maintenance debt.

## Scope
- In scope:
  - auth and account
  - Loop Mode
  - Messenger / Alleycat
  - shared challenge flow
  - Wall
  - Cities
  - Leaderboard
  - Rider profile
  - Night Ride
  - native camera, location, storage, deep linking, and in-app purchases
- Out of scope:
  - mobile admin surface
  - changing the current web product
  - rewriting the backend unless mobile requires additive contract changes

## Phase plan
### Phase 0: Documentation and contract freeze
- Create mobile docs in the current repo and in the new app workspace.
- Map every current web route, flow, and backend dependency to mobile.
- Freeze naming conventions, architecture choices, and release order.

### Phase 1: Mobile workspace bootstrap
- Initialize Expo + React Native + TypeScript in `/Users/alan/_localDEV/APPS/LOOP/app`.
- Add routing, state persistence, API client boundaries, environment loading, and theme tokens.
- Set package IDs and release placeholders for Android and iOS.

### Phase 2: Product shell
- Build navigation and route groups.
- Add auth bootstrap and session restore.
- Add global layout, status surfaces, legal/support routes, and shared UI primitives.

### Phase 3: Feature parity
- Rebuild each user-facing module with native-first interaction rules.
- Preserve current product behavior and copy as closely as practical.
- Keep code modular by feature and keep screens thin.

### Phase 4: Native integrations
- Camera
- Geolocation
- Secure storage
- Lifecycle restore
- Offline draft persistence
- Deep links

### Phase 5: Billing and backend extensions
- Replace mobile credit checkout with native in-app purchases.
- Add manual SQL migrations only when backend changes are required.
- Keep all backend additions additive and web-safe.

### Phase 6: QA and release
- Android smoke testing and internal release first.
- Play Store assets, privacy disclosures, support metadata, and review notes.
- iOS enablement after Android stabilizes.

### Phase 7: Core production polish
- Shift priority from feature breadth to product quality.
- Bring the mobile app as close as practical to a 1:1 operational and visual translation of the web app while respecting mobile interaction rules.
- Fix route handoff correctness before broader polish so ride generation and launch behavior are dependable.
- Replace scaffold filters and control clusters with mobile-native patterns such as sheets, modals, and tighter hierarchy.
- Tune spacing, typography, card hierarchy, and navigation surfaces so testing and repeated use feel production-grade.

### Phase 8: Embedded in-app maps
- Add embedded route maps only after the core production pass is stable.
- Keep external map launch as a fallback rather than the primary experience.
- Evaluate a dedicated map SDK for Loop, Messenger, and Night Ride route preview inside the app.

## Deliverables
- A new mobile workspace with shared app code.
- Mobile-specific documentation in both repos.
- Mobile-specific SQL files under `db/sql/mobile/`.
- Release checklists for Android and iOS.

## Working rules
- Keep code lean and modular.
- Prefer clear feature boundaries over shared mega-files.
- Document major decisions close to the code and in the docs.
- Do not change live web behavior unless there is a deliberate backend extension that keeps web compatibility.
- Prioritize core experience quality before adding new feature surfaces that expand scope.
