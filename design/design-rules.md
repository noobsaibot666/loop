# Loop Design System & Rules

> [!IMPORTANT]
> **STREET CODE:** All new designs, components, and graphical elements MUST be compared with the reference images in `/design` before shipping. If it doesn't vibe with the reference, it doesn't go live.

## 1. The Vibe (Tone & Voice)
We speak slang. We’re street, young, and free. We’re spicy but respect the game.
- **Do:** Use contextual translations. Speak the local language of the rider.
- **Don’t:** Be a robot. No formal/corporate talk. No emojis (use icons).
- **Copy:** Keep it minimal. People are here for fun, not a manual. Headers should say everything; sub-headers are just backup.

## 2. Visual Foundation
- **Dark Mode First:** The app is mainly dark with #1a1a1a (Darkest Hour) and dark grey touches.
- **White Type:** High contrast white text for maximum readability on the street.
- **No Gradients:** Keep it solid. Gradients are for rookies. We move in solid blocks of color.
- **Breathing Space:** No crowded UI. If it feels tight, add padding. Content needs to breathe.

## 3. Typography & Hierarchy
- **Contrast is King:** Use heavy weights for titles and lighter weights for data.
- **Hierarchy:** 
  1. Important numbers/stats (Big, Bold, Accent Color).
  2. Main labels (Medium, White).
  3. Support text (Small, Dark Grey).
- No overlayed text on images unless there's a clear backdrop or the image is darkened.

## 4. Accent Colors by Difficulty
Each section gets its own flavor. Use accents sparingly—only for the important stuff.
- **LOOP (Easy):** Sun Glare (#E1FF00)
- **NIGHT RIDE (Medium):** Exuberant Orange (#FF4F00)
- **ALLEYCAT (Hard):** Blue Violet (#645AD0)
- **Standard:** Cloud Dancer (#F0EDE5) for general UI elements.
- **Builder:** All chosen options must be highlighted with the respective section accent color.

## 5. Mobile-First Layout
- **No Bottom Nav:** The lower navigation is DEAD. Move everything to the top.
- **Top Bar:** Minimalist. App name on the LEFT. Language and Burger Menu on the TOP RIGHT.
- **Hero Images:** Every page MUST have one. Keep the top of the image clean. Text always sits in the lower part of the hero.
- **Breathing Space:** Don't let content fill the whole width (especially large buttons). Use white space. Premium = Briefing areas, not messy width-filling components.
- **Cards:** Clean columns/rows. No user profile pictures needed.
  - **Quick Read:** Credits and Usage cards must be minimal and graphical.
  - **Header Focus:** Short text, quick read. Header is the priority.

## 6. Interaction & Components
- **Burger Menu:** Must animate smoothly over the page content. Includes all page links + User Profile entry.
- **Admin Access:** Hide the Admin link from the public menu. Only insiders know how to hit it.
- **Animations:** Fluid page transitions, smooth loading, and cool/smooth scroll animations.
- **Sliders:** Comfortable touch distance for mobile. Surface smooth interaction.
- **Input Fields:** Taller for text types (better tap target/reach).
- **Icons Only:** Stop using emojis. Use `lucide-react` or `phosphor-icons`. Keep them minimal.
- **Buttons:** Sharp 4px corners. Not full width if it crowds the space.

## 7. Image Standard (Ratios)
- **Night Ride Crews:** 16:9 ratio.
- **Wall of Fame:** 1:1 (Square) or 3:4 ratio. Must be distinct from crews gallery.

---
### DO NOT...
- ...use shadows on everything.
- ...overlay graphics on top of text.
- ...crowd the screen with buttons.
- ...use generic blue/red colors.
- ...hide the hero image with the menu overlay.
