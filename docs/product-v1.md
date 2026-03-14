# Gimme The Loop V1

Related planning docs:
- [v1-1-roadmap.md](/Users/alan/_localDEV/Loop/docs/v1-1-roadmap.md)
- [v1-1-checklist.md](/Users/alan/_localDEV/Loop/reports/v1-1-checklist.md)
- [city-rollout.md](/Users/alan/_localDEV/Loop/docs/city-rollout.md)
- [cities-documentation.md](/Users/alan/_localDEV/Loop/docs/cities-documentation.md)
- [phase-2-gate-checklist.md](/Users/alan/_localDEV/Loop/reports/phase-2-gate-checklist.md)
- [phase-3-roadmap.md](/Users/alan/_localDEV/Loop/docs/phase-3-roadmap.md)
- [phase-3-checklist.md](/Users/alan/_localDEV/Loop/reports/phase-3-checklist.md)
- [phase-4-roadmap.md](/Users/alan/_localDEV/Loop/docs/phase-4-roadmap.md)
- [phase-4-checklist.md](/Users/alan/_localDEV/Loop/reports/phase-4-checklist.md)
- [phase-5-roadmap.md](/Users/alan/_localDEV/Loop/docs/phase-5-roadmap.md)
- [phase-5-checklist.md](/Users/alan/_localDEV/Loop/reports/phase-5-checklist.md)
- [phase-6-roadmap.md](/Users/alan/_localDEV/Loop/docs/phase-6-roadmap.md)
- [phase-6-checklist.md](/Users/alan/_localDEV/Loop/reports/phase-6-checklist.md)
- [phase-7-roadmap.md](/Users/alan/_localDEV/Loop/docs/phase-7-roadmap.md)
- [phase-7-checklist.md](/Users/alan/_localDEV/Loop/reports/phase-7-checklist.md)
- [phase-7-live-qa.md](/Users/alan/_localDEV/Loop/reports/phase-7-live-qa.md)
- [phase-8-roadmap.md](/Users/alan/_localDEV/Loop/docs/phase-8-roadmap.md)
- [phase-8-checklist.md](/Users/alan/_localDEV/Loop/reports/phase-8-checklist.md)
- [release-smoke-checklist.md](/Users/alan/_localDEV/Loop/reports/release-smoke-checklist.md)
- [new-york-coverage-roadmap.md](/Users/alan/_localDEV/Loop/docs/new-york-coverage-roadmap.md)
- [new-york-coverage-checklist.md](/Users/alan/_localDEV/Loop/reports/new-york-coverage-checklist.md)
- [san-francisco-coverage-roadmap.md](/Users/alan/_localDEV/Loop/docs/san-francisco-coverage-roadmap.md)
- [san-francisco-coverage-checklist.md](/Users/alan/_localDEV/Loop/reports/san-francisco-coverage-checklist.md)

## Product shape
Gimme The Loop V1 has two product surfaces:

1. `Home`
   - Alleycat-first entry point
   - Short hero and fast actions into `Alleycat Mode` or `Loop Mode`
   - Mobile-first navigation with quick dock and lighter copy

2. `Loop Mode`
   - Dedicated `/loop` page
   - Fast loop generation from a chosen point
   - User sets distance, terrain, surface, and ride vibe
   - Output opens directly in Maps

3. `Alleycat Mode`
   - Premium product on its own page
   - City-based manifest generation with curated checkpoints
   - Any-order completion
   - Solo time trial with ghost target

4. `Account`
   - Dedicated `/account` page
   - Email/password auth
   - Credits, purchase history, and basic account controls

5. `Wall of Fame`
   - Dedicated `/wall` page
   - Public Alleycat proof feed
   - Rider photo proof cards with city and checkpoint context

6. `Cities`
   - Dedicated `/cities` page
   - Public city lane discovery for live and next-up packs
   - Links into filtered Wall and Leaderboard views

7. `Leaderboard`
   - Dedicated `/leaderboard` page
   - Quarter-based public ranking surface
   - Rider profile entry point

## Loop Mode capabilities
- Build a loop from one point
- Switch between KM and miles
- Tune terrain, surface, and vibe
- Use location suggestions from geocoding
- Open generated route in Google Maps
- Consume free or paid loop credits
- Persist recent loop history to the rider account

## Alleycat Mode capabilities
- Dedicated `/messenger` page with separate communication and layout
- Premium manifest generation
- Supported city packs in V1 tester set: `New York`, `San Francisco`, `Berlin`, `London`, `Tokyo`, `Mexico City`, `Bogota`, `Warsaw`, `Barcelona`, `Sao Paulo`, `Vienna`, `Santos`, `Amsterdam`, `Paris`, `Milan`, `Bangkok`, `Taipei`, `Seoul`, `Chicago`, `Los Angeles`, `Philadelphia`, `Seattle`, `Buenos Aires`, `Krakow`
- Difficulty levels: `Easy`, `Medium`, `Hard`
- Street tones: `Lazy`, `Fast`, `Chaotic`
- Curated checkpoint list with task prompt and hint
- Any-order checkpoint completion
- Geofence-style check-in validation using rider location
- Run start, check-in, and finish flow
- Ghost target comparison on completion
- Friend challenge sharing via share code
- Friend leaderboard for shared challenges
- Derived challenge states: `open`, `finished`, `expired`
- Rivalry summary and winner state in the run panel
- One-photo checkpoint proof upload
- Optional public proof visibility
- Public proof wall feed on `/wall`
- Abandon active run
- Restart the same manifest with a fresh clock
- Clearer duplicate, distance, and location-permission feedback
- Start-area and range-based manifest generation
- Checkpoint count selection for testing and live tuning
- New York and San Francisco flagship packs added to the live tester set

## Account and auth capabilities
- Email/password sign in
- Email/password account creation
- Dedicated account page instead of mixing auth into the main product page
- Password update while logged in
- Credit top-up access from account
- Recent Stripe purchase list for quick verification
- V1 activity summary for Alleycat usage
- Quarter board with current rank, proof count, and top 3
- Rider badges derived from proof and finish behavior
- Recent loop history with reopen links
- Alleycat manifest/run history with best time and ghost delta
- Shared challenge history
- Riders-you-raced-with list limited to shared challenge links
- Public rider profile fields for wall posts:
  - rider name
  - home location
  - bike name
  - bike ratio

## Admin capabilities
- Minimal standalone `/admin.html` page
- Email/password admin login
- Website health check
- Small ops overview for credits, manifests, runs, and top-ups
- Minimal wall moderation through proof hide/show controls
- Quarter leaderboard visibility for award review
- City studio for DB-backed city packs and checkpoints
- AI-assisted checkpoint and pack drafting in the city studio
- Preview manifest generation from admin-managed content
- Release readiness and publish blockers in City Studio
- Wall of Fame moderation with hide/show, delete, and month archive
- Reset rider usage
- Reset guest usage
- Set rider credits
- Admin bootstrap script: `npm run admin:create -- admin@email.com strong-password`

## Public discovery capabilities
- `Wall of Fame` with city filter modal and compact proof cards
- `Leaderboard` with quarter leaderboard and city filter modal
- Public rider profile pages with:
  - recent proofs
  - recent runs
  - rider circle
  - city lanes
  - city standing
- `Cities` page with live and next-up lane discovery

## How to use
### Loop Mode
1. Open `/loop`.
2. Enter a loop point.
3. Set distance and ride preferences.
4. Generate the loop.
5. Open it in Maps and ride.

### Alleycat Mode
1. Open `/messenger` from the top navigation.
2. Enter a supported city or start area.
3. Select difficulty and street tone.
4. Generate the manifest.
5. Start the run.
6. Move within range of each checkpoint and check in.
7. Finish the run and compare against the ghost.

### Shared Alleycat challenge
1. Generate a manifest.
2. Create a share code.
3. Send the code to a friend.
4. Your friend opens Alleycat Mode and loads the same manifest by code.
5. Both riders run the same checkpoint set asynchronously.

### Account
1. Open `/account`.
2. Sign in or create an account with email and password.
3. Check available credits and recent purchases.
4. Top up credits when needed.
5. Update password if the account is staying in regular use.

### Wall
1. Open `/wall`.
2. Browse public Alleycat proof cards from riders.
3. Use it as a read-only feed for checkpoint moments across supported cities.

### Cities
1. Open `/cities`.
2. Check which city lanes are live.
3. Jump into the city Wall, Board, or ride flow from there.

### Leaderboard
1. Open `/leaderboard`.
2. Filter by city if needed.
3. Open rider profiles from the public board.

### Admin
1. Create or update an admin auth user with `npm run admin:create -- admin@email.com strong-password`.
2. Add that email to `ADMIN_EMAILS` in the backend environment.
3. Open `/admin.html`.
4. Sign in with email and password.
5. Use overview, reset, credit, wall moderation, and city studio controls to keep V1 testable.
6. Use AI draft buttons to generate copy suggestions, then review and save them manually.

## Mobile behavior
- Home is simplified for quick action and thumb-zone navigation.
- Loop, Alleycat, Wall, Leaderboard, Cities, Rider, and Account are all optimized for vertical mobile scan.
- The intended scroll sequence on mobile is:
  1. understand the product
  2. set the manifest inputs
  3. generate the manifest
  4. scroll into the run panel
  5. check in checkpoints
  6. finish and review result

## V1 boundaries
- No live group race
- No social-post requirement
- No public user-generated manifests
- No GPS or media proof requirement
- Safety framing stays explicit: self-directed challenge, obey local laws, stay aware in traffic

## Free plan note
- Supabase leaked password protection remains unavailable on the Free plan.
- Email/password auth is live anyway and the product is test-ready without that toggle.
- Keep passwords strong for admin and rider accounts until the project is upgraded.

## AI draft note
- AI drafting is admin-only and review-gated.
- The OpenAI key is not exposed to the browser.
- Local development reads `OPENAI_API_KEY` from `.env`.
- Production should set `OPENAI_API_KEY` as a deployment secret.

## Final test checklist
- Sign in and sign out on `/account`
- Verify credits and purchases render correctly for a logged-in rider
- Generate a Loop on `/loop` and confirm Maps output opens
- Generate an Alleycat manifest and confirm credits are deducted once
- Start a run, check in a checkpoint within range, and confirm progress updates
- Create a share code, join it from a second account, and confirm the leaderboard updates
- Open `/wall`, `/leaderboard`, `/cities`, and a rider page and confirm public discovery surfaces load cleanly
- Open `/admin.html`, sign in as admin, and verify overview metrics, reset, and credit tools respond
