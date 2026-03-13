-- New York flagship Alleycat city pack
-- Seeds New York into city_packs + city_checkpoints.

insert into public.city_packs (slug, name, route_note, finish_label, safety_note, is_active)
values
  (
    'newyork',
    'New York',
    'Bridge weight, bad angles, fast cuts, and no reason to ride polite if the line is there.',
    'Sheet clear, clock buried, city still talking back.',
    'Ride inside local laws, stay sharp around traffic, and keep every task grounded in the real street.',
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
  select id from public.city_packs where slug = 'newyork'
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
  ((select id from pack_refs),'nyc-chinatown-cut','Chinatown Canal Cut',40.7158,-73.9970,'Chinatown','street-cut','worker-rush','Tight blocks, delivery pressure, and no room for soft reads.','Clock the first corner that feels more worker rush than visitor drift.','Touch the cut, pick the hard exit, and keep the cadence blunt.','Mutter one fake dispatch line and leave before the block talks back.',10,true),
  ((select id from pack_refs),'nyc-les-seam','LES Market Seam',40.7189,-73.9881,'Lower East Side','market-edge','tight-fast','Fast storefront rhythm and barely-clean exits.','Clock which side street feels most like riders actually use it.','Touch the seam and cut before the traffic pattern changes its mind.','Give the block one fake alleycat title and move on.',20,true),
  ((select id from pack_refs),'nyc-east-village-grid','East Village Grid',40.7282,-73.9847,'East Village','grid','bodega-rush','Bodega corners, tight grid, too many almost-good moves.','Clock the corner that looks calm but clearly never is.','Tag the grid, trust the next light, and keep it neat.','Pick the line that feels slightly wrong and own it anyway.',30,true),
  ((select id from pack_refs),'nyc-soho-backline','SoHo Backline',40.7234,-74.0027,'SoHo','backstreet','pretty-trap','Pretty enough to distract you, sharp enough to punish it.','Find the least polished corner and trust it more than the famous one.','Touch the backline and leave before the block goes soft.','Rate the block out of ten like a harsh sponsor and bounce.',40,true),
  ((select id from pack_refs),'nyc-west-village-cut','West Village Hook',40.7334,-74.0054,'West Village','street-cut','bad-geometry','Bad geometry, clean reads if your head is on right.','Clock which bend looks useless but actually carries the move.','Hit the hook, lock your turn, and keep the pace clean.','Act like the grid broke for you personally and keep rolling.',50,true),
  ((select id from pack_refs),'nyc-chelsea-rail-edge','Chelsea Rail Edge',40.7475,-74.0048,'Chelsea','rail-edge','lane-pressure','Rail drag, service lanes, and no time to drift.','Clock the moment the block shifts from gallery pace to work pace.','Touch the rail edge and cut before the lane gets crowded.','Throw one fake champion nod at the tracks and go.',60,true),
  ((select id from pack_refs),'nyc-midtown-west-split','Midtown West Split',40.7544,-73.9956,'Midtown West','split','bus-pressure','Noise, buses, and decisions that punish hesitation.','Clock the one exit that feels cleaner than the block deserves.','Touch the split, trust the lane, and keep the speed honest.','Make one fake radio call to yourself and punch out.',70,true),
  ((select id from pack_refs),'nyc-midtown-east-cut','Midtown East Cut',40.7526,-73.9722,'Midtown East','street-cut','machine-rhythm','Long signals, tunnel air, and no free speed.','Clock which block feels more machine than city.','Touch the cut and keep moving before the lights trap you.','Give the avenue one sarcastic compliment and disappear.',80,true),
  ((select id from pack_refs),'nyc-fidi-runup','FiDi Run-Up',40.7062,-74.0092,'Financial District','run-up','canyon-wind','Canyons, wind, and hard exits if you read the seams right.','Clock the first line that feels more messenger than office rush.','Touch the run-up and get out before the canyon slows you.','Pretend you own the block for two seconds, then vanish.',90,true),
  ((select id from pack_refs),'nyc-hudson-river-line','Hudson Greenway Break',40.7398,-74.0104,'Hudson River','waterline','tempting-fast','Fast waterline, but only if you know where to leave it.','Clock the exact point where the path stops helping and starts tempting.','Touch the line and get back into the street before you get lazy.','Give the water one fake title-defense stare and cut out.',100,true),
  ((select id from pack_refs),'nyc-williamsburg-bridge','Williamsburg Bridge Run-Up',40.7135,-73.9717,'Lower East Side','bridge-runup','bridge-pressure','Bridge pressure and one clean choice if you take it early.','Clock when the block starts feeling like pure bridge setup.','Touch the run-up and lock the next move instantly.','Act like the bridge owes you speed and keep it moving.',110,true),
  ((select id from pack_refs),'nyc-manhattan-bridge','Manhattan Bridge Ramp Edge',40.7130,-73.9892,'Chinatown','bridge-runup','rough-angle','Rough angle in, rougher line out.','Clock the side that looks calmer than it really is.','Touch the ramp edge and leave before the angle gets ugly.','Give the bridge one fake sponsor shout and cut.',120,true),
  ((select id from pack_refs),'nyc-brooklyn-bridge','Brooklyn Bridge Entry Drift',40.7125,-73.9961,'Civic Center','bridge-runup','tourist-drag','Tourist drag nearby, cleaner seams off the obvious line.','Clock the least postcard corner and trust it.','Touch the entry and get off the obvious line fast.','Tell yourself this is not for tourists and keep rolling.',130,true),
  ((select id from pack_refs),'nyc-dumbo-drop','DUMBO Drop',40.7033,-73.9891,'DUMBO','drop','cobble-pressure','Cobble edge, bridge weight, and no room to switch off.','Clock which block feels more working edge than camera stop.','Touch the drop, find the clean seam, and keep it blunt.','Give the cobbles one fake curse and bounce.',140,true),
  ((select id from pack_refs),'nyc-downtown-brooklyn-cut','Downtown Brooklyn Cut',40.6917,-73.9873,'Downtown Brooklyn','street-cut','wide-then-tight','Wide roads, tighter moves hiding just off them.','Clock one useful lane a tourist would never choose.','Touch the cut, pick the hard exit, and do not coast.','Make one fake director call and keep it moving.',150,true),
  ((select id from pack_refs),'nyc-fort-greene-pocket','Fort Greene Pocket',40.6874,-73.9736,'Fort Greene','pocket','short-reset','Short calm pocket, fast exits, better if you trust your read.','Clock how quickly the block mood shifts when you enter it.','Touch the pocket and hit the quick exit before it softens you.','Act like this was always your secret lane and leave.',160,true),
  ((select id from pack_refs),'nyc-williamsburg-grid','Williamsburg Grid',40.7172,-73.9576,'Williamsburg','grid','fast-cross','Fast north-south, sharp cross cuts, no patience for bad timing.','Clock the cross street riders actually trust here.','Touch the grid, trust the gap, and leave before the light flips the day.','Give the block one fake style score and move on.',170,true),
  ((select id from pack_refs),'nyc-greenpoint-line','Greenpoint Line',40.7288,-73.9545,'Greenpoint','line','quiet-fast','Quiet seam until it suddenly is not.','Clock the first corner that feels more rider than weekend.','Touch the line and keep your cadence tidy.','Pretend this is the cleanest move in the city and defend it hard.',180,true),
  ((select id from pack_refs),'nyc-bushwick-cut','Bushwick Cut',40.7065,-73.9234,'Bushwick','street-cut','industrial-edge','Industrial edges, wall runs, and no free route choices.','Clock one wall or gate that makes the block feel alive.','Touch the cut, lock the exit, and keep your pace rude.','Give the strip one fake alleycat sponsor tag and get gone.',190,true),
  ((select id from pack_refs),'nyc-lic-seam','LIC Seam',40.7446,-73.9487,'Long Island City','seam','warehouse-drag','Warehouse drag, bridge pressure, useful lanes if you read them early.','Clock which lane feels most like work still happens here.','Touch the seam and stay on top of the line.','Throw one fake champion glare at the skyline and move.',200,true),
  ((select id from pack_refs),'nyc-astoria-pocket','Astoria Pocket',40.7644,-73.9235,'Astoria','pocket','long-block','Long blocks, quick corners, zero need for scenic pacing.','Clock the corner that feels most local without trying.','Touch the pocket, pick the clean side, and keep it blunt.','Make one fake radio-check and push on.',210,true),
  ((select id from pack_refs),'nyc-queensboro-runup','Queensboro Run-Up',40.7568,-73.9482,'Long Island City','bridge-runup','gravity','Bridge gravity and awkward approach choices.','Clock the exact point where the bridge starts owning the block.','Touch the run-up and commit before hesitation costs speed.','Give the bridge one fake title stare and get on with it.',220,true),
  ((select id from pack_refs),'nyc-pulaski-bridge-edge','Pulaski Edge',40.7358,-73.9524,'Long Island City','bridge-edge','windy','Waterline wind and a line that punishes lazy exits.','Clock the block where Queens stops feeling soft.','Touch the edge and leave before the bridge drag kicks in.','Tell yourself the wind is free speed and ride like you mean it.',230,true),
  ((select id from pack_refs),'nyc-harlem-river-line','Harlem River Line',40.8167,-73.9385,'Harlem','waterline','open-hard','Wide water seam, hard reads on entry and exit.','Clock what changes in the city sound when the water opens up.','Touch the line, take the clean seam, and stay on the gas.','Throw one fake champion nod at the river and bounce.',240,true),
  ((select id from pack_refs),'nyc-upper-west-side-cut','Upper West Side Cut',40.7811,-73.9776,'Upper West Side','street-cut','avenue-shadow','Long avenues nearby, better cuts just off them.','Clock one block that feels more rider than resident.','Touch the cut and keep the line cleaner than traffic deserves.','Give the avenue one sarcastic compliment and disappear.',250,true),
  ((select id from pack_refs),'nyc-upper-east-side-line','Upper East Side Line',40.7737,-73.9566,'Upper East Side','line','timing-rhythm','Long rhythm, cleaner turns if you respect the timing.','Clock the first cross street that feels worth trusting.','Touch the line and keep the move neat, not polite.','Act like this was always the smart side of Manhattan and go.',260,true),
  ((select id from pack_refs),'nyc-red-hook-drift','Red Hook Drift',40.6762,-74.0124,'Red Hook','water-edge','working-port','Water edge, truck air, and no help if you zone out.','Clock the exact point the city starts feeling more working port than neighborhood.','Touch the drift and cut before the open air slows the move.','Give the waterfront one fake sponsor line and vanish.',270,true)
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
