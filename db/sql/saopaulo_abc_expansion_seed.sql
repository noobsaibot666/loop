-- City expansion seed: Sao Paulo ABC Region
-- Focus: Santo Andre, Sao Bernardo, Sao Caetano, Diadema, Maua.

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
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-andre-centro', 'Santo Andre Centro', -23.6575, -46.5333, 'Santo Andre', 'city-core', 'industrial-legacy', 'Downtown ABC, rail proximity, and hard city edges.', 'Clock the first corner that feels more industrial worker than commuter.', 'Touch the core, pick the clean exit, and move.', 'Give the square one fake dispatch shout and vanish.', 300, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-andre-campestre', 'Campestre Seam', -23.6425, -46.5505, 'Santo Andre', 'seam', 'border-rhythm', 'Border with Sao Caetano, residential mix, and fast connections.', 'Clock where one city ends and the other starts talking back.', 'Tag the seam and stay on top of the cadence.', 'Act like the border was your secret lane and move.', 310, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-bernardo-centro', 'Sao Bernardo Centro', -23.6936, -46.5512, 'Sao Bernardo', 'city-core', 'highway-gravity', 'Via Anchieta proximity, busy core, zero room for soft reads.', 'Clock where the highway energy starts owning the block.', 'Touch the core and hit the fast side before it clogs up.', 'Mutter one fake race-radio call and vanish.', 320, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-bernardo-rudge', 'Rudge Ramos Cut', -23.6635, -46.5615, 'Sao Bernardo', 'street-cut', 'university-energy', 'Student blocks, fast cuts, and better lines hiding off-road.', 'Clock the lane locals use when the main road is loud.', 'Touch the cut, lock the exit, and keep the line blunt.', 'Give the block one fake style score and bounce.', 330, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-caetano-centro', 'Sao Caetano Centro', -23.6165, -46.5702, 'Sao Caetano', 'city-core', 'clean-sharp', 'Dense core, rail edge, and consistent city pace.', 'Clock the first corner that feels more rider than office spill.', 'Touch the core and vanish back into the grid fast.', 'Rate the block out of ten like a harsh judge.', 340, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-caetano-barca', 'Barcelona Grid', -23.6235, -46.5515, 'Sao Caetano', 'grid', 'local-rhythm', 'Residential grid, fast exits, and zero reason to cruise.', 'Clock which block moves faster than the main avenue nearby.', 'Touch the grid and stay sharp through the turns.', 'Throw one fake champion stare at the rails and go.', 350, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-diadema-centro', 'Diadema Centro', -23.6865, -46.6212, 'Diadema', 'city-core', 'hill-bite', 'Hilly core, transit pressure, and no help if you go soft.', 'Notice where the block stops feeling flat and starts biting back.', 'Touch the core and stay on top of the rhythm.', 'Treat the wall like mountain drama and keep rolling.', 360, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-diadema-pirapora', 'Piraporinha Seam', -23.7025, -46.5915, 'Diadema', 'seam', 'industrial-flow', 'Industrial flow, bus corridors, and heavy reads.', 'Clock the point where the commercial drag hits the factory line.', 'Touch the seam, lock the exit, and vanish.', 'Make one fake dispatch call and get gone.', 370, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-maua-centro', 'Maua Centro', -23.6685, -46.4612, 'Maua', 'city-core', 'terminal-pressure', 'Station proximity, busy markets, and zero free speed.', 'Clock where the station energy starts dominating the block.', 'Touch the core and punch the exit before the crowd wins.', 'Give the square one sarcastic compliment and bounce.', 380, true),
  ((select id from pack_refs where slug = 'saopaulo'), 'saopaulo-maua-zaira', 'Zaira Rise', -23.6485, -46.4312, 'Maua', 'rise', 'peripheral-energy', 'Deep peripheral climb, rough but honest streets.', 'Clock the first street that feels more neighborhood than sprawl.', 'Tag the rise and breathe once before the next move.', 'Act like this corner was your home straight and move.', 390, true)
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
