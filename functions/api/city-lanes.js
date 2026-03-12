import { json, supabaseRequest } from "../_utils.js";

const normalizeCityKey = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "");

const slugifyCity = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const titleCaseCity = (value = "") =>
  String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const getPackStatus = (pack, countData, districtCount) => {
  const checkpointCount = countData?.checkpoint_count || 0;
  const activeCheckpointCount = countData?.active_checkpoint_count || 0;
  const copyReady = Boolean(pack.route_note && pack.finish_label && pack.safety_note);
  const canPublish = copyReady && activeCheckpointCount >= 4 && districtCount >= 3;
  if (pack.is_active) return "live";
  if (canPublish) return "ready";
  if (copyReady || checkpointCount > 0) return "review";
  return "draft";
};

const fetchThumbs = async (env) => {
  const base =
    "messenger_proof_posts?is_public=eq.true&order=created_at.desc&limit=20&select=id,city_name,city_slug,checkpoint_name,public_url";

  const withArchive = await supabaseRequest(env, `${base}&archived_at=is.null`, { method: "GET" }).catch(() => null);
  if (Array.isArray(withArchive)) return withArchive;
  return supabaseRequest(env, base, { method: "GET" }).catch(() => []);
};

export async function onRequest({ env }) {
  const [packs, checkpoints, requests, thumbs] = await Promise.all([
    supabaseRequest(env, "city_packs?order=name.asc&select=id,slug,name,route_note,finish_label,safety_note,is_active,created_at", { method: "GET" }).catch(() => []),
    supabaseRequest(env, "city_checkpoints?select=pack_id,id,is_active,district", { method: "GET" }).catch(() => []),
    supabaseRequest(env, "city_requests?select=requested_city,requested_location,status,created_at&order=created_at.desc&limit=300", { method: "GET" }).catch(() => []),
    fetchThumbs(env),
  ]);

  const checkpointCounts = new Map();
  const districtsByPack = new Map();
  for (const checkpoint of checkpoints || []) {
    const current = checkpointCounts.get(checkpoint.pack_id) || { checkpoint_count: 0, active_checkpoint_count: 0 };
    current.checkpoint_count += 1;
    if (checkpoint.is_active !== false) current.active_checkpoint_count += 1;
    checkpointCounts.set(checkpoint.pack_id, current);
    if (checkpoint.district) {
      const districtSet = districtsByPack.get(checkpoint.pack_id) || new Set();
      districtSet.add(String(checkpoint.district).trim());
      districtsByPack.set(checkpoint.pack_id, districtSet);
    }
  }

  const requestCounts = new Map();
  for (const row of requests || []) {
    const cityValue = row.requested_city || row.requested_location || "";
    const normalized = normalizeCityKey(cityValue);
    if (!normalized) continue;
    const current = requestCounts.get(normalized) || {
      city_name: titleCaseCity(cityValue),
      city_slug: slugifyCity(cityValue),
      demand_count: 0,
      open_count: 0,
      last_requested_at: null,
    };
    current.demand_count += 1;
    if (row.status !== "done") current.open_count += 1;
    if (!current.last_requested_at || row.created_at > current.last_requested_at) current.last_requested_at = row.created_at;
    requestCounts.set(normalized, current);
  }

  const packedCityKeys = new Set();
  const lanes = (packs || []).map((pack) => {
    const countData = checkpointCounts.get(pack.id);
    const districtCount = districtsByPack.get(pack.id)?.size || 0;
    const demand = requestCounts.get(normalizeCityKey(pack.name));
    packedCityKeys.add(normalizeCityKey(pack.name));
    return {
      city_slug: pack.slug,
      city_name: pack.name,
      status: getPackStatus(pack, countData, districtCount),
      checkpoint_count: countData?.checkpoint_count || 0,
      active_checkpoint_count: countData?.active_checkpoint_count || 0,
      district_count: districtCount,
      demand_count: demand?.demand_count || 0,
      open_request_count: demand?.open_count || 0,
      route_note: pack.route_note || "",
      finish_label: pack.finish_label || "",
      last_requested_at: demand?.last_requested_at || null,
    };
  });

  for (const [cityKey, demand] of requestCounts.entries()) {
    if (packedCityKeys.has(cityKey)) continue;
    lanes.push({
      city_slug: demand.city_slug,
      city_name: demand.city_name,
      status: "requested",
      checkpoint_count: 0,
      active_checkpoint_count: 0,
      district_count: 0,
      demand_count: demand.demand_count,
      open_request_count: demand.open_count,
      route_note: "",
      finish_label: "",
      last_requested_at: demand.last_requested_at,
    });
  }

  const statusOrder = { live: 0, ready: 1, review: 2, draft: 3, requested: 4 };
  lanes.sort((left, right) => {
    const statusDiff = (statusOrder[left.status] ?? 99) - (statusOrder[right.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    const demandDiff = (right.demand_count || 0) - (left.demand_count || 0);
    if (demandDiff !== 0) return demandDiff;
    return left.city_name.localeCompare(right.city_name);
  });

  return json({
    lanes,
    thumbs: (thumbs || []).filter((thumb) => thumb?.public_url).map((thumb) => ({
      id: thumb.id,
      city_name: thumb.city_name || "Unknown",
      city_slug: thumb.city_slug || slugifyCity(thumb.city_name || ""),
      checkpoint_name: thumb.checkpoint_name || "",
      public_url: thumb.public_url,
    })),
  });
}
