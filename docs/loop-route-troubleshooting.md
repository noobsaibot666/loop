# Loop Route Troubleshooting

This note covers the loop-route failure mode where Google Maps opens with only the same start and finish point and no usable middle stops.

## Symptoms

- Google Maps opens with only two fields and both show the same address.
- The route link looks like `.../maps/dir/<origin>/<origin>/...`.
- Google Maps shows an error like `could not calculate biking directions`.
- Night Ride and Loop Builder disagree about route quality or one works while the other fails.

## Root Cause We Fixed

There were three separate problems:

1. Loop and Night Ride were not using the same waypoint sampler.
2. Some code paths still allowed an empty waypoint list to produce a loop URL.
3. Google Maps is much more reliable with path-style directions URLs for loops:

```text
https://www.google.com/maps/dir/lat,lng/lat,lng/.../lat,lng/data=!4m2!4m1!3e1
```

Using the same origin and destination in query-string format was collapsing into a broken two-point route.

## Current Safety Rails

- Shared minimum loop threshold lives in `shared/loop-quality.js` as `MIN_LOOP_WAYPOINTS`.
- Shared waypoint gate is `hasUsableLoopWaypoints(...)`.
- `buildGoogleMapsLoopUrl(...)` returns an empty string if it receives no usable waypoints.
- `src/utils/maps.ts` normalizes legacy query-style route URLs into path-style Google Maps directions before opening them.
- Android mobile uses a reduced `api=1` directions URL with shaping waypoints so the route stays under Google Maps mobile waypoint limits.
- iPhone route opens first try `comgooglemapsurl://` with the full path-style route, then fall back to the mobile web directions URL if the Google Maps app does not take over.
- `functions/api/loop.js` falls back to `buildFallbackLoopWaypoints(...)` if ORS produces a weak or empty loop.
- `functions/api/night-rides/generate.js` uses the same fallback for Night Ride loops.
- `src/store/useLoopStore.ts` also has a client-side fallback so the UI never emits an `origin -> origin` route.

## Verification Command

Run this before deploys that touch loop generation:

```bash
npm run verify:loop-routes
```

What it checks:

- sampled loop routes produce at least 5 usable waypoints
- fallback loop generation produces at least 5 usable waypoints
- loop URLs are path-style Google Maps URLs
- generated URLs parse back into a loop with the same waypoint count
- Night Ride loop URLs pass the same checks

## Manual Spot Check

1. Generate a loop in `/loop`.
2. Generate a loop ride in `/night`.
3. Open both links in Google Maps.
4. Confirm the directions sheet shows multiple destinations or `N places`, not just one start and one finish.
5. Confirm the route is not just the same address repeated twice.
6. On iPhone, confirm the route opens in Google Maps with multiple stops instead of Safari flattening it into a straight origin/destination ride.

## If It Breaks Again

Check these files first:

- `shared/loop-quality.js`
- `shared/night-rides.js`
- `functions/api/loop.js`
- `functions/api/night-rides/generate.js`
- `src/store/useLoopStore.ts`

Things to inspect:

- `sampled_waypoints` in the API response
- `candidate_profile` and `route_debug`
- whether the generated `route_url` contains multiple path segments after `/maps/dir/`
- whether a recent change reintroduced query-string `origin/destination/waypoints` loop URLs

## Deployment Note

If loop routing is touched, rebuild and verify before deploy:

```bash
npm run verify:loop-routes
npm run build
```
