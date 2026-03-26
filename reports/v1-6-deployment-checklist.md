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
- [ ] Confirm deploy candidate branch/commit
- [ ] Run final local `npm run build`
- [ ] Confirm Cloudflare Pages env/config
- [ ] Deploy to Cloudflare staging/preview
- [ ] Capture preview URL
- [ ] Smoke-test hosted public routes
- [ ] Smoke-test hosted protected routes

## Phase 9: Online review pass
- [ ] Desktop page review on hosted build
- [ ] Mobile page review on hosted build
- [ ] Collect live-only regressions
- [ ] Fix and redeploy staging issues
- [ ] Re-approve hosted build

## Phase 10: Production cutover readiness
- [ ] Final hosted rider flow check
- [ ] Final hosted admin flow check
- [ ] Final hosted feed/moderation check
- [ ] Confirm no legacy route exposure remains
- [ ] Production go/no-go approval

## Phase 11: Production deploy and watch
- [ ] Deploy approved React build to production target
- [ ] Verify main public URL after cutover
- [ ] Immediate production smoke
- [ ] Post-launch monitoring window
- [ ] Close deployment phase
