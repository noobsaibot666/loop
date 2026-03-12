export const MESSENGER_CREDIT_COST = 3;
export const ALLEYCAT_CHECKIN_RADIUS_METERS = 250;

const checkpointsByCity = {
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
      candidatePool = inRange.map((entry) => entry.checkpoint);
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

  const checkpoints = ordered.map((checkpoint, index) => ({
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
  }));

  if (startPoint?.lat && startPoint?.lng && checkpoints.length) {
    maxDistanceKm = Math.max(
      ...checkpoints.map((checkpoint) =>
        distanceBetweenMeters(startPoint, { lat: checkpoint.lat, lng: checkpoint.lng }) / 1000
      )
    );
  }

  const title = `${pack.name} ${titleTokens[styleKey]} ${difficultyKey.charAt(0).toUpperCase()}${difficultyKey.slice(1)}`;
  const estimatedMinutes = Math.max(20, Math.round((config.estimatedMinutes / config.count) * checkpoints.length));
  const ghostSeconds = Math.max(20 * 60, Math.round((config.ghostSeconds / config.count) * checkpoints.length));

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
      checkpoint_count: checkpoints.length,
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
