# Seed Photos Needed

Source CC0 cycling photos from Unsplash or Wikimedia Commons before running `npm run admin:seed`.

Search terms: "bicycle courier street", "fixed gear urban", "bike messenger", "night cycling city"

## Required files

### Alleycat proof photos (≥1 per city, round-robined)

```
alleycat-proofs/berlin/     cp01.jpg … cp09.jpg  (need at least 1, ideally 9)
alleycat-proofs/newyork/    cp01.jpg … cp08.jpg  (need at least 1, ideally 8)
alleycat-proofs/london/     cp01.jpg … cp05.jpg  (need at least 1, ideally 5)
alleycat-proofs/tokyo/      cp01.jpg … cp05.jpg  (need at least 1, ideally 5)
alleycat-proofs/munich/     cp01.jpg cp02.jpg    (need at least 1, ideally 2)
```

### Night ride photos

```
night-ride-posts/berlin/    nr01.jpg nr02.jpg nr03.jpg
night-ride-posts/newyork/   nr01.jpg nr02.jpg nr03.jpg
night-ride-posts/london/    nr01.jpg
night-ride-posts/tokyo/     nr01.jpg
```

### Profile avatars (optional but recommended for mobile)

```
avatars/
  male_01.jpg      — rider: FelixKreuz  (~30s, German, urban)
  male_02.jpg      — rider: TylerBoro   (~28s, Black American, NYC)
  male_03.jpg      — rider: MarcusHell  (~32s, Hispanic, NYC)
  male_04.jpg      — rider: OllieBrick  (~31s, British, casual)
  male_05.jpg      — rider: KaiFrank    (~30s, German, Munich)
  female_01.jpg    — rider: LenaWedding (~27s, German, sporty)
  female_02.jpg    — rider: MiriamBlix  (~25s, mixed/European)
  female_03.jpg    — rider: ZoeyLower   (~26s, American, street style)
  female_04.jpg    — rider: SophieRoad  (~29s, British, Hackney)
  female_05.jpg    — rider: HarukaMachi (~25s, Japanese)
```

**Naming rule:** filename must contain `male` or `female` (e.g. `male_01.jpg`, `female_portrait_2.png`). Files are sorted alphabetically then assigned in order to male/female riders. You can add fewer — they round-robin. Avatars are optional — the seed runs without them and shows a placeholder on mobile. With them, each rider gets a face on the leaderboard and profile.

## Tips

- Resize to ≤1MB before placing here
- Save as JPEG (.jpg)
- Use real urban cycling/street photos — they show as proof images on the Wall of Fame
- Night ride photos work best at 16:9 ratio

## Remove when done

These photos are NOT committed to git (see .gitignore). They live locally and get uploaded to Supabase storage when the seed script runs.
