# V1.6 Deployment Checklist

Date updated: 2026-03-30

Status legend:
- `[x]` done
- `[ ]` next
- `[-]` deferred

## Current production state
- [x] Community pass checkout is live on `gimme-the-loop.pages.dev`
- [x] Discord OAuth link flow is live
- [x] Discord role grant on paid access is working
- [x] Discord role revoke on cancellation is working
- [x] `Open Discord` opens the server directly instead of the expired invite
- [x] Community lifecycle emails are implemented in code
- [x] Resend test sender is configured in production

## Phase 1: Community pass baseline
- [x] Stripe subscription flow deployed
- [x] Membership row synced in Supabase
- [x] Discord guild join working
- [x] Rider role assignment working
- [x] Cancellation request path tested
- [x] Production account card reflects active membership and linked Discord state

Phase 1 notes:
- Guild id in use: `1482723182447165501`
- Community role in use: `Rider`
- Bot must remain above `Rider` in Discord role order

## Phase 2: Email and welcome polish
- [x] Branded activation email template implemented
- [x] Branded Discord-linked email template implemented
- [x] Branded cancellation email template implemented
- [ ] Verify all three emails arrive in production end to end
- [ ] Replace `onboarding@resend.dev` with a branded sender domain
- [ ] Brand the Discord welcome/onboarding experience inside Discord

Phase 2 notes:
- Current sender is safe for testing only
- Production sender should move to a verified domain like `crew@...`
- Discord welcome copy, channels, and server guide must be configured in Discord, not in the app

## Phase 3: Membership ops hardening
- [ ] Re-test cancel flow on production and confirm role revoke every time
- [ ] Decide whether revoke should remove only the role or kick the member
- [ ] Add a lightweight event log for Discord sync + membership emails
- [ ] Add admin visibility for community pass state changes
- [ ] Add retry handling for failed Discord sync or failed email delivery

Phase 3 notes:
- `DISCORD_KICK_ON_REVOKE=false` is the current safe setting
- Keep role-revoke-only until repeated production verification is complete

## Phase 4: Rider account and bike flow follow-up
- [x] Multi-bike profile support implemented
- [x] Bike selection appears in builders before start
- [x] Bike data is wired into run data
- [ ] Confirm bike + ratio show consistently in wall and leaderboard surfaces
- [ ] Final mobile QA pass for account cards and builder selectors
- [ ] Add stronger admin visibility into bike usage by run

## Phase 5: Route and builder stability
- [x] Loop and night ride route generation hardened
- [x] Mobile Google Maps handoff hardened
- [x] Route troubleshooting doc added
- [x] Route guardrail workflow added
- [ ] Run another mobile real-device loop smoke test after current account/community changes

Related docs:
- [loop-route-troubleshooting.md](/Users/alan/_localDEV/Loop/docs/loop-route-troubleshooting.md)
- [route-generation-guardrails.md](/Users/alan/_localDEV/Loop/.agent/workflows/route-generation-guardrails.md)

## Before next deploy
- [ ] Confirm Resend production sender/domain
- [ ] Run one fresh subscription on production
- [ ] Confirm activation email arrives
- [ ] Confirm Discord-linked email arrives
- [ ] Cancel subscription and confirm cancellation email arrives
- [ ] Confirm Discord role is revoked after cancellation
- [ ] Run `npm run build`

## Recommended next execution order
1. Verify production emails with the current Resend test sender.
2. Configure a branded sending domain in Resend.
3. Brand the Discord server welcome/onboarding flow.
4. Re-run full membership lifecycle test on production.
5. Commit and tag the community/email milestone.
