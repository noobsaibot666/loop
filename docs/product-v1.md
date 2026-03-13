# Gimme The Loop V1

Related planning docs:
- [v1-1-roadmap.md](/Users/alan/_localDEV/Loop/docs/v1-1-roadmap.md)
- [v1-1-checklist.md](/Users/alan/_localDEV/Loop/reports/v1-1-checklist.md)
- [city-rollout.md](/Users/alan/_localDEV/Loop/docs/city-rollout.md)
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

## Product shape
Gimme The Loop V1 has two product surfaces:

1. `Loop`
   - Main product on the home page
   - Fast loop generation from a chosen point
   - User sets distance, terrain, surface, and ride vibe
   - Output opens directly in Maps

2. `Alleycat Mode`
   - Premium product on its own page
   - City-based manifest generation with curated checkpoints
   - Any-order completion
   - Solo time trial with ghost target

3. `Account`
   - Dedicated `/account` page
   - Email/password auth
   - Credits, purchase history, and basic account controls

4. `Wall`
   - Dedicated `/wall` page
   - Public Alleycat proof feed
   - Rider photo proof cards with city and checkpoint context

## Loop capabilities
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
- Supported city packs in V1: `Berlin`, `London`, `Tokyo`
- Difficulty levels: `Easy`, `Medium`, `Hard`
- Street tones: `Local`, `Fast`, `Chaotic`
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
- Reset rider usage
- Reset guest usage
- Set rider credits
- Admin bootstrap script: `npm run admin:create -- admin@email.com strong-password`

## How to use
### Loop
1. Open the home page.
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

### Admin
1. Create or update an admin auth user with `npm run admin:create -- admin@email.com strong-password`.
2. Add that email to `ADMIN_EMAILS` in the backend environment.
3. Open `/admin.html`.
4. Sign in with email and password.
5. Use overview, reset, credit, wall moderation, and city studio controls to keep V1 testable.
6. Use AI draft buttons to generate copy suggestions, then review and save them manually.

## Mobile behavior
- Home page keeps the loop builder immediately accessible.
- Alleycat Mode stacks vertically on mobile.
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
- Generate a Loop and confirm Maps output opens
- Generate an Alleycat manifest and confirm credits are deducted once
- Start a run, check in a checkpoint within range, and confirm progress updates
- Create a share code, join it from a second account, and confirm the leaderboard updates
- Open `/admin.html`, sign in as admin, and verify overview metrics, reset, and credit tools respond
