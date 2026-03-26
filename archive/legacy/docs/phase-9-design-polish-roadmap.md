# Phase 9: Design Polish Roadmap

**Project:** Loop
**Focus:** Mobile-First UI Review & Refinement
**Reference:** [/design/design-rules.md](../design/design-rules.md)

## Purpose

Phase 9 is about moving from "functional" to "premium." We are auditing every single page—from Login to Admin—to ensure they meet the street-standard design rules. No more cluttered layouts, no more bottom navs. Just clean, sharp, mobile-first design.

## 1. Global UI Refactor

### Navigation & Header

- [x] **Top Bar Refactor:** Implement minimal top bar (Name: Left | Lang/Burger: Right).
- [x] **Burger Menu:** Create animated full-screen or slide-over menu including User Profile.
- [x] **Admin Security:** Hide Admin link from the standard menu structure.
- [x] **Navigation Audit:** Remove bottom navigation bar from all mobile views.
- [x] **Footer:** Simplify footers to minimal text/links.

### Design Standards

- [x] **Component Audit:** Apply "tall" input field styles and "comfort" spacing for sliders.
- [x] **White Space Pass:** Adjust button widths and container padding to create "briefing areas."
- [x] **Icon Library:** Swap all emojis for `lucide-react` icons.
- [x] **Color Sweep:** Ensure all accent colors match the difficulty mapping (Sun Glare, Orange, Violet).
- [x] **Typography Audit:** Review font weights and sizes on every page for clear hierarchy.

## 2. Page Audit & Polish

### Login & Onboarding

- [x] **Visual Impact:** Dark theme overhaul. High-contrast input fields.
- [x] **Copy:** Urban/street tone check (Minimal, straight, spicy).

### Start Page & Main App

- [x] **Hero preservation:** Ensure the Hero image is the first thing riders see (text in lower part).
- [x] **Card Layout:** Review stats and manifesto cards for "breathing space" and quick-read headers.
- [x] **Gallery Work:** Set Crews to 16:9 and Wall of Fame to 1:1/3:4 ratios.
- [x] **Builder:** Implement color highlighting for selected options.

### Admin Page

- [x] **Branding Alignment:** Apply the same industrial/street aesthetic.
- [x] **Data Viz:** Clean up tables and dashboards using the high-contrast hierarchy.

## 3. Sectional Branding

- [x] **Difficulty Accents:** Apply specific colors to sections:
  - Loop -> Yellow
  - Night Ride -> Orange
  - Alleycat -> Violet
- [x] **Branded Headers:** Each section needs a clear, branded visual identity (Applied // prefix).

## 4. Technical Checklist

- [x] **Translations:** Update strings to spicy/local slang.
- [x] **Mobile QA:** Test all pages on multiple mobile breakpoints (Responsive Pass).
- [x] **Animation:** Polish the burger menu animation for smooth transitions.

---

## Success Condition

Phase 9 is done when:
1. The app feels like a single, cohesive brand.
2. Mobile navigation is intuitive and out of the way.
3. Every page follows the "breathing space" and "high contrast" rules.
4. The user "wows" at the premium feel of the UI.
