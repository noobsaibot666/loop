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
};

const difficultyConfig = {
  easy: { count: 4, estimatedMinutes: 38, ghostSeconds: 42 * 60 },
  medium: { count: 5, estimatedMinutes: 54, ghostSeconds: 58 * 60 },
  hard: { count: 6, estimatedMinutes: 72, ghostSeconds: 75 * 60 },
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

export const buildMessengerManifest = ({
  city,
  difficulty = "medium",
  style = "local",
  seed = Date.now(),
}) => {
  const pack = getMessengerCityPack(city);
  if (!pack) {
    return { error: "City not supported yet. Start with Berlin or London." };
  }

  const difficultyKey = difficultyConfig[difficulty] ? difficulty : "medium";
  const styleKey = ["local", "fast", "chaotic"].includes(style) ? style : "local";
  const config = difficultyConfig[difficultyKey];
  const ordered = seededOrder(pack.checkpoints, seed).slice(0, config.count);

  const checkpoints = ordered.map((checkpoint, index) => ({
    id: checkpoint.id,
    order: index + 1,
    name: checkpoint.name,
    lat: checkpoint.lat,
    lng: checkpoint.lng,
    hint: checkpoint.hint,
    task: checkpoint.tasks[styleKey],
  }));

  const title = `${pack.name} ${titleTokens[styleKey]} ${difficultyKey.charAt(0).toUpperCase()}${difficultyKey.slice(1)}`;

  return {
    manifest: {
      id: crypto.randomUUID(),
      city: pack.name,
      city_slug: pack.slug,
      difficulty: difficultyKey,
      style: styleKey,
      manifest_title: title,
      estimated_minutes: config.estimatedMinutes,
      ghost_seconds: config.ghostSeconds,
      checkpoint_count: checkpoints.length,
      route_note: "Any order. Pick your own line through the city and clear every checkpoint before the finish.",
      finish_label: "Final proof at your last checkpoint. When the list is clear, stop the clock.",
      safety_note: "Ride within local laws, stay aware in traffic, and treat this as a self-directed challenge.",
      checkpoints,
    },
  };
};

export const formatDurationLabel = (totalSeconds = 0) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export const distanceBetweenMeters = (pointA, pointB) => {
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
};
