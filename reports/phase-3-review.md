# Phase 3 Review

Date: 2026-03-12

## Verification Run
- `npm run build`
- `node --check functions/api/rider-profile.js`
- `node --check functions/api/wall.js`
- `node --check functions/api/leaderboard.js`

## Issues Found And Fixed
- Public city discovery used UI labels while APIs expected slugs.
  Result:
  - multi-word cities like `Mexico City` and `Sao Paulo` could miss on Wall of Fame and Leaderboard filters.
  Fix:
  - normalized city slugs in the UI and the public Wall/Leaderboard APIs.

- Public rider pages were still too proof-flat.
  Result:
  - profiles showed stats, but not enough story about where or how a rider actually rides.
  Fix:
  - added run ledger
  - added proof streak storytelling
  - added city-lane cards
  - added proof clusters by city

- Wall of Fame still read like a feed before it read like a surface.
  Result:
  - users had to scroll cards before understanding what was active.
  Fix:
  - added editorial summary cards:
    - latest drop
    - city spotlight

## Phase 3 Outcome
Phase 3 is functionally complete.

It now includes:
- public rider profiles
- stronger leaderboard hierarchy
- stronger Wall of Fame storytelling
- rivalry and rematch surfaces
- richer city content and spread logic
- 8-city Alleycat support

## Suggested Cleanup For Phase 4
- code-split the main frontend bundle
- review wall card density on smaller tablets
- review rider profile scan speed with real mixed-user data
- review city pack density in the new expansion cities after live use
