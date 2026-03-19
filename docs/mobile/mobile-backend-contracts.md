# LOOP Mobile Backend Contracts

Date: 2026-03-19

This document tracks backend impact from the mobile rebuild.

## Baseline rule
- Reuse existing Supabase tables and existing backend endpoints when they already support the required behavior.
- Add new contracts only when native mobile introduces a real gap.

## Expected backend touchpoints
- auth session handling
- account summary
- usage and credit balance
- loop generation
- messenger manifest generation
- messenger run lifecycle
- proof upload and visibility
- night ride feed and posting
- leaderboard and rider profile

## Areas likely to require additive work
### Mobile billing verification
- reason:
  - native purchases need verification and entitlement grant
- likely artifacts:
  - a webhook receiver for RevenueCat events
  - updated audit logging
  - product mapping table for store product to credit grant
  - merged mobile purchase history in account summary
- implemented additive path:
  - `functions/api/revenuecat/webhook.js`
  - `db/sql/mobile/mobile_v1_billing.sql`
  - `functions/api/account/summary.js` merge of `stripe_sessions` and `mobile_purchase_events`

### Auth redirect handling
- reason:
  - mobile auth callbacks need app-scheme or universal-link redirects
- likely artifacts:
  - redirect config updates
  - app URL allowlist notes

### Upload hardening
- reason:
  - native camera/media flows may expose stricter MIME, size, and metadata cases
- likely artifacts:
  - validation updates
  - storage policy notes

### Deep link helpers
- reason:
  - challenge share and rider route entry must resolve cleanly in-app
- likely artifacts:
  - share URL normalization
  - mobile-safe redirect handling

## Migration policy
- All mobile-driven changes must be represented as manual SQL files in `db/sql/mobile/`.
- Each SQL file must stay narrow and include:
  - purpose
  - feature dependency
  - rollback notes

## Current expected SQL placeholders
- `mobile_v1_auth.sql`
- `mobile_v1_billing.sql`
- `mobile_v1_uploads.sql`
- `mobile_v1_deeplinks.sql`
