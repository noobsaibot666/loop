const EARTH_RADIUS_KM = 6371;
export const MIN_LOOP_WAYPOINTS = 5;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const toRadians = (value) => (value * Math.PI) / 180;
const toDegrees = (value) => (value * 180) / Math.PI;

const computeOffsetPoint = (origin, bearingDegrees, distanceKm) => {
  const angularDistance = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRadians(bearingDegrees);
  const lat1 = toRadians(origin.lat);
  const lng1 = toRadians(origin.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing),
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: Number(toDegrees(lat2).toFixed(6)),
    lng: Number(toDegrees(lng2).toFixed(6)),
  };
};

export const buildFallbackLoopWaypoints = (origin, distanceKm = 0, seed = 1) => {
  const originPoint = normalizePoint(origin);
  if (!originPoint || !Number.isFinite(originPoint.lat) || !Number.isFinite(originPoint.lng)) return [];
  const radiusBase = clamp(Math.max(1.2, distanceKm * 0.17), 1.2, 5.8);
  const seedRotation = ((Number(seed || 1) * 37) % 360 + 360) % 360;
  const bearings = [28, 94, 172, 246, 318].map((offset) => (offset + seedRotation) % 360);
  const radiusFactors = [0.96, 1.14, 1.02, 1.18, 0.92];
  return bearings.map((bearing, index) =>
    computeOffsetPoint(originPoint, bearing, clamp(radiusBase * radiusFactors[index], 0.9, radiusBase * 1.25)),
  );
};

export const hasUsableLoopWaypoints = (waypoints = []) =>
  waypoints.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng)).length >= MIN_LOOP_WAYPOINTS;

const normalizePoint = (point) => {
  if (!point) return null;
  if (Array.isArray(point) && point.length >= 2) {
    return {
      lng: Number(point[0]),
      lat: Number(point[1]),
    };
  }
  if (typeof point === "object") {
    return {
      lat: Number(point.lat),
      lng: Number(point.lng),
    };
  }
  return null;
};

const normalizeRoutePoints = (routeCoords = []) =>
  (routeCoords || [])
    .map(normalizePoint)
    .filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));

const haversineKm = (start, end) => {
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildCumulativeDistances = (points = []) => {
  const cumulative = [0];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += haversineKm(points[index - 1], points[index]);
    cumulative.push(total);
  }
  return { cumulative, total };
};

const headingBetween = (start, end) => {
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const dLng = toRadians(end.lng - start.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const heading = (toDegrees(Math.atan2(y, x)) + 360) % 360;
  return Number.isFinite(heading) ? heading : 0;
};

const headingDelta = (left, right) => {
  const raw = Math.abs(left - right) % 360;
  return raw > 180 ? 360 - raw : raw;
};

const buildHeadingBins = (headings = [], binCount = 12) => {
  const bins = new Set();
  headings.forEach((heading) => {
    if (!Number.isFinite(heading)) return;
    bins.add(Math.floor(((heading % 360) + 360) % 360 / (360 / binCount)));
  });
  return bins.size;
};

const buildBBox = (points = []) => {
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
};

const bboxMetrics = (points = []) => {
  if (!points.length) {
    return { diagKm: 0, widthKm: 0, heightKm: 0, aspectPenalty: 1 };
  }
  const box = buildBBox(points);
  const centerLat = (box.minLat + box.maxLat) / 2;
  const widthKm =
    haversineKm({ lat: centerLat, lng: box.minLng }, { lat: centerLat, lng: box.maxLng }) || 0;
  const heightKm =
    haversineKm({ lat: box.minLat, lng: box.minLng }, { lat: box.maxLat, lng: box.minLng }) || 0;
  const diagKm = haversineKm({ lat: box.minLat, lng: box.minLng }, { lat: box.maxLat, lng: box.maxLng }) || 0;
  const shorter = Math.max(0.01, Math.min(widthKm, heightKm));
  const longer = Math.max(widthKm, heightKm);
  const aspectPenalty = clamp((longer / shorter - 1.8) / 3.2, 0, 1);
  return { diagKm, widthKm, heightKm, aspectPenalty };
};

const roundedPointKey = (point, precision = 3) => `${point.lat.toFixed(precision)},${point.lng.toFixed(precision)}`;

const overlapRatio = (points = [], splitRatio = 0.5) => {
  if (points.length < 12) return 1;
  const splitIndex = Math.floor(points.length * splitRatio);
  const left = points.slice(0, splitIndex);
  const right = points.slice(splitIndex);
  const leftKeys = new Set(left.map((point) => roundedPointKey(point, 3)));
  const rightKeys = new Set(right.map((point) => roundedPointKey(point, 3)));
  if (!leftKeys.size || !rightKeys.size) return 1;
  let shared = 0;
  rightKeys.forEach((key) => {
    if (leftKeys.has(key)) shared += 1;
  });
  return shared / Math.max(1, Math.min(leftKeys.size, rightKeys.size));
};

const corridorDuplicationRatio = (points = []) => {
  if (points.length < 16) return 1;
  const quarter = Math.max(4, Math.floor(points.length * 0.24));
  const start = points.slice(0, quarter);
  const finish = points.slice(points.length - quarter).reverse();
  const startKeys = new Set(start.map((point) => roundedPointKey(point, 3)));
  const finishKeys = new Set(finish.map((point) => roundedPointKey(point, 3)));
  let shared = 0;
  finishKeys.forEach((key) => {
    if (startKeys.has(key)) shared += 1;
  });
  return shared / Math.max(1, Math.min(startKeys.size, finishKeys.size));
};

const radialSpreadBins = (origin, points = [], binCount = 12) => {
  const headings = points
    .filter((point) => haversineKm(origin, point) > 0.25)
    .map((point) => headingBetween(origin, point));
  return buildHeadingBins(headings, binCount);
};

const turnDensity = (points = []) => {
  if (points.length < 8) return 0;
  const headings = [];
  for (let index = 1; index < points.length; index += 1) {
    headings.push(headingBetween(points[index - 1], points[index]));
  }
  if (headings.length < 2) return 0;
  let sharpTurns = 0;
  for (let index = 1; index < headings.length; index += 1) {
    if (headingDelta(headings[index - 1], headings[index]) >= 24) sharpTurns += 1;
  }
  return sharpTurns / headings.length;
};

const maxRadiusKm = (origin, points = []) =>
  points.reduce((max, point) => Math.max(max, haversineKm(origin, point)), 0);

const sampledLegMetrics = (origin, sampledWaypoints = [], totalDistanceKm = 0) => {
  const sequence = [origin, ...sampledWaypoints, origin].filter(Boolean);
  if (sequence.length < 3 || totalDistanceKm <= 0) {
    return { dominantLegRatio: 1, averageLegKm: 0 };
  }
  const legs = [];
  for (let index = 1; index < sequence.length; index += 1) {
    legs.push(haversineKm(sequence[index - 1], sequence[index]));
  }
  const dominantLegKm = Math.max(...legs, 0);
  const averageLegKm = legs.reduce((sum, value) => sum + value, 0) / Math.max(1, legs.length);
  return {
    dominantLegRatio: dominantLegKm / totalDistanceKm,
    averageLegKm: Number(averageLegKm.toFixed(2)),
  };
};

const chooseWaypointCount = (totalDistanceKm = 0) => {
  if (totalDistanceKm < 6) return 4;
  if (totalDistanceKm < 12) return 5;
  if (totalDistanceKm < 20) return 6;
  if (totalDistanceKm < 30) return 7;
  return 8;
};

const pointAtDistance = (points = [], cumulative = [], targetDistance = 0) => {
  if (!points.length) return null;
  if (targetDistance <= 0) return points[0];
  const maxDistance = cumulative[cumulative.length - 1] || 0;
  if (targetDistance >= maxDistance) return points[points.length - 1];
  let index = 1;
  while (index < cumulative.length && cumulative[index] < targetDistance) index += 1;
  const prevIndex = Math.max(0, index - 1);
  const nextIndex = Math.min(points.length - 1, index);
  const prevDistance = cumulative[prevIndex] || 0;
  const nextDistance = cumulative[nextIndex] || prevDistance;
  if (nextDistance <= prevDistance) return points[nextIndex];
  const ratio = clamp((targetDistance - prevDistance) / (nextDistance - prevDistance), 0, 1);
  const start = points[prevIndex];
  const end = points[nextIndex];
  return {
    lat: Number((start.lat + (end.lat - start.lat) * ratio).toFixed(6)),
    lng: Number((start.lng + (end.lng - start.lng) * ratio).toFixed(6)),
  };
};

export const sampleLoopMapsWaypoints = (routeCoords = [], distanceKm = 0) => {
  const points = normalizeRoutePoints(routeCoords);
  if (points.length < 8) return [];
  const { cumulative, total } = buildCumulativeDistances(points);
  const count = chooseWaypointCount(distanceKm || total);
  const minSpacingKm = Math.max(0.45, total / (count + 3) * 0.55);
  const minOriginDistanceKm = Math.max(0.35, (distanceKm || total) * 0.06);
  const samples = [];
  const keys = new Set();
  const candidates = [];
  const pushCandidate = (point, routeIndex = null, priority = 0) => {
    if (!point) return;
    const normalized = normalizePoint(point);
    if (!normalized) return;
    candidates.push({ point: normalized, routeIndex, priority });
  };

  for (let index = 0; index < count; index += 1) {
    const ratio = (index + 1) / (count + 1);
    const targetDistance = total * (0.08 + ratio * 0.82);
    const point = pointAtDistance(points, cumulative, targetDistance);
    pushCandidate(point, Math.round((points.length - 1) * ratio), 1);
  }

  const routeExtrema = [
    { point: points.reduce((best, point) => (!best || point.lat > best.lat ? point : best), null), priority: 3 },
    { point: points.reduce((best, point) => (!best || point.lng > best.lng ? point : best), null), priority: 3 },
    { point: points.reduce((best, point) => (!best || point.lat < best.lat ? point : best), null), priority: 3 },
    { point: points.reduce((best, point) => (!best || point.lng < best.lng ? point : best), null), priority: 3 },
    {
      point: points.reduce(
        (best, point) =>
          !best || haversineKm(points[0], point) > haversineKm(points[0], best) ? point : best,
        null,
      ),
      priority: 4,
    },
  ];

  routeExtrema.forEach(({ point, priority }) => {
    if (!point) return;
    const routeIndex = points.findIndex(
      (candidate) => candidate.lat === point.lat && candidate.lng === point.lng,
    );
    pushCandidate(point, routeIndex, priority);
  });

  candidates
    .sort((left, right) => {
      if (right.priority !== left.priority) return right.priority - left.priority;
      return (left.routeIndex ?? 0) - (right.routeIndex ?? 0);
    })
    .forEach(({ point }) => {
      if (haversineKm(points[0], point) < minOriginDistanceKm) return;
      const tooClose = samples.some((sample) => haversineKm(sample, point) < minSpacingKm);
      const key = roundedPointKey(point, 4);
      if (tooClose || keys.has(key)) return;
      keys.add(key);
      samples.push(point);
    });

  if (samples.length < 4) {
    [0.14, 0.3, 0.48, 0.64, 0.8, 0.9].forEach((ratio) => {
      if (samples.length >= 5) return;
      const point = pointAtDistance(points, cumulative, total * ratio);
      if (!point) return;
      if (haversineKm(points[0], point) < minOriginDistanceKm) return;
      const tooClose = samples.some((sample) => haversineKm(sample, point) < minSpacingKm * 0.8);
      const key = roundedPointKey(point, 4);
      if (tooClose || keys.has(key)) return;
      keys.add(key);
      samples.push(point);
    });
  }

  return samples
    .sort((left, right) => {
      const leftIndex = points.findIndex((point) => roundedPointKey(point, 4) === roundedPointKey(left, 4));
      const rightIndex = points.findIndex((point) => roundedPointKey(point, 4) === roundedPointKey(right, 4));
      return leftIndex - rightIndex;
    })
    .slice(0, Math.max(MIN_LOOP_WAYPOINTS, count));
};

export const buildGoogleMapsLoopUrl = (origin, sampledWaypoints = []) => {
  const originPoint = normalizePoint(origin);
  if (!originPoint || !Number.isFinite(originPoint.lat) || !Number.isFinite(originPoint.lng)) return "";
  const points = sampledWaypoints
    .map(normalizePoint)
    .filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));
  if (!points.length) return "";
  const orderedPoints = [originPoint, ...points, originPoint];
  const path = orderedPoints.map((point) => `${point.lat},${point.lng}`).join("/");
  return `https://www.google.com/maps/dir/${path}/data=!4m2!4m1!3e1`;
};

export const parseGoogleMapsLoopUrl = (routeUrl = "") => {
  try {
    const url = new URL(routeUrl);
    const originRaw = url.searchParams.get("origin");
    const destinationRaw = url.searchParams.get("destination");
    const waypointsRaw = url.searchParams.get("waypoints") || "";
    const parsePair = (value) => {
      const cleaned = String(value || "").replace(/^via:/, "");
      const [lat, lng] = cleaned.split(",").map(Number);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    };
    if (!originRaw && !destinationRaw && url.pathname.includes("/maps/dir/")) {
      const segments = url.pathname
        .split("/maps/dir/")[1]
        ?.split("/")
        .map((segment) => decodeURIComponent(segment).trim())
        .filter(Boolean)
        .map(parsePair)
        .filter(Boolean) || [];
      return {
        origin: segments[0] || null,
        destination: segments[segments.length - 1] || null,
        waypoints: segments.slice(1, -1),
      };
    }
    if (url.searchParams.get("api") === "1") {
      return {
        origin: parsePair(originRaw),
        destination: parsePair(destinationRaw),
        waypoints: waypointsRaw
          .split("|")
          .map(parsePair)
          .filter(Boolean),
      };
    }
    return {
      origin: parsePair(originRaw),
      destination: parsePair(destinationRaw),
      waypoints: waypointsRaw
        .split("|")
        .map(parsePair)
        .filter(Boolean),
    };
  } catch {
    return { origin: null, destination: null, waypoints: [] };
  }
};

export const isUsableLoopRouteUrl = (routeUrl = "") => {
  const parsed = parseGoogleMapsLoopUrl(routeUrl);
  return Boolean(parsed.origin) && hasUsableLoopWaypoints(parsed.waypoints);
};

const computeRecentSimilarity = ({ origin, distanceKm, sampledWaypoints, recentRoutes = [] }) => {
  const candidateKeys = new Set(sampledWaypoints.map((point) => roundedPointKey(point, 3)));
  if (!candidateKeys.size) return 0;
  let maxSimilarity = 0;
  recentRoutes.forEach((route) => {
    const parsed = parseGoogleMapsLoopUrl(route.route_url || "");
    if (!parsed.origin) return;
    if (haversineKm(origin, parsed.origin) > 0.75) return;
    if (Math.abs(Number(route.distance_km || 0) - distanceKm) > Math.max(2, distanceKm * 0.3)) return;
    const routePoints = [...parsed.waypoints, parsed.destination].filter(Boolean);
    const routeKeys = new Set(routePoints.map((point) => roundedPointKey(point, 3)));
    if (!routeKeys.size) return;
    let shared = 0;
    candidateKeys.forEach((key) => {
      if (routeKeys.has(key)) shared += 1;
    });
    const similarity = shared / Math.max(1, Math.min(candidateKeys.size, routeKeys.size));
    maxSimilarity = Math.max(maxSimilarity, similarity);
  });
  return maxSimilarity;
};

const applyPreferenceBias = ({
  terrain,
  surface,
  vibe,
  bboxDiagScore,
  headingSpreadScore,
  radialSpreadScore,
  turnDensityScore,
  lengthCloseness,
  overlapPenalty,
}) => {
  let bonus = 0;
  const terrainKey = String(terrain || "").trim().toLowerCase();
  const surfaceKey = String(surface || "").trim().toLowerCase();
  const vibeKey = String(vibe || "").trim().toLowerCase();

  if (terrainKey === "climb") bonus += radialSpreadScore * 5 + turnDensityScore * 6;
  if (terrainKey === "road") bonus += lengthCloseness * 4;
  if (terrainKey === "coast") bonus += bboxDiagScore * 7 + radialSpreadScore * 4;

  if (surfaceKey === "mixed") bonus += headingSpreadScore * 3 + bboxDiagScore * 2;
  if (surfaceKey === "gravel") bonus += headingSpreadScore * 4 + radialSpreadScore * 3;

  if (vibeKey === "scenic") bonus += bboxDiagScore * 8 + radialSpreadScore * 5;
  if (vibeKey === "energy") bonus += turnDensityScore * 8 + headingSpreadScore * 4;
  if (vibeKey === "elegant") bonus += (1 - overlapPenalty) * 6 + lengthCloseness * 2;
  if (vibeKey === "climb") bonus += turnDensityScore * 4 + radialSpreadScore * 4;

  return bonus;
};

export const evaluateLoopCandidate = ({
  routeData,
  origin,
  targetDistanceKm,
  terrain,
  surface,
  vibe,
  recentRoutes = [],
}) => {
  const routeCoords = routeData?.features?.[0]?.geometry?.coordinates || [];
  const points = normalizeRoutePoints(routeCoords);
  if (points.length < 8) {
    return {
      valid: false,
      score: -999,
      metrics: {
        totalDistanceKm: 0,
        overlapRatio: 1,
        corridorDuplication: 1,
        radialSpreadBins: 0,
        headingSpreadBins: 0,
        turnDensity: 0,
        bboxDiagKm: 0,
        maxRadiusKm: 0,
        recentSimilarity: 0,
        startEndGapKm: 99,
        dominantLegRatio: 1,
      },
      sampledWaypoints: [],
    };
  }

  const { total } = buildCumulativeDistances(points);
  const totalDistanceKm =
    Number(routeData?.features?.[0]?.properties?.summary?.distance || 0) > 0
      ? Number(routeData.features[0].properties.summary.distance) / 1000
      : total;
  const headings = [];
  for (let index = 1; index < points.length; index += 1) {
    headings.push(headingBetween(points[index - 1], points[index]));
  }
  const bbox = bboxMetrics(points);
  const overlap = overlapRatio(points);
  const corridorDup = corridorDuplicationRatio(points);
  const headingBins = buildHeadingBins(headings, 12);
  const radialBins = radialSpreadBins(origin, points, 12);
  const turnRate = turnDensity(points);
  const radiusKm = maxRadiusKm(origin, points);
  const sampledWaypoints = sampleLoopMapsWaypoints(routeCoords, totalDistanceKm);
  const startEndGapKm = haversineKm(points[0], points[points.length - 1]);
  const legMetrics = sampledLegMetrics(origin, sampledWaypoints, totalDistanceKm);
  const recentSimilarity = computeRecentSimilarity({
    origin,
    distanceKm: targetDistanceKm,
    sampledWaypoints,
    recentRoutes,
  });

  const lengthCloseness = 1 - clamp(Math.abs(totalDistanceKm - targetDistanceKm) / Math.max(targetDistanceKm, 1), 0, 1);
  const bboxDiagScore = clamp(bbox.diagKm / Math.max(targetDistanceKm * 0.42, 1.2), 0, 1);
  const headingSpreadScore = clamp(headingBins / 9, 0, 1);
  const radialSpreadScore = clamp(radialBins / 8, 0, 1);
  const turnDensityScore = clamp(turnRate / 0.22, 0, 1);
  const radiusScore = clamp(radiusKm / Math.max(targetDistanceKm * 0.34, 0.8), 0, 1);
  const overlapPenalty = clamp(overlap, 0, 1);
  const corridorPenalty = clamp(corridorDup, 0, 1);
  const recentPenalty = clamp(recentSimilarity, 0, 1);
  const dominantLegPenalty = clamp((legMetrics.dominantLegRatio - 0.3) / 0.28, 0, 1);
  const returnGapPenalty = clamp(startEndGapKm / Math.max(targetDistanceKm * 0.08, 0.2), 0, 1);

  let score =
    lengthCloseness * 12 +
    bboxDiagScore * 18 +
    headingSpreadScore * 16 +
    radialSpreadScore * 16 +
    turnDensityScore * 10 +
    radiusScore * 8 -
    overlapPenalty * 28 -
    corridorPenalty * 18 -
    dominantLegPenalty * 14 -
    returnGapPenalty * 18 -
    bbox.aspectPenalty * 14 -
    recentPenalty * 22;

  score += applyPreferenceBias({
    terrain,
    surface,
    vibe,
    bboxDiagScore,
    headingSpreadScore,
    radialSpreadScore,
    turnDensityScore,
    lengthCloseness,
    overlapPenalty,
  });

  const valid =
    hasUsableLoopWaypoints(sampledWaypoints) &&
    overlap < 0.54 &&
    corridorDup < 0.58 &&
    dominantLegPenalty < 0.66 &&
    startEndGapKm < Math.max(targetDistanceKm * 0.08, 0.35) &&
    radialBins >= MIN_LOOP_WAYPOINTS &&
    score >= 18;

  return {
    valid,
    score: Number(score.toFixed(2)),
    sampledWaypoints,
    metrics: {
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      overlapRatio: Number(overlap.toFixed(3)),
      corridorDuplication: Number(corridorDup.toFixed(3)),
      radialSpreadBins: radialBins,
      headingSpreadBins: headingBins,
      turnDensity: Number(turnRate.toFixed(3)),
      bboxDiagKm: Number(bbox.diagKm.toFixed(2)),
      maxRadiusKm: Number(radiusKm.toFixed(2)),
      recentSimilarity: Number(recentSimilarity.toFixed(3)),
      startEndGapKm: Number(startEndGapKm.toFixed(3)),
      dominantLegRatio: Number(legMetrics.dominantLegRatio.toFixed(3)),
      averageLegKm: legMetrics.averageLegKm,
    },
  };
};

export const selectBestLoopCandidate = (candidates = []) => {
  const successful = candidates.filter((candidate) => candidate?.ok && candidate?.evaluation);
  if (!successful.length) return null;
  const validCandidates = successful.filter((candidate) => candidate.evaluation.valid);
  const pool = validCandidates.length ? validCandidates : successful;
  return [...pool].sort((left, right) => right.evaluation.score - left.evaluation.score)[0] || null;
};

const uniqueProfiles = (profiles = []) => {
  const seen = new Set();
  return profiles.filter((profile) => {
    const key = `${profile.points}:${profile.seedOffset}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildLoopCandidateProfiles = ({ terrain, surface, vibe, reroll = false, strict = false }) => {
  const terrainKey = String(terrain || "").trim().toLowerCase();
  const surfaceKey = String(surface || "").trim().toLowerCase();
  const vibeKey = String(vibe || "").trim().toLowerCase();
  const rerollOffset = reroll ? 131 : 0;
  const basePoints =
    terrainKey === "climb"
      ? 5
      : terrainKey === "coast" || vibeKey === "scenic"
        ? 4
        : surfaceKey === "gravel"
          ? 5
          : 4;

  const anchorProfiles = [
    {
      label: "anchor-orbit",
      strategy: "anchors",
      points: clamp(basePoints + 1, 3, 7),
      seedOffset: rerollOffset + 0,
      bearingOffsets: [42, 162, 286],
      radiusFactors: [1.02, 1.22, 0.9],
    },
    {
      label: "anchor-wide",
      strategy: "anchors",
      points: clamp(basePoints + 2, 3, 7),
      seedOffset: rerollOffset + 17,
      bearingOffsets: [64, 184, 304],
      radiusFactors: [1.1, 1.3, 0.98],
    },
    {
      label: "anchor-urban",
      strategy: "anchors",
      points: clamp(basePoints, 3, 7),
      seedOffset: rerollOffset + 37,
      bearingOffsets: [28, 146, 258],
      radiusFactors: [0.92, 1.08, 0.84],
    },
    {
      label: "anchor-cross",
      strategy: "anchors",
      points: clamp(basePoints + (surfaceKey === "mixed" || surfaceKey === "gravel" ? 1 : 0), 3, 7),
      seedOffset: rerollOffset + 61,
      bearingOffsets: [80, 208, 332],
      radiusFactors: [1.0, 1.2, 0.96],
    },
    {
      label: "anchor-deep",
      strategy: "anchors",
      points: clamp(basePoints + 2, 3, 7),
      seedOffset: rerollOffset + 101,
      bearingOffsets: [24, 118, 214, 308],
      radiusFactors: [0.92, 1.22, 1.28, 0.98],
    },
    {
      label: "anchor-laced",
      strategy: "anchors",
      points: clamp(basePoints + 1, 3, 7),
      seedOffset: rerollOffset + 127,
      bearingOffsets: [52, 136, 224, 314],
      radiusFactors: [1.04, 0.96, 1.18, 1.02],
    },
  ];
  const profiles = strict
    ? anchorProfiles
    : [
        ...anchorProfiles,
        {
          label: "roundtrip-fallback",
          strategy: "round_trip",
          points: clamp(surfaceKey === "mixed" || surfaceKey === "gravel" ? basePoints + 1 : 6, 3, 7),
          seedOffset: rerollOffset + 89,
        },
      ];
  return uniqueProfiles(profiles).slice(0, strict ? 6 : 5);
};

export const buildLoopCandidateRequest = ({
  origin,
  targetDistanceKm,
  terrain,
  surface,
  vibe,
  seed,
  profile,
}) => {
  const terrainKey = String(terrain || "").trim().toLowerCase();
  const surfaceKey = String(surface || "").trim().toLowerCase();
  const vibeKey = String(vibe || "").trim().toLowerCase();
  const baseBearing =
    (((Number(seed || 1) * 47 + profile.seedOffset * 17) % 360) +
      (terrainKey === "coast" ? 18 : 0) +
      (terrainKey === "climb" ? 11 : 0) +
      (vibeKey === "scenic" ? 24 : 0) +
      (vibeKey === "energy" ? -12 : 0) +
      (surfaceKey === "gravel" ? 9 : 0) +
      360) %
    360;

  if (profile.strategy === "anchors") {
    const radiusBase = clamp(
      targetDistanceKm *
        (terrainKey === "road" ? 0.22 : terrainKey === "climb" ? 0.24 : vibeKey === "scenic" ? 0.25 : 0.23),
      1.1,
      6.4,
    );
    const points = (profile.bearingOffsets || []).map((offset, index) =>
      computeOffsetPoint(
        origin,
        (baseBearing + offset + 360) % 360,
        clamp(radiusBase * (profile.radiusFactors?.[index] || 1), 0.9, Math.max(1.6, targetDistanceKm * 0.48)),
      ),
    );

    return {
      coordinates: [
        [origin.lng, origin.lat],
        ...points.map((point) => [point.lng, point.lat]),
        [origin.lng, origin.lat],
      ],
    };
  }

  return {
    coordinates: [[origin.lng, origin.lat]],
    options: {
      round_trip: {
        length: Math.max(1000, targetDistanceKm * 1000),
        points: profile.points,
        seed: Number(seed || 1) + profile.seedOffset,
      },
    },
  };
};
