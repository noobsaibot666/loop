# Phase 2 Gate Checklist

Date created: 2026-03-09

Purpose:
- Track what still needs testing or approval before moving from the current V1.1 build into the next major phase.

Status legend:
- `[ ]` still needs testing or approval
- `[-]` intentionally deferred

## Product readiness
- [ ] Admin page feels clean and dashboard-like instead of one long block stack
- [ ] Admin sections are grouped clearly: overview, ops, wall, city studio
- [ ] City studio is clear enough to use without guessing the order
- [ ] AI pack drafting avoids tourist-guide tone and feels like real alleycat culture

## Auth and account
- [ ] Logout works cleanly and clears rider state
- [ ] Password update works while logged in
- [ ] Admin account is recognized correctly through `ADMIN_EMAILS`

## Loop product
- [ ] Loop history is written to account history

## Alleycat core flow
- [ ] Finish run works only after valid checkpoint completion
- [ ] Checkpoint completion state feels obvious after check-in
- [ ] Follow-up task system for checkpoints is defined

## Checkpoint and proof flow
- [ ] Photo proof upload works on desktop
- [ ] Photo proof upload works on mobile
- [ ] Duplicate proof upload is blocked cleanly
- [ ] Public/private proof selection works

## Wall and social surface
- [ ] Public proof posts appear on `/wall`
- [ ] Wall loads correctly with mixed users and cities
- [ ] Proof cards show rider, city, checkpoint, and image correctly
- [ ] Admin can hide/show proof posts from the wall

## Shared challenge flow
- [ ] Leaderboard shows rider names and statuses cleanly
- [ ] Winner state updates correctly after completed runs
- [ ] Expired or closed codes are handled clearly

## Account data richness
- [ ] Quarter board renders correctly
- [ ] Badge logic looks correct on real rider data
- [ ] Loop history looks correct
- [ ] Alleycat history looks correct
- [ ] Challenge log looks correct
- [ ] Shared rider list looks correct

## Admin tooling
- [ ] Credit reset/set tools work
- [ ] City pack create/edit works
- [ ] Checkpoint create/edit works
- [ ] Preview manifest works from admin tools
- [ ] AI pack draft works
- [ ] AI draft output remains review-gated and is never auto-published

## Infrastructure and deployment
- [ ] Cloudflare production has required secrets configured
- [ ] Supabase schema matches the live app behavior
