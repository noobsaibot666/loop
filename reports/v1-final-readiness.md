# V1 Final Readiness

Date: 2026-03-09

## Product surfaces
- `/` Home page for Loop
- `/messenger` dedicated Alleycat Mode page
- `/account` dedicated account page
- `/admin.html` minimal admin ops page

## Auth
- Email/password login is active
- Email/password signup is active
- Password reset email trigger is available from the login modal
- Password update is available on `/account`

## Account
- Credits display works
- Purchase history works
- Alleycat usage summary works
- Logout clears user-scoped state correctly

## Loop
- Loop generation works
- Free and paid credit state updates correctly after generation
- Google Maps link output works

## Alleycat
- Manifest generation works
- Credit deduction occurs once per manifest generation
- Start run works
- Geofence check-in works
- Finish flow works
- Share code flow works
- Friend leaderboard works

## Admin
- Admin login works with email/password
- Overview metrics load
- Health check loads
- Reset and set-credit controls are available

## Supabase status
- Alleycat schema applied
- `set_updated_at` search_path warning fixed
- Remaining advisor item: leaked password protection disabled

## Known constraint
- Supabase Free plan does not allow enabling leaked password protection
- This does not block V1 testing or the current auth model

## Ready for
- product testing
- content tuning
- deployment
- final UX polish after real user feedback
