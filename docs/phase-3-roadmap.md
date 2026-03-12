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
- rider profile page renders public stats, bike setup, badges, recent proof, shared-code rider circle, and a closed-run ledger

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
- generated manifests now prefer district spread when the pack has enough variety
- Wave 1 fallback packs now have deeper spot coverage across Berlin, London, and Tokyo
- the richer Wave 1 checkpoint set is now synced into live Supabase
- builder shared-code entry is now modal-based to keep the Alleycat form cleaner
- fallback and builder support now cover the planned 8-city set:
  - Berlin
  - London
  - Tokyo
  - Mexico City
  - Bogota
  - Warsaw
  - Barcelona
  - Sao Paulo
- admin city studio shells now match the expanded city set
- the 8-city expansion set is now synced into live Supabase
- admin preview now calls out weak district spread before publish
- city studio now has checkpoint search, summary chips, and denser checkpoint cards for faster admin review
- public rider profiles now open with a stronger hero, featured latest wall hit, and clearer city/quarter stats
- public Leaderboard now has a stronger winner callout, summary strip, and quicker row scan
- Phase 3 core implementation is now in place; next work should come from live QA or the next roadmap

### 4. Rivalry and social history
Make async competition feel more personal.

Scope:
- cleaner rivalry cards
- better head-to-head summaries
- rematch-friendly challenge surfaces

Status:
- started
- challenge board now includes a clearer head-to-head summary
- riders can run the same manifest back directly from the shared board

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
