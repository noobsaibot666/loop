# V1.1 Checklist

Date created: 2026-03-09
Status legend:
- `[x]` done
- `[ ]` not started
- `[-]` intentionally deferred

Update rule:
- After each implementation, mark the completed steps here.
- If scope changes, update this file and the roadmap together.

Related docs:
- [v1-1-roadmap.md](/Users/alan/_localDEV/Loop/docs/v1-1-roadmap.md)
- [product-v1.md](/Users/alan/_localDEV/Loop/docs/product-v1.md)

## Phase 0: Current baseline
- [x] Loop home page exists
- [x] Alleycat page exists
- [x] Account page exists
- [x] Admin page exists
- [x] Email/password auth exists
- [x] Alleycat manifest generation exists
- [x] Geofence checkpoint check-in exists
- [x] Share code flow exists
- [x] Friend leaderboard exists
- [x] Minimal account usage summary exists

## Phase 1: Proof and wall
- [x] Create database structure for proof posts
- [x] Create storage strategy for proof images
- [x] Add checkpoint proof upload flow
- [x] Add public/private proof visibility choice
- [x] Create public `/wall` page
- [x] Render masonry-style proof cards
- [x] Show rider name on proof cards
- [x] Show city and checkpoint/area on proof cards
- [x] Show Alleycat marker on proof cards
- [x] Add proof fetch API
- [x] Add proof upload API
- [x] Add minimal proof moderation controls for admin
- [-] 5-second proof video support
- [-] comments
- [-] likes

## Phase 2: Rank and awards
- [x] Create quarterly ranking structure
- [x] Track completed public proofs per user
- [x] Add badge model
- [x] Add badge display in account
- [x] Add quarterly leaderboard
- [x] Add top-3 task maker logic
- [x] Add tie-break by finished Alleycat runs
- [x] Add award-ready admin visibility

## Phase 3: Account history
- [x] Add loop history list
- [x] Add Alleycat run history list
- [x] Add best time / ghost result summaries
- [x] Add challenge history list
- [x] Add shared activity summaries
- [x] Add riders-you-raced-with surface
- [x] Keep privacy limited to shared or linked activity

## Phase 4: Friend challenge polish
- [x] Improve leaderboard identity labels
- [x] Add challenge status labels
- [x] Add rivalry summary text
- [x] Add best completed time emphasis
- [x] Add cleaner “who won” state
- [x] Add expired or closed challenge handling

## Phase 5: Recovery and edge cases
- [x] Add abandon run action
- [x] Add restart manifest action
- [x] Add explicit resume action
- [x] Improve location denied messaging
- [x] Improve expired share code handling
- [x] Improve duplicate proof/checkpoint feedback
- [x] Improve out-of-range guidance

## Phase 6: City content studio
- [x] Create city pack tables or structure
- [x] Create checkpoint management surface
- [x] Add district/category/vibe metadata
- [x] Add publish/unpublish controls
- [x] Add preview manifest generation
- [x] Add admin checkpoint editing
- [x] Add admin task copy editing

## Phase 7: AI-assisted content tooling
- [x] Define AI prompt rules for task copy
- [x] Generate slang-aware task draft variants
- [x] Generate route-note variants
- [x] Add district spread suggestions
- [x] Add tourist-overuse avoidance rules
- [x] Require admin review before publish
- [-] fully autonomous AI publishing

## Phase 8: Deferred V2 ideas
- [-] live group mode
- [-] live map competition
- [-] public user-generated manifests
- [-] full social graph
- [-] comment/reaction systems

## Phase 9: Moderation and abuse tooling
- [ ] Add proof moderation states beyond live/delete
- [ ] Add rider abuse review surface
- [ ] Add proof spam / suspicious activity visibility
- [ ] Add moderation action history
- [ ] Tighten destructive admin action guardrails

## Phase 10: Analytics and ops dashboard
- [ ] Add admin metrics for active riders and city usage
- [ ] Add manifest / run / proof trend summaries
- [ ] Add credit top-up visibility
- [ ] Add failure-rate visibility for manifest, proof, and share flows
- [ ] Add weekly / monthly ops snapshots

## Phase 11: Mobile recovery hardening
- [ ] Handle refresh during active Alleycat more safely
- [ ] Improve proof upload interruption recovery
- [ ] Improve auth/session expiry recovery mid-flow
- [ ] Improve failed checkout / top-up recovery
- [ ] Improve low-credit interruption handling
- [ ] Keep recovery copy short and rider-facing

## Phase 12: Membership and credit economy
- [x] Add home awareness of the crew pass
- [x] Add account entry point for community access
- [x] Clarify Loop vs Alleycat credit usage in account
- [x] Add dedicated membership/community page
- [ ] Add recurring 4 EUR / month checkout flow
- [ ] Add account subscription state
- [ ] Add gated Discord invite/access handling
- [ ] Add automatic monthly free-credit grant for members

## Testing checklist for this wave
- [ ] Proof upload works on mobile
- [ ] Proof wall loads with mixed users and cities
- [ ] Quarterly ranking updates correctly
- [x] Account history reflects loop + Alleycat usage
- [x] Shared challenge activity shows correctly
- [x] Recovery flows do not corrupt runs
- [x] Admin content tooling can add a city pack without manual DB edits
- [x] AI drafting stays review-gated
