# City Batch 2026-04 Smoke

Date: 2026-03-14

Scope:
- Chicago
- Los Angeles
- Philadelphia
- Seattle
- Buenos Aires
- Krakow

Method:
- fallback manifest generation smoke pass
- `medium`
- `fast`
- `checkpoint_count = 4`
- range checks at:
  - `1 km`
  - `2 km`
  - `3 km`
  - `5 km`

Start areas used:
- Chicago: `Loop`
- Los Angeles: `Downtown`
- Philadelphia: `Center City`
- Seattle: `Pioneer Square`
- Buenos Aires: `San Telmo`
- Krakow: `Kazimierz`

## Results

### Full tester pass
- `Chicago`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Los Angeles`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Philadelphia`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Seattle`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Buenos Aires`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Krakow`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK

## Read
- The 2026-04 batch passes the fallback tester smoke matrix.
- The US flagship follow-up cities now generate cleanly from tight central starts.
- `Krakow` is the first rider-requested city moved into a tested live-code wave.

## Next content move
1. apply the updated batch SQL in Supabase if it is not already synced
2. verify the new wave across `/cities`, `/wall`, and `/leaderboard` after DB sync
3. decide whether the next batch should be:
   - more US fixed-gear cities
   - another Europe wave
   - demand-led rider requests
