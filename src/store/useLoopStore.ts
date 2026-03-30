import { create } from "zustand";
import { persist } from "zustand/middleware";
import { postJSON } from "../utils/routeUtils";
import { normalizeMapsUrl } from "../utils/maps";

const MIN_LOOP_WAYPOINTS = 5;
const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineKm = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildCumulativeDistances = (points: { lat: number; lng: number }[]) => {
  const cumulative = [0];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += haversineKm(points[index - 1], points[index]);
    cumulative.push(total);
  }
  return { cumulative, total };
};

const pointAtDistance = (
  points: { lat: number; lng: number }[],
  cumulative: number[],
  targetDistance: number,
) => {
  if (!points.length) return null;
  if (targetDistance <= 0) return points[0];
  const total = cumulative[cumulative.length - 1] || 0;
  if (targetDistance >= total) return points[points.length - 1];
  let index = 1;
  while (index < cumulative.length && cumulative[index] < targetDistance) index += 1;
  const prevIndex = Math.max(0, index - 1);
  const nextIndex = Math.min(points.length - 1, index);
  const prevDistance = cumulative[prevIndex] || 0;
  const nextDistance = cumulative[nextIndex] || prevDistance;
  if (nextDistance <= prevDistance) return points[nextIndex];
  const ratio = Math.min(1, Math.max(0, (targetDistance - prevDistance) / (nextDistance - prevDistance)));
  const start = points[prevIndex];
  const end = points[nextIndex];
  return {
    lat: Number((start.lat + (end.lat - start.lat) * ratio).toFixed(6)),
    lng: Number((start.lng + (end.lng - start.lng) * ratio).toFixed(6)),
  };
};

const sampleLoopMapsWaypoints = (routeCoords: [number, number][], targetDistanceKm: number) => {
  const points = routeCoords
    .map((point) => ({ lat: Number(point[1]), lng: Number(point[0]) }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (points.length < 8) return [];
  const { cumulative, total } = buildCumulativeDistances(points);
  const waypointCount =
    targetDistanceKm < 6 ? 4 : targetDistanceKm < 12 ? 5 : targetDistanceKm < 20 ? 6 : targetDistanceKm < 30 ? 7 : 8;
  const minSpacingKm = Math.max(0.45, total / (waypointCount + 3) * 0.55);
  const minOriginDistanceKm = Math.max(0.35, targetDistanceKm * 0.06);
  const picked: { lat: number; lng: number }[] = [];
  const keys = new Set<string>();
  const candidates: Array<{ point: { lat: number; lng: number }; routeIndex: number; priority: number }> = [];
  const pushCandidate = (point: { lat: number; lng: number } | null, routeIndex: number, priority: number) => {
    if (!point) return;
    candidates.push({ point, routeIndex, priority });
  };

  for (let index = 0; index < waypointCount; index += 1) {
    const ratio = (index + 1) / (waypointCount + 1);
    const sample = pointAtDistance(points, cumulative, total * (0.08 + ratio * 0.82));
    pushCandidate(sample, Math.round((points.length - 1) * ratio), 1);
  }

  const extrema = [
    points.reduce<{ lat: number; lng: number } | null>((best, point) => (!best || point.lat > best.lat ? point : best), null),
    points.reduce<{ lat: number; lng: number } | null>((best, point) => (!best || point.lng > best.lng ? point : best), null),
    points.reduce<{ lat: number; lng: number } | null>((best, point) => (!best || point.lat < best.lat ? point : best), null),
    points.reduce<{ lat: number; lng: number } | null>((best, point) => (!best || point.lng < best.lng ? point : best), null),
    points.reduce<{ lat: number; lng: number } | null>(
      (best, point) => (!best || haversineKm(points[0], point) > haversineKm(points[0], best) ? point : best),
      null,
    ),
  ];

  extrema.forEach((point, index) => {
    if (!point) return;
    const routeIndex = points.findIndex((candidate) => candidate.lat === point.lat && candidate.lng === point.lng);
    pushCandidate(point, routeIndex, index === 4 ? 4 : 3);
  });

  candidates
    .sort((left, right) => {
      if (right.priority !== left.priority) return right.priority - left.priority;
      return left.routeIndex - right.routeIndex;
    })
    .forEach(({ point }) => {
      if (haversineKm(points[0], point) < minOriginDistanceKm) return;
      if (picked.some((existing) => haversineKm(existing, point) < minSpacingKm)) return;
      const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
      if (keys.has(key)) return;
      keys.add(key);
      picked.push(point);
    });

  if (picked.length < 4) {
    [0.14, 0.3, 0.48, 0.64, 0.8, 0.9].forEach((ratio) => {
      if (picked.length >= 5) return;
      const sample = pointAtDistance(points, cumulative, total * ratio);
      if (!sample) return;
      if (haversineKm(points[0], sample) < minOriginDistanceKm) return;
      const key = `${sample.lat.toFixed(4)},${sample.lng.toFixed(4)}`;
      if (picked.some((existing) => haversineKm(existing, sample) < minSpacingKm * 0.8)) return;
      if (keys.has(key)) return;
      keys.add(key);
      picked.push(sample);
    });
  }

  return picked
    .sort((left, right) => {
      const leftKey = `${left.lat.toFixed(4)},${left.lng.toFixed(4)}`;
      const rightKey = `${right.lat.toFixed(4)},${right.lng.toFixed(4)}`;
      const leftIndex = points.findIndex((point) => `${point.lat.toFixed(4)},${point.lng.toFixed(4)}` === leftKey);
      const rightIndex = points.findIndex((point) => `${point.lat.toFixed(4)},${point.lng.toFixed(4)}` === rightKey);
      return leftIndex - rightIndex;
    })
    .slice(0, Math.max(MIN_LOOP_WAYPOINTS, waypointCount));
};

const buildGoogleMapsLoopUrl = (
  origin: { lat: number; lng: number },
  routeWaypoints: { lat: number; lng: number }[],
) => {
  const points = routeWaypoints.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));
  if (!points.length) return "";
  const orderedPoints = [origin, ...points, origin];
  const path = orderedPoints.map((point) => `${point.lat},${point.lng}`).join("/");
  return `https://www.google.com/maps/dir/${path}/data=!4m2!4m1!3e1`;
};

const hasUsableLoopWaypoints = (waypoints: { lat: number; lng: number }[]) =>
  waypoints.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng)).length >= MIN_LOOP_WAYPOINTS;

const buildFallbackLoopWaypoints = (
  origin: { lat: number; lng: number },
  distanceKm: number,
  seed: number,
) => {
  const radiusBase = Math.min(5.8, Math.max(1.2, distanceKm * 0.17));
  const seedRotation = ((seed * 37) % 360 + 360) % 360;
  const bearings = [28, 94, 172, 246, 318].map((offset) => (offset + seedRotation) % 360);
  const radiusFactors = [0.96, 1.14, 1.02, 1.18, 0.92];
  return bearings.map((bearing, index) => {
    const earthRadiusKm = 6371;
    const distance = Math.max(0.9, Math.min(radiusBase * radiusFactors[index], radiusBase * 1.25));
    const bearingRad = (bearing * Math.PI) / 180;
    const lat1 = (origin.lat * Math.PI) / 180;
    const lng1 = (origin.lng * Math.PI) / 180;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / earthRadiusKm) +
        Math.cos(lat1) * Math.sin(distance / earthRadiusKm) * Math.cos(bearingRad),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(distance / earthRadiusKm) * Math.cos(lat1),
        Math.cos(distance / earthRadiusKm) - Math.sin(lat1) * Math.sin(lat2),
      );
    return {
      lat: Number(((lat2 * 180) / Math.PI).toFixed(6)),
      lng: Number(((lng2 * 180) / Math.PI).toFixed(6)),
    };
  });
};

interface LoopState {
  loopPoint: string;
  distance: number;
  terrain: string;
  surface: string;
  vibe: string;
  unit: "km" | "mi";
  selectedCoords: { lat: number; lng: number } | null;
  lastRouteUrl: string;
  isGenerating: boolean;
  statusMessage: string;
  isSuggesting: boolean;
  suggestions: any[];
  
  setLoopPoint: (point: string) => void;
  setDistance: (distance: number) => void;
  setTerrain: (terrain: string) => void;
  setSurface: (surface: string) => void;
  setVibe: (vibe: string) => void;
  setUnit: (unit: "km" | "mi") => void;
  setSelectedCoords: (coords: { lat: number; lng: number } | null) => void;
  setLastRouteUrl: (url: string) => void;
  
  fetchSuggestions: (text: string) => Promise<void>;
  generateLoop: (
    userId: string,
    deviceId: string,
    currentUsage: any,
    updateUsage: (u: any) => void,
    selectedBike?: { id?: string | null; bike_name?: string | null; bike_ratio?: string | null } | null,
  ) => Promise<void>;
}

export const useLoopStore = create<LoopState>()(
  persist(
    (set, get) => ({
      loopPoint: "",
      distance: 20,
      terrain: "mix",
      surface: "paved",
      vibe: "Elegant",
      unit: "km",
      selectedCoords: null,
      lastRouteUrl: "",
      isGenerating: false,
      statusMessage: "",
      isSuggesting: false,
      suggestions: [],

      setLoopPoint: (loopPoint) => set({ loopPoint }),
      setDistance: (distance) => set({ distance }),
      setTerrain: (terrain) => set({ terrain }),
      setSurface: (surface) => set({ surface }),
      setVibe: (vibe) => set({ vibe }),
      setUnit: (unit) => set({ unit }),
      setSelectedCoords: (selectedCoords) => set({ selectedCoords }),
      setLastRouteUrl: (lastRouteUrl) => set({ lastRouteUrl }),

      fetchSuggestions: async (text: string) => {
        if (!text || text.length < 3) {
          set({ suggestions: [] });
          return;
        }
        if ((get() as any).selectedCoords) return;
        set({ isSuggesting: true });
        try {
          const geo = await postJSON<any>("/api/geocode", { text });
          const results = geo?.features?.slice(0, 5).map((f: any) => ({
            label: f?.properties?.label || f?.properties?.name || "Unknown",
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          })) || [];
          set({ suggestions: results });
        } catch {
          set({ suggestions: [] });
        } finally {
          set({ isSuggesting: false });
        }
      },

      generateLoop: async (userId, deviceId, currentUsage, updateUsage, selectedBike) => {
        const { loopPoint, distance, unit, terrain, surface, vibe, selectedCoords } = get() as any;
        set({ isGenerating: true, statusMessage: "" });
        
        try {
          const consumed = await postJSON<any>("/api/usage/consume", { device_id: deviceId, user_id: userId });
          if (!consumed.allowed) {
            set({ statusMessage: "loop.status.spent", isGenerating: false });
            return;
          }

          updateUsage({
            free_used: consumed.free_used,
            donation_credits: consumed.donation_credits,
            free_remaining: Math.max(0, 10 - consumed.free_used), 
            credits_remaining: consumed.credits_remaining || 0,
          });

          let origin = selectedCoords;
          if (!origin) {
            const geo = await postJSON<any>("/api/geocode", { text: loopPoint });
            const first = geo?.features?.[0];
            if (!first) throw new Error("loop.status.noLocation");
            origin = { lat: first.geometry.coordinates[1], lng: first.geometry.coordinates[0] };
            set({ selectedCoords: origin });
          }

          const distanceKm = unit === "km" ? distance : distance * 1.60934;
          const loop = await postJSON<any>("/api/loop", {
            coords: [origin.lng, origin.lat],
            distance_km: distanceKm,
            terrain,
            surface,
            vibe,
            seed: Math.floor(Math.random() * 1000),
          });

          const coords = loop?.features?.[0]?.geometry?.coordinates || [];
          const serverWaypoints = Array.isArray(loop?.sampled_waypoints)
            ? loop.sampled_waypoints
                .map((point: any) => ({
                  lat: Number(point?.lat),
                  lng: Number(point?.lng),
                }))
                .filter((point: any) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
            : [];
          const waypoints = hasUsableLoopWaypoints(serverWaypoints) ? serverWaypoints : sampleLoopMapsWaypoints(coords, distanceKm);
          let routeUrl = String(loop?.route_url || "").trim();
          const resolvedWaypoints =
            hasUsableLoopWaypoints(waypoints)
              ? waypoints
              : buildFallbackLoopWaypoints(origin, distanceKm, Number(loop?.candidate_seed || Math.floor(Math.random() * 1000)));

          if ((!routeUrl || !routeUrl.includes("/maps/dir/")) && hasUsableLoopWaypoints(resolvedWaypoints)) {
            routeUrl = buildGoogleMapsLoopUrl(origin, resolvedWaypoints);
          } else if (!routeUrl) {
            const fallbackDistanceKm = Math.max(1.2, distanceKm * 0.18);
            const bearings = [55, 235];
            const fallbackWaypoints = bearings
              .map((bearing) => {
                const earthRadiusKm = 6371;
                const bearingRad = (bearing * Math.PI) / 180;
                const lat1 = (origin.lat * Math.PI) / 180;
                const lng1 = (origin.lng * Math.PI) / 180;
                const lat2 = Math.asin(
                  Math.sin(lat1) * Math.cos(fallbackDistanceKm / earthRadiusKm) +
                    Math.cos(lat1) * Math.sin(fallbackDistanceKm / earthRadiusKm) * Math.cos(bearingRad),
                );
                const lng2 =
                  lng1 +
                  Math.atan2(
                    Math.sin(bearingRad) * Math.sin(fallbackDistanceKm / earthRadiusKm) * Math.cos(lat1),
                    Math.cos(fallbackDistanceKm / earthRadiusKm) - Math.sin(lat1) * Math.sin(lat2),
                  );
                return {
                  lat: (lat2 * 180) / Math.PI,
                  lng: (lng2 * 180) / Math.PI,
                };
              })
              .map((point) => ({
                lat: Number(point.lat.toFixed(6)),
                lng: Number(point.lng.toFixed(6)),
              }));
            routeUrl = buildGoogleMapsLoopUrl(origin, fallbackWaypoints);
          }

          routeUrl = normalizeMapsUrl(routeUrl);

          if (!routeUrl) {
            throw new Error("loop.status.failed");
          }

          set({ lastRouteUrl: routeUrl, statusMessage: "loop.status.ready" });
          await postJSON("/api/loop-history", {
            loop_point: loopPoint,
            distance_km: distanceKm,
            unit,
            terrain,
            surface,
            vibe,
            route_url: routeUrl,
            bike_id: selectedBike?.id || null,
            bike_name: selectedBike?.bike_name || null,
            bike_ratio: selectedBike?.bike_ratio || null,
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : "";
          set({ statusMessage: message || "loop.status.failed" });
        } finally {
          set({ isGenerating: false });
        }
      }
    }),
    {
      name: "loop-builder-storage",
    }
  )
);
