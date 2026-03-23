import { create } from "zustand";
import { persist } from "zustand/middleware";
import { postJSON } from "../utils/routeUtils";
import { API_BASE } from "../config";

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
  generateLoop: (userId: string, deviceId: string, currentUsage: any, updateUsage: (u: any) => void) => Promise<void>;
}

const buildGoogleMapsLoopUrl = (
  origin: { lat: number; lng: number },
  routeWaypoints: string[],
) => {
  const cleanedWaypoints = routeWaypoints
    .map((point) => point.replace(/^via:/, "").trim())
    .filter(Boolean);
  const destination = cleanedWaypoints[cleanedWaypoints.length - 1] || `${origin.lat},${origin.lng}`;
  const waypoints = cleanedWaypoints.slice(0, -1);
  const params = new URLSearchParams();
  params.set("api", "1");
  params.set("origin", `${origin.lat},${origin.lng}`);
  params.set("destination", destination);
  params.set("travelmode", "bicycling");
  params.set("dir_action", "navigate");
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

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

      generateLoop: async (userId, deviceId, currentUsage, updateUsage) => {
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
          const sampledWaypoints = (routeCoords: [number, number][]) => {
            if (routeCoords.length < 6) return [];
            const ratios = [0.33, 0.66];
            return ratios
              .map((ratio) => routeCoords[Math.min(routeCoords.length - 1, Math.floor(routeCoords.length * ratio))])
              .filter(Boolean)
              .map((point) => `via:${point[1]},${point[0]}`);
          };

          const waypoints = sampledWaypoints(coords);
          let routeUrl = "";

          if (waypoints.length) {
            routeUrl = buildGoogleMapsLoopUrl(origin, waypoints);
          } else {
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
              .map((point) => `via:${point.lat.toFixed(6)},${point.lng.toFixed(6)}`);
            routeUrl = buildGoogleMapsLoopUrl(origin, fallbackWaypoints);
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
