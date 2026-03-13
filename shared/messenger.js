export const MESSENGER_CREDIT_COST = 3;
export const ALLEYCAT_CHECKIN_RADIUS_METERS = 250;

const checkpointsByCity = {
  newyork: [
    {
      id: "nyc-chinatown-cut",
      name: "Chinatown Canal Cut",
      district: "Chinatown",
      lat: 40.7158,
      lng: -73.997,
      hint: "Tight blocks, delivery pressure, and no room for soft reads.",
      tasks: {
        local: "Clock the first corner that feels more worker rush than visitor drift.",
        fast: "Touch the cut, pick the hard exit, and keep the cadence blunt.",
        chaotic: "Mutter one fake dispatch line and leave before the block talks back.",
      },
    },
    {
      id: "nyc-les-seam",
      name: "LES Market Seam",
      district: "Lower East Side",
      lat: 40.7189,
      lng: -73.9881,
      hint: "Fast storefront rhythm and barely-clean exits.",
      tasks: {
        local: "Clock which side street feels most like riders actually use it.",
        fast: "Touch the seam and cut before the traffic pattern changes its mind.",
        chaotic: "Give the block one fake alleycat title and move on.",
      },
    },
    {
      id: "nyc-east-village-grid",
      name: "East Village Grid",
      district: "East Village",
      lat: 40.7282,
      lng: -73.9847,
      hint: "Bodega corners, tight grid, too many almost-good moves.",
      tasks: {
        local: "Clock the corner that looks calm but clearly never is.",
        fast: "Tag the grid, trust the next light, and keep it neat.",
        chaotic: "Pick the line that feels slightly wrong and own it anyway.",
      },
    },
    {
      id: "nyc-soho-backline",
      name: "SoHo Backline",
      district: "SoHo",
      lat: 40.7234,
      lng: -74.0027,
      hint: "Pretty enough to distract you, sharp enough to punish it.",
      tasks: {
        local: "Find the least polished corner and trust it more than the famous one.",
        fast: "Touch the backline and leave before the block goes soft.",
        chaotic: "Rate the block out of ten like a harsh sponsor and bounce.",
      },
    },
    {
      id: "nyc-west-village-cut",
      name: "West Village Hook",
      district: "West Village",
      lat: 40.7334,
      lng: -74.0054,
      hint: "Bad geometry, clean reads if your head is on right.",
      tasks: {
        local: "Clock which bend looks useless but actually carries the move.",
        fast: "Hit the hook, lock your turn, and keep the pace clean.",
        chaotic: "Act like the grid broke for you personally and keep rolling.",
      },
    },
    {
      id: "nyc-chelsea-rail-edge",
      name: "Chelsea Rail Edge",
      district: "Chelsea",
      lat: 40.7475,
      lng: -74.0048,
      hint: "Rail drag, service lanes, and no time to drift.",
      tasks: {
        local: "Clock the moment the block shifts from gallery pace to work pace.",
        fast: "Touch the rail edge and cut before the lane gets crowded.",
        chaotic: "Throw one fake champion nod at the tracks and go.",
      },
    },
    {
      id: "nyc-midtown-west-split",
      name: "Midtown West Split",
      district: "Midtown West",
      lat: 40.7544,
      lng: -73.9956,
      hint: "Noise, buses, and decisions that punish hesitation.",
      tasks: {
        local: "Clock the one exit that feels cleaner than the block deserves.",
        fast: "Touch the split, trust the lane, and keep the speed honest.",
        chaotic: "Make one fake radio call to yourself and punch out.",
      },
    },
    {
      id: "nyc-midtown-east-cut",
      name: "Midtown East Cut",
      district: "Midtown East",
      lat: 40.7526,
      lng: -73.9722,
      hint: "Long signals, tunnel air, and no free speed.",
      tasks: {
        local: "Clock which block feels more machine than city.",
        fast: "Touch the cut and keep moving before the lights trap you.",
        chaotic: "Give the avenue one sarcastic compliment and disappear.",
      },
    },
    {
      id: "nyc-fidi-runup",
      name: "FiDi Run-Up",
      district: "Financial District",
      lat: 40.7062,
      lng: -74.0092,
      hint: "Canyons, wind, and hard exits if you read the seams right.",
      tasks: {
        local: "Clock the first line that feels more messenger than office rush.",
        fast: "Touch the run-up and stay out before the canyon slows you.",
        chaotic: "Pretend you own the block for two seconds, then vanish.",
      },
    },
    {
      id: "nyc-hudson-river-line",
      name: "Hudson Greenway Break",
      district: "Hudson River",
      lat: 40.7398,
      lng: -74.0104,
      hint: "Fast waterline, but only if you know where to leave it.",
      tasks: {
        local: "Clock the exact point where the path stops helping and starts tempting.",
        fast: "Touch the line and get back into the street before you get lazy.",
        chaotic: "Give the water one fake title-defense stare and cut out.",
      },
    },
    {
      id: "nyc-williamsburg-bridge",
      name: "Williamsburg Bridge Run-Up",
      district: "Lower East Side",
      lat: 40.7135,
      lng: -73.9717,
      hint: "Bridge pressure and one clean choice if you take it early.",
      tasks: {
        local: "Clock when the block starts feeling like pure bridge setup.",
        fast: "Touch the run-up and lock the next move instantly.",
        chaotic: "Act like the bridge owes you speed and keep it moving.",
      },
    },
    {
      id: "nyc-manhattan-bridge",
      name: "Manhattan Bridge Ramp Edge",
      district: "Chinatown",
      lat: 40.713,
      lng: -73.9892,
      hint: "Rough angle in, rougher line out.",
      tasks: {
        local: "Clock the side that looks calmer than it really is.",
        fast: "Touch the ramp edge and leave before the angle gets ugly.",
        chaotic: "Give the bridge one fake sponsor shout and cut.",
      },
    },
    {
      id: "nyc-brooklyn-bridge",
      name: "Brooklyn Bridge Entry Drift",
      district: "Civic Center",
      lat: 40.7125,
      lng: -73.9961,
      hint: "Tourist drag nearby, cleaner seams off the obvious line.",
      tasks: {
        local: "Clock the least postcard corner and trust it.",
        fast: "Touch the entry and get off the obvious line fast.",
        chaotic: "Tell yourself this is not for tourists and keep rolling.",
      },
    },
    {
      id: "nyc-dumbo-drop",
      name: "DUMBO Drop",
      district: "DUMBO",
      lat: 40.7033,
      lng: -73.9891,
      hint: "Cobble edge, bridge weight, and no room to switch off.",
      tasks: {
        local: "Clock which block feels more working edge than camera stop.",
        fast: "Touch the drop, find the clean seam, and keep it blunt.",
        chaotic: "Give the cobbles one fake curse and bounce.",
      },
    },
    {
      id: "nyc-downtown-brooklyn-cut",
      name: "Downtown Brooklyn Cut",
      district: "Downtown Brooklyn",
      lat: 40.6917,
      lng: -73.9873,
      hint: "Wide roads, tighter moves hiding just off them.",
      tasks: {
        local: "Clock one useful lane a tourist would never choose.",
        fast: "Touch the cut, pick the hard exit, and do not coast.",
        chaotic: "Make one fake director call and keep it moving.",
      },
    },
    {
      id: "nyc-fort-greene-pocket",
      name: "Fort Greene Pocket",
      district: "Fort Greene",
      lat: 40.6874,
      lng: -73.9736,
      hint: "Short calm pocket, fast exits, better if you trust your read.",
      tasks: {
        local: "Clock how quickly the block mood shifts when you enter it.",
        fast: "Touch the pocket and hit the quick exit before it softens you.",
        chaotic: "Act like this was always your secret lane and leave.",
      },
    },
    {
      id: "nyc-williamsburg-grid",
      name: "Williamsburg Grid",
      district: "Williamsburg",
      lat: 40.7172,
      lng: -73.9576,
      hint: "Fast north-south, sharp cross cuts, no patience for bad timing.",
      tasks: {
        local: "Clock the cross street riders actually trust here.",
        fast: "Touch the grid, trust the gap, and leave before the light flips the day.",
        chaotic: "Give the block one fake style score and move on.",
      },
    },
    {
      id: "nyc-greenpoint-line",
      name: "Greenpoint Line",
      district: "Greenpoint",
      lat: 40.7288,
      lng: -73.9545,
      hint: "Quiet seam until it suddenly is not.",
      tasks: {
        local: "Clock the first corner that feels more rider than weekend.",
        fast: "Touch the line and keep your cadence tidy.",
        chaotic: "Pretend this is the cleanest move in the city and defend it hard.",
      },
    },
    {
      id: "nyc-bushwick-cut",
      name: "Bushwick Cut",
      district: "Bushwick",
      lat: 40.7065,
      lng: -73.9234,
      hint: "Industrial edges, wall runs, and no free route choices.",
      tasks: {
        local: "Clock one wall or gate that makes the block feel alive.",
        fast: "Touch the cut, lock the exit, and keep your pace rude.",
        chaotic: "Give the whole strip a fake alleycat sponsor tag and get gone.",
      },
    },
    {
      id: "nyc-lic-seam",
      name: "LIC Seam",
      district: "Long Island City",
      lat: 40.7446,
      lng: -73.9487,
      hint: "Warehouse drag, bridge pressure, useful lanes if you read them early.",
      tasks: {
        local: "Clock which lane feels most like work still happens here.",
        fast: "Touch the seam and stay on top of the line.",
        chaotic: "Throw one fake champion glare at the skyline and move.",
      },
    },
    {
      id: "nyc-astoria-pocket",
      name: "Astoria Pocket",
      district: "Astoria",
      lat: 40.7644,
      lng: -73.9235,
      hint: "Long blocks, quick corners, zero need for scenic pacing.",
      tasks: {
        local: "Clock the corner that feels most local without trying.",
        fast: "Touch the pocket, pick the clean side, and keep it blunt.",
        chaotic: "Make one fake radio-check and push on.",
      },
    },
    {
      id: "nyc-queensboro-runup",
      name: "Queensboro Run-Up",
      district: "Long Island City",
      lat: 40.7568,
      lng: -73.9482,
      hint: "Bridge gravity and awkward approach choices.",
      tasks: {
        local: "Clock the exact point where the bridge starts owning the block.",
        fast: "Touch the run-up and commit before hesitation costs speed.",
        chaotic: "Give the bridge one fake title stare and get on with it.",
      },
    },
    {
      id: "nyc-pulaski-bridge-edge",
      name: "Pulaski Edge",
      district: "Long Island City",
      lat: 40.7358,
      lng: -73.9524,
      hint: "Waterline wind and a line that punishes lazy exits.",
      tasks: {
        local: "Clock the block where Queens stops feeling soft.",
        fast: "Touch the edge and leave before the bridge drag kicks in.",
        chaotic: "Tell yourself the wind is free speed and ride like you mean it.",
      },
    },
    {
      id: "nyc-harlem-river-line",
      name: "Harlem River Line",
      district: "Harlem",
      lat: 40.8167,
      lng: -73.9385,
      hint: "Wide water seam, hard reads on entry and exit.",
      tasks: {
        local: "Clock what changes in the city sound when the water opens up.",
        fast: "Touch the line, take the clean seam, and stay on the gas.",
        chaotic: "Throw one fake champion nod at the river and bounce.",
      },
    },
    {
      id: "nyc-upper-west-side-cut",
      name: "Upper West Side Cut",
      district: "Upper West Side",
      lat: 40.7811,
      lng: -73.9776,
      hint: "Long avenues nearby, better cuts just off them.",
      tasks: {
        local: "Clock one block that feels more rider than resident.",
        fast: "Touch the cut and keep the line cleaner than the traffic deserves.",
        chaotic: "Give the avenue one sarcastic compliment and disappear.",
      },
    },
    {
      id: "nyc-upper-east-side-line",
      name: "Upper East Side Line",
      district: "Upper East Side",
      lat: 40.7737,
      lng: -73.9566,
      hint: "Long rhythm, cleaner turns if you respect the timing.",
      tasks: {
        local: "Clock the first cross street that feels worth trusting.",
        fast: "Touch the line and keep the move neat, not polite.",
        chaotic: "Act like this was always the smart side of Manhattan and go.",
      },
    },
    {
      id: "nyc-red-hook-drift",
      name: "Red Hook Drift",
      district: "Red Hook",
      lat: 40.6762,
      lng: -74.0124,
      hint: "Water edge, truck air, and no help if you zone out.",
      tasks: {
        local: "Clock the exact point the city starts feeling more working port than neighborhood.",
        fast: "Touch the drift and cut before the open air slows the move.",
        chaotic: "Give the waterfront one fake sponsor line and vanish.",
      },
    },
  ],
  sanfrancisco: [
    {
      id: "sf-fidi-split",
      name: "FiDi Split",
      district: "Financial District",
      lat: 37.7923,
      lng: -122.3999,
      hint: "Fast blocks, bad angles, and no reward for hesitation.",
      tasks: {
        local: "Clock the first line that feels more messenger than office rush.",
        fast: "Touch the split, pick the clean exit, and keep your pace blunt.",
        chaotic: "Make one fake dispatch call and get out before the canyon slows you down.",
      },
    },
    {
      id: "sf-embarcadero-run",
      name: "Embarcadero Run",
      district: "Embarcadero",
      lat: 37.7968,
      lng: -122.3935,
      hint: "Water drag, ferry traffic, and a line that only works if you leave it on time.",
      tasks: {
        local: "Clock the exact point the waterfront stops helping and starts baiting you.",
        fast: "Touch the run and get back into the grid before the view softens the move.",
        chaotic: "Throw one fake champion glare at the bay and cut back in.",
      },
    },
    {
      id: "sf-chinatown-cut",
      name: "Chinatown Cut",
      district: "Chinatown",
      lat: 37.7944,
      lng: -122.4079,
      hint: "Tight grade, tighter corners, no clean mistakes.",
      tasks: {
        local: "Clock the steepest corner that still feels rideable.",
        fast: "Touch the cut, trust the drop, and keep it clean.",
        chaotic: "Act like that climb was free and keep rolling.",
      },
    },
    {
      id: "sf-northbeach-rise",
      name: "North Beach Rise",
      district: "North Beach",
      lat: 37.8021,
      lng: -122.4102,
      hint: "Short lift, fast exits, no room for soft legs.",
      tasks: {
        local: "Clock where the block stops looking flat and starts talking back.",
        fast: "Tag the rise, breathe once, and punch through clean.",
        chaotic: "Treat that little wall like a mountain stage and leave with a straight face.",
      },
    },
    {
      id: "sf-russian-hill-edge",
      name: "Russian Hill Edge",
      district: "Russian Hill",
      lat: 37.8006,
      lng: -122.4192,
      hint: "Pretty trap, bad grades, one smart exit if you read it early.",
      tasks: {
        local: "Clock the least postcard corner and trust it more than the obvious one.",
        fast: "Touch the edge and keep the line tighter than the hill deserves.",
        chaotic: "Give the view one sarcastic compliment and disappear.",
      },
    },
    {
      id: "sf-civic-center-line",
      name: "Civic Center Line",
      district: "Civic Center",
      lat: 37.7796,
      lng: -122.4148,
      hint: "Open blocks, ugly seams, useful exits if your head stays on.",
      tasks: {
        local: "Clock the side street that looks calmer than it has any right to.",
        fast: "Touch the line, lock the exit, and keep moving.",
        chaotic: "Pretend you planned that cut three lights ago and own it.",
      },
    },
    {
      id: "sf-hayes-cut",
      name: "Hayes Cut",
      district: "Hayes Valley",
      lat: 37.7763,
      lng: -122.4242,
      hint: "Fast cross streets hiding under soft-looking blocks.",
      tasks: {
        local: "Clock which lane feels more rider than retail.",
        fast: "Touch the cut and leave before the block goes polite.",
        chaotic: "Give the whole strip one fake style score and bounce.",
      },
    },
    {
      id: "sf-mission-grid",
      name: "Mission Grid",
      district: "Mission",
      lat: 37.7598,
      lng: -122.4148,
      hint: "Bodega corners, quick lines, and no need for scenic pacing.",
      tasks: {
        local: "Clock the first block that feels more worker rush than brunch drift.",
        fast: "Touch the grid, trust the next gap, and keep it rude.",
        chaotic: "Make one fake alleycat sponsor tag and keep pushing.",
      },
    },
    {
      id: "sf-valencia-seam",
      name: "Valencia Seam",
      district: "Mission",
      lat: 37.7651,
      lng: -122.4216,
      hint: "Bike-heavy stretch with plenty of wrong ways to ride it.",
      tasks: {
        local: "Clock the side lane riders actually use to keep the move alive.",
        fast: "Touch the seam, stay off the obvious line, and leave before it clogs.",
        chaotic: "Give the strip one fake podium nod and disappear.",
      },
    },
    {
      id: "sf-potrero-rise",
      name: "Potrero Rise",
      district: "Potrero Hill",
      lat: 37.7595,
      lng: -122.4016,
      hint: "Hill bite, warehouse air, no free speed anywhere near it.",
      tasks: {
        local: "Clock where the block starts feeling less flat than the map promised.",
        fast: "Tag the rise and stay on top of the climb.",
        chaotic: "Act like that punchy wall was exactly what you came for.",
      },
    },
    {
      id: "sf-dogpatch-line",
      name: "Dogpatch Line",
      district: "Dogpatch",
      lat: 37.759,
      lng: -122.3883,
      hint: "Rail edge, long reads, and cuts that feel better than they look.",
      tasks: {
        local: "Clock the corner that still feels more work than weekend.",
        fast: "Touch the line, trust the cleaner side, and keep the pace sharp.",
        chaotic: "Throw one fake champion stare at the tracks and bounce.",
      },
    },
    {
      id: "sf-mission-bay-break",
      name: "Mission Bay Break",
      district: "Mission Bay",
      lat: 37.7707,
      lng: -122.391,
      hint: "Wide lanes, open air, and a trap if you start coasting.",
      tasks: {
        local: "Clock the exact point where the bay air starts making bad ideas feel clean.",
        fast: "Touch the break and get back into the grid before it softens you.",
        chaotic: "Give the whole zone one fake tech-campus curse and leave.",
      },
    },
    {
      id: "sf-castro-pocket",
      name: "Castro Pocket",
      district: "Castro",
      lat: 37.7609,
      lng: -122.435,
      hint: "Short pocket, fast exits, and one good read if you trust it.",
      tasks: {
        local: "Clock the calmest lane in the middle of all that motion.",
        fast: "Touch the pocket and hit the quick exit before it flattens out.",
        chaotic: "Act like this was your secret lane all week and keep it moving.",
      },
    },
    {
      id: "sf-haight-cross",
      name: "Haight Cross",
      district: "Haight",
      lat: 37.7699,
      lng: -122.4469,
      hint: "Cross traffic, slight lift, and no reason to drift.",
      tasks: {
        local: "Clock which corner feels more rider than visitor.",
        fast: "Touch the cross and cut before the block gets weird.",
        chaotic: "Mutter one fake director note and move on.",
      },
    },
    {
      id: "sf-presidio-gate",
      name: "Presidio Gate",
      district: "Presidio",
      lat: 37.7981,
      lng: -122.4487,
      hint: "Open edge, military-grade calm, and exits that still need nerve.",
      tasks: {
        local: "Clock the exact moment the city sound falls off when you hit the gate.",
        fast: "Touch the gate, breathe once, and get back to work.",
        chaotic: "Give the trees one fake sponsor shout and roll out.",
      },
    },
    {
      id: "sf-marina-edge",
      name: "Marina Edge",
      district: "Marina",
      lat: 37.8042,
      lng: -122.4394,
      hint: "Wind off the water and no help if you start admiring it.",
      tasks: {
        local: "Clock the least postcard angle and trust it more than the obvious one.",
        fast: "Touch the edge and leave before the breeze turns into drag.",
        chaotic: "Throw one fake title-defense nod at the bay and vanish.",
      },
    },
    {
      id: "sf-golden-gate-runup",
      name: "Golden Gate Run-Up",
      district: "Presidio",
      lat: 37.8076,
      lng: -122.4749,
      hint: "Bridge gravity, open wind, and a line that punishes lazy approach speed.",
      tasks: {
        local: "Clock the exact point the bridge starts owning the block.",
        fast: "Touch the run-up and commit before hesitation costs speed.",
        chaotic: "Give the bridge one fake champion stare and keep it moving.",
      },
    },
  ],
  berlin: [
    {
      id: "berlin-alex-clock",
      name: "Alexanderplatz World Clock",
      district: "Mitte",
      lat: 52.521918,
      lng: 13.413215,
      hint: "Meet the spinning time zones.",
      tasks: {
        local: "Check the city names on the clock and note one place you want to ride next.",
        fast: "Snap a quick clock check, lock your line, and move before the square slows you down.",
        chaotic: "Count three languages in the square before you roll to the next stop.",
      },
    },
    {
      id: "berlin-obernbaum",
      name: "Oberbaum Bridge",
      district: "Friedrichshain-Kreuzberg",
      lat: 52.501775,
      lng: 13.446943,
      hint: "Brick towers, river wind, no straight answers.",
      tasks: {
        local: "Pause at mid-span and clock which side of the river feels louder.",
        fast: "Hit the bridge, tag the view in your head, and pick your fastest exit.",
        chaotic: "Find the noisiest approach and remember what made it messy.",
      },
    },
    {
      id: "berlin-tempelhof",
      name: "Tempelhofer Feld Gate",
      district: "Tempelhof",
      lat: 52.473629,
      lng: 13.403419,
      hint: "Runway energy without the planes.",
      tasks: {
        local: "Spot one thing only Tempelhof could make feel this open.",
        fast: "Touch the gate, breathe once, and get back into the city grid.",
        chaotic: "Name the weirdest mix of people or wheels you saw on approach.",
      },
    },
    {
      id: "berlin-luftbruecke",
      name: "Platz der Luftbruecke Edge",
      district: "Tempelhof",
      lat: 52.4849,
      lng: 13.3852,
      hint: "Big circle energy, quick exits, zero reason to drift.",
      tasks: {
        local: "Clock which side of the circle feels calmer than it should.",
        fast: "Touch the edge, lock your escape, and keep your pace honest.",
        chaotic: "Give the roundabout one fake salute and cut before it gets ceremonial.",
      },
    },
    {
      id: "berlin-victoriapark-rise",
      name: "Victoriapark Lower Rise",
      district: "Kreuzberg",
      lat: 52.4885,
      lng: 13.3927,
      hint: "Short climb pressure and a clean exit if you read it right.",
      tasks: {
        local: "Notice the first point where the block stops feeling flat.",
        fast: "Tag the rise, breathe once, and punch out before it drags on.",
        chaotic: "Act like that tiny lift was alpine drama, then move on.",
      },
    },
    {
      id: "berlin-victory-column",
      name: "Victory Column",
      district: "Tiergarten",
      lat: 52.514496,
      lng: 13.350118,
      hint: "Traffic circles and a gold figure above it all.",
      tasks: {
        local: "Pick the calmest approach road and remember it for next time.",
        fast: "Orbit once with your eyes, not your wheels, then choose your cut-through.",
        chaotic: "Count the number of route choices that look good and bad at the same time.",
      },
    },
    {
      id: "berlin-mauerpark",
      name: "Mauerpark Amphitheatre",
      district: "Prenzlauer Berg",
      lat: 52.541541,
      lng: 13.402147,
      hint: "Concrete bowl, noise, and open edges.",
      tasks: {
        local: "Clock the current mood of the park in three words.",
        fast: "Drop in, read the crowd in one glance, and push on.",
        chaotic: "Find the least direct approach and decide if it was worth it.",
      },
    },
    {
      id: "berlin-tiergarten",
      name: "Tiergarten S-Bend",
      district: "Tiergarten",
      lat: 52.51417,
      lng: 13.36652,
      hint: "A soft patch inside a hard city.",
      tasks: {
        local: "Notice what changes in the sound when you hit the trees.",
        fast: "Use the calm to reset your pace, then get back to work.",
        chaotic: "Choose an exit purely by instinct and commit.",
      },
    },
    {
      id: "berlin-hansaviertel-cut",
      name: "Hansaviertel Cut",
      district: "Hansaviertel",
      lat: 52.5189,
      lng: 13.3476,
      hint: "Quiet seam, fast exits, no reason to linger.",
      tasks: {
        local: "Clock the cleanest quiet line and remember how fast the city mood changed.",
        fast: "Touch the cut, lock the exit, and keep your speed tidy.",
        chaotic: "Act like this little pocket was your secret all along, then leave before it gets weird.",
      },
    },
    {
      id: "berlin-kotti",
      name: "Kotti Ring Edge",
      district: "Kreuzberg",
      lat: 52.4996,
      lng: 13.4186,
      hint: "Too much movement, exactly the right amount of pressure.",
      tasks: {
        local: "Clock the sketchiest calm-looking corner and remember it for later.",
        fast: "Touch the edge, pick the cleanest escape, and do not let the ring slow your thinking.",
        chaotic: "Mutter a fake apology to the traffic, then cut out like you meant no harm.",
      },
    },
    {
      id: "berlin-maybachufer",
      name: "Maybachufer Canal Edge",
      district: "Neukoelln",
      lat: 52.4963,
      lng: 13.4249,
      hint: "Canal drag, market edges, and shortcuts that look cleaner than they are.",
      tasks: {
        local: "Clock the first corner that feels more neighborhood than spectacle.",
        fast: "Touch the waterline, read the clean exit, and get back into the blocks fast.",
        chaotic: "Give the canal one fake sponsor shout-out and leave before the joke lands.",
      },
    },
  ],
  london: [
    {
      id: "london-somerset",
      name: "Somerset House Courtyard",
      district: "Central London",
      lat: 51.511463,
      lng: -0.117422,
      hint: "Open stone and fast exits.",
      tasks: {
        local: "Find the strongest line through the courtyard and hold it in your head.",
        fast: "Touch the square, scan the exits, and pick the sharpest one.",
        chaotic: "Count how many directions feel wrong until one feels right.",
      },
    },
    {
      id: "london-columbia-road",
      name: "Columbia Road",
      district: "Bethnal Green",
      lat: 51.529274,
      lng: -0.071812,
      hint: "Tight streets with market energy.",
      tasks: {
        local: "Clock a storefront detail worth remembering.",
        fast: "Read the street in one pass and keep rolling.",
        chaotic: "Notice the point where the lane stops making sense.",
      },
    },
    {
      id: "london-waterloo",
      name: "Waterloo Station Arch",
      district: "Waterloo",
      lat: 51.503334,
      lng: -0.113122,
      hint: "Crowd pressure and decision pressure.",
      tasks: {
        local: "Pick the exit you would trust in the rain.",
        fast: "Touch the arch zone and leave before the crowd owns your speed.",
        chaotic: "Count the conflicting flows before you choose your line.",
      },
    },
    {
      id: "london-regents",
      name: "Regent's Canal Towpath Entry",
      district: "Islington",
      lat: 51.536578,
      lng: -0.103717,
      hint: "A hidden seam in the city.",
      tasks: {
        local: "Notice how the city changes when you drop to the water.",
        fast: "Use the canal as a reset point, then re-enter clean.",
        chaotic: "Decide if this was the shortcut or the distraction.",
      },
    },
    {
      id: "london-greenwich",
      name: "Greenwich Foot Tunnel North Entrance",
      district: "Greenwich",
      lat: 51.500732,
      lng: -0.008077,
      hint: "A route choice with history baked in.",
      tasks: {
        local: "Mark the strangest contrast between river traffic and street traffic.",
        fast: "Hit the entrance, make the call, and keep momentum.",
        chaotic: "Pick the boldest onward line that still feels rideable.",
      },
    },
    {
      id: "london-soho",
      name: "Soho Seven Dials",
      district: "Soho",
      lat: 51.513628,
      lng: -0.128111,
      hint: "Too many spokes, which is exactly the point.",
      tasks: {
        local: "Choose the spoke that best fits your current mood.",
        fast: "Read the junction fast and trust your cut.",
        chaotic: "Count the possible mistakes before choosing the fun one.",
      },
    },
    {
      id: "london-broadway-market",
      name: "Broadway Market Cut",
      district: "Hackney",
      lat: 51.5362,
      lng: -0.0614,
      hint: "Crowd edge, curb pressure, and a fast line if you keep your head up.",
      tasks: {
        local: "Clock one tiny sign this block would never make for tourists.",
        fast: "Hit the market edge, find the clean seam, and get gone before it clogs up.",
        chaotic: "Give the whole block a fake ten-point style score and leave before anyone asks why.",
      },
    },
    {
      id: "london-elephant-cut",
      name: "Elephant Arcade Edge",
      district: "Elephant and Castle",
      lat: 51.4948,
      lng: -0.1009,
      hint: "Bad geometry, loud roads, and exits that reward nerve.",
      tasks: {
        local: "Clock which direction feels rougher than it looks and store that away.",
        fast: "Touch the edge, trust the cut, and keep your pace cleaner than the junction deserves.",
        chaotic: "Act like this mess was exactly what you came for, then disappear.",
      },
    },
  ],
  tokyo: [
    {
      id: "tokyo-shibuya-scramble",
      name: "Shibuya Scramble Edge",
      district: "Shibuya",
      lat: 35.6595,
      lng: 139.7005,
      hint: "Too many flows, too many faces, no sympathy.",
      tasks: {
        local: "Clock the cleanest gap in the human mess and remember it like it owes you money.",
        fast: "Hit the edge, pick your exit in one glance, and leave before hesitation gets expensive.",
        chaotic: "Give the crossing your best fake race-face for two seconds, then vanish like nothing happened.",
      },
    },
    {
      id: "tokyo-harajuku-backcut",
      name: "Harajuku Backcut",
      district: "Shibuya",
      lat: 35.6701,
      lng: 139.7037,
      hint: "Narrow side lanes, fast exits, and no time for tourist pace.",
      tasks: {
        local: "Clock the first side lane that feels more rider than shopper.",
        fast: "Touch the backcut and stay off the obvious line.",
        chaotic: "Give the block one fake style score and bounce before it argues.",
      },
    },
    {
      id: "tokyo-aoyama-split",
      name: "Aoyama Split",
      district: "Minato",
      lat: 35.6666,
      lng: 139.7194,
      hint: "Clean-looking lanes with enough pressure to punish a soft read.",
      tasks: {
        local: "Clock which side street feels calmer than it has any right to.",
        fast: "Touch the split, trust the cleaner line, and keep your pace blunt.",
        chaotic: "Act like you called that move three lights ago and leave with a straight face.",
      },
    },
    {
      id: "tokyo-yoyogi-entry",
      name: "Yoyogi Park South Gate",
      district: "Shibuya",
      lat: 35.6673,
      lng: 139.6949,
      hint: "Open calm with city noise still hanging around it.",
      tasks: {
        local: "Notice the first sound that proves this place is still Tokyo and not an escape hatch.",
        fast: "Touch the gate, reset your breathing once, and get back to work.",
        chaotic: "Bow to the park like it saved your life, then leave before anyone clocks you.",
      },
    },
    {
      id: "tokyo-ebisu-rise",
      name: "Ebisu Rise",
      district: "Shibuya",
      lat: 35.6467,
      lng: 139.7101,
      hint: "Slight lift, quick signals, no free speed if you lose focus.",
      tasks: {
        local: "Clock the exact point the block stops feeling flat and starts asking questions.",
        fast: "Tag the rise, breathe once, and punch through clean.",
        chaotic: "Treat that little lift like a mountain stage and keep rolling.",
      },
    },
    {
      id: "tokyo-nakameguro-tracks",
      name: "Nakameguro Under Tracks",
      district: "Meguro",
      lat: 35.6442,
      lng: 139.6986,
      hint: "Tight lanes, side-glances, and no wasted motion.",
      tasks: {
        local: "Find one detail under the tracks that feels more night ride than daytime city.",
        fast: "Read the lane, trust the line, and keep your cadence cleaner than the street deserves.",
        chaotic: "Quietly rate the whole block out of ten with full confidence and absolutely no evidence.",
      },
    },
    {
      id: "tokyo-akihabara-udx",
      name: "Akihabara UDX Edge",
      district: "Chiyoda",
      lat: 35.7006,
      lng: 139.772,
      hint: "Neon pressure, layered traffic, zero softness.",
      tasks: {
        local: "Clock the exact point where commuter energy flips into full weirdness.",
        fast: "Touch the edge, cut the noise, and move before the lights start bossing you around.",
        chaotic: "Name your bike like it is an anime side character and roll to the next stop.",
      },
    },
    {
      id: "tokyo-ryogoku-river",
      name: "Ryogoku River Walk Drop",
      district: "Sumida",
      lat: 35.6962,
      lng: 139.7934,
      hint: "Waterline reset, but never fully relaxed.",
      tasks: {
        local: "Notice what changes in the wind and decide if it helped or insulted you.",
        fast: "Use the river as a reset seam, then snap back into the grid with intent.",
        chaotic: "Throw one fake championship nod at the water and act like you just defended a title.",
      },
    },
    {
      id: "tokyo-shinbashi-cut",
      name: "Shinbashi Cut",
      district: "Minato",
      lat: 35.6662,
      lng: 139.7586,
      hint: "Rail gravity, service-lane exits, and no patience for hesitation.",
      tasks: {
        local: "Clock the corner that feels most like late-night work still happens here.",
        fast: "Touch the cut, lock the next move, and keep it sharp.",
        chaotic: "Mutter one fake dispatch line and disappear before the block answers back.",
      },
    },
    {
      id: "tokyo-odaiba-decks",
      name: "Odaiba Decks Cut",
      district: "Odaiba",
      lat: 35.6275,
      lng: 139.7753,
      hint: "Wide views, awkward edges, too much temptation to coast.",
      tasks: {
        local: "Find the least postcard-worthy angle and trust it more than the obvious one.",
        fast: "Touch the deck zone, skip the view trap, and get moving again.",
        chaotic: "Give the skyline a sarcastic compliment under your breath and disappear before it answers back.",
      },
    },
    {
      id: "tokyo-jimbocho-line",
      name: "Jimbocho Line",
      district: "Chiyoda",
      lat: 35.6952,
      lng: 139.7582,
      hint: "Bookstreet calm until the exits get sharp.",
      tasks: {
        local: "Clock which lane feels more rider than reader.",
        fast: "Touch the line and get out before the calm starts slowing the move.",
        chaotic: "Give the block one fake intellectual sponsor shout and keep pushing.",
      },
    },
    {
      id: "tokyo-koenji-north",
      name: "Koenji North Cut",
      district: "Suginami",
      lat: 35.7061,
      lng: 139.6492,
      hint: "Tight local seams, quick reads, and no reason to play tourist.",
      tasks: {
        local: "Clock the first storefront that feels like regulars would notice you noticing it.",
        fast: "Touch the cut, keep the cadence neat, and leave before the lane starts asking questions.",
        chaotic: "Give the block a fake alleycat sponsorship tag under your breath and move on.",
      },
    },
    {
      id: "tokyo-kiyosumi-bridge",
      name: "Kiyosumi Bridge Run-Up",
      district: "Koto",
      lat: 35.6818,
      lng: 139.7991,
      hint: "River wind, clean lines, and one wrong choice away from a drag.",
      tasks: {
        local: "Clock how the river changes the feel of the block before you even hit it.",
        fast: "Touch the run-up, read the next move instantly, and keep the bridge from slowing the day down.",
        chaotic: "Throw one fake champion glare at the water and move before it gets theatrical.",
      },
    },
  ],
  mexicocity: [
    {
      id: "cdmx-doctores-cut",
      name: "Doctores Shopfront Cut",
      district: "Doctores",
      lat: 19.4187,
      lng: -99.1466,
      hint: "Tool shops, fast blocks, and no reason to coast.",
      tasks: {
        local: "Clock one storefront detail that says this block works harder than it talks.",
        fast: "Touch the cut, read the exit quick, and keep the cadence mean.",
        chaotic: "Give the block one fake sponsor tag in your head and disappear.",
      },
    },
    {
      id: "cdmx-santa-maria",
      name: "Santa Maria Kiosk Edge",
      district: "Santa Maria la Ribera",
      lat: 19.4491,
      lng: -99.1624,
      hint: "Open square, side-street pressure, easy to read wrong.",
      tasks: {
        local: "Clock the corner locals use like a shortcut and store it for later.",
        fast: "Touch the edge, pick the clean seam, and get out before the square flattens you.",
        chaotic: "Make one dramatic face at the kiosk like it called you out, then move.",
      },
    },
    {
      id: "cdmx-obrera-rail",
      name: "Obrera Rail Edge",
      district: "Obrera",
      lat: 19.4135,
      lng: -99.1404,
      hint: "Rail pressure, loud corners, and fast decisions.",
      tasks: {
        local: "Notice which side of the block feels louder than it should and why.",
        fast: "Hit the edge, trust the line, and keep your speed cleaner than the street deserves.",
        chaotic: "Quietly announce this was a tactical masterpiece and leave before anyone checks.",
      },
    },
    {
      id: "cdmx-roma-backline",
      name: "Roma Backline",
      district: "Roma Sur",
      lat: 19.4068,
      lng: -99.1632,
      hint: "Pretty blocks nearby, but this line is not here for that.",
      tasks: {
        local: "Find the least polished corner and trust it more than the postcard version.",
        fast: "Touch the backline, lock the next move, and keep it sharp.",
        chaotic: "Give the block a fake style score out of ten and ride off before the rating sinks in.",
      },
    },
    {
      id: "cdmx-san-rafael",
      name: "San Rafael Split",
      district: "San Rafael",
      lat: 19.4354,
      lng: -99.1668,
      hint: "Bad angles, useful exits, no softness.",
      tasks: {
        local: "Clock the corner that feels like old city stubbornness and remember it.",
        fast: "Touch the split, trust the fast side, and keep the hesitation off your face.",
        chaotic: "Mutter one fake team-radio line to yourself and move on.",
      },
    },
    {
      id: "cdmx-canal-nacional",
      name: "Canal Nacional Run-Up",
      district: "Iztacalco",
      lat: 19.3899,
      lng: -99.1214,
      hint: "Water drag, long reads, one wrong move into dead air.",
      tasks: {
        local: "Clock how the water changes the feel of the block before you touch it.",
        fast: "Touch the run-up, pick the hard exit, and stay on top of it.",
        chaotic: "Throw one fake champion nod at the canal and bounce before it gets corny.",
      },
    },
  ],
  bogota: [
    {
      id: "bogota-teusaquillo-cut",
      name: "Teusaquillo Cut",
      district: "Teusaquillo",
      lat: 4.6391,
      lng: -74.0858,
      hint: "Wide blocks, hidden speed, easy to underestimate.",
      tasks: {
        local: "Clock the first corner that feels more rider than commuter.",
        fast: "Touch the cut, stay on top of the line, and keep it moving.",
        chaotic: "Give the block one fake alleycat title and leave before it objects.",
      },
    },
    {
      id: "bogota-chapinero-rise",
      name: "Chapinero Rise",
      district: "Chapinero",
      lat: 4.6488,
      lng: -74.0617,
      hint: "A little lift, a little pressure, no free speed.",
      tasks: {
        local: "Notice where the block starts feeling less flat than the map promised.",
        fast: "Tag the rise, breathe once, and punch through clean.",
        chaotic: "Act like that tiny rise was mountain-stage drama and keep rolling.",
      },
    },
    {
      id: "bogota-san-felipe",
      name: "San Felipe Grid",
      district: "San Felipe",
      lat: 4.6647,
      lng: -74.0732,
      hint: "Warehouse edges, art spill, and cuts that reward nerve.",
      tasks: {
        local: "Clock one wall detail that feels more local hustle than gallery gloss.",
        fast: "Touch the grid, call the exit fast, and keep the noise behind you.",
        chaotic: "Pretend you curated the whole block for two seconds, then disappear.",
      },
    },
    {
      id: "bogota-parkway",
      name: "Parkway Edge",
      district: "La Soledad",
      lat: 4.6352,
      lng: -74.0757,
      hint: "Open center, tight edges, no easy choice.",
      tasks: {
        local: "Clock which side of the strip feels more alive without trying.",
        fast: "Touch the edge, choose the clean lane, and do not drift.",
        chaotic: "Give the strip one fake race commentary line and move on.",
      },
    },
    {
      id: "bogota-industrial-line",
      name: "Puente Aranda Line",
      district: "Puente Aranda",
      lat: 4.6217,
      lng: -74.1113,
      hint: "Industrial blocks, long sightlines, and bad decisions if you switch off.",
      tasks: {
        local: "Clock the exact moment the block feels more machine than city.",
        fast: "Touch the line, keep your speed honest, and leave before it drags.",
        chaotic: "Give the whole strip a fake union-strong salute and keep it moving.",
      },
    },
    {
      id: "bogota-river-seam",
      name: "Salitre River Seam",
      district: "Salitre",
      lat: 4.6591,
      lng: -74.1098,
      hint: "Wind seam, awkward edges, good reset if you read it right.",
      tasks: {
        local: "Notice what the wind does to the mood of the block and why.",
        fast: "Use the river seam as a reset, then get back into the grid sharply.",
        chaotic: "Throw one fake championship glare at the water and bounce.",
      },
    },
  ],
  warsaw: [
    {
      id: "warsaw-powisle-drop",
      name: "Powiśle Drop",
      district: "Powiśle",
      lat: 52.2376,
      lng: 21.0348,
      hint: "River pull, underpass choices, no space for soft calls.",
      tasks: {
        local: "Clock the corner that feels most like locals actually use it, not maps.",
        fast: "Hit the drop, choose the clean exit, and keep the line tight.",
        chaotic: "Give the river one fake title-defense nod and move along.",
      },
    },
    {
      id: "warsaw-praga-yard",
      name: "Praga Yard Edge",
      district: "Praga",
      lat: 52.2501,
      lng: 21.0496,
      hint: "Brick, rails, and the right amount of friction.",
      tasks: {
        local: "Clock the roughest useful corner and remember why it works.",
        fast: "Touch the yard edge, trust the next cut, and keep it blunt.",
        chaotic: "Quietly rate the whole block like a harsh race judge and leave.",
      },
    },
    {
      id: "warsaw-muranow-cut",
      name: "Muranów Cut",
      district: "Muranów",
      lat: 52.2498,
      lng: 20.9941,
      hint: "Open blocks with just enough confusion to matter.",
      tasks: {
        local: "Clock which side street feels calmer than it should.",
        fast: "Touch the cut, call the exit in one glance, and go.",
        chaotic: "Give the block a fake tactical breakdown under your breath and move on.",
      },
    },
    {
      id: "warsaw-ochota-line",
      name: "Ochota Line",
      district: "Ochota",
      lat: 52.2196,
      lng: 20.9847,
      hint: "Wide roads nearby, better lines tucked off them.",
      tasks: {
        local: "Clock one useful line that a tourist would never pick.",
        fast: "Touch the line, keep the pace honest, and leave before it opens up too much.",
        chaotic: "Make one fake radio-check to yourself and carry on.",
      },
    },
    {
      id: "warsaw-zoliborz-pocket",
      name: "Żoliborz Pocket",
      district: "Żoliborz",
      lat: 52.2689,
      lng: 20.9862,
      hint: "Quiet pocket, fast exits, looks softer than it is.",
      tasks: {
        local: "Notice how fast the block mood changes when you enter it.",
        fast: "Touch the pocket, pick the quick exit, and don’t overthink it.",
        chaotic: "Act like this was your secret training ground all along, then leave.",
      },
    },
    {
      id: "warsaw-mokotow-split",
      name: "Mokotów Split",
      district: "Mokotów",
      lat: 52.1942,
      lng: 21.0308,
      hint: "Too many useful exits, which is exactly the problem.",
      tasks: {
        local: "Clock the side that feels more lived in than designed.",
        fast: "Touch the split, choose hard, and keep the cadence clean.",
        chaotic: "Give the junction one sarcastic compliment and bounce.",
      },
    },
  ],
  barcelona: [
    {
      id: "barcelona-poblenou-grid",
      name: "Poblenou Grid",
      district: "Poblenou",
      lat: 41.4015,
      lng: 2.2026,
      hint: "Long blocks, sharp turns, no reason to drift into the beach fantasy.",
      tasks: {
        local: "Clock the first block that feels more workday than waterfront.",
        fast: "Touch the grid, lock the clean lane, and stay off cruise mode.",
        chaotic: "Tell yourself this is not a postcard out loud and keep moving.",
      },
    },
    {
      id: "barcelona-sants-cut",
      name: "Sants Cut",
      district: "Sants",
      lat: 41.3777,
      lng: 2.1366,
      hint: "Station gravity nearby, better moves off to the side.",
      tasks: {
        local: "Clock the corner commuters ignore but riders should not.",
        fast: "Touch the cut, pick the hard exit, and keep your line tight.",
        chaotic: "Make one fake team-director call to yourself and carry on.",
      },
    },
    {
      id: "barcelona-gracia-rise",
      name: "Gràcia Rise",
      district: "Gràcia",
      lat: 41.4042,
      lng: 2.1568,
      hint: "A little climb, a little noise, zero free points.",
      tasks: {
        local: "Notice where the street stops feeling flat and starts feeling personal.",
        fast: "Tag the rise, breathe once, and push through before it turns into a thing.",
        chaotic: "Treat that lift like a mountain stage and then immediately get over yourself.",
      },
    },
    {
      id: "barcelona-raval-edge",
      name: "Raval Edge",
      district: "Raval",
      lat: 41.3799,
      lng: 2.1686,
      hint: "Tight edges, fast reads, easy to get distracted.",
      tasks: {
        local: "Clock the least polished useful corner and trust it.",
        fast: "Touch the edge, leave before the block tries to keep your attention.",
        chaotic: "Give the block a fake style award and vanish.",
      },
    },
    {
      id: "barcelona-sant-antoni",
      name: "Sant Antoni Ring",
      district: "Sant Antoni",
      lat: 41.3785,
      lng: 2.1595,
      hint: "Good exits, bad geometry, perfect.",
      tasks: {
        local: "Clock which side of the ring feels calmer than it should.",
        fast: "Touch the ring, trust the fast side, and don’t drift into soft lines.",
        chaotic: "Mutter one fake apology to traffic and keep rolling.",
      },
    },
    {
      id: "barcelona-clot-line",
      name: "Clot Line",
      district: "Clot",
      lat: 41.4121,
      lng: 2.1907,
      hint: "Rail pressure nearby, useful cuts if you read them right.",
      tasks: {
        local: "Clock the line locals use when they are trying not to be seen waiting.",
        fast: "Touch the line, read the next move once, and go.",
        chaotic: "Give the whole strip one fake alleycat sponsor tag and bounce.",
      },
    },
  ],
  saopaulo: [
    {
      id: "saopaulo-bixiga-cut",
      name: "Bixiga Cut",
      district: "Bixiga",
      lat: -23.5584,
      lng: -46.6462,
      hint: "Short climbs, loud corners, proper city bite.",
      tasks: {
        local: "Clock the first corner that feels more neighborhood than performance.",
        fast: "Touch the cut, keep the pressure on, and leave before the block slows you.",
        chaotic: "Act like that corner was your home straight and move on.",
      },
    },
    {
      id: "saopaulo-liberdade-edge",
      name: "Liberdade Edge",
      district: "Liberdade",
      lat: -23.5552,
      lng: -46.6357,
      hint: "Crowd pull, side-street exits, easy to read wrong.",
      tasks: {
        local: "Clock one tiny detail that locals would notice before visitors ever do.",
        fast: "Touch the edge, pick the cleaner line, and get gone.",
        chaotic: "Give the whole block a fake rating out of ten and disappear.",
      },
    },
    {
      id: "saopaulo-barra-funda",
      name: "Barra Funda Yard",
      district: "Barra Funda",
      lat: -23.5252,
      lng: -46.6672,
      hint: "Rail energy, rough edges, good decisions matter here.",
      tasks: {
        local: "Clock the exact point where the block feels more machine than city.",
        fast: "Touch the yard edge, trust the next cut, and keep it clean.",
        chaotic: "Throw one fake champion stare at the rails and bounce.",
      },
    },
    {
      id: "saopaulo-vila-madalena",
      name: "Vila Madalena Backline",
      district: "Vila Madalena",
      lat: -23.5507,
      lng: -46.6917,
      hint: "Hills, bars, and side streets that reward commitment.",
      tasks: {
        local: "Clock the least polished useful corner and trust it more than the obvious one.",
        fast: "Touch the backline, hold your pace, and do not let the hill get in your head.",
        chaotic: "Make one fake heroic face at the slope and keep it pushing.",
      },
    },
    {
      id: "saopaulo-luz-runup",
      name: "Luz Run-Up",
      district: "Luz",
      lat: -23.5346,
      lng: -46.6358,
      hint: "Station gravity and long reads under pressure.",
      tasks: {
        local: "Clock which direction feels rougher than the map would admit.",
        fast: "Touch the run-up, pick your line, and keep the hesitation out of it.",
        chaotic: "Quietly narrate the move like race radio and leave before it gets weird.",
      },
    },
    {
      id: "saopaulo-mooca-line",
      name: "Mooca Line",
      district: "Mooca",
      lat: -23.5538,
      lng: -46.6015,
      hint: "Old factory energy, useful corners, zero need for a scenic detour.",
      tasks: {
        local: "Clock one sign the block still wears from an older version of itself.",
        fast: "Touch the line, lock the exit, and keep the whole move blunt.",
        chaotic: "Give the line one fake sponsor shout and cut out.",
      },
    },
  ],
};

const difficultyConfig = {
  easy: { count: 4, estimatedMinutes: 38, ghostSeconds: 37 * 60 },
  medium: { count: 5, estimatedMinutes: 54, ghostSeconds: 50 * 60 },
  hard: { count: 6, estimatedMinutes: 72, ghostSeconds: 64 * 60 },
};

const titleTokens = {
  local: "City Proof",
  fast: "Dispatch Cut",
  chaotic: "Street Noise",
};

const cityDisplayNames = {
  newyork: "New York",
  sanfrancisco: "San Francisco",
  berlin: "Berlin",
  london: "London",
  tokyo: "Tokyo",
  mexicocity: "Mexico City",
  bogota: "Bogota",
  warsaw: "Warsaw",
  barcelona: "Barcelona",
  saopaulo: "Sao Paulo",
};

const normalize = (value = "") => value.toLowerCase().replace(/[^a-z]/g, "");

const titleCaseWords = (value = "") =>
  String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const inferTaskType = (checkpoint = {}) => {
  const source = [
    checkpoint.category,
    checkpoint.vibe,
    checkpoint.name,
    checkpoint.hint,
    checkpoint.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(bridge|river|canal|towpath|water|bay)/.test(source)) return "Waterline read";
  if (/(station|arch|underpass|tracks|rail|yard)/.test(source)) return "Transit cut";
  if (/(rise|climb|hill|run-up|runup|gate)/.test(source)) return "Leg check";
  if (/(market|square|crossing|junction|ring|circle|scramble)/.test(source)) return "Flow read";
  if (/(park|feld|open-space|open|courtyard|decks)/.test(source)) return "Space check";
  if (/(line|backline|street-cut|cut|edge|split)/.test(source)) return "Line call";
  if (checkpoint.category) return `${titleCaseWords(checkpoint.category)} read`;
  return "Street read";
};

const inferPressureScore = ({ checkpoint = {}, difficulty = "medium", style = "local" }) => {
  const base = difficulty === "hard" ? 4 : difficulty === "medium" ? 3 : 2;
  const styleBoost = style === "chaotic" ? 1 : style === "fast" ? 0.5 : 0;
  const source = [checkpoint.category, checkpoint.vibe, checkpoint.hint, checkpoint.name].filter(Boolean).join(" ").toLowerCase();
  let contextBoost = 0;
  if (/(junction|crossing|market|station|bridge|scramble|ring|circle)/.test(source)) contextBoost += 1;
  if (/(quiet|reset|park|open|waterline|water)/.test(source)) contextBoost -= 0.5;
  return Math.max(1, Math.min(5, Math.round(base + styleBoost + contextBoost)));
};

const pressureLabel = (score) => {
  if (score >= 5) return "Hot";
  if (score >= 4) return "High";
  if (score >= 3) return "Medium";
  return "Low";
};

const buildGhostLabel = ({ difficulty, style, checkpointCount, districtCount }) => {
  const pressure = (difficulty === "hard" ? 2 : difficulty === "medium" ? 1 : 0) + (style === "chaotic" ? 2 : style === "fast" ? 1 : 0);
  const spreadBoost = districtCount >= Math.max(4, checkpointCount - 1) ? 1 : 0;
  const total = pressure + spreadBoost;
  if (total >= 4) return "Heat check";
  if (total >= 2) return "Hard chase";
  return "Clean chase";
};

const buildTaskMixSummary = (checkpoints = []) => {
  const counts = new Map();
  for (const checkpoint of checkpoints) {
    const key = checkpoint.task_type || "Street read";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label, count]) => `${label} x${count}`)
    .join(" · ");
};

const buildReplayHook = ({ style, city }) => {
  if (style === "chaotic") return `Same city, different noise. Run ${city} back and clean the line up.`;
  if (style === "fast") return `Run ${city} back, tighten the exits, and shave the clock.`;
  return `Take another swing through ${city} and find a cleaner second line.`;
};

export const getMessengerCityPack = (city = "") => {
  const normalized = normalize(city);
  if (!normalized) return null;
  const exact = Object.keys(checkpointsByCity).find((key) => normalized.includes(key));
  if (!exact) return null;
  return {
    slug: exact,
    name: cityDisplayNames[exact] || exact.charAt(0).toUpperCase() + exact.slice(1),
    checkpoints: checkpointsByCity[exact],
  };
};

export const normalizeCitySlug = normalize;

const seededOrder = (items, seed) => {
  const copy = [...items];
  let state = seed || 1;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (state * 9301 + 49297) % 233280;
    const next = Math.floor((state / 233280) * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
};

const pickCheckpointSet = (items, count, seed) => {
  const ordered = seededOrder(items, seed);
  const selected = [];
  const seenDistricts = new Set();
  const leftovers = [];

  for (const checkpoint of ordered) {
    const districtKey = String(checkpoint.district || "").trim().toLowerCase();
    if (districtKey && !seenDistricts.has(districtKey)) {
      selected.push(checkpoint);
      seenDistricts.add(districtKey);
      if (selected.length >= count) return selected;
      continue;
    }
    leftovers.push(checkpoint);
  }

  for (const checkpoint of leftovers) {
    selected.push(checkpoint);
    if (selected.length >= count) break;
  }

  return selected;
};

export function distanceBetweenMeters(pointA, pointB) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const latDiff = toRad(pointB.lat - pointA.lat);
  const lngDiff = toRad(pointB.lng - pointA.lng);
  const lat1 = toRad(pointA.lat);
  const lat2 = toRad(pointB.lat);
  const sinLat = Math.sin(latDiff / 2);
  const sinLng = Math.sin(lngDiff / 2);
  const a = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadius * c);
}

export const buildMessengerManifestFromPack = ({
  pack,
  checkpoints: sourceCheckpoints,
  difficulty = "medium",
  style = "local",
  seed = Date.now(),
  startPoint = null,
  startLabel = "",
  rangeKm = null,
  checkpointCount = null,
}) => {
  if (!pack || !Array.isArray(sourceCheckpoints) || !sourceCheckpoints.length) {
    return { error: "City pack is empty." };
  }

  const difficultyKey = difficultyConfig[difficulty] ? difficulty : "medium";
  const styleKey = ["local", "fast", "chaotic"].includes(style) ? style : "local";
  const config = difficultyConfig[difficultyKey];
  const requestedCount = Number.isFinite(Number(checkpointCount)) ? Math.round(Number(checkpointCount)) : null;
  const normalizedRequestedCount = requestedCount ? Math.max(1, requestedCount) : config.count;
  const resolvedRangeKm = Number.isFinite(Number(rangeKm)) ? Math.max(1, Number(rangeKm)) : null;
  const effectiveRangeKm = resolvedRangeKm
    ? Number(((resolvedRangeKm <= 1 ? resolvedRangeKm : resolvedRangeKm * 0.8)).toFixed(2))
    : null;
  const targetCount = resolvedRangeKm && resolvedRangeKm <= 1 ? Math.min(normalizedRequestedCount, 2) : normalizedRequestedCount;
  let candidatePool = [...sourceCheckpoints];
  let maxDistanceKm = null;

  if (startPoint?.lat && startPoint?.lng) {
    const ranked = [...sourceCheckpoints]
      .map((checkpoint) => ({
        checkpoint,
        distance: distanceBetweenMeters(startPoint, { lat: checkpoint.lat, lng: checkpoint.lng }),
      }))
      .sort((a, b) => a.distance - b.distance);

    const inRange = effectiveRangeKm
      ? ranked.filter((entry) => entry.distance <= effectiveRangeKm * 1000)
      : ranked;

    if (effectiveRangeKm) {
      if (inRange.length < targetCount) {
        return {
          error: `${pack.name} cannot fit ${targetCount} checkpoints within ${resolvedRangeKm} km of ${startLabel || "that start area"}. Widen the range, lower the checkpoint count, or drop the difficulty.`,
        };
      }
      const denseWindow = Math.min(
        inRange.length,
        Math.max(targetCount + 2, targetCount * 2)
      );
      candidatePool = inRange.slice(0, denseWindow).map((entry) => entry.checkpoint);
    } else {
      candidatePool = ranked.map((entry) => entry.checkpoint);
    }
  }

  if (candidatePool.length < targetCount) {
    return {
      error: `${pack.name} only has ${candidatePool.length} usable checkpoints right now. Lower the checkpoint count or switch packs.`,
    };
  }

  const ordered = pickCheckpointSet(candidatePool, Math.min(targetCount, candidatePool.length), seed);

  const checkpoints = ordered.map((checkpoint, index) => {
    const taskType = inferTaskType(checkpoint);
    const pressureScore = inferPressureScore({ checkpoint, difficulty: difficultyKey, style: styleKey });
    return {
      id: checkpoint.id,
      order: index + 1,
      name: checkpoint.name,
      district: checkpoint.district || "",
      lat: checkpoint.lat,
      lng: checkpoint.lng,
      hint: checkpoint.hint,
      task:
        checkpoint.tasks?.[styleKey] ||
        checkpoint.task_local ||
        checkpoint.task_fast ||
        checkpoint.task_chaotic ||
        "Read the street, clear the spot, and keep moving.",
      task_type: taskType,
      task_pressure: pressureLabel(pressureScore),
      pressure_score: pressureScore,
      score_points: 80 + pressureScore * 20,
    };
  });

  if (startPoint?.lat && startPoint?.lng && checkpoints.length) {
    maxDistanceKm = Math.max(
      ...checkpoints.map((checkpoint) =>
        distanceBetweenMeters(startPoint, { lat: checkpoint.lat, lng: checkpoint.lng }) / 1000
      )
    );
  }

  const districtCount = new Set(checkpoints.map((checkpoint) => checkpoint.district).filter(Boolean)).size;
  const title = `${pack.name} ${titleTokens[styleKey]} ${difficultyKey.charAt(0).toUpperCase()}${difficultyKey.slice(1)}`;
  const estimatedMinutes = Math.max(20, Math.round((config.estimatedMinutes / config.count) * checkpoints.length));
  const difficultyFactor = difficultyKey === "hard" ? 0.92 : difficultyKey === "medium" ? 0.97 : 1;
  const styleFactor = styleKey === "chaotic" ? 0.95 : styleKey === "fast" ? 0.97 : 1;
  const spreadFactor = districtCount >= Math.max(4, checkpoints.length - 1) ? 0.97 : 1;
  const ghostSeconds = Math.max(
    18 * 60,
    Math.round((config.ghostSeconds / config.count) * checkpoints.length * difficultyFactor * styleFactor * spreadFactor)
  );
  const totalScore = checkpoints.reduce((sum, checkpoint) => sum + (checkpoint.score_points || 0), 0);
  const taskMix = buildTaskMixSummary(checkpoints);
  const ghostLabel = buildGhostLabel({
    difficulty: difficultyKey,
    style: styleKey,
    checkpointCount: checkpoints.length,
    districtCount,
  });

  return {
    manifest: {
      id: crypto.randomUUID(),
      city: pack.name,
      city_slug: pack.slug,
      difficulty: difficultyKey,
      style: styleKey,
      manifest_title: title,
      estimated_minutes: estimatedMinutes,
      ghost_seconds: ghostSeconds,
      ghost_label: ghostLabel,
      checkpoint_count: checkpoints.length,
      district_count: districtCount,
      total_score: totalScore,
      task_mix: taskMix,
      replay_hook: buildReplayHook({ style: styleKey, city: pack.name }),
      start_label: startLabel || "",
      range_km: resolvedRangeKm,
      effective_range_km: effectiveRangeKm,
      max_distance_km: maxDistanceKm ? Number(maxDistanceKm.toFixed(1)) : null,
      route_note:
        pack.route_note || "Any order. Pick your own line through the city and clear every checkpoint before the finish.",
      finish_label:
        pack.finish_label || "Final proof at your last checkpoint. When the list is clear, stop the clock.",
      safety_note:
        pack.safety_note || "Ride within local laws, stay aware in traffic, and treat this as a self-directed challenge.",
      checkpoints,
    },
  };
};

export const buildMessengerManifest = ({
  city,
  difficulty = "medium",
  style = "local",
  seed = Date.now(),
  startPoint = null,
  startLabel = "",
  rangeKm = null,
  checkpointCount = null,
}) => {
  const pack = getMessengerCityPack(city);
  if (!pack) {
    return { error: "City not supported yet. Start with Berlin, London, Tokyo, Mexico City, Bogota, Warsaw, Barcelona, or Sao Paulo." };
  }
  return buildMessengerManifestFromPack({
    pack,
    checkpoints: pack.checkpoints,
    difficulty,
    style,
    seed,
    startPoint,
    startLabel,
    rangeKm,
    checkpointCount,
  });
};

export const formatDurationLabel = (totalSeconds = 0) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
