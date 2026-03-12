-- Phase 3 Alleycat city expansion
-- Seeds Mexico City, Bogota, Warsaw, Barcelona, and Sao Paulo into city_packs + city_checkpoints.

insert into public.city_packs (slug, name, route_note, finish_label, safety_note, is_active)
values
  (
    'mexicocity',
    'Mexico City',
    'Fast cuts, canal drag, and blocks that reward nerve more than polish.',
    'Sheet clear, clock dead, no soft excuses left.',
    'Ride within local laws, stay sharp in traffic, and keep the task work safe and doable.',
    true
  ),
  (
    'bogota',
    'Bogota',
    'Big blocks, punchy rises, and side-street calls that matter if you want the run to feel clean.',
    'Close the list, stop the clock, act like you knew the line all along.',
    'Ride clean, stay aware, and keep every task realistic in live traffic.',
    true
  ),
  (
    'warsaw',
    'Warsaw',
    'River seams, rough splits, and enough district contrast to punish lazy reads.',
    'List cleared, pace held, story earned.',
    'Ride predictably, stay inside local laws, and do not force bad moves.',
    true
  ),
  (
    'barcelona',
    'Barcelona',
    'Grid cuts, hard corners, and just enough lift to make soft pacing expensive.',
    'Clear the sheet, kill the clock, skip the postcard ending.',
    'Stay alert, keep it legal, and make every task safe and short.',
    true
  ),
  (
    'saopaulo',
    'Sao Paulo',
    'Steep little bites, rail drag, and enough city noise to punish weak decisions.',
    'Close it hard, keep the face straight, tell the story later.',
    'Ride within local laws, stay sharp in traffic, and keep the tasks grounded.',
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
  select id, slug from public.city_packs where slug in ('mexicocity', 'bogota', 'warsaw', 'barcelona', 'saopaulo')
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
  ((select id from pack_refs where slug = 'mexicocity'),'cdmx-doctores-cut','Doctores Shopfront Cut',19.4187,-99.1466,'Doctores','street-cut','work-block','Tool shops, fast blocks, and no reason to coast.','Clock one storefront detail that says this block works harder than it talks.','Touch the cut, read the exit quick, and keep the cadence mean.','Give the block one fake sponsor tag in your head and disappear.',10,true),
  ((select id from pack_refs where slug = 'mexicocity'),'cdmx-santa-maria','Santa Maria Kiosk Edge',19.4491,-99.1624,'Santa Maria la Ribera','square-edge','open-pressure','Open square, side-street pressure, easy to read wrong.','Clock the corner locals use like a shortcut and store it for later.','Touch the edge, pick the clean seam, and get out before the square flattens you.','Make one dramatic face at the kiosk like it called you out, then move.',20,true),
  ((select id from pack_refs where slug = 'mexicocity'),'cdmx-obrera-rail','Obrera Rail Edge',19.4135,-99.1404,'Obrera','rail-edge','loud','Rail pressure, loud corners, and fast decisions.','Notice which side of the block feels louder than it should and why.','Hit the edge, trust the line, and keep your speed cleaner than the street deserves.','Quietly announce this was a tactical masterpiece and leave before anyone checks.',30,true),
  ((select id from pack_refs where slug = 'mexicocity'),'cdmx-roma-backline','Roma Backline',19.4068,-99.1632,'Roma Sur','backstreet','sharp','Pretty blocks nearby, but this line is not here for that.','Find the least polished corner and trust it more than the postcard version.','Touch the backline, lock the next move, and keep it sharp.','Give the block a fake style score out of ten and ride off before the rating sinks in.',40,true),
  ((select id from pack_refs where slug = 'mexicocity'),'cdmx-san-rafael','San Rafael Split',19.4354,-99.1668,'San Rafael','junction','bad-angle','Bad angles, useful exits, no softness.','Clock the corner that feels like old city stubbornness and remember it.','Touch the split, trust the fast side, and keep the hesitation off your face.','Mutter one fake team-radio line to yourself and move on.',50,true),
  ((select id from pack_refs where slug = 'mexicocity'),'cdmx-canal-nacional','Canal Nacional Run-Up',19.3899,-99.1214,'Iztacalco','canal-edge','water-drag','Water drag, long reads, one wrong move into dead air.','Clock how the water changes the feel of the block before you touch it.','Touch the run-up, pick the hard exit, and stay on top of it.','Throw one fake champion nod at the canal and bounce before it gets corny.',60,true),

  ((select id from pack_refs where slug = 'bogota'),'bogota-teusaquillo-cut','Teusaquillo Cut',4.6391,-74.0858,'Teusaquillo','street-cut','wide-fast','Wide blocks, hidden speed, easy to underestimate.','Clock the first corner that feels more rider than commuter.','Touch the cut, stay on top of the line, and keep it moving.','Give the block one fake alleycat title and leave before it objects.',10,true),
  ((select id from pack_refs where slug = 'bogota'),'bogota-chapinero-rise','Chapinero Rise',4.6488,-74.0617,'Chapinero','rise','punchy','A little lift, a little pressure, no free speed.','Notice where the block starts feeling less flat than the map promised.','Tag the rise, breathe once, and punch through clean.','Act like that tiny rise was mountain-stage drama and keep rolling.',20,true),
  ((select id from pack_refs where slug = 'bogota'),'bogota-san-felipe','San Felipe Grid',4.6647,-74.0732,'San Felipe','grid','warehouse-edge','Warehouse edges, art spill, and cuts that reward nerve.','Clock one wall detail that feels more local hustle than gallery gloss.','Touch the grid, call the exit fast, and keep the noise behind you.','Pretend you curated the whole block for two seconds, then disappear.',30,true),
  ((select id from pack_refs where slug = 'bogota'),'bogota-parkway','Parkway Edge',4.6352,-74.0757,'La Soledad','strip-edge','open-center','Open center, tight edges, no easy choice.','Clock which side of the strip feels more alive without trying.','Touch the edge, choose the clean lane, and do not drift.','Give the strip one fake race commentary line and move on.',40,true),
  ((select id from pack_refs where slug = 'bogota'),'bogota-industrial-line','Puente Aranda Line',4.6217,-74.1113,'Puente Aranda','industrial-line','machine','Industrial blocks, long sightlines, and bad decisions if you switch off.','Clock the exact moment the block feels more machine than city.','Touch the line, keep your speed honest, and leave before it drags.','Give the whole strip a fake union-strong salute and keep it moving.',50,true),
  ((select id from pack_refs where slug = 'bogota'),'bogota-river-seam','Salitre River Seam',4.6591,-74.1098,'Salitre','river-edge','wind-reset','Wind seam, awkward edges, good reset if you read it right.','Notice what the wind does to the mood of the block and why.','Use the river seam as a reset, then get back into the grid sharply.','Throw one fake championship glare at the water and bounce.',60,true),

  ((select id from pack_refs where slug = 'warsaw'),'warsaw-powisle-drop','Powiśle Drop',52.2376,21.0348,'Powiśle','river-drop','hard-read','River pull, underpass choices, no space for soft calls.','Clock the corner that feels most like locals actually use it, not maps.','Hit the drop, choose the clean exit, and keep the line tight.','Give the river one fake title-defense nod and move along.',10,true),
  ((select id from pack_refs where slug = 'warsaw'),'warsaw-praga-yard','Praga Yard Edge',52.2501,21.0496,'Praga','yard-edge','rough','Brick, rails, and the right amount of friction.','Clock the roughest useful corner and remember why it works.','Touch the yard edge, trust the next cut, and keep it blunt.','Quietly rate the whole block like a harsh race judge and leave.',20,true),
  ((select id from pack_refs where slug = 'warsaw'),'warsaw-muranow-cut','Muranów Cut',52.2498,20.9941,'Muranów','street-cut','open-confusing','Open blocks with just enough confusion to matter.','Clock which side street feels calmer than it should.','Touch the cut, call the exit in one glance, and go.','Give the block a fake tactical breakdown under your breath and move on.',30,true),
  ((select id from pack_refs where slug = 'warsaw'),'warsaw-ochota-line','Ochota Line',52.2196,20.9847,'Ochota','line','wide-nearby','Wide roads nearby, better lines tucked off them.','Clock one useful line that a tourist would never pick.','Touch the line, keep the pace honest, and leave before it opens up too much.','Make one fake radio-check to yourself and carry on.',40,true),
  ((select id from pack_refs where slug = 'warsaw'),'warsaw-zoliborz-pocket','Żoliborz Pocket',52.2689,20.9862,'Żoliborz','pocket','quiet-fast','Quiet pocket, fast exits, looks softer than it is.','Notice how fast the block mood changes when you enter it.','Touch the pocket, pick the quick exit, and don’t overthink it.','Act like this was your secret training ground all along, then leave.',50,true),
  ((select id from pack_refs where slug = 'warsaw'),'warsaw-mokotow-split','Mokotów Split',52.1942,21.0308,'Mokotów','split','choice-heavy','Too many useful exits, which is exactly the problem.','Clock the side that feels more lived in than designed.','Touch the split, choose hard, and keep the cadence clean.','Give the junction one sarcastic compliment and bounce.',60,true),

  ((select id from pack_refs where slug = 'barcelona'),'barcelona-poblenou-grid','Poblenou Grid',41.4015,2.2026,'Poblenou','grid','no-postcard','Long blocks, sharp turns, no reason to drift into the beach fantasy.','Clock the first block that feels more workday than waterfront.','Touch the grid, lock the clean lane, and stay off cruise mode.','Tell yourself this is not a postcard out loud and keep moving.',10,true),
  ((select id from pack_refs where slug = 'barcelona'),'barcelona-sants-cut','Sants Cut',41.3777,2.1366,'Sants','station-cut','hard-exit','Station gravity nearby, better moves off to the side.','Clock the corner commuters ignore but riders should not.','Touch the cut, pick the hard exit, and keep your line tight.','Make one fake team-director call to yourself and carry on.',20,true),
  ((select id from pack_refs where slug = 'barcelona'),'barcelona-gracia-rise','Gràcia Rise',41.4042,2.1568,'Gràcia','rise','short-lift','A little climb, a little noise, zero free points.','Notice where the street stops feeling flat and starts feeling personal.','Tag the rise, breathe once, and push through before it turns into a thing.','Treat that lift like a mountain stage and then immediately get over yourself.',30,true),
  ((select id from pack_refs where slug = 'barcelona'),'barcelona-raval-edge','Raval Edge',41.3799,2.1686,'Raval','edge','tight-fast','Tight edges, fast reads, easy to get distracted.','Clock the least polished useful corner and trust it.','Touch the edge, leave before the block tries to keep your attention.','Give the block a fake style award and vanish.',40,true),
  ((select id from pack_refs where slug = 'barcelona'),'barcelona-sant-antoni','Sant Antoni Ring',41.3785,2.1595,'Sant Antoni','ring','bad-geometry','Good exits, bad geometry, perfect.','Clock which side of the ring feels calmer than it should.','Touch the ring, trust the fast side, and don’t drift into soft lines.','Mutter one fake apology to traffic and keep rolling.',50,true),
  ((select id from pack_refs where slug = 'barcelona'),'barcelona-clot-line','Clot Line',41.4121,2.1907,'Clot','line','rail-nearby','Rail pressure nearby, useful cuts if you read them right.','Clock the line locals use when they are trying not to be seen waiting.','Touch the line, read the next move once, and go.','Give the whole strip one fake alleycat sponsor tag and bounce.',60,true),

  ((select id from pack_refs where slug = 'saopaulo'),'saopaulo-bixiga-cut','Bixiga Cut',-23.5584,-46.6462,'Bixiga','street-cut','city-bite','Short climbs, loud corners, proper city bite.','Clock the first corner that feels more neighborhood than performance.','Touch the cut, keep the pressure on, and leave before the block slows you.','Act like that corner was your home straight and move on.',10,true),
  ((select id from pack_refs where slug = 'saopaulo'),'saopaulo-liberdade-edge','Liberdade Edge',-23.5552,-46.6357,'Liberdade','edge','crowd-pull','Crowd pull, side-street exits, easy to read wrong.','Clock one tiny detail that locals would notice before visitors ever do.','Touch the edge, pick the cleaner line, and get gone.','Give the whole block a fake rating out of ten and disappear.',20,true),
  ((select id from pack_refs where slug = 'saopaulo'),'saopaulo-barra-funda','Barra Funda Yard',-23.5252,-46.6672,'Barra Funda','yard-edge','rail-drag','Rail energy, rough edges, good decisions matter here.','Clock the exact point where the block feels more machine than city.','Touch the yard edge, trust the next cut, and keep it clean.','Throw one fake champion stare at the rails and bounce.',30,true),
  ((select id from pack_refs where slug = 'saopaulo'),'saopaulo-vila-madalena','Vila Madalena Backline',-23.5507,-46.6917,'Vila Madalena','backstreet','hill-pressure','Hills, bars, and side streets that reward commitment.','Clock the least polished useful corner and trust it more than the obvious one.','Touch the backline, hold your pace, and do not let the hill get in your head.','Make one fake heroic face at the slope and keep it pushing.',40,true),
  ((select id from pack_refs where slug = 'saopaulo'),'saopaulo-luz-runup','Luz Run-Up',-23.5346,-46.6358,'Luz','run-up','station-gravity','Station gravity and long reads under pressure.','Clock which direction feels rougher than the map would admit.','Touch the run-up, pick your line, and keep the hesitation out of it.','Quietly narrate the move like race radio and leave before it gets weird.',50,true),
  ((select id from pack_refs where slug = 'saopaulo'),'saopaulo-mooca-line','Mooca Line',-23.5538,-46.6015,'Mooca','line','old-factory','Old factory energy, useful corners, zero need for a scenic detour.','Clock one sign the block still wears from an older version of itself.','Touch the line, lock the exit, and keep the whole move blunt.','Give the line one fake sponsor shout and cut out.',60,true)
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
