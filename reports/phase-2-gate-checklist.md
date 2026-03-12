# Phase 2 Gate Checklist

Date created: 2026-03-09
Last cleaned: 2026-03-12

Purpose:
- Track only what still needs testing, approval, or follow-up before moving from the current V1.1 build into the next major phase.

Status legend:
- `[ ]` still needs testing or approval
- `[-]` intentionally deferred

## Wall and social surface
- [x] Wall loads correctly with mixed users and cities
- [x] Admin hide/show for proof posts works correctly from the admin page
- [ ] Admin delete for proof posts works correctly from the admin page
- [ ] Month archive works correctly in admin and archived posts disappear from the public wall

## Shared challenge flow
- [ ] Leaderboard page and shared challenge board need final UX review on live data
- [ ] Share code action after manifest generation needs live retest with the stronger button treatment

## Account data richness
- [ ] Quarter board renders correctly on real rider data
- [ ] Ghost targets feel challenging but still fair on real rider runs

## Admin tooling
- [ ] City request flow needs full retest
  Rider side: user can request a city or riding area from the app
  Admin side: requests show up clearly and can be reviewed
- [ ] City pack create/edit flow needs final UX cleanup and retest
- [ ] Preview manifest flow in admin needs retest with current city packs
- [ ] AI draft output review gate needs explicit verification
  Confirm drafts never auto-publish without admin action

## QA-only settings to remove before wider release
- [ ] Remove temporary Alleycat QA mode
  Current QA mode allows 1-stop and 2-stop runs, plus 1 km / 2 km spread testing
