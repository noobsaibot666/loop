# Phase 5 Roadmap

Date: 2026-03-12

## Purpose
Phase 5 starts after Phase 4 closes public performance and city-context polish.

The goal here is to make city growth, request handling, and release operations feel intentional instead of hidden behind admin-only tooling.

## Phase 5 focus

### 1. City demand layer
Turn city requests into a visible product signal.

Scope:
- public city demand summary
- clearer rider request flow
- demand cues on Home and Alleycat surfaces
- basic request queue visibility for admin

Status:
- started
- public city demand summary is now available to riders on Home and Alleycat
- admin requests now show quick queue counts and top requested cities
- admin requests can now move into `approved_for_draft` and `ai_drafted`
- `Approve + AI draft` now creates an inactive city pack shell for review in City Studio

### 2. Admin release operations
Make admin better at answering one question fast: what needs attention right now?

Scope:
- stronger request queue summary
- cleaner ops prioritization
- visible counts for proof, request, and city-pack state
- reduce “hunt around the admin page” work

Status:
- started
- request queue now exposes total, open, queued, and top-city demand at a glance

### 3. City pack release readiness
Tighten the path from request to active city.

Scope:
- connect demand signals to city studio
- clearer pack status / publish readiness
- better preview confidence before pushing a city live

Status:
- started
- admin can now turn a city request into an AI-drafted inactive city pack for review
- City Studio now shows draft/review/ready/live pack state
- packs now show district coverage and copy-readiness before publish
- admin can now publish a ready pack straight from the pack list

### 4. QA hardening for live use
Keep the product release-ready while the city set grows.

Scope:
- request flow retest
- city-demand API QA
- admin request review QA
- Alleycat generation sanity across the expanded set

## Guardrails
- keep comments/likes out
- keep live multiplayer out
- keep user-generated manifests out
- keep AI review-gated

## Success condition
Phase 5 is successful if:
- riders can see that city requests actually go somewhere
- admin can read demand and act on it quickly
- city growth feels connected to real usage instead of hidden ops work
- release operations stay compact and obvious
