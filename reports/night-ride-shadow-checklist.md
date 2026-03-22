# Night Ride Shadow Checklist

Date created: 2026-03-15

Status legend:
- `[x]` done
- `[ ]` not started
- `[-]` intentionally deferred

## Product
- [x] Define Night Ride as a separate community lane
- [x] Keep Night Ride hidden from main nav
- [x] Separate Night Ride feed from Wall of Fame
- [x] Define loop and roulette builder modes
- [x] Define join-by-code behavior
- [x] Pivot Night Ride to crew-only
- [x] Define Crew metadata model

## Frontend
- [x] Add hidden `/night` route
- [x] Add Night Ride builder page
- [x] Add loop/roulette mode switch
- [x] Remove single ride option from Night Ride UI
- [x] Add Crew metadata fields
- [x] Add builder result card with route link and share code
- [x] Add join-by-code UI
- [x] Add Night Ride feed preview section
- [x] Add home construction promo
- [x] Add account Night Ride section
- [x] Add Wall Night Ride section
- [x] Add admin Night Ride shadow panel

## Backend
- [x] Add Night Ride shared helper module
- [x] Add generate endpoint
- [x] Add join endpoint
- [x] Add feed endpoint
- [x] Add account history endpoint
- [x] Add local server mirror routes

## Data
- [ ] Apply SQL for `night_ride_sessions`
- [ ] Apply SQL for `night_ride_participants`
- [ ] Apply SQL for `night_ride_posts`
- [ ] Apply new Crew/session/post fields in Supabase

## Gate to public launch
- [ ] Run city smoke pass for Night Loop
- [ ] Run city smoke pass for Roulette
- [ ] Define Night Ride moderation rules
- [ ] Add Night Ride post upload flow
- [ ] Add public navigation entry only after gates pass

## Deferred
- [-] Feed upload UI
- [-] Night Ride moderation surface
- [-] Night Ride reactions/comments
