# Night Ride Shadow Roadmap

Date: 2026-03-15
Status: Shadow development

## Purpose
Night Ride is a separate community lane for after-dark route planning and image-driven culture, without mixing it into Alleycat or the public Wall too early.

Status on 2026-03-15:
- Hidden page, route builder, join flow, and feed preview are implemented in app code
- Supabase SQL still needs manual application
- Public launch remains blocked on routing QA and moderation definition
- Single and Crew builder split is now implemented
- Home has a construction-state promo and top nav can reach `/night`
- Account, Wall, and Admin now have Night Ride shadow surfaces

This feature stays hidden from the main navigation until:
- route quality is stable
- share/join credit rules are clear
- moderation for night-feed content is ready

## Product challenge
The idea is strong, but only if the product avoids three bad shortcuts:

1. Do not turn "roulette" into a danger gimmick.
Difficulty should change route complexity and detour shape, not push riders toward unsafe behavior.

2. Do not mix Night Ride proof with Alleycat proof.
Night Ride is community/culture content, not checkpoint validation. It needs its own feed and moderation surface.

3. Do not let shared rides bypass credits.
Each rider joining a shared Night Ride should burn their own credit so one code does not become a free unlock for a whole crew.

## Shadow scope

### Page and route
- Hidden route: `/night`
- Not linked in main navigation yet
- Uses the current Loop/Alleycat visual language:
  - clean modules
  - strong spacing
  - mobile-first builder flow

### Builder modes
- Toggle: `Single` / `Crew`
- Inside both:
  - `Night Loop`
    - after-dark loop around a chosen start point
    - uses a cleaner loop planner, not Alleycat checkpoints
  - `Roulette`
    - start point + end point + target distance
    - app suggests a less direct route based on difficulty

### Single
- one-person planning flow
- no share-code UI
- route goes straight to Maps

### Crew
- requires:
  - crew name
  - city
  - member names or `@` tags
- generates share code
- keeps the ride attached to a named crew session

### Difficulty meaning
- `Easy`
  - lower detour pressure
  - cleaner line
- `Medium`
  - more deviation from the direct line
  - a few stranger turns
- `Hard`
  - highest detour pressure
  - still rideable, but less obvious

### Shared ride flow
- Main rider builds a Night Ride
- Session gets a share code immediately
- Another logged-in rider can paste the code and join
- Every join consumes the rider's own credits

### Community feed
- Separate Night Ride feed
- Intended content:
  - photos from night rides
  - city / caption / rider
- crew name when the session is group-based
- route / distance summary for cleaner browsing
- This feed stays separate from `Wall of Fame`

## Technical plan

### Frontend
- Add hidden page `/night`
- Builder sections:
  - single / crew toggle
  - mode
  - start / end
  - distance
  - difficulty
  - crew metadata in crew mode
  - generate
  - share/join
  - feed preview
- Add:
  - home construction promo
  - account Night Ride history
  - Wall Night Ride section
  - admin shadow feed panel

### Backend
- New API:
  - `/api/night-rides/generate`
  - `/api/night-rides/join`
  - `/api/night-rides/feed`
  - `/api/night-rides/mine`
- Reuse:
  - ORS geocoding
  - ORS cycling route generation
  - existing user auth
  - existing credit rules as the temporary Night Ride burn

### Data model
- `night_ride_sessions`
- `night_ride_participants`
- `night_ride_posts`
- session fields:
  - `session_type`
  - `ride_city`
  - `crew_name`
  - `crew_members`
- post fields:
  - `crew_name`
  - `route_title`
  - `distance_km`
  - `aspect_ratio`
  - `moderation_status`

## Temporary rules for shadow release
- Single Night Ride build cost: `1` credit
- Crew Night Ride build cost: `2` credits
- Crew Night Ride join cost: `1` credit
- Feed upload flow is not shipped in this pass
- Feed read surface can ship before upload

## Phase plan

### Phase 1: Shadow foundation
- Single and Crew builders
- account reflection
- wall shadow section
- admin shadow feed preview
- hidden nav-ready route and home construction promo

### Phase 2: Crew posting
- upload crew photo after ride
- attach route / city / crew metadata at post time
- choose crop ratio:
  - `1:1`
  - `16:9`

### Phase 3: Moderation and abuse
- explicit hide / flag controls for Night Ride posts
- text and image abuse review rules
- merge Night Ride history into admin moderation workflow

### Phase 4: Public launch gate
- routing QA by city
- credit QA for crew builds and joins
- mobile nav rethink before promotion
- public nav/home promotion once moderation is ready

## Open risks
- ORS point-to-point detours may drift from requested target distance
- point-to-point "roulette" needs tuning by city density
- night image moderation needs a dedicated queue before public promotion

## Promotion gate
Do not expose Night Ride in top nav until:
- at least one city-based smoke pass is done for loop and roulette
- shared join flow is stable
- feed moderation is defined
