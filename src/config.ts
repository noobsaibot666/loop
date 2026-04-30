import { createClient } from "@supabase/supabase-js";

export const API_BASE = (() => {
  const configured = import.meta.env.VITE_API_BASE || "";
  if (typeof window !== "undefined") {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isLocal) {
      return configured || "http://localhost:8787";
    }
    if (configured.includes("localhost")) return window.location.origin;
    return configured || window.location.origin;
  }
  return configured;
})();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

export const LOOP_FREE_LIMIT = 3;
export const LOOP_CREDIT_COST = 1;
export const MESSENGER_CREDIT_COST = 3;
export const ALLEYCAT_STORAGE_KEY = "loop_alleycat_state";
export const ALLEYCAT_PROOF_DRAFTS_KEY = "loop_alleycat_proof_drafts";
export const LOOP_BUILDER_STORAGE_KEY = "loop_builder_state";

export const PROOF_BUCKET = "alleycat-proofs";
export const NIGHT_RIDE_BUCKET = "night-ride-posts";

export const ALLEYCAT_CITY_GROUPS = [
  { label: "Americas", cities: ["Austin", "Belo Horizonte", "Bogota", "Buenos Aires", "Chicago", "Curitiba", "Guadalajara", "Guarulhos", "Lima", "Los Angeles", "Medellín", "Mexico City", "New York", "Philadelphia", "Portland", "Rio de Janeiro", "San Francisco", "Santiago", "Santos", "Sao Paulo", "Seattle", "Toronto"] },
  { label: "Europe", cities: ["Amsterdam", "Barcelona", "Berlin", "Budapest", "Cologne", "Copenhagen", "Hamburg", "Krakow", "Lisbon", "London", "Madrid", "Marseille", "Milan", "Munich", "Paris", "Prague", "Rotterdam", "Vienna", "Warsaw", "Wroclaw"] },
  { label: "Asia", cities: ["Bangkok", "Hong Kong", "Jakarta", "Manila", "Osaka", "Seoul", "Shanghai", "Taipei", "Tokyo"] },
];

export const ALLEYCAT_CITY_PRESETS = ALLEYCAT_CITY_GROUPS.flatMap((group) => group.cities);

export const toCitySlug = (value = "") => value.trim().toLowerCase().replace(/\s+/g, "");
export const getCityLabel = (value = "") => ALLEYCAT_CITY_PRESETS.find((city) => toCitySlug(city) === toCitySlug(value)) || value;
