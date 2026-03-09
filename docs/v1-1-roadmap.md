# Gimme The Loop V1.1 Roadmap

Date: 2026-03-09

## Purpose
This document defines the next implementation wave after the current V1 launch baseline.

The goal is to add richer Alleycat proof, social visibility, account depth, and city tooling without creating moderation, storage, or product-quality problems that are too heavy for a lean version.

This roadmap should be updated when:
- a phase starts
- a phase is materially rescoped
- a phase is completed

For day-to-day progress tracking, use:
- [v1-1-checklist.md](/Users/alan/_localDEV/Loop/reports/v1-1-checklist.md)

## Guiding constraints
- Keep the product testable on a lean stack.
- Prefer image proof over video proof in the first social version.
- AI can draft and assist, but should not publish city content directly.
- Public social should stay read-only in V1.1.
- Group live mode stays out until the async challenge system is fully solid.

## Current baseline
Already live or implemented in the current product:
- Loop product on `/`
- Alleycat Mode on `/messenger`
- Account page on `/account`
- Admin ops page on `/admin.html`
- Email/password auth
- Premium Alleycat manifest generation
- Geofence checkpoint check-in
- Share code flow
- Friend leaderboard
- Minimal account activity summary

## V1.1 target scope

### Phase 1: Proof and social wall
Add a public proof wall that acts as the app’s social surface.

Status on 2026-03-09:
- Started
- Backend structure, proof upload API, wall feed API, `/wall` page, checkpoint proof upload UI, and minimal admin proof moderation are implemented
- Still open in this phase:
  - live mixed-user feed testing

Scope:
- New public page: `/wall`
- Pinterest-style masonry feed
- Proof cards show:
  - rider name
  - city
  - checkpoint or area label
  - Alleycat marker
  - proof image
  - created date
- Proof creation attached to Alleycat checkpoints
- V1.1 proof type: one photo upload per checkpoint proof
- Proof publication flow:
  - rider uploads image
  - rider can choose whether the proof is public
- No likes
- No comments
- No reposts
- No video in this phase

Why this scope:
- It captures the public energy of the idea.
- It avoids the storage and moderation weight of short video.
- It creates a lightweight social layer without turning the app into a social network.

### Phase 2: Rank, badges, and quarterly awards
Make proof participation visible and rewardable.

Status on 2026-03-09:
- Implemented with derived live data
- Quarter rank is computed from public proof count first and finished Alleycats second
- Badges are derived from rider proof and run behavior without a separate badge table yet
- Top 3 visibility exists on account and admin

Scope:
- Add proof-driven profile metrics:
  - total public proofs
  - completed tasks
  - finished Alleycats
  - current quarter rank
- Add badges:
  - task streak
  - quarter finisher
  - city regular
  - challenge closer
- Add quarterly leaderboard
- Award top 3 task makers every 3 months
- Tie-break by finished Alleycat runs if proof totals match

Notes:
- Keep the ranking logic purely rules-based.
- Avoid manual judging in the first version.

### Phase 3: Account history and shared activity
Make the account page feel data-rich and more social.

Status on 2026-03-09:
- Implemented
- Loop history is now persisted and rendered in account
- Alleycat history, challenge history, best-time/ghost summaries, and shared-rider surfaces are live
- Shared activity exposure stays limited to riders linked through shared challenges

Scope:
- Add run history to `/account`
- Add loop history:
  - last generated loops
  - date
  - route open link if stored
- Add Alleycat history:
  - manifests generated
  - runs started
  - finished times
  - best ghost result
  - challenge outcomes
- Add shared activity visibility:
  - riders you have shared a challenge with
  - recent shared challenge results
  - head-to-head summaries

Privacy rule:
- only expose cross-user activity where users are linked by a shared challenge or explicit friend relationship

### Phase 4: Friend challenge polish
Make async rivalry clearer and more fun.

Status on 2026-03-09:
- Implemented
- Leaderboard entries now carry rider identity labels instead of generic placeholders
- Challenge cards now show derived `open`, `finished`, and `expired` states
- Rivalry summary and winner text are shown directly in the Alleycat run panel
- Expired and already-closed challenge codes are rejected for new joiners

Scope:
- Improve challenge result card
- Add clearer status:
  - open
  - finished
  - abandoned
  - expired
- Add rivalry summaries:
  - you beat X
  - X beat you
  - best time in group
  - fastest clean finish
- Add clearer creator / entrant identity labels

### Phase 5: Recovery and edge-case controls
Remove common failure points.

Status on 2026-03-09:
- Implemented
- Riders can abandon and restart active runs
- Resume is now an explicit option in the Alleycat run panel
- Expired and closed share codes return clear API/UI errors
- Duplicate checkpoint and proof actions return specific feedback
- Out-of-range and location-denied failures now explain what to do next

Scope:
- Abandon run
- Restart current manifest
- Resume active run cleanly
- Handle denied geolocation permission cleanly
- Handle expired share code / closed challenge state
- Improve error messages for:
  - no proof uploaded
  - out-of-range checkpoint
  - duplicate proof
  - challenge no longer active

### Phase 6: City content studio
Create the internal tooling needed to scale city packs.

Status on 2026-03-09:
- Implemented as a minimal admin studio
- City packs and checkpoints are now stored in Supabase
- Admin can create/edit packs and checkpoints, toggle active state, and preview generated manifests
- Live Alleycat generation now prefers published DB packs and falls back to built-in packs if none exist

Scope:
- Admin content surface for city packs
- Create/edit city pack
- Create/edit checkpoint
- Add checkpoint metadata:
  - district
  - category
  - vibe
  - difficulty suitability
  - active / inactive
- Add preview manifest generation
- Add publish / unpublish controls

Why this matters:
- Without this, city growth becomes brittle and manual edits spread across code and database.

### Phase 7: AI-assisted city generation
Use AI where it actually helps without letting it own publishing.

Status on 2026-03-09:
- Implemented as admin-only drafting in the city studio
- AI drafts checkpoint task variants and pack copy suggestions
- Drafts include route-note suggestions, district spread guidance, and tourist-overuse warnings
- Admin still reviews and saves everything manually before publish

Scope:
- AI-assisted task copy generation
- AI-assisted route note generation
- AI-assisted checkpoint spread suggestions
- AI prompt rules:
  - keep language young and direct
  - vary slang lightly without becoming cringe or unreadable
  - avoid overusing iconic tourist-center spots
  - distribute checkpoints across districts
  - keep tasks doable in real riding conditions
- Human/admin review before publish

Recommended model:
- AI drafts
- system scores spread and variety
- admin approves

Implementation note:
- `OPENAI_API_KEY` stays server-side only
- local development reads it from `.env`
- production should provide it as a deployment secret
- admin UI never receives the raw key

Not allowed in V1.1:
- fully autonomous AI publishing
- AI-generated unsafe tasks
- AI-only checkpoint selection without content constraints

## Explicitly deferred
- Live multiplayer group mode
- 5-second proof video uploads
- Comments, likes, and chat
- Public user-generated manifests
- Large moderation workflows

## Data model additions to expect
These should likely be introduced as part of implementation:
- `proof_posts`
- `proof_media`
- `quarterly_rankings`
- `user_badges`
- `friend_links` or `shared_activity_links`
- `city_packs`
- `city_checkpoints`
- `checkpoint_copy_variants`
- `checkpoint_generation_reviews`

## UX principles for this wave
- Keep public social read-only.
- Make creation flows sequential and mobile-first.
- Avoid stuffing every social feature into `/account`.
- Prefer small cards with clear status over large dashboard blocks.
- Keep Alleycat language cool and direct, but not try-hard.

## Implementation order
Recommended order:
1. Proof photo upload + public `/wall`
2. Account history + quarterly badges
3. Friend challenge result polish
4. Recovery controls
5. City content studio
6. AI-assisted city drafting

## Success criteria
This roadmap wave is successful if:
- riders can create public checkpoint proof safely
- the feed feels alive without needing comments/likes
- account pages feel richer and more personal
- challenges are clearer to compare
- city content can grow without editing raw code everywhere
- AI improves variety and tone without reducing quality control
