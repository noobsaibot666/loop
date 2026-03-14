# City Batch 2026-03 Smoke

Date: 2026-03-14

Scope:
- Vienna
- Santos
- Amsterdam
- Paris
- Milan
- Bangkok
- Taipei
- Seoul

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
- Vienna: `Innere Stadt`
- Santos: `Gonzaga`
- Amsterdam: `Centrum`
- Paris: `Centre`
- Milan: `Duomo`
- Bangkok: `Old City`
- Taipei: `Xinyi`
- Seoul: `Jongno`

## Results

### Full tester pass
- `Vienna`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Santos`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Amsterdam`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Paris`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Milan`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Bangkok`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Taipei`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK
- `Seoul`
  - `1 km` OK
  - `2 km` OK
  - `3 km` OK
  - `5 km` OK

## Read
- The 2026-03 batch now passes the fallback manifest smoke matrix for tester use.
- The central density pass fixed the earlier tight-start failures in:
  - Vienna
  - Amsterdam
  - Paris
  - Milan
  - Seoul
- Some cities still compress into fewer districts at the tightest ranges, but the manifests now generate cleanly and stay usable for live testing.

## Next content move
1. apply the updated batch SQL in Supabase if it is not already synced
2. do a live city-by-city tester pass on:
   - `Wall`
   - `Leaderboard`
   - `Cities`
3. start the next city batch from rider demand or US flagship coverage
