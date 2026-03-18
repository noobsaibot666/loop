-- City expansion seed: Berlin, Germany
-- Focus: Expanding coverage across all major districts for better route variety.

with pack_refs as (
  select id, slug from public.city_packs where slug = 'berlin'
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
  ((select id from pack_refs where slug = 'berlin'), 'berlin-leo-grid', 'Leopoldplatz Grid', 52.5463, 13.3592, 'Wedding', 'grid', 'local-grit', 'Open square, fast edges, zero tourism bias.', 'Clock the first corner that feels more rider than market spill.', 'Touch the grid and stay sharp through the turns.', 'Rate the block out of ten and skip the pause.', 120, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-weser-line', 'Weserstrasse Line', 52.4834, 13.4345, 'Neukoelln', 'line', 'bar-pressure', 'Tight blocks, bar spill, and cleaner cuts if you trust the read.', 'Clock the lane locals use when they are not here for the scene.', 'Touch the line and leave before the crowd flattens your move.', 'Give the strip one fake sponsor shout and bounce.', 130, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-yorck-seam', 'Yorckstrasse Seam', 52.4925, 13.3695, 'Schoeneberg', 'seam', 'rail-edge', 'Iron bridges, rail seams, and fast escapes hiding underneath.', 'Clock the exact point the noise of the bridges changes your mood.', 'Touch the seam, lock the exit, and keep the line blunt.', 'Give the rails one fake title-defense nod and disappear.', 140, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-boxi-pocket', 'Boxhagener Pocket', 52.5112, 13.4592, 'Friedrichshain', 'pocket', 'market-drag', 'Square pressure, messy edges, and no reward for drifting.', 'Clock where the square energy starts owning the block flow.', 'Touch the pocket and hit the fast side before it clogs up.', 'Act like this was your secret lane all week and move on.', 150, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-herzberg-line', 'Herzberg Line', 52.5276, 13.4834, 'Lichtenberg', 'line', 'industrial-reads', 'Industrial edge, wide blocks, and no help if you go soft.', 'Clock which block moves faster than the tram line nearby.', 'Touch the line and stay sharp through the industrial sprawl.', 'Rate the block like a harsh race judge and leave.', 160, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-husemann-pocket', 'Husemann Pocket', 52.5356, 13.4145, 'Prenzlauer Berg', 'pocket', 'old-core-quiet', 'Quiet stone blocks, legacy air, and fast side exits.', 'Clock the least polished corner and trust it over the clean one.', 'Touch the pocket and hit the exit before it softens you.', 'Give the block one fake style score and bounce.', 170, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-moabit-cut', 'Moabit Cut', 52.5265, 13.3385, 'Moabit', 'street-cut', 'island-pressure', 'River edge, prison wall nearby, and no reason to ride polite.', 'Clock the first corner that feels more rider than administrative flow.', 'Touch the cut and stay sharp through the river flat.', 'Make one fake dispatch call and get gone.', 180, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-ku-damm-edge', 'Ku-Damm Edge', 52.5024, 13.3285, 'Charlottenburg', 'edge', 'west-city-drag', 'Avenue pressure, wide lanes, and long reads hiding in the side streets.', 'Clock the side lane that feels more rider than luxury spill.', 'Touch the edge and vanish back into the side blocks fast.', 'Give the boulevard one sarcastic compliment and bounce.', 190, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-goerli-edge', 'Goerlitzer Edge', 52.4984, 13.4385, 'Kreuzberg', 'edge', 'park-noise', 'Park edge, wall remains, and no room for soft timing.', 'Clock where the park energy starts dominating the block.', 'Touch the edge and cut back in before the crowd wins.', 'Throw one fake champion glare at the grass and move.', 200, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-pankow-seam', 'Pankow Seam', 52.5695, 13.4024, 'Pankow', 'seam', 'north-rhythm', 'North zone pace, wide connections, and consistent speed.', 'Clock the lane locals actually trust for quick crossing.', 'Touch the seam and keep the cadence mean.', 'Mutter one fake race-radio call and vanish.', 210, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-hansa-grid', 'Hansaplatz Grid', 52.5186, 13.3424, 'Tiergarten', 'grid', 'modernist-quiet', 'Open grid, modernist blocks, and fast line opportunities.', 'Clock how quickly the sound changes once you enter the grid.', 'Touch the grid and stay sharp through the open spaces.', 'Act like this corner was your home straight and move.', 220, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-hackescher-cut', 'Hackescher Cut', 52.5234, 13.4024, 'Mitte', 'street-cut', 'tourist-trap-edge', 'Tight alleys, high pressure, and one clean line if you read it early.', 'Find the least postcard angle and trust it more than the obvious one.', 'Touch the cut and leave before the center clogs your pace.', 'Give the square one fake sponsor shout and move.', 230, true),
  ((select id from pack_refs where slug = 'berlin'), 'berlin-gleisdreieck-edge', 'Gleisdreieck Edge', 52.4975, 13.3768, 'Kreuzberg', 'edge', 'park-rail-mix', 'New park, old rails, fast seams between the two.', 'Clock where the rail noise stops and the park noise starts.', 'Touch the edge and lock the escape in one glance.', 'Quietly narrate the move like you own the block and roll.', 240, true)
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
