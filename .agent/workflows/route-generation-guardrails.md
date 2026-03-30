# Route Generation Guardrails

Use this rule when touching anything related to:

- `/loop`
- `/night`
- route builders
- Google Maps links
- ORS route generation
- loop history links
- mobile map opening behavior

## Goal

Do not ship any change that can collapse a real loop into a broken start-to-start route, a straight out-and-back line, or a mobile-only bad handoff.

## Non-Negotiable Rules

1. Keep loop and night ride route logic aligned.
   If a route-generation fix is made in one path, review the matching path in the other runtime too:
   - `functions/api/loop.js`
   - `functions/api/night-rides/generate.js`
   - `server/index.js`
   - `shared/loop-quality.js`
   - `shared/night-rides.js`
   - `src/store/useLoopStore.ts`
   - `src/utils/maps.ts`

2. Never emit a loop URL with zero usable waypoints.
   A route like `.../maps/dir/<origin>/<origin>/...` is broken and must never be produced.

3. Do not reintroduce query-string loop URLs as the primary format.
   Loop routes must use path-style Google Maps directions:

   ```text
   https://www.google.com/maps/dir/lat,lng/lat,lng/.../lat,lng/data=!4m2!4m1!3e1
   ```

4. Do not bypass shared loop guards.
   The source of truth is in `shared/loop-quality.js`:
   - `MIN_LOOP_WAYPOINTS`
   - `hasUsableLoopWaypoints(...)`
   - `buildGoogleMapsLoopUrl(...)`
   - `buildFallbackLoopWaypoints(...)`

5. Mobile map opening must be treated as a separate risk.
   If you change `src/utils/maps.ts`, verify mobile behavior explicitly. Desktop success is not enough.
   - iPhone should prefer `comgooglemapsurl://` with the full path-style route, then fall back to the mobile web URL.
   - Do not assume Safari and the Google Maps app interpret the same link the same way.

## Required Checks Before Merge or Deploy

Run:

```bash
npm run verify:loop-routes
npm run build
```

Do not skip `verify:loop-routes` if route code, map links, builder state, or night ride generation changed.

## Manual QA

Test both builders:

1. Generate a loop in `/loop`
2. Generate a loop in `/night`
3. Open both on mobile
4. Confirm Google Maps shows multiple stops or `N places`
5. Confirm the route is not only the same origin repeated as start and end
6. Confirm the ride shape is a loop, not a thin straight line

## Common Regression Signs

- Google Maps opens with the same start and destination only
- Google Maps says it cannot calculate biking directions
- The copied link contains only two path points
- Night Ride works differently from Loop Builder
- Desktop works but mobile flattens the route
- History links open differently from newly generated links

## If You Need To Troubleshoot

Start with:

- `docs/loop-route-troubleshooting.md`
- `scripts/verify-loop-routes.mjs`

Inspect:

- `sampled_waypoints`
- `route_debug`
- `candidate_profile`
- the final stored `route_url`

## Change Discipline

- Prefer fixing shared helpers before patching only UI code.
- Do not introduce a new route URL builder in another file.
- Do not duplicate waypoint thresholds in multiple places unless there is a hard technical reason.
- If you must add a fallback, make it deterministic enough to debug and compatible with the shared verifier.
