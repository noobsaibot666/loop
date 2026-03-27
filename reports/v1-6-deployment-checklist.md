# V1.6 Deployment Checklist

Date created: 2026-03-26

Status legend:
- `[x]` done
- `[ ]` not started
- `[-]` intentionally deferred

Related docs:
- [v1-6-deployment-roadmap.md](/Users/alan/_localDEV/Loop/docs/v1-6-deployment-roadmap.md)
- [v1-5-modular-upgrade-roadmap.md](/Users/alan/_localDEV/Loop/docs/v1-5-modular-upgrade-roadmap.md)

## Phase 8: Cloudflare staging deploy
- [x] Confirm deploy candidate branch/commit
- [x] Run final local `npm run build`
- [x] Confirm Cloudflare Pages env/config
- [x] Deploy to Cloudflare staging/preview
- [x] Capture preview URL
- [x] Smoke-test hosted public routes
- [x] Smoke-test hosted protected routes

Phase 8 notes:
- staging alias: `https://phase8-staging.gimme-the-loop.pages.dev`
- preview deployment: `https://9c071be6.gimme-the-loop.pages.dev`

## Phase 9: Online review pass
- [ ] Desktop page review on hosted build
- [ ] Mobile page review on hosted build
- [ ] Collect live-only regressions
- [ ] Fix and redeploy staging issues
- [ ] Re-approve hosted build

Phase 9 note:
- This is now the main remaining product lane. Keep work limited to hosted page-by-page review and polish.

## Phase 10: Production cutover readiness
- [x] Final hosted rider flow check
- [x] Final hosted admin flow check
- [x] Final hosted feed/moderation check
- [x] Confirm no legacy route exposure remains
- [x] Production go/no-go approval

Phase 10 notes:
- legacy `.html` URLs now redirect to React routes with `301`

## Phase 11: Production deploy and watch
- [x] Deploy approved React build to production target
- [x] Verify main public URL after cutover
- [x] Immediate production smoke
- [ ] Post-launch monitoring window
- [ ] Close deployment phase

Phase 11 note:
- Remaining work here is monitoring and hotfix response only.

Phase 11 notes:
- main root: `https://gimme-the-loop.pages.dev`
- production deployment: `https://0e9a5130.gimme-the-loop.pages.dev`
