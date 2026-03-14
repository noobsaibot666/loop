# V1.1.1 Roadmap

## Goal

Add multilingual support without changing the Cloudflare Pages single-page app shape.

## Scope

- Keep one SPA build
- Keep one route system
- Keep one API surface
- Add `English`, `Portuguese`, and `Spanish`
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

## First Pass

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
- Date formatting by locale

## Guardrails

- City names stay canonical
- Route paths stay canonical
- Database content stays canonical
- Dynamic city pack copy can stay English until content localization is planned

## Follow-Up Passes

- Auth and payment modals
- Account page deep copy
- Alleycat run-panel/status text
- Loop/alleycat edge-case messages
- Static legal/help pages in multiple languages

## Release Rule

Ship only if:

- build passes
- existing routes still work
- language switching does not reset app state
- English remains the fallback for missing strings
