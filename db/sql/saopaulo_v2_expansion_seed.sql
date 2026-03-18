-- City expansion seed: Sao Paulo Outer Neighborhoods
-- Focus: Pinheiros, North zone, East zone, and South zone sprawl.

with pack_refs as (
  select id, slug from public.city_packs where slug = 'saopaulo'
)
insert into public.city_checkpoints (
  pack_id,
  slug,
  name,
  lat,
  lng,
  district,
  category,
  vibe,
  hint,
  task_local,
  task_fast,
  task_chaotic,
  sort_weight,
  is_active
)
values
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-pinheiros-cut', 'Pinheiros Cut', -23.5630, -46.7020, 'Pinheiros', 'street-cut', 'market-block', 'Market blocks, rail edge, and corners that reward commitment.', 'Clock the first corner that feels more market worker than weekend shopper.', 'Touch the cut, trust the next block, and keep it moving.', 'Give the market strip one fake podium nod and disappear.', 200, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-santana-grid-v2', 'Santana Grid V2', -23.5028, -46.6285, 'Santana', 'grid', 'metro-drag', 'Northern zone pace, wide blocks, metro drag under every read.', 'Clock which block feels like it moves faster than the metro below it.', 'Touch the grid, trust the gap, and keep it rude.', 'Make one fake radio-check to yourself and push on.', 210, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-ipiranga-rise', 'Ipiranga Rise', -23.5856, -46.6120, 'Ipiranga', 'rise', 'history-weight', 'Monument weight, short climbs, and history you can ignore if you want to.', 'Clock the point where the block stops feeling flat and starts talking back.', 'Tag the rise, breathe once, and punch through clean.', 'Treat that little wall like a mountain stage and leave with a straight face.', 220, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-penha-line', 'Penha Line', -23.5207, -46.5405, 'Penha', 'line', 'east-rhythm', 'East zone rhythm, church hill energy, rough but honest blocks.', 'Clock the first street that feels more neighborhood than highway service road.', 'Touch the line and cut before the hill catches your legs.', 'Act like the church hill was part of the plan all along.', 230, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-vila-mariana-pocket-v2', 'Vila Mariana Pocket V2', -23.5878, -46.6372, 'Vila Mariana', 'pocket', 'paulista-gravity', 'Calm pocket with punchy exits back to Paulista gravity.', 'Clock how quickly the block mood shifts when you enter the pocket.', 'Touch the pocket and hit the quick exit before it softens you.', 'Pretend this was always your secret lane and leave.', 240, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-lapa-seam-v2', 'Lapa Seam V2', -23.5219, -46.7017, 'Lapa', 'seam', 'industrial-reads', 'Rail yard proximity, river flat, industrial reads that still pay off.', 'Clock one sign the block still wears from an older version of itself.', 'Touch the seam, lock the exit, and keep the whole move blunt.', 'Throw one fake champion stare at the rail yard and bounce.', 250, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-itaquera-drift', 'Itaquera Drift', -23.5365, -46.4536, 'Itaquera', 'drift', 'arena-energy', 'Arena zone, long blocks, and no reason to coast.', 'Clock the block where the arena energy fades and the real neighborhood starts.', 'Touch the drift, lock the exit, and keep the speed honest.', 'Give the whole zone one fake stadium announcement and get gone.', 260, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-interlagos-edge', 'Interlagos Edge', -23.7013, -46.6972, 'Interlagos', 'edge', 'track-proximity', 'Track proximity, south zone sprawl, useful reads if you stay committed.', 'Clock the exact point where the F1 energy bleeds into the neighborhood.', 'Touch the edge and get back on the main line before the sprawl drags you.', 'Give the circuit one fake podium finish and disappear into the blocks.', 270, true)
on conflict (slug) do update
set
  pack_id = excluded.pack_id,
  name = excluded.name,
  lat = excluded.lat,
  lng = excluded.lng,
  district = excluded.district,
  category = excluded.category,
  vibe = excluded.vibe,
  hint = excluded.hint,
  task_local = excluded.task_local,
  task_fast = excluded.task_fast,
  task_chaotic = excluded.task_chaotic,
  sort_weight = excluded.sort_weight,
  is_active = excluded.is_active,
  updated_at = now();
