# LOOP Mobile Feature Parity

Date: 2026-03-19

This file maps the current web product to required mobile V1 capability.

## Required mobile modules
### Home / entry
- brand-led landing shell
- fast entry to Loop and Messenger
- support/legal access

### Auth and account
- email sign in
- email account creation
- password update
- account summary
- credits and purchase history
- rider profile fields

### Loop Mode
- location or place input
- ride preferences
- unit switching
- route generation
- maps handoff
- usage burn rules
- account history persistence

### Messenger / Alleycat
- city/start-area inputs
- difficulty and tone selection
- checkpoint count selection
- manifest generation
- active run state
- geofence-style checkpoint validation
- ghost target result
- restart and abandon flows
- friend challenge share code
- friend challenge leaderboard
- proof upload with optional public visibility

### Night Ride
- session creation or join
- feed and posting flows
- account linkage
- moderation-aware visibility states

### Public discovery
- Wall feed
- Cities page
- quarter leaderboard
- rider profile

## Native adaptations required
- route stacks instead of web-style page swaps
- real back navigation
- permission prompts for location and camera
- lifecycle restore when app backgrounds or is killed
- native media picker / camera capture
- native-safe external map handoff
- offline draft persistence for active flows

## Non-parity items for mobile V1
- admin tools

## Acceptance rule
- Mobile V1 is not done until every item above has a mapped screen, data contract, and smoke test.
