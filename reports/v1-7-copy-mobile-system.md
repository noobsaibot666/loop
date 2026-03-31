# V1.7 Copy System

Date created: 2026-03-31

Status legend:
- `[x]` done
- `[ ]` next
- `[-]` deferred

## Purpose
- Make the app copy functional, clean, and helpful.
- Make copy mobile-first by default.
- Remove long sentences, vague editorial phrases, and low-signal filler.
- Establish English as the source language before updating translations.

## Dependency check from V1.6
- [ ] Verify all three community lifecycle emails in production
- [ ] Replace `onboarding@resend.dev` with a branded sender
- [ ] Brand the Discord welcome/onboarding flow
- [ ] Re-test cancel flow on production and confirm role revoke every time
- [ ] Confirm bike + ratio show consistently in wall and leaderboard
- [ ] Final mobile QA pass for account cards and builder selectors
- [ ] Run another mobile real-device loop smoke test

Dependency note:
- V1.7 can start now, but these V1.6 items are still open and should not be forgotten during copy rollout.

## Copy principles
- [x] Keep sentences short
- [x] Keep one idea per line where possible
- [x] Default to action-first copy
- [x] Prefer plain language over tone
- [x] Avoid metaphor unless it adds useful direction
- [x] Avoid any copy that sounds stylish but does not help the rider act
- [x] Write for small screens first
- [x] Keep labels, helper text, and buttons distinct in purpose

## Rules for mobile-first copy
- [x] Button labels should usually stay within 2 to 4 words
- [x] Section headers should scan in one glance
- [x] Supporting copy should fit cleanly under the header without pushing the layout wider
- [x] Helper text should be one short sentence, not a paragraph
- [x] Status text should be brief and stateful
- [x] Empty states should explain what to do next
- [x] Error copy should explain what failed and what the rider can do now

## Phase 1: Copy inventory
- [x] Audit all English copy in `src/i18n.tsx`
- [x] Group copy by surface:
  - homepage
  - account
  - loop
  - messenger / manifest
  - night ride
  - wall
  - leaderboard
  - admin
  - auth / legal / system states
- [x] Mark copy as one of:
  - keep
  - shorten
  - rewrite
  - remove
- [x] Flag every string that is too long for mobile
- [x] Flag every string that is vague, editorial, or misleading

Phase 1 output:
- [x] a copy inventory with clear rewrite priority
- [x] see `reports/v1-7-copy-inventory.md`

## Phase 2: Structural system
- [x] Define copy types:
  - headers
  - subheaders
  - helper text
  - buttons
  - status lines
  - errors
  - empty states
  - confirmation states
- [x] Set target length for each type
- [x] Define tone rules for each type
- [x] Create a small copy style guide for future work

Phase 2 output:
- [x] a reusable English copy system for the product
- [x] see `reports/v1-7-copy-style-guide.md`

## Phase 3: Homepage rewrite
- [x] Rewrite homepage module titles and body copy
- [x] Rewrite community and Strava cards
- [x] Rewrite modal copy for crew/community access
- [x] Shorten all CTA labels where needed
- [x] Remove any copy that looks decorative but does not help action

Focus:
- instant scan
- clear action
- no wasted words

Phase 3 notes:
- English homepage source copy was shortened and cleaned in `src/i18n.tsx`
- hero, mode cards, community card, Strava card, and community modal note were rewritten first
- translations are intentionally untouched until the English source is stable

## Phase 4: Builder and manifest rewrite
- [x] Review loop builder copy
- [x] Review messenger builder copy
- [x] Review manifest result copy
- [x] Review checkpoint labels, states, and helper text
- [x] Review night ride builder copy
- [x] Rewrite any helper copy that slows down mobile scanning

Focus:
- riders should know what to do next without thinking
- run-critical copy should be stronger than descriptive copy

Phase 4 notes:
- English builder and manifest copy was rewritten in `src/i18n.tsx`
- loop, Street Hunt, manifest, checkpoint, share-code, and Night Ride builder strings were shortened
- vague labels were replaced with clearer operational language

## Phase 5: Account and community rewrite
- [x] Review profile card copy
- [x] Review bikes section copy
- [x] Review credits copy
- [x] Review community pass copy
- [x] Review collaboration and feedback copy
- [x] Review purchase / history / stats copy

Focus:
- remove clutter
- make billing and membership states explicit
- make bike and rider data easy to understand fast

Phase 5 notes:
- account and community English source copy was rewritten in `src/i18n.tsx`
- profile, bike, credits, community pass, collaboration, feedback, and stats copy were shortened
- billing and membership language was made more explicit and less branded

## Phase 6: Wall, leaderboard, and city surfaces
- [x] Review wall copy
- [x] Review leaderboard copy
- [x] Review city page copy
- [x] Review status chips, filters, and empty states
- [x] Make ranking / checkpoint-count copy fair and clear

Focus:
- scoring clarity
- comparison clarity
- low-friction discovery

Phase 6 notes:
- wall, leaderboard, rider, and cities English source copy was rewritten in `src/i18n.tsx`
- mixed-language English strings were corrected on these public surfaces
- ranking and city status copy was shortened for faster mobile scanning

## Phase 7: System, error, and auth copy
- [x] Review login and signup copy
- [x] Review payment and subscription states
- [x] Review Discord connect / failure / revoke messages
- [x] Review upload and proof errors
- [x] Review route and map failure messages

Focus:
- say what happened
- say what to do next
- avoid generic failure text

Phase 7 notes:
- auth, payment, Discord, upload, proof, share-code, and route failure English copy was rewritten in `src/i18n.tsx`
- generic failures were replaced with clearer state plus next step when possible
- English rewrite phases are now complete enough to move into QA

## Phase 8: English QA pass
- [x] Review every changed English string inside the running UI
- [x] Check line breaks on mobile
- [x] Check button width on mobile
- [x] Check section rhythm on mobile
- [x] Check repeated terms for consistency
- [x] Remove duplicate meanings across screens

English QA rule:
- no translation work starts before English is stable

Phase 8 notes:
- final English source cleanup removed the last mixed-language labels still present in admin and legal keys
- missing live keys were added for `common.show`, `common.hide`, and `cities.checkpoints`
- `npm run build` passes after the QA cleanup

## Phase 9: Translation pass
- [x] Update Portuguese after English is locked
- [x] Update Spanish after English is locked
- [x] Keep meaning aligned, not literal
- [ ] Re-check mobile width and wrapping in all supported languages
- [ ] Review labels with the longest translated strings first

Translation rule:
- English is the source language for V1.7

Phase 9 notes:
- Portuguese and Spanish source copy were aligned to the cleaned English system in `src/i18n.tsx`
- rider-facing surfaces were prioritized first: homepage, builders, manifest, account, community, wall, leaderboard, rider, and cities
- `npm run build` passes after the translation update

## Phase 10: Multilingual QA
- [ ] Check Portuguese on mobile
- [ ] Check Spanish on mobile
- [ ] Review longest buttons, chips, and helper lines first
- [ ] Catch any leftover mixed-language strings
- [ ] Tighten any label that widens cards or breaks wraps

QA rule:
- translation is not done until PT and ES both hold layout on mobile

## Deliverables
- [x] English-first copy inventory
- [x] copy style guide
- [x] rewritten English product copy
- [x] Portuguese translation pass
- [x] Spanish translation pass
- [ ] final mobile copy QA report

## Suggested execution order
1. Audit English copy in `src/i18n.tsx`
2. Create the copy style guide and target lengths
3. Rewrite homepage and builder copy first
4. Rewrite account and community surfaces
5. Rewrite wall, leaderboard, and city surfaces
6. Rewrite system and error states
7. Run English mobile QA
8. Translate to Portuguese
9. Translate to Spanish
10. Run final multilingual mobile QA

## Notes
- V1.7 should favor clarity over brand tone whenever they conflict.
- Every rewritten string should be tested against a mobile layout, not just reviewed in code.
- Manifest and builder copy should be treated as operational UI, not editorial content.
