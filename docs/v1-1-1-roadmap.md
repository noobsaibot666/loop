# V1.1.1 Roadmap

## Goal

Add multilingual support without changing the Cloudflare Pages single-page app shape.

## Scope

- Keep one SPA build
- Keep one route system
- Keep one API surface
- Add `English`, `Portuguese (Brazil)`, and `Spanish`
- Persist language on the client
- Translate the highest-traffic UI first

## Technical Direction

- Client-side i18n only
- No `/pt` or `/es` route split
- No `_redirects` change
- No backend locale dependency
- No translated slugs
- Language stored in local storage

## Why This Fits Cloudflare Pages

- Same compiled SPA bundle
- Same static hosting flow
- Same Pages fallback routing
- No function or API path changes
- No extra deployment topology

## Implemented Pass

- App shell
  - header
  - mobile nav
  - footer
- Home
- Loop page
- Alleycat page
- Wall of Fame
- Leaderboard
- Cities
- Rider profile
- Account page
- Auth modal
- Password reset flow copy
- City request modal
- Share-code modal
- Credit top-up modal
- Date formatting by locale

## Tone Rule

- English keeps the current rider/street voice
- Portuguese uses Brazilian Portuguese, not Portugal Portuguese
- Portuguese public-facing copy should lean toward Sao Paulo rider slang where it improves fit
- Spanish keeps direct street tone without breaking clarity

## Guardrails

- City names stay canonical
- Route paths stay canonical
- Database content stays canonical
- Dynamic city pack copy can stay English until content localization is planned

## Remaining Follow-Up

- Alleycat run-panel/status deep copy
- Loop/alleycat edge-case messages outside the main builder and modal flows
- Static legal/help pages in multiple languages
- Admin page translations if needed for non-admin demo users

## Release Rule

Ship only if:

- build passes
- existing routes still work
- language switching does not reset app state
- English remains the fallback for missing strings
- account, cities, wall, and leaderboard stay usable during tester onboarding
