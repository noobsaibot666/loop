# Gimme The Loop: V1.6 Deployment Roadmap

**Date:** March 2026  
**Status:** In progress

Context:
- V1.5 modular migration, cleanup, and finalization are complete locally.
- The active app is now the React system.
- Cloudflare staging and production deploys have already been completed for the React cut.
- The main root now serves the React app.
- This roadmap now covers the remaining hosted review, cutover verification, and post-launch watch lane.

Related docs:
- [v1-5-modular-upgrade-roadmap.md](/Users/alan/_localDEV/Loop/docs/v1-5-modular-upgrade-roadmap.md)
- [v1-5-production-parity-checklist.md](/Users/alan/_localDEV/Loop/reports/v1-5-production-parity-checklist.md)
- [v1-6-deployment-checklist.md](/Users/alan/_localDEV/Loop/reports/v1-6-deployment-checklist.md)

---

## Phase 8: Cloudflare Staging Deploy
- [x] Verify current branch/worktree is the intended deploy candidate.
- [x] Re-run local build and confirm `npm run build` is still green immediately before deploy.
- [x] Confirm environment variables required by Cloudflare Pages are present and current.
- [x] Deploy the React app to Cloudflare Pages staging/preview.
- [x] Capture the preview URL and deployment metadata.
- [x] Verify the live preview serves the React routes correctly:
  - `/`
  - `/loop`
  - `/messenger`
  - `/night`
  - `/wall`
  - `/cities`
  - `/leaderboard`
  - `/account`
  - `/admin`
  - `/how`
  - `/privacy`
  - `/terms`
  - `/coffee`
- [x] Verify hosted asset loading, route chunks, and image delivery on Cloudflare.
- [x] Verify the deployed app points to the correct backend/runtime environment.

Exit criteria:
- A stable Cloudflare preview is online.
- Public and protected routes load successfully in the hosted environment.
- No staging-only runtime regression appears versus local.

Completed:
- staging alias: `https://phase8-staging.gimme-the-loop.pages.dev`
- preview deployment: `https://9c071be6.gimme-the-loop.pages.dev`

---

## Phase 9: Online Review & Fix Pass
- [ ] Review the live React app page by page in desktop.
- [ ] Review the live React app page by page in mobile.
- [ ] Compare hosted behavior against local behavior and the former production experience.
- [ ] Collect live-only issues:
  - routing
  - auth/session behavior
  - Cloudflare caching quirks
  - asset loading
  - image sizing
  - builder behavior
  - wall/feed rendering
  - admin runtime behavior
- [ ] Fix staging-discovered issues without regressing local parity.
- [ ] Re-deploy to staging after each meaningful fix batch.
- [ ] Repeat until the hosted React app is approved visually and functionally.

Expected focus:
- pages may need another review once online
- final page-specific polish may happen here if hosting exposes differences not seen locally
- this is the intended lane for “review some pages after the new React is online”

Exit criteria:
- Hosted desktop and mobile review are accepted.
- No known staging regression remains open.

Current status:
- This is the primary remaining development lane.
- Work here should now be page-by-page hosted review and focused polish only.
- Core migration, deploy, cutover, and cleanup work are already complete.

---

## Phase 10: Production Cutover Readiness
- [x] Confirm staging build is the exact candidate for production.
- [x] Run final release-readiness sweep against the staging URL.
- [x] Confirm rider/admin/public core flows on hosted runtime one last time.
- [x] Confirm legal/help/support routes are reachable from the hosted footer.
- [x] Confirm Night Ride moderation and proof moderation on hosted runtime.
- [x] Confirm there are no legacy static dependencies still exposed to users.
- [x] Approve production cutover.

Exit criteria:
- The hosted React app is approved as the new production surface.
- No known blocker remains for replacing the older live version.

Completed:
- legacy `.html` paths now redirect cleanly to React routes:
  - `/admin.html -> /admin`
  - `/membership.html -> /account`
  - `/how.html -> /how`
  - `/privacy.html -> /privacy`
  - `/terms.html -> /terms`
  - `/coffee.html -> /coffee`

---

## Phase 11: Production Deploy & Post-Launch Watch
- [x] Deploy approved build to the production Cloudflare target.
- [x] Verify main public URL behavior after cutover.
- [x] Run immediate smoke on:
  - Home
  - Loop
  - Street Hunt
  - Night Ride
  - Wall
  - Leaderboard
  - Account
  - Admin
- [ ] Monitor first post-launch issues:
  - auth/session problems
  - route failures
  - asset loading
  - moderation failures
  - feed write/read regressions
- [ ] Apply hotfixes if needed.
- [ ] Mark the React migration fully live.

Exit criteria:
- Production React app is live and stable.
- Post-launch monitoring window closes without critical blocker.

Current status:
- The React app is already live.
- Remaining work here is monitoring and hotfix response only.

Completed:
- main root: `https://gimme-the-loop.pages.dev`
- production deployment: `https://0e9a5130.gimme-the-loop.pages.dev`

---

## Deployment Principles
- Staging first, never direct-to-production without review.
- Fix hosted issues in focused batches, not ad hoc panic edits.
- Keep deploy, review, and cutover as separate phases.
- Do not archive or delete more legacy material during deployment unless it directly blocks release.
- Treat hosted behavior as a separate validation lane from local parity.
