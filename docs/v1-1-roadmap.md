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

Related follow-on docs:
- [payment-and-credits.md](/Users/alan/_localDEV/Loop/docs/payment-and-credits.md)
- [night-ride-shadow-roadmap.md](/Users/alan/_localDEV/Loop/docs/night-ride-shadow-roadmap.md)
- [night-ride-shadow-checklist.md](/Users/alan/_localDEV/Loop/reports/night-ride-shadow-checklist.md)

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

Status on 2026-03-15:
- Core V1.1 product phases are functionally covered
- Remaining live backend gaps sit mostly inside Phase 12 membership/community rollout
- Night Ride now exists as a hidden shadow-development track and is intentionally kept outside the public nav
- Night Ride shadow scope now includes Single/Crew builder split plus account, wall, and admin preview surfaces

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

### Phase 9: Moderation and abuse tooling
Tighten the control layer now that public proof, city rollout, and tester traffic are broader.

Status on 2026-03-14:
- Implemented as a lean moderation pass
- Wall moderation already supports hide, archive, and delete
- Admin overview now includes an abuse watch surface for suspicious rider proof patterns
- Moderation actions are now logged with admin identity and surfaced back into the admin overview

Scope:
- Add stronger proof moderation states:
  - live
  - hidden
  - archived
  - deleted
- Add rider abuse review tools:
  - repeated proof spam visibility
  - suspicious upload patterns
- Add basic action history for admin moderation changes
- Add clearer admin guardrails for destructive actions

Why this matters:
- V1 now has enough public surface area that moderation needs to move beyond one-click cleanup.

### Phase 10: Analytics and ops visibility
Make release health, usage, and failure patterns visible without opening a full BI project.

Status on 2026-03-14:
- Implemented
- Admin overview now exposes proof volume, active runs, checkout failures, city pulse, abuse watch, and weekly / monthly snapshots
- Public leaderboard now supports country filtering and cleaner visual hierarchy for broader tester use
- Admin ops surface has also been hardened for mobile so key sections remain usable on phones

Scope:
- Add a clearer admin ops dashboard for:
  - active riders
  - manifests generated
  - finished runs
  - proof posts
  - credit top-ups
  - city usage by demand and run volume
- Add route and run failure visibility:
  - checkout failures
  - abandoned runs
  - hidden / archived proof load
- Add simple date-range snapshots for weekly / monthly review

Why this matters:
- More cities and more testers mean the team needs fast ops reads, not guesses.

### Phase 11: Mobile recovery hardening
Handle ugly edge cases on phones without dumping riders into dead ends.

Status on 2026-03-14:
- Implemented as a recovery pass
- Active Alleycat recovery already persists and reloads
- Loop builder state now persists locally too
- Auth/session expiry and checkout cancel states now return cleaner rider-facing recovery copy
- Proof upload now stages the uploaded image locally so riders can finish posting after refresh or a final API hiccup

Scope:
- Tighten recovery for:
  - app reload during an active Alleycat
  - loop builder reload
  - auth/session expiry during a run
  - failed top-up attempts
  - low-credit failure at the wrong moment
- Add clearer rider-facing recovery states:
  - what failed
  - what was kept
  - what to do next
- Keep recovery copy short and branded, not technical

Why this matters:
- Edge-case recovery on mobile is now product quality, not polish.

### Phase 12: Membership and community access
Make the paid lane community-first. Membership should connect riders with the same culture and interests. Credit bonus value can exist, but it should not be the core reason the pass exists.

Status on 2026-03-14:
- Started
- Community pass is intentionally hidden until the real Discord setup and recurring billing flow are ready
- Public membership messaging has been pulled back out of the main app
- Current server invite reserved for launch: `https://discord.gg/2wWFKuQ7`

Scope:
- Add a paid community pass:
  - 5 USD / month
  - Discord community access
  - monthly bonus credit drop
- Make credit usage clearer in account:
  - Loop cost
  - Alleycat cost
  - what free loops cover
  - what paid credits cover
- Add a dedicated community / membership surface
- Add account entry point for community access
- Keep the home page aware of the community lane without turning it into a pricing page

Open backend work:
- recurring membership checkout flow
- subscription state on user account
- Discord invite / access handling
- monthly bonus-credit grant automation

Release note:
- Keep community / Discord access hidden in the live app until the real server, invite flow, and billing logic are ready.

### Shadow follow-on: Night Ride
Night Ride is now being built as a hidden companion lane rather than as part of the live V1.1 nav.

Status on 2026-03-15:
- Hidden `/night` route is implemented
- Night Loop and Roulette builders are implemented
- Join-by-code and read-only feed preview are implemented
- SQL still needs manual Supabase application before any live rollout

Scope boundary:
- keep Night Ride off the public nav
- keep Night Ride feed separate from Wall of Fame
- do not promote or launch until route quality, join stability, and moderation rules are ready

See:
- [night-ride-shadow-roadmap.md](/Users/alan/_localDEV/Loop/docs/night-ride-shadow-roadmap.md)
- [night-ride-shadow-checklist.md](/Users/alan/_localDEV/Loop/reports/night-ride-shadow-checklist.md)

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

Current reading on 2026-03-15:
- The original V1.1 implementation order has been materially completed.
- What remains is mostly launch gating, deferred community billing/access work, and shadow follow-ons such as Night Ride.
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
