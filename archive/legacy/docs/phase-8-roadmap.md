# Phase 8 Roadmap

Date: 2026-03-13

## Purpose
Phase 8 starts after Phase 7 closes Alleycat gameplay depth.

The goal here is to harden the live product around release quality, moderation safety, and admin control without bloating the public experience.

Status: in progress

## Phase 8 focus

### 1. Release hardening
Tighten the live product around the paths riders and admins use most.

Scope:
- document and repeat real usage QA paths
- reduce obvious failure points in public routes
- tighten fallbacks, empty states, and loading states
- keep production behavior consistent with the shipped design

Status:
- in progress
- release smoke checklist added
- destructive admin actions now carry clearer warnings
- Phase 7 live QA pass is complete

### 2. Admin safety and moderation
Make moderation and release tools safer to use in the live product.

Scope:
- clearer destructive actions
- cleaner archive / hide / delete flows
- safer month archive and release actions
- tighter request-to-release review path

Status:
- open

### 3. City pack integrity
Keep live city packs tighter as the city set grows.

Scope:
- stronger pack warnings
- better publish blockers
- district spread and copy checks
- clearer release-read state inside City Studio

Status:
- open

### 4. Failure recovery
Make operational mistakes cheaper.

Scope:
- clearer admin recovery messaging
- better broken-pack handling
- safer fallback behavior when live city data is thin
- cleaner QA-mode removal path when test toggles are no longer needed

Status:
- open

## Guardrails
- keep the product mobile-first
- keep the public experience minimal and on-brand
- do not add comments/likes
- do not add live multiplayer
- do not add public user-generated manifests

## Success condition
Phase 8 is successful if:
- live QA paths are stable and repeatable
- admin release actions are safer and clearer
- city pack publishing is harder to misuse
- the product feels release-ready, not just feature-complete
