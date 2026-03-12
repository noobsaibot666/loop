# Phase 6 Roadmap

Date: 2026-03-12

## Purpose
Phase 6 starts after Phase 5 closes the request-to-release city flow.

The goal here is to turn city growth into a public discovery layer instead of leaving it hidden across Alleycat builder state, demand chips, and admin-only tooling.

Status: complete

## Phase 6 focus

### 1. Public city directory
Give riders one clear place to browse live cities, in-review lanes, and demand-only asks.

Scope:
- public city lanes API
- `/cities` page
- direct jumps from city lanes into Alleycat, Wall of Fame, and Leaderboard

Status:
- complete

### 2. City-based discovery
Make city lanes feel like real product territory, not just filter names.

Scope:
- city-level summaries
- clearer live vs next-up separation
- stronger movement between city surfaces

Status:
- complete
- editorial lead-lane and hot-ask framing added
- city-specific jumps into Wall of Fame and Leaderboard tightened

### 3. Release visibility
Expose the result of city demand and release work publicly in a controlled way.

Scope:
- show live lanes
- show next-up lanes
- reflect demand without exposing admin-only internals

## Guardrails
- keep comments/likes out
- keep live multiplayer out
- keep public user-generated manifests out
- keep AI review-gated

## Success condition
Phase 6 is successful if:
- riders can see which cities are live right now
- riders can see which lanes are building next
- city discovery feeds Alleycat, Wall of Fame, and Leaderboard cleanly
- city growth feels like part of the product, not hidden ops

Result:
- complete
- verified on production with 8 live city lanes returned by `/api/city-lanes`
