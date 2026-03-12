export const MESSENGER_CREDIT_COST = 3;
export const ALLEYCAT_CHECKIN_RADIUS_METERS = 250;

const checkpointsByCity = {
  berlin: [
    {
      id: "berlin-alex-clock",
      name: "Alexanderplatz World Clock",
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
      lat: 52.5189,
      lng: 13.3476,
      hint: "Quiet seam, fast exits, no reason to linger.",
      tasks: {
        local: "Clock the cleanest quiet line and remember how fast the city mood changed.",
        fast: "Touch the cut, lock the exit, and keep your speed tidy.",
        chaotic: "Act like this little pocket was your secret all along, then leave before it gets weird.",
      },
    },
  ],
  london: [
    {
      id: "london-somerset",
      name: "Somerset House Courtyard",
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
      lat: 51.513628,
      lng: -0.128111,
      hint: "Too many spokes, which is exactly the point.",
      tasks: {
        local: "Choose the spoke that best fits your current mood.",
        fast: "Read the junction fast and trust your cut.",
        chaotic: "Count the possible mistakes before choosing the fun one.",
      },
    },
  ],
  tokyo: [
    {
      id: "tokyo-shibuya-scramble",
      name: "Shibuya Scramble Edge",
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
      lat: 35.6275,
      lng: 139.7753,
      hint: "Wide views, awkward edges, too much temptation to coast.",
      tasks: {
        local: "Find the least postcard-worthy angle and trust it more than the obvious one.",
        fast: "Touch the deck zone, skip the view trap, and get moving again.",
        chaotic: "Give the skyline a sarcastic compliment under your breath and disappear before it answers back.",
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

const normalize = (value = "") => value.toLowerCase().replace(/[^a-z]/g, "");

export const getMessengerCityPack = (city = "") => {
  const normalized = normalize(city);
  if (!normalized) return null;
  const exact = Object.keys(checkpointsByCity).find((key) => normalized.includes(key));
  if (!exact) return null;
  return {
    slug: exact,
    name: exact.charAt(0).toUpperCase() + exact.slice(1),
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
    return { error: "City not supported yet. Start with Berlin, London, or Tokyo." };
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
