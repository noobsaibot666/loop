import {
  buildFallbackLoopWaypoints,
  buildGoogleMapsLoopUrl,
  sampleLoopMapsWaypoints,
} from './loop-quality.js';

export const NIGHT_RIDE_CREDIT_COST = 1;
export const NIGHT_RIDE_CREW_BUILD_COST = 2;
export const NIGHT_RIDE_CREW_JOIN_COST = 1;

export const normalizeNightRideSessionType = (value = '') => {
  const sessionType = String(value || '')
    .trim()
    .toLowerCase();
  return sessionType === 'crew' ? 'crew' : 'single';
};

export const normalizeNightRideMode = (value = '') => {
  const mode = String(value || '')
    .trim()
    .toLowerCase();
  return mode === 'roulette' ? 'roulette' : 'loop';
};

export const normalizeNightRideDifficulty = (value = '') => {
  const difficulty = String(value || '')
    .trim()
    .toLowerCase();
  if (difficulty === 'easy' || difficulty === 'hard') return difficulty;
  return 'medium';
};

export const sanitizeCrewMembers = value => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item =>
      String(item || '')
        .trim()
        .replace(/^@+/, ''),
    )
    .filter(Boolean)
    .slice(0, 12);
};

export const createNightRideCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const toRadians = value => (value * Math.PI) / 180;
const toDegrees = value => (value * 180) / Math.PI;

export const distanceBetweenKm = (start, end) => {
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const computeOffsetPoint = (origin, bearingDegrees, distanceKm) => {
  const earthRadiusKm = 6371;
  const angularDistance = distanceKm / earthRadiusKm;
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

export const buildNightRideMapsUrl = ({
  origin,
  destination,
  waypoints = [],
}) => {
  const allPoints = waypoints.filter(
    point => Number.isFinite(point?.lat) && Number.isFinite(point?.lng),
  );

  if (
    Number.isFinite(origin?.lat) &&
    Number.isFinite(origin?.lng) &&
    Number.isFinite(destination?.lat) &&
    Number.isFinite(destination?.lng) &&
    Math.abs(origin.lat - destination.lat) < 0.000001 &&
    Math.abs(origin.lng - destination.lng) < 0.000001
  ) {
    return buildGoogleMapsLoopUrl(origin, allPoints);
  }

  const orderedPoints = [origin, ...allPoints, destination].filter(
    point => Number.isFinite(point?.lat) && Number.isFinite(point?.lng),
  );
  const path = orderedPoints
    .map(point => `${point.lat},${point.lng}`)
    .join('/');
  return `https://www.google.com/maps/dir/${path}/data=!4m2!4m1!3e1`;
};

export const sampleLoopWaypoints = (routeCoords = [], distanceKm = 0) =>
  sampleLoopMapsWaypoints(routeCoords, distanceKm);

export const buildNightRideFallbackLoopWaypoints = (
  origin,
  distanceKm = 0,
  seed = 1,
) => buildFallbackLoopWaypoints(origin, distanceKm, seed);

export const buildRouletteWaypoint = ({start, end, targetKm, difficulty}) => {
  const directKm = Math.max(0.8, distanceBetweenKm(start, end));
  const midpoint = {
    lat: (start.lat + end.lat) / 2,
    lng: (start.lng + end.lng) / 2,
  };
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;
  const perpendicularBearing = toDegrees(Math.atan2(dy, -dx));
  const detourScale =
    difficulty === 'easy' ? 0.22 : difficulty === 'hard' ? 0.48 : 0.34;
  const requestedExtra = Math.max(0, targetKm - directKm);
  const offsetKm = Math.min(
    Math.max(0.9, requestedExtra * detourScale),
    Math.max(2, targetKm * 0.42),
  );
  return computeOffsetPoint(midpoint, perpendicularBearing, offsetKm);
};
