# Phase 8 Checklist

Date created: 2026-03-13

Status legend:
- `[x]` done
- `[ ]` open
- `[-]` deferred

Related docs:
- [phase-8-roadmap.md](/Users/alan/_localDEV/Loop/docs/phase-8-roadmap.md)
- [phase-7-live-qa.md](/Users/alan/_localDEV/Loop/reports/phase-7-live-qa.md)

## Release hardening
- [x] Run live QA pass across home, cities, wall, leaderboard, and public rider pages
- [x] Confirm lazy public routes recover from loading fallback into live content
- [x] Add a repeatable release smoke checklist for public and admin flows
- [ ] Tighten loading and empty states where they still feel too generic

## Admin safety and moderation
- [x] Make destructive admin actions clearer before trigger
- [ ] Tighten archive / hide / delete scan speed in the admin Wall of Fame flow
- [ ] Re-test month archive flow on live data
- [ ] Re-test pack publish flow on a reviewed draft

## City pack integrity
- [ ] Re-test pack readiness against weak district spread
- [ ] Re-test publish blockers against copy-missing packs
- [ ] Verify live pack state matches admin review state after publish

## Failure recovery
- [ ] Review QA-mode settings that still exist for Alleycat testing
- [ ] Remove temporary testing affordances when the live product no longer needs them
- [ ] Tighten fallback messaging for thin or missing city data

## Deferred
- [-] live multiplayer
- [-] comments
- [-] likes
- [-] public user-generated manifests
