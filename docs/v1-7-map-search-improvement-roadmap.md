# Gimme The Loop: V1.7 Map Search Improvement Roadmap

**Date:** March 2026  
**Status:** Planned

Context:
- Core production blockers on Street Hunt, Night Ride, admin auth, and account summary have been closed.
- The next major usability debt is the map/address search layer across builders.
- Current geocoding works, but the UX is still too fragile:
  - slow feedback
  - weak autocomplete
  - hard-to-find addresses
  - poor tolerance for neighborhood aliases and informal input
  - suggestion behavior that feels too technical instead of rider-friendly

Goal:
- Make map search feel fast, forgiving, and obvious on desktop and mobile.
- Reduce failed route builds caused by poor location entry.
- Turn address search from a blocker into a reliable builder tool.

---

## Phase 12: Search UX Audit
- Audit all location-entry surfaces:
  - Loop start point
  - Street Hunt city + start area
  - Night Ride city + start/end points
- Measure:
  - request timing
  - empty-result patterns
  - suggestion quality
  - mobile interaction pain
- Identify weak patterns:
  - exact-address bias
  - no local alias support
  - poor neighborhood matching
  - confusing loading states
  - modal/overlay interactions that interrupt search flow

Exit criteria:
- A full map-search pain list exists by page and field.

---

## Phase 13: Search Interaction Rebuild
- Add stronger autocomplete behavior:
  - debounce input
  - earlier result streaming
  - clearer loading/empty states
  - keyboard and touch-friendly selection
- Improve result ranking:
  - exact match
  - neighborhood match
  - city-biased ranking
  - recent/likely rider picks
- Improve field UX:
  - better placeholders
  - stronger helper copy
  - more tolerant parsing for common street input
  - clearer selected-state display
- Normalize behaviors across all builders:
  - outside click close
  - `Esc` close
  - consistent dropdown spacing
  - auto-clear stale suggestions

Exit criteria:
- Search interaction feels consistent and predictable across Loop, Street Hunt, and Night Ride.

---

## Phase 14: Localization + Place Intelligence
- Improve PT-BR and ES localization for map/search language:
  - more natural street vocabulary
  - less formal phrasing
  - location helper text that sounds local, not literal
- Add city-aware examples:
  - Sao Paulo style examples for PT-BR
  - natural urban examples for ES
- Support informal place input where possible:
  - neighborhood names
  - station names
  - common shorthand

Exit criteria:
- Search fields sound local and are easier to use in Portuguese and Spanish.

---

## Phase 15: Reliability + Monitoring
- Add lightweight logging for:
  - empty geocode responses
  - repeated retry behavior
  - failed route builds caused by bad coordinates
- Track which fields fail most often.
- Use that data to tune placeholders, matching, and ranking.

Exit criteria:
- Search quality can be improved with real usage evidence instead of guesswork.

---

## Delivery Principles
- Do not regress the current working route generation logic.
- Prioritize perceived speed and input forgiveness over adding map chrome.
- Mobile-first: every search interaction must feel clean on touch.
- Treat map entry as product UX, not just an API call.
