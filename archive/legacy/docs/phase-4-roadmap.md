# Phase 4 Roadmap

Date: 2026-03-12

## Purpose
Phase 4 starts after Phase 3 closes the public social surfaces.

The goal here is to make the product feel sharper and more competitive without bloating it into a generic social app.

## Phase 4 focus

### 1. City standing layer
Make riders readable against their city, not only against themselves.

Scope:
- city-specific standing on public rider pages
- city leaderboard comparisons
- stronger city-lane discovery
- clearer “who owns this lane” signals

Status:
- started
- public rider profiles now include city standing for the rider’s strongest lane
- city standing shows quarter rank, proof/finish totals, and top city leaders
- rider pages now open back into city wall lanes and city boards from the standing card

### 2. Performance and frontend structure
Tighten the app so new features do not keep stacking into one large client bundle.

Scope:
- route/page code splitting
- reduce initial JS weight
- keep motion and media from blocking content

Status:
- started
- removed `framer-motion` from the main app path
- replaced oversized PNG hero assets with compressed JPEGs
- split vendor code into separate React and Supabase chunks
- split Wall of Fame, Leaderboard, and Rider Profile into lazy-loaded route chunks
- rechecked multi-word city filters after the public-surface split
- tightened checkpoint pooling so ranged Alleycat runs stay denser inside expanded-city packs

### 3. Editorial city surfaces
Make public discovery pages feel more intentional.

Scope:
- stronger featured logic on Wall of Fame
- seasonal / quarter framing
- better city lane callouts

Status:
- done
- Wall of Fame now carries featured and spotlight logic with quarter/city framing
- Leaderboard now carries clearer active-board framing without adding page clutter

### 4. Live QA hardening
Close the gap between “implemented” and “robust under live use.”

Scope:
- mixed-user scans on rider pages
- real-city filter verification
- city-pack density review in the expanded set

Status:
- done
- live multi-word city filters were rechecked against public APIs
- public wall / leaderboard / rider routes were rechecked after lazy splitting
- expanded-city manifest generation now prefers denser local checkpoint pools inside the selected range

## Guardrails
- keep comments/likes out
- keep live multiplayer out
- keep user-generated manifests out
- keep AI review-gated

## Success condition
Phase 4 is successful if:
- rider pages compare riders to their city context
- public discovery surfaces feel editorial, not accidental
- frontend weight starts moving down instead of up
- live QA issues are getting burned down, not carried forever

Current result:
- complete
