-- City batch seed: Guarulhos
-- Focus: Major logistics hub, dense industrial seams, and residential climbs.

insert into public.city_packs (slug, name, route_note, finish_label, safety_note, is_active)
values
  ('guarulhos', 'Guarulhos', 'Industrial drag, valley climbs, and airport seams that punish soft timing.', 'Sheet clear, valley air held, line still clean.', 'Ride inside local laws, stay sharp around heavy transport and hills, and keep every task grounded.', true)
on conflict (slug) do update
set
  name = excluded.name,
  route_note = excluded.route_note,
  finish_label = excluded.finish_label,
  safety_note = excluded.safety_note,
  is_active = excluded.is_active,
  updated_at = now();

with pack_refs as (
  select id, slug from public.city_packs where slug = 'guarulhos'
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
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-centro-seam','Centro Seam',-23.4667,-46.5333,'Centro','seam','grid-pressure','Market pressure, bus pull, and no reward for soft timing.','Clock the side street riders actually trust in the middle of the rush.','Touch the seam and lock the hard exit instantly.','Give the canyon one fake dispatch line and disappear.',10,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-maia-runup','Maia Run-Up',-23.4545,-46.5338,'Vila Maia','run-up','hill-bite','Hill bite, park edge nearby, and cleaner lines just off the main drag.','Clock how fast the altitude changes the block mood.','Touch the run-up and commit before hesitation costs speed.','Throw one fake champion glare at the hill and keep rolling.',20,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-cumbica-drag','Cumbica Drag',-23.4333,-46.4667,'Cumbica','line','industrial-pressure','Logistics drag, heavy air, and long blocks that punish lazy reads.','Clock the lane that feels more rider than truck spill.','Touch the line and keep the cadence blunt.','Give the strip one fake sponsor shout and move on.',30,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-tiete-cut','Tietê Cut',-23.4833,-46.5167,'Várzea do Tietê','waterline','river-pull','River pull, flat seams, and no help if you get soft.','Clock the exact point the water stops helping and starts baiting you.','Touch the cut and get back into the grid before it flattens you.','Throw one fake title-defense nod at the water and bounce.',40,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-pimentas-pocket','Pimentas Pocket',-23.4500,-46.4000,'Pimentas','pocket','short-reset','Dense pocket, worker rhythm, and one clean side if you read it early.','Clock how fast the district vibe shifts when you hit the pocket.','Touch the pocket and leave before it flattens you.','Act like this was your lane all week and disappear.',50,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-galvao-edge','Galvão Edge',-23.4583,-46.5667,'Vila Galvão','edge','residential-drag','Lake drag nearby, old-core pressure, and cleaner exits than they look.','Clock the least postcard corner and trust it over the obvious one.','Touch the edge and keep the cadence sharp.','Rate the block like a harsh race judge and get gone.',60,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-macedo-line','Macedo Line',-23.4600,-46.5167,'Macedo','line','transit-pressure','Fast city line, hospital drag, and no room for soft reads.','Clock the cross street riders would actually trust here.','Touch the line and keep the move blunt.','Make one fake race-radio call and move on.',70,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-bom-clima-runup','Bom Clima Run-Up',-23.4444,-46.5111,'Bom Clima','run-up','hill-gravity','Hill run-up, city hall pressure, and awkward approach choices.','Clock the exact point the climb starts owning the block.','Touch the run-up and commit before hesitation costs speed.','Throw one fake trophy nod at the plaza and keep rolling.',80,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-bosque-pocket','Bosque Pocket',-23.4500,-46.5300,'Bosque Maia','pocket','short-reset','Short pocket, fast exits, and no reward for drifting.','Clock how fast the mood changes when you hit the pocket.','Touch the pocket and get out before it flattens you.','Give the park one sarcastic compliment and bounce.',90,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-taboao-cut','Taboão Cut',-23.4000,-46.5000,'Taboão','street-cut','industrial-seam','Industrial seam, logistics pull, and no patience for bad timing.','Clock the lane riders actually trust when the block gets loud.','Touch the cut and trust the cleaner side instantly.','Make one fake dispatch line and vanish.',100,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-airport-view','Airport View',-23.4300,-46.4800,'Aeroporto','water-edge','signal-pressure','Signal pressure, runway drag, and cleaner seams than they look.','Clock the least postcard angle and trust it more than the obvious one.','Touch the view and leave before the noise softens the move.','Throw one fake champion glare at the planes and cut out.',110,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-gopouva-seam','Gopoúva Seam',-23.4750,-46.5417,'Gopoúva','seam','hill-bite','Hill bite, dense blocks, and no reward for soft reads.','Clock the side lane that feels cleaner than the main road deserves.','Touch the seam and keep the pace blunt.','Rate the block like a harsh race judge and move on.',120,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-recreio-run','Recreio Run',-23.3667,-46.5500,'Recreio São Jorge','run-up','hill-gravity','Long hill, high air, and no room for soft timing.','Clock the exact line locals still trust when the block gets quiet.','Touch the run and commit before the incline flattens you.','Give the ridge one fake title-defense nod and disappear.',130,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-monte-carmelo-line','Monte Carmelo Line',-23.4417,-46.4750,'Monte Carmelo','line','dense-read','Dense blocks, logistics edge, and no patience for bad reads.','Clock the side street riders would actually trust here.','Touch the line and keep the cadence sharp.','Make one fake race-radio call and bounce.',140,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-paraventi-seam','Paraventi Seam',-23.4556,-46.5194,'Paraventi','seam','grid-pressure','Grid pressure, old-core drag, and cleaner exits hiding in plain sight.','Clock the lane that feels more rider than commuter spill.','Touch the seam and lock the hard exit instantly.','Give the block one fake dispatch line and vanish.',150,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-cocaia-cut','Cocaia Cut',-23.4417,-46.5167,'Cocaia','street-cut','hill-bite','Hill bite, worker blocks, and no reward for drifting.','Clock the corner that feels more regular than visitor drift.','Touch the cut and keep the pace blunt.','Rate the block like a harsh race judge and get gone.',160,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-bonsucesso-drag','Bonsucesso Drag',-23.3833,-46.4000,'Bonsucesso','line','industrial-pressure','Logistics drag, heavy air, and long blocks that punish lazy reads.','Clock the lane that feels more rider than truck spill.','Touch the line and keep the cadence blunt.','Give the strip one fake sponsor shout and move on.',170,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-inocoop-pocket','Inocoop Pocket',-23.4167,-46.4333,'Inocoop','pocket','short-reset','Dense pocket, worker rhythm, and one clean side if you read it early.','Clock how fast the district vibe shifts when you hit the pocket.','Touch the pocket and leave before it flattens you.','Act like this was your lane all week and disappear.',180,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-dutra-seam','Dutra Seam',-23.4333,-46.4500,'Jardim Presidente Dutra','seam','highway-pressure','Highway pressure, logistics pull, and no patience for bad timing.','Clock the lane riders actually trust when the block gets loud.','Touch the seam and trust the cleaner side instantly.','Make one fake dispatch line and vanish.',190,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-cecap-grid','Cecap Grid',-23.4500,-46.5000,'Parque Cecap','grid','modernist-drag','Modernist grid, open blocks, and better lines hiding off the obvious path.','Clock the corner that feels more regular than visitor drift.','Touch the grid, lock the clean lane, and stay off cruise mode.','Tell yourself this is not a postcard out loud and keep moving.',200,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-continental-hill','Continental Hill',-23.4500,-46.5500,'Parque Continental','rise','hill-bite','Hill bite, residential pressure, and no help if you get soft.','Clock how fast the altitude changes the block mood.','Tag the rise, breathe once, and push through before it turns into a thing.','Treat that lift like a mountain stage and then immediately get over yourself.',210,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-haras-edge','Haras Edge',-23.4000,-46.5333,'Haras','edge','quiet-fast','Quiet pocket, fast exits, looks softer than it is.','Notice how fast the block mood changes when you enter it.','Touch the edge, pick the quick exit, and don’t overthink it.','Act like this was your secret training ground all along, then leave.',220,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-augusta-seam','Augusta Seam',-23.4750,-46.5333,'Vila Augusta','seam','old-core-pressure','Old-core pressure, retail drag, and no room for soft timing.','Clock the side street riders actually trust in the middle of the rush.','Touch the seam and lock the hard exit instantly.','Give the canyon one fake dispatch line and disappear.',230,true),
  ((select id from pack_refs where slug = 'guarulhos'),'guarulhos-ponte-grande-line','Ponte Grande Line',-23.5000,-46.5333,'Ponte Grande','line','river-drag','River drag, border pressure, and long reads that reward nerve.','Clock the exact point the water stops helping and starts baiting you.','Touch the line, keep your speed honest, and leave before it drags.','Give the whole strip a fake union-strong salute and keep it moving.',240,true)
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
