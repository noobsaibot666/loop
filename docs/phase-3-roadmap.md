# Phase 3 Roadmap

Date: 2026-03-12

## Purpose
Phase 3 starts after the V1.1 build is functionally complete and the remaining Phase 2 items are mostly live QA.

The goal here is to deepen the social and content surfaces without turning the product into a bloated social app.

## Phase 3 focus

### 1. Public rider layer
Make riders discoverable across the product.

Scope:
- public rider profile pages
- links from Wall of Fame
- links from Leaderboard
- visible rider stats:
  - public proofs
  - finished runs
  - quarter rank
  - best finish
  - bike setup

Status:
- started
- public rider profile route and API implemented
- Wall of Fame cards link into rider profiles
- Leaderboard rows link into rider profiles
- rider profile page renders public stats, bike setup, badges, and recent proof

### 2. Social surface polish
Turn the read-only public surfaces into something more connected.

Scope:
- better Leaderboard page hierarchy
- stronger Wall of Fame filtering
- city tags and top-city signals
- quarter winners callout

Status:
- started
- city filters are live on Wall of Fame
- city filters are live on Leaderboard
- quarter leader callout is live on the public Leaderboard
- top-3 winner visibility is live on the admin quarter board
- Leaderboard hierarchy now includes summary stats and a podium block

### 3. City content quality
Make city packs feel more like real alleycats and less like generic route data.

Scope:
- richer checkpoint libraries
- better district spread rules
- stronger task tone review
- admin preview improvements

Status:
- started
- admin pack visibility now shows pack state plus checkpoint counts
- admin preview now breaks route line, spread lock, finish call, and safety frame into clear sections
- rider-facing manifest copy now renders as labeled route / spread / finish blocks
- next focus is deeper Wave 1 checkpoint density and better district spread before the bigger city expansion pass

### 4. Rivalry and social history
Make async competition feel more personal.

Scope:
- cleaner rivalry cards
- better head-to-head summaries
- rematch-friendly challenge surfaces

## Guardrails
- keep comments/likes out
- keep video out
- keep live multiplayer out
- keep AI review-gated

## Success condition
Phase 3 is successful if:
- public rider pages feel useful and linkable
- leaderboard and wall feel connected
- city content quality improves without opening moderation problems
