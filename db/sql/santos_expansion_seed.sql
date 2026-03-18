-- City expansion seed: Santos, Brazil
-- Focus: Expanding coverage to residential and port-adjacent districts.

with pack_refs as (
  select id, slug from public.city_packs where slug = 'santos'
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
  ((select id from pack_refs where slug = 'santos'), 'santos-marape-cut', 'Marape Cut', -23.9576, -46.3458, 'Marape', 'street-cut', 'local-grid', 'Residential grid, quiet corners, fast internal cuts.', 'Clock the first corner that feels more local than beach-goer.', 'Touch the cut and stay sharp through the grid.', 'Give the block one fake sponsor tag and move.', 130, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-vila-belmiro-edge', 'Vila Belmiro Edge', -23.9511, -46.3389, 'Vila Belmiro', 'stadium-edge', 'historic-gravity', 'Stadium proximity, tight streets, zero reason to cruise.', 'Clock where the stadium energy starts owning the block.', 'Touch the edge and punch out before the crowds gather.', 'Give the stadium one fake podium shout and vanish.', 140, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-encruzilhada-line', 'Encruzilhada Line', -23.9482, -46.3267, 'Encruzilhada', 'line', 'transit-rhythm', 'Fast city line, hospital zone nearby, long roads.', 'Clock the lane riders actually trust when the block gets loud.', 'Touch the line and keep the cadence mean.', 'Rate the block out of ten like a harsh judge.', 150, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-jabaquara-rise', 'Jabaquara Rise', -23.9405, -46.3412, 'Jabaquara', 'rise', 'hill-bite', 'Short climb, quiet residential patch, and no help.', 'Notice where the block stops feeling flat and starts talking back.', 'Tag the rise and stay on top of it clean.', 'Treat the wall like mountain drama and keep rolling.', 160, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-saboo-seam', 'Saboo Seam', -23.9284, -46.3495, 'Saboo', 'seam', 'rail-edge', 'Entrance to the city, rail yard nearby, industrial reads.', 'Clock the point where the city starts feeling more machine than coast.', 'Touch the seam and trust the hard exit.', 'Give the rails one fake sponsor nod and disappear.', 170, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-castelo-grid', 'Castelo Grid', -23.9234, -46.3685, 'Castelo', 'grid', 'peripheral-pace', 'Northern zones, wide grids, fast escape lines.', 'Clock the block that moves faster than the main avenue nearby.', 'Touch the grid and keep the line tidy.', 'Make one fake dispatch call and get gone.', 180, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-areia-branca-pocket', 'Areia Branca Pocket', -23.9256, -46.3785, 'Areia Branca', 'pocket', 'quiet-patch', 'Short pocket, quick exits, industrial air nearby.', 'Clock how quickly the mood shifts once you hit the pocket.', 'Touch the pocket and hit the exit before it flattens you.', 'Act like this corner was your home straight and move.', 190, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-santa-maria-line', 'Santa Maria Line', -23.9356, -46.3812, 'Santa Maria', 'line', 'edge-rhythm', 'Border zones, residential sprawl, long reads.', 'Clock the first street that feels more neighborhood than highway.', 'Touch the line and cut back in before the sprawl wins.', 'Give the border one fake salute and vanish.', 200, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-caneleira-cut', 'Caneleira Cut', -23.9402, -46.3725, 'Caneleira', 'street-cut', 'local-grit', 'Local rhythm, tight blocks, and no reason to coast.', 'Clock the lane locals actually use for quick movement.', 'Touch the cut and stay sharp through the turns.', 'Rate the block out of ten and skip the pause.', 210, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-chico-paula-seam', 'Chico de Paula Seam', -23.9312, -46.3585, 'Chico de Paula', 'seam', 'industrial-reads', 'Port accessibility, heavy trucks nearby, blunt reads.', 'Clock where the commercial drag hits the residential line.', 'Touch the seam and lock the exit in one glance.', 'Mutter one fake dispatch line and cut out.', 220, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-alemao-edge', 'Alemoa Edge', -23.9255, -46.3505, 'Alemoa', 'edge', 'port-heavy', 'Logistics hub, heavy lanes, and zero room for soft timing.', 'Clock where the port energy starts dominating the block.', 'Touch the edge and get out before the flow drags you.', 'Give the towers one fake title-defense nod and bounce.', 230, true),
  ((select id from pack_refs where slug = 'santos'), 'santos-nova-cintra-rise', 'Morro Nova Cintra Rise', -23.9458, -46.3524, 'Morro Nova Cintra', 'rise', 'hill-peak', 'Hilltop climb, scenic bias, and leg pressure.', 'Clock the point where the climb finally lets you breathe.', 'Tag the peak and hit the descent with speed.', 'Treat the view like a prize you earned and leave.', 240, true)
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
