# Cities Documentation

Status: active city tracker for tester rollout

## Purpose
Use this file to track:
- cities already live for testers
- cities queued next
- cities requested by riders
- flagship coverage plans
- regional hub decisions before we build deeper packs

## Live now
- New York
- San Francisco
- Berlin
- London
- Tokyo
- Mexico City
- Bogota
- Warsaw
- Barcelona
- Sao Paulo
- Vienna
- Santos
- Amsterdam
- Paris
- Milan
- Bangkok
- Taipei
- Seoul
- Chicago
- Los Angeles
- Philadelphia
- Seattle
- Buenos Aires
- Krakow
- Curitiba
- Guarulhos
- Munich
- Portland
- Austin
- Madrid
- Lisbon
- Copenhagen
- Rotterdam
- Toronto
- Osaka
- Shanghai

## Current smoke read
- Smoke report:
  - [city-batch-2026-03-smoke.md](/Users/alan/_localDEV/Loop/reports/city-batch-2026-03-smoke.md)
  - [city-batch-2026-04-smoke.md](/Users/alan/_localDEV/Loop/reports/city-batch-2026-04-smoke.md)
  - [city-batch-guarulhos-smoke.md](/Users/alan/_localDEV/Loop/reports/city-batch-guarulhos-smoke.md)
  - [saopaulo-expansion-smoke.md](/Users/alan/_localDEV/Loop/reports/saopaulo-expansion-smoke.md)
- Current read:
  - the full 2026-03 batch passes the fallback tester smoke matrix
  - central density was tightened for:
    - Vienna
    - Amsterdam
    - Paris
    - Milan
    - Seoul
  - the 2026-04 batch also passes the fallback tester smoke matrix
  - the Tier 1 batch is live after manual Supabase application
  - the Tier 2 batch is prepared for manual Supabase application
  - after Tier 2 is applied, the live-code tester set covers 44 cities

## Batch seed ready
- SQL batch prepared:
  - [city_batch_2026_03_seed.sql](/Users/alan/_localDEV/Loop/db/sql/city_batch_2026_03_seed.sql)
- This batch covers:
  - Vienna
  - Santos
  - Amsterdam
  - Paris
  - Milan
  - Bangkok
  - Taipei
  - Seoul

## Next batch
- SQL batch prepared:
  - [city_batch_2026_04_seed.sql](/Users/alan/_localDEV/Loop/db/sql/city_batch_2026_04_seed.sql)
- This batch covers:
  - Chicago
  - Los Angeles
  - Philadelphia
  - Seattle
  - Buenos Aires
  - Krakow
- Why this batch mattered:
  - expands the US flagship track after New York and San Francisco
  - adds Buenos Aires back into the alleycat map
  - moves Krakow from rider request into active rollout

## Tier 1 expansion batch
- SQL batch prepared:
  - [city_batch_tier1_2026_04_seed.sql](/Users/alan/_localDEV/Loop/db/sql/city_batch_tier1_2026_04_seed.sql)
- This batch covers:
  - Portland
  - Austin
  - Madrid
  - Lisbon
  - Copenhagen
  - Rotterdam
  - Toronto
  - Osaka
  - Shanghai
- Batch standard:
  - 20 active checkpoints per city
  - real place names and source-checked coordinates
  - practical task copy without fictional reference points
  - checkpoint spread from central-adjacent districts to outer metro coverage

## Tier 2 expansion batch
- SQL batch prepared:
  - [city_batch_tier2_2026_04_seed.sql](/Users/alan/_localDEV/Loop/db/sql/city_batch_tier2_2026_04_seed.sql)
- This batch covers:
  - Hamburg
  - Cologne
  - Marseille
  - Wroclaw
  - Prague
  - Budapest
  - Rio de Janeiro
  - Belo Horizonte
- Batch standard:
  - 20 active checkpoints per city
  - real place names and source-checked coordinates
  - practical task copy without fictional reference points
  - checkpoint spread from central-adjacent districts to outer metro coverage

## Why this wave matters
- `Vienna` gives Central Europe coverage with a dense inner-city street grid.
- `Santos` gives Brazil a coastal test city outside the Sao Paulo core.
- `Amsterdam` is a strong bike city and good stress test for dense urban checkpoint logic.
- `Paris` gives a large European city with stronger mainstream rider recognition.
- `Milan` is the Italy fixed-gear hub call.
- `Bangkok` is the Thailand hub call.
- `Taipei` is the Taiwan hub call.
- `Seoul` expands East Asia with a city that already shows fixed-gear signal.

## Regional hub picks

### Italy
- Recommended hub: `Milan`
- Why:
  - Milano Fixed positions itself as a home for urban cycling and community/event culture.
  - Milan is set to host `CMWC 2026`, which is a strong messenger/fixed-gear signal.
- Sources:
  - Milano Fixed: https://www.milanofixed.com/homepage/
  - CMWC Milan 2026 signal: https://messengers.org/category/cmwc/
  - Current event summary: https://fixedgearfocus.com/culture-and-community/major-global-fixed-gear-events/

### Thailand
- Recommended hub: `Bangkok`
- Why:
  - Bangkok still shows the strongest visible fixed-gear shop/community signal in Thailand.
  - Older but still useful local coverage points directly at Bangkok fixed-gear hotspots.
- Sources:
  - Bangkok community/shop coverage: https://bk.asia-city.com/restaurants/article/bangkok%E2%80%99s-best-bicycle-clubs-caf%C3%A9s-and-online-communities
  - Bangkok shop scene note: https://bk.asia-city.com/shopping/article/best-shops-buy-bicycle-bangkok
  - Current rider interest signal: https://www.reddit.com/r/FixedGearBicycle/comments/1i0edvl

### Taiwan
- Recommended hub: `Taipei`
- Why:
  - Faith Gear is based in New Taipei and is explicitly fixed-gear focused.
  - Taipei remains the strongest public cycling hub in Taiwan and the clearest launch city.
- Sources:
  - Faith Gear about page: https://www.faithgear.com.tw/about
  - Faith Gear night ride page: https://www.faithgear.com.tw/pages/fg-night-ride
  - Taipei cycling event signal: https://www.reddit.com/r/u_Natural-Anything2462/comments/1rnbtkw

### South Korea
- Recommended hub: `Seoul`
- Why:
  - Fixed Gear Seoul exists as a clear city-level shop/community signal.
  - Seoul continues to show current public fixie visibility.
- Sources:
  - Fixed Gear Seoul: https://fixedgearseoul.com/
  - Seoul fixie popularity signal: https://koreajoongangdaily.joins.com/news/2025-05-04/national/socialAffairs/Safety-concerns-rise-as-fixies-gain-popularity-among-Korean-teenagers/2299774

## Flagship coverage plans
- New York: active
- San Francisco: active
- Next likely US deep packs:
  - Chicago
  - Los Angeles
  - Philadelphia

## Build standard for new cities
Before a city is marked live, it should have:
- at least `16` working checkpoints for tester coverage
- at least `4` districts represented
- at least `3` distinct task vibes
- start-area smoke pass at:
  - `1 km`
  - `2 km`
  - `3 km`
  - `5 km`
- short route note
- short finish line
- clear safety note

## Content rules
- no tourist-guide voice
- no defaulting to city-center landmarks only
- use rider language, not travel copy
- keep tasks short, specific, and street-readable
- spread checkpoints across real riding seams, not only famous attractions

## Requested by riders
- Add entries here as they come in from city requests and tester feedback.
- Krakow

## Notes
- `Santos` should be treated as its own city pack, not merged into Sao Paulo.
- `Milan`, `Bangkok`, and `Taipei` are the chosen hub cities unless stronger live scene evidence appears.
- `Seoul` is explicit, not a hub proxy.
- The 2026-03 batch is live for tester use in code.
- The 2026-04 batch is live for tester use in code.
- `Guarulhos` is active as a major logistics and industrial tier expansion (24 checkpoints).
- `Sao Paulo` has been extended for deeper urban coverage (19 checkpoints).
- keep using batch SQL for city rollout from this point onward.
