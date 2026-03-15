# Gimme The Loop V1.2 Roadmap

Date: 2026-03-15

## Purpose
V1.2 moves the product from a strong solo Alleycat/Loop test app into a more community-shaped version.

The focus is:
- Night Ride as its own culture lane
- community membership prep for Discord access
- stronger moderation for image-led community surfaces
- cleaner mobile navigation once the new sections are real

Use this roadmap for phase intent.
Use [v1-2-checklist.md](/Users/alan/_localDEV/Loop/reports/v1-2-checklist.md) for execution status.

## Guardrails
- Do not launch Discord/community billing until the server, invite flow, and account state are stable.
- Keep Night Ride separate from Wall of Fame until moderation rules are explicit.
- Keep subscription billing separate from one-time credit top-ups.
- Community membership is for access and belonging first; any credits are a bonus.

## Phase 1: Night Ride foundation
Status on 2026-03-15:
- Implemented in shadow form

Scope:
- hidden `/night` route
- Single vs Crew toggle
- Night Loop and Roulette builders
- Crew name, city, and member tagging
- Crew share-code flow
- account reflection
- Wall shadow section
- admin shadow preview panel
- home construction promo

## Phase 2: Night Ride posting
Status on 2026-03-15:
- Not started

Scope:
- upload crew/single ride photo after ride
- post metadata:
  - crew or rider name
  - city
  - route title
  - distance
  - crop ratio
- public Night Ride wall browsing

## Phase 3: Night Ride moderation
Status on 2026-03-15:
- Not started

Scope:
- offensive text review
- offensive image review
- hide / flag / delete flow for Night Ride posts
- merge Night Ride actions into admin moderation history

## Phase 4: Community membership billing
Status on 2026-03-15:
- Billing and entitlement backend started

Scope:
- Stripe monthly subscription checkout
- fixed price: `5 USD / month`
- account subscription state
- webhook + verify fallback
- Discord invite gated entitlement flow
- subscription lifecycle sync on update/cancel

Important:
- membership remains non-promoted until the community lane is operational
- credits are not the core purchase reason

## Phase 5: Community launch surfaces
Status on 2026-03-15:
- Not started

Scope:
- membership page copy for launch
- account membership section
- controlled home promotion
- Discord access instructions

## Phase 6: Mobile navigation rethink
Status on 2026-03-15:
- Not started

Scope:
- compact header nav for added surfaces
- burger-menu rethink for mobile
- keep language switcher stable
- avoid hero overlap and page jump

## Required SQL for V1.2
- [night_rides_shadow.sql](/Users/alan/_localDEV/Loop/db/sql/night_rides_shadow.sql)
- [community_memberships.sql](/Users/alan/_localDEV/Loop/db/sql/community_memberships.sql)
- [moderation_action_history.sql](/Users/alan/_localDEV/Loop/db/sql/moderation_action_history.sql)
