insert into public.city_packs (slug, name, route_note, finish_label, safety_note, is_active)
values
  (
    'sanfrancisco',
    'San Francisco',
    'Hill bites, waterfront drag, bridge wind, and cuts that only feel smart after you commit.',
    'Sheet clear, lungs hot, line held.',
    'Ride inside local laws, stay sharp on climbs and descents, and keep every task grounded in the real street.',
    true
  )
on conflict (slug) do update
set
  name = excluded.name,
  route_note = excluded.route_note,
  finish_label = excluded.finish_label,
  safety_note = excluded.safety_note,
  is_active = excluded.is_active,
  updated_at = now();

with pack_refs as (
  select id from public.city_packs where slug = 'sanfrancisco'
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
  ((select id from pack_refs),'sf-fidi-split','FiDi Split',37.7923,-122.3999,'Financial District','split','office-rush','Fast blocks, bad angles, and no reward for hesitation.','Clock the first line that feels more messenger than office rush.','Touch the split, pick the clean exit, and keep your pace blunt.','Make one fake dispatch call and get out before the canyon slows you down.',10,true),
  ((select id from pack_refs),'sf-embarcadero-run','Embarcadero Run',37.7968,-122.3935,'Embarcadero','waterline','water-drag','Water drag, ferry traffic, and a line that only works if you leave it on time.','Clock the exact point the waterfront stops helping and starts baiting you.','Touch the run and get back into the grid before the view softens the move.','Throw one fake champion glare at the bay and cut back in.',20,true),
  ((select id from pack_refs),'sf-chinatown-cut','Chinatown Cut',37.7944,-122.4079,'Chinatown','street-cut','tight-grade','Tight grade, tighter corners, no clean mistakes.','Clock the steepest corner that still feels rideable.','Touch the cut, trust the drop, and keep it clean.','Act like that climb was free and keep rolling.',30,true),
  ((select id from pack_refs),'sf-northbeach-rise','North Beach Rise',37.8021,-122.4102,'North Beach','rise','short-wall','Short lift, fast exits, no room for soft legs.','Clock where the block stops looking flat and starts talking back.','Tag the rise, breathe once, and punch through clean.','Treat that little wall like a mountain stage and leave with a straight face.',40,true),
  ((select id from pack_refs),'sf-russian-hill-edge','Russian Hill Edge',37.8006,-122.4192,'Russian Hill','edge','pretty-trap','Pretty trap, bad grades, one smart exit if you read it early.','Clock the least postcard corner and trust it more than the obvious one.','Touch the edge and keep the line tighter than the hill deserves.','Give the view one sarcastic compliment and disappear.',50,true),
  ((select id from pack_refs),'sf-civic-center-line','Civic Center Line',37.7796,-122.4148,'Civic Center','line','open-ugly','Open blocks, ugly seams, useful exits if your head stays on.','Clock the side street that looks calmer than it has any right to.','Touch the line, lock the exit, and keep moving.','Pretend you planned that cut three lights ago and own it.',60,true),
  ((select id from pack_refs),'sf-hayes-cut','Hayes Cut',37.7763,-122.4242,'Hayes Valley','street-cut','soft-trap','Fast cross streets hiding under soft-looking blocks.','Clock which lane feels more rider than retail.','Touch the cut and leave before the block goes polite.','Give the whole strip one fake style score and bounce.',70,true),
  ((select id from pack_refs),'sf-mission-grid','Mission Grid',37.7598,-122.4148,'Mission','grid','worker-rush','Bodega corners, quick lines, and no need for scenic pacing.','Clock the first block that feels more worker rush than brunch drift.','Touch the grid, trust the next gap, and keep it rude.','Make one fake alleycat sponsor tag and keep pushing.',80,true),
  ((select id from pack_refs),'sf-valencia-seam','Valencia Seam',37.7651,-122.4216,'Mission','seam','bike-heavy','Bike-heavy stretch with plenty of wrong ways to ride it.','Clock the side lane riders actually use to keep the move alive.','Touch the seam, stay off the obvious line, and leave before it clogs.','Give the strip one fake podium nod and disappear.',90,true),
  ((select id from pack_refs),'sf-potrero-rise','Potrero Rise',37.7595,-122.4016,'Potrero Hill','rise','hill-bite','Hill bite, warehouse air, no free speed anywhere near it.','Clock where the block starts feeling less flat than the map promised.','Tag the rise and stay on top of the climb.','Act like that punchy wall was exactly what you came for.',100,true),
  ((select id from pack_refs),'sf-dogpatch-line','Dogpatch Line',37.7590,-122.3883,'Dogpatch','line','rail-edge','Rail edge, long reads, and cuts that feel better than they look.','Clock the corner that still feels more work than weekend.','Touch the line, trust the cleaner side, and keep the pace sharp.','Throw one fake champion stare at the tracks and bounce.',110,true),
  ((select id from pack_refs),'sf-mission-bay-break','Mission Bay Break',37.7707,-122.3910,'Mission Bay','break','open-air','Wide lanes, open air, and a trap if you start coasting.','Clock the exact point where the bay air starts making bad ideas feel clean.','Touch the break and get back into the grid before it softens you.','Give the whole zone one fake tech-campus curse and leave.',120,true),
  ((select id from pack_refs),'sf-castro-pocket','Castro Pocket',37.7609,-122.4350,'Castro','pocket','short-reset','Short pocket, fast exits, and one good read if you trust it.','Clock the calmest lane in the middle of all that motion.','Touch the pocket and hit the quick exit before it flattens out.','Act like this was your secret lane all week and keep it moving.',130,true),
  ((select id from pack_refs),'sf-haight-cross','Haight Cross',37.7699,-122.4469,'Haight','cross','slight-lift','Cross traffic, slight lift, and no reason to drift.','Clock which corner feels more rider than visitor.','Touch the cross and cut before the block gets weird.','Mutter one fake director note and move on.',140,true),
  ((select id from pack_refs),'sf-presidio-gate','Presidio Gate',37.7981,-122.4487,'Presidio','gate','open-edge','Open edge, military-grade calm, and exits that still need nerve.','Clock the exact moment the city sound falls off when you hit the gate.','Touch the gate, breathe once, and get back to work.','Give the trees one fake sponsor shout and roll out.',150,true),
  ((select id from pack_refs),'sf-marina-edge','Marina Edge',37.8042,-122.4394,'Marina','edge','bay-wind','Wind off the water and no help if you start admiring it.','Clock the least postcard angle and trust it more than the obvious one.','Touch the edge and leave before the breeze turns into drag.','Throw one fake title-defense nod at the bay and vanish.',160,true),
  ((select id from pack_refs),'sf-golden-gate-runup','Golden Gate Run-Up',37.8076,-122.4749,'Presidio','bridge-runup','bridge-gravity','Bridge gravity, open wind, and a line that punishes lazy approach speed.','Clock the exact point the bridge starts owning the block.','Touch the run-up and commit before hesitation costs speed.','Give the bridge one fake champion stare and keep it moving.',170,true)
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
