-- City batch seed: Munich (Expanded v2)
-- Focus: Historic center, Isar lanes, Schwabing grids, and diverse outer districts across the city.

insert into public.city_packs (slug, name, route_note, finish_label, safety_note, is_active)
values
  ('munich', 'Munich', 'Isar seams, Altstadt pressure, and clean Schwabing grids that punish hesitation.', 'Sheet clear, alpine air held, line still sharp.', 'Ride inside local laws, stay sharp around pedestrians and tram tracks, and keep every move blunt.', true)
on conflict (slug) do update
set
  name = excluded.name,
  route_note = excluded.route_note,
  finish_label = excluded.finish_label,
  safety_note = excluded.safety_note,
  is_active = excluded.is_active,
  updated_at = now();

with pack_refs as (
  select id, slug from public.city_packs where slug = 'munich'
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
  ((select id from pack_refs where slug = 'munich'), 'munich-marienplatz-cut', 'Marienplatz Cut', 48.1371, 11.5754, 'Altstadt', 'street-cut', 'tourist-drag', 'Pedestrian drag, tourist cross-traffic, one clean escape if you read it early.', 'Clock the least postcard corner and trust it more than the famous one.', 'Touch the cut, find the clean seam, and keep it blunt.', 'Give the Glockenspiel one sarcastic compliment and disappear.', 10, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-isar-line', 'Isar Line', 48.1280, 11.5885, 'Au-Haidhausen', 'line', 'river-drag', 'River drag, bridge approaches, and exits that feel cleaner than they look.', 'Clock the exact point where the river stops helping and starts tempting.', 'Touch the line and get back into the street before you get lazy.', 'Give the water one fake title-defense stare and cut out.', 20, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-schwabing-grid', 'Schwabing Grid', 48.1618, 11.5841, 'Schwabing', 'grid', 'uni-drag', 'University drag, bike-heavy lanes, and wrong ways to ride all of them.', 'Clock which side lane riders actually use to keep the move alive.', 'Touch the grid, stay off the obvious line, and leave before it clogs.', 'Give the strip one fake podium nod and disappear.', 30, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-olympiapark-edge', 'Olympiapark Edge', 48.1755, 11.5520, 'Milbertshofen', 'edge', 'park-shadow', 'Open park seam, tower shadow, and a lazy trap if you stop paying attention.', 'Clock the moment the city sound falls off when you hit the park edge.', 'Touch the edge, breathe once, and get back to work.', 'Throw one fake champion glare at the Olympic tower and roll out.', 40, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-sendling-cut', 'Sendling Cut', 48.1196, 11.5508, 'Sendling', 'street-cut', 'tram-trap', 'Tight local blocks, tram tracks, and no clean mistakes.', 'Clock the corner that feels more daily grind than design.', 'Touch the cut and leave before the tram line traps you.', 'Give the block one fake sponsor tag and bounce.', 50, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-haidhausen-rise', 'Haidhausen Rise', 48.1327, 11.5983, 'Haidhausen', 'rise', 'lift-pressure', 'Short lift from the river flat, fast exits if you commit.', 'Clock where the block stops feeling flat and starts talking back.', 'Tag the rise, breathe once, and punch through clean.', 'Treat that little wall like a mountain stage and leave with a straight face.', 60, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-westend-seam', 'Westend Seam', 48.1340, 11.5401, 'Schwanthalerhoehe', 'seam', 'rail-edge', 'Brewery air, rail edge proximity, useful cuts hiding in plain sight.', 'Clock one sign the block still wears from an older version of itself.', 'Touch the seam, lock the exit, and keep the whole move blunt.', 'Give the line one fake sponsor shout and cut out.', 70, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-maxvorstadt-line', 'Maxvorstadt Line', 48.1508, 11.5670, 'Maxvorstadt', 'line', 'gallery-spill', 'Museum strip, wide blocks, fast cross streets hiding under soft-looking facades.', 'Clock which lane feels more rider than gallery visitor.', 'Touch the line and leave before the block goes polite.', 'Give the whole strip one fake style score and bounce.', 80, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-neuhausen-grid', 'Neuhausen Grid', 48.1540, 11.5333, 'Neuhausen', 'grid', 'market-drag', 'Old-core blocks, Rotkreuzplatz pressure, and no reward for drifting.', 'Clock the first corner that feels more neighbor than restaurant crowd.', 'Touch the grid, trust the gap, and keep your pace honest.', 'Give the marketplace one fake historical commentary and disappear.', 90, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-bogenhausen-seam', 'Bogenhausen Seam', 48.1472, 11.6167, 'Bogenhausen', 'seam', 'estate-gravity', 'Tower views, park edges, and long avenues that demand commitment.', 'Clock the side street riders would actually trust here.', 'Touch the seam, read the exit quick, and keep your pace blunt.', 'Throw one fake champion stare at the skyline and bounce.', 100, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-giesing-rise', 'Giesing Rise', 48.1147, 11.5833, 'Obergiesing', 'rise', 'hill-bite', 'Stadium shadow, short climbs, and blue-collar energy.', 'Clock the point where the block stops feeling flat and starts talking back.', 'Tag the rise, breathe once, and punch through before it slows you.', 'Act like that punchy wall was always part of the plan and keep rolling.', 110, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-laim-pocket', 'Laim Pocket', 48.1400, 11.5033, 'Laim', 'pocket', 'quiet-fast', 'Quiet residential pocket with punchy exits back to the city grid.', 'Clock how quickly the atmosphere shifts when you enter the pocket.', 'Touch the pocket and hit the quick exit before it softens you.', 'Pretend this was always your secret warmup lane and move on.', 120, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-moosach-grid', 'Moosach Grid', 48.1800, 11.5167, 'Moosach', 'grid', 'transit-pressure', 'U-bahn gravity, commercial drag, and better lines hiding off the obvious path.', 'Clock one detail riders actually trust when the block gets loud.', 'Touch the grid, lock the clean lane, and stay off cruise mode.', 'Give the block one fake style score and keep pushing.', 130, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-thalkirchen-edge', 'Thalkirchen Edge', 48.1000, 11.5450, 'Thalkirchen', 'edge', 'river-flat', 'Park proximity, river flat, and a lazy trap if you start coasting.', 'Clock the exact point the water stops helping and starts tempting.', 'Touch the edge and get back into the grid before it flattens you.', 'Throw one fake title-defense nod at the Isar and bounce.', 140, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-berg-am-laim-cut', 'Berg am Laim Cut', 48.1250, 11.6333, 'Berg am Laim', 'street-cut', 'industrial-seam', 'Rail yard proximity, worker rhythm, and no patient for bad timing.', 'Clock one tiny detail that locals would notice before visitors ever do.', 'Touch the cut and trust the cleaner side instantly.', 'Mutter one fake dispatch line and leave before the block talks back.', 150, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-hadern-line', 'Hadern Line', 48.1150, 11.4833, 'Hadern', 'line', 'sprawl-pressure', 'Southwest sprawl, hospital edge, useful reads if you stay committed.', 'Clock etc point where the city sound falls off when you hit the edge.', 'Touch the line and get back on the main path before the crawl drags you.', 'Give the strip one fake sponsor shout and move on.', 160, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-nymphenburg-drift', 'Nymphenburg Drift', 48.1583, 11.5033, 'Nymphenburg', 'drift', 'palace-shadow', 'Palace shadow, park walls, and wide avenues that reward nerve.', 'Clock the first corner that feels more local than tourist stroll.', 'Touch the drift, pick the clean line, and stay committed.', 'Throw one fake champion glare at the palace and roll out.', 170, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-ramersdorf-seam', 'Ramersdorf Seam', 48.1167, 11.6167, 'Ramersdorf', 'seam', 'highway-drag', 'A8 edge, commercial spill, and no reward for drifting.', 'Clock which service road exit feels most usable for a real move.', 'Touch the seam and cut before the highway rhythm flattens your move.', 'Quietly narrate your move like race radio and keep it moving.', 180, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-trudering-pocket', 'Trudering Pocket', 48.1250, 11.6667, 'Trudering', 'pocket', 'old-village-vibe', 'Former village core, tight streets, and fast exits off the main drag.', 'Clock how fast the atmosphere shifts when you hit the old core.', 'Touch the pocket and hit the quick exit before the light flips.', 'Act like this was always your secret shortcut and leave.', 190, true),
  ((select id from pack_refs where slug = 'munich'), 'munich-freimann-line', 'Freimann Line', 48.1917, 11.6167, 'Freimann', 'line', 'northern-drag', 'Northern grid, stadium pull, and wide blocks that punish lazy reads.', 'Clock which lane feels more rider than stadium commute spill.', 'Touch the line, stay top of the rhythm change, and keep it blunt.', 'Make one fake race-radio call and bounce.', 200, true)
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
