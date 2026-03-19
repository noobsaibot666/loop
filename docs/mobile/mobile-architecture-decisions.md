# LOOP Mobile Architecture Decisions

Date: 2026-03-19

## Decision 1: Separate mobile workspace
- Decision:
  - Build the new mobile app in `/Users/alan/_localDEV/APPS/LOOP/`.
- Why:
  - keeps the web app stable
  - avoids mixing web and native concerns
  - makes release ownership clearer

## Decision 2: Shared cross-platform app
- Decision:
  - Use a single shared React Native / Expo codebase for Android and iOS.
- Why:
  - same product logic on both platforms
  - lower maintenance than separate native apps
  - better path for parity with the current React product

## Decision 3: Expo Router
- Decision:
  - Use Expo Router for file-based navigation and deep links.
- Why:
  - good fit for mobile stacks and tabs
  - clear route ownership
  - cleaner than custom mobile navigation wiring

## Decision 4: Feature-first module layout
- Decision:
  - Organize the mobile app by feature domains, not by page-only or utility-only buckets.
- Why:
  - keeps related screen, state, api, and model code together
  - reduces monolithic growth

## Decision 5: Native billing for mobile
- Decision:
  - Use native in-app purchases for mobile credits.
- Why:
  - credits are digital entitlements used in-app
  - this is the safer long-term store path

## Decision 6: Additive backend policy
- Decision:
  - Any mobile-driven backend changes must be additive and documented.
- Why:
  - current web product must remain stable
  - manual SQL rollout should stay explicit

## Decision 7: Admin remains web-only
- Decision:
  - Do not rebuild the admin surface in mobile V1.
- Why:
  - it is not needed for the rider-facing product
  - it reduces surface area and release risk

## Decision 8: Documentation is part of implementation
- Decision:
  - Mobile docs live in both the current repo and the new workspace.
- Why:
  - current repo needs contract and migration history
  - new workspace needs setup, architecture, and release guidance

## Open decisions to revisit later
- push notifications
- analytics provider
- E2E framework rollout timing
- whether some heavy feeds need pagination or caching changes for mobile
