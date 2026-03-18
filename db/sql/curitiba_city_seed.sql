-- City batch seed: Curitiba (Expanded v2)
-- Focus: Historic core, Batel drag, and diverse neighborhood grids across the entire city area.

insert into public.city_packs (slug, name, route_note, finish_label, safety_note, is_active)
values
  ('curitiba', 'Curitiba', 'Plaza pressure, Batel lines, and neighborhood grids that reward commitment.', 'Sheet clear, cold air held, line still clean.', 'Ride inside local laws, stay sharp around pedestrian spills and tram rhythm, and keep every task grounded.', true)
on conflict (slug) do update
set
  name = excluded.name,
  route_note = excluded.route_note,
  finish_label = excluded.finish_label,
  safety_note = excluded.safety_note,
  is_active = excluded.is_active,
  updated_at = now();

with pack_refs as (
  select id, slug from public.city_packs where slug = 'curitiba'
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
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-centro-historico', 'Centro Historico Cut', -25.4284, -49.2733, 'Centro Historico', 'street-cut', 'decision-pressure', 'Tight colonial blocks, pedestrian spill, and decisions that punish hesitation.', 'Clock the first corner that feels more local grind than heritage walk.', 'Touch the cut, pick the clean exit, and keep your pace blunt.', 'Give the old town one fake historical commentary and disappear.', 10, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-batel-line', 'Batel Line', -25.4371, -49.2880, 'Batel', 'line', 'cafe-drag', 'Wide avenues, cafe drag, and side streets hiding better reads.', 'Clock the side lane that feels more rider than brunch crowd.', 'Touch the line, stay off the obvious avenue, and leave before it goes polite.', 'Rate the block out of ten like a harsh sponsor and bounce.', 20, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-reboucas-seam', 'Reboucas Seam', -25.4441, -49.2674, 'Reboucas', 'seam', 'rail-rhythm', 'Rail yard proximity, blue-collar rhythm, no free speed.', 'Clock the exact point where the block feels more machine than city.', 'Touch the seam, trust the next cut, and keep it clean.', 'Throw one fake champion stare at the rails and bounce.', 30, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-juveve-pocket', 'Juveve Pocket', -25.4115, -49.2681, 'Juveve', 'pocket', 'mood-shift', 'Quiet residential pocket with punchy exits back into the grid.', 'Clock how quickly the block mood shifts when you enter it.', 'Touch the pocket and hit the quick exit before it softens you.', 'Act like this was always your secret lane and leave.', 40, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-mercado-municipal', 'Mercado Municipal Edge', -25.4303, -49.2681, 'Centro', 'edge', 'market-energy', 'Market energy, delivery trucks, tight loading-zone reads.', 'Clock one tiny detail that locals would notice before visitors ever do.', 'Touch the edge, pick the cleaner line, and get gone.', 'Mutter one fake dispatch line and leave before the block talks back.', 50, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-barigui-break', 'Barigui Break', -25.4237, -49.3116, 'Santo Inacio', 'break', 'park-softness', 'Park edge, open air, and a trap if you start coasting.', 'Clock the exact point where the park air starts making bad ideas feel clean.', 'Touch the break and get back into the grid before it softens you.', 'Give the park one fake sponsor shout and cut back in.', 60, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-bacacheri-grid', 'Bacacheri Grid', -25.3966, -49.2494, 'Bacacheri', 'grid', 'scenic-trap', 'Long blocks, military zone edge, zero need for scenic pacing.', 'Clock the cross street riders actually trust here.', 'Touch the grid, trust the gap, and leave before the light flips the day.', 'Give the block one fake style score and move on.', 70, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-portao-rise', 'Portao Rise', -25.4597, -49.2907, 'Portao', 'rise', 'grade-change', 'Grade change, commercial base, one good line if you trust it.', 'Clock where the block starts feeling less flat than the map promised.', 'Tag the rise and stay on top of the climb.', 'Act like that punchy wall was exactly what you came for.', 80, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-santa-felicidade-edge', 'Santa Felicidade Edge', -25.4022, -49.3304, 'Santa Felicidade', 'edge', 'pasta-drag', 'Old country spirit, restaurant drag, and fast exits off the tourist path.', 'Clock the corner that feels more garden gate than gallery entrance.', 'Touch the edge and keep the cadence blunt.', 'Give the block one fake sponsor shout and move on.', 90, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-cabral-seam', 'Cabral Seam', -25.4071, -49.2520, 'Cabral', 'seam', 'high-end-grit', 'Tower pressure, clean streets, and hidden service lanes that reward local knowledge.', 'Clock one details that riders actually trust when the block gets loud.', 'Touch the seam, trust the next gap, and keep it rude.', 'Throw one fake champion stare at the skyline and bounce.', 100, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-agua-verde-grid', 'Agua Verde Grid', -25.4526, -49.2847, 'Agua Verde', 'grid', 'residential-pressure', 'Dense blocks, tree-lined traps, and speed if you read the breaks right.', 'Clock the side street that feels cleaner than the main road deserves.', 'Touch the grid and stay off the obvious avenue.', 'Make one fake race-radio call and move on.', 110, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-merces-rise', 'Merces Rise', -25.4227, -49.2904, 'Merces', 'rise', 'hill-bite', 'Tower gravity, short climbs, and history you can ignore if you want to.', 'Clock where the block starts feeling less flat than the map promised.', 'Tag the rise, breathe once, and punch through clean.', 'Treat that little wall like a mountain stage and bounce.', 120, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-hugo-lange-pocket', 'Hugo Lange Pocket', -25.4184, -49.2450, 'Hugo Lange', 'pocket', 'quiet-fast', 'Quiet residential pocket with punchy exits back back to the grid.', 'Clock how fast the atmosphere shifts when you hit the pocket.', 'Touch the pocket and hit the quick exit before it softens you.', 'Act like this was your secret training lane and leave.', 130, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-capao-raso-drift', 'Capao Raso Drift', -25.5013, -49.2931, 'Capao Raso', 'drift', 'south-zone-energy', 'Long blocks, south zone rhythm, and zero reason to coast.', 'Clock the point where factory energy bleeds into family life.', 'Touch the drift, lock the exit, and keep the move blunt.', 'Give the strip one fake alleycat sponsor tag and get gone.', 140, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-bigorrilho-canyon', 'Bigorrilho Canyon', -25.4350, -49.2954, 'Bigorrilho', 'canyon', 'tower-pressure', 'Tower pressure, wind tunnels, and fast lines hiding under glass facades.', 'Clock the lane that feels more rider than office worker drag.', 'Touch the canyon, pick the clean line, and stay committed.', 'Throw one fake podium finish nod at the plaza and bounce.', 150, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-boqueirao-drag', 'Boqueirao Drag', -25.5050, -49.2366, 'Boqueirao', 'line', 'industrial-rhythm', 'Logistics drag, heavy air, and long routes that punish lazy reads.', 'Clock which service road exit feels most usable for a real move.', 'Touch the drag and cut back into the blocks before the rhythm takes over.', 'Quietly narrate the move like race radio and leave.', 160, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-parolin-grit', 'Parolin Grit', -25.4626, -49.2709, 'Parolin', 'grit', 'blue-collar-drag', 'Worker rhythm, rail proximity, and no patience for bad timing.', 'Clock one sign the block still wears from an older version of itself.', 'Touch the grit, read the exit quick, and keep the cadence mean.', 'Rate the block like a harsh race judge and vanish.', 170, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-sitio-cercado-edge', 'Sitio Cercado Edge', -25.5456, -49.2631, 'Sitio Cercado', 'edge', 'sprawl-pressure', 'South zone sprawl, useful reads if you stay committed.', 'Clock the exact line locals still trust when the block gets quiet.', 'Touch the edge and get out before the sprawl flattens your move.', 'Give the zone one fake stadium announcement and get gone.', 180, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-pinheirinho-grid', 'Pinheirinho Grid', -25.5250, -49.2933, 'Pinheirinho', 'grid', 'transit-pull', 'Terminal pressure, highway edge, and no room for soft timing.', 'Clock which block feels more messenger than commuter spill.', 'Touch the grid, lock the next move, and stay off cruise mode.', 'Make one fake dispatch line and disappear.', 190, true),
  ((select id from pack_refs where slug = 'curitiba'), 'curitiba-prado-velho-cut', 'Prado Velho Cut', -25.4522, -49.2631, 'Prado Velho', 'street-cut', 'river-drag', 'Uni edge, river drag, and fast cross streets hiding under soft facades.', 'Clock where the water stops helping and starts baiting you.', 'Touch the cut and trust the cleaner exit instantly.', 'Quietly narrate your move like race radio and move on.', 200, true)
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
