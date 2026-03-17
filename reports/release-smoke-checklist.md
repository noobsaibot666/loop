# Release Smoke Checklist

Date created: 2026-03-13

Use this before a release tag, deploy push, or phase closeout.

## Public routes

- [ ] Home loads without console errors
- [ ] Loop loads and builder is visible
- [ ] Alleycat loads and builder is visible
- [ ] Cities loads after lazy fallback and shows live lanes
- [ ] Wall of Fame loads after lazy fallback and shows proof cards
- [ ] Leaderboard loads after lazy fallback and shows ranked riders
- [ ] Public rider profile opens from Leaderboard or Wall of Fame

## Public interactions

- [ ] City filters work on Wall of Fame
- [ ] City filters work on Leaderboard
- [ ] Rider links work from Wall of Fame
- [ ] Rider links work from Leaderboard
- [ ] City jumps work from Cities into Wall and Leaderboard

## Alleycat flow

- [ ] Generate a manifest from a live city
- [ ] Start a run
- [ ] Check in at least one checkpoint
- [ ] Finish a run and confirm recap renders
- [ ] Create a share code
- [ ] Join a share code from a second account or confirmed test account

## Account

- [ ] Login works
- [ ] Credits render correctly
- [ ] Profile save works
- [ ] Wall-linked rider and bike fields save correctly

## Admin

- [ ] Admin login works
- [ ] Overview loads metrics
- [ ] Requests section loads queue data
- [ ] City Studio loads packs and review state
- [ ] Wall of Fame admin section loads month groups
- [ ] Hide / Show works on a proof tile
- [ ] Delete forever shows the stronger warning and works when confirmed
- [ ] Archive month hide works when confirmed
- [ ] Publish live now shows the stronger warning and works when confirmed

## API spot checks

- [ ] `/api/city-lanes` returns `200`
- [ ] `/api/wall` returns `200`
- [ ] `/api/leaderboard` returns `200`
- [ ] `/api/city-demand` returns `200`
- [ ] `/api/admin/night-rides` returns `200`

## Night Ride

- [ ] Enter Night Ride from Home or Mobile Dock
- [ ] Build a Single or Crew Night Loop
- [ ] Verify photo upload flow completes without error
- [ ] Verify post appears on the Wall Night Feed
