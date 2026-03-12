import { json, parseJSON, requireAdmin } from "../../_utils.js";
import { buildMessengerManifest, buildMessengerManifestFromPack, normalizeCitySlug } from "../../../shared/messenger.js";
import { getCityPackById, getPackCheckpoints, getPublishedCityPackByCity } from "../messenger/_helpers.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const difficulty = String(body.difficulty || "medium").toLowerCase();
  const style = String(body.style || "local").toLowerCase();
  const seed = Number(body.seed || 777);
  const checkpointCount = Number(body.checkpoint_count || 0) || null;
  const startPoint =
    Number.isFinite(Number(body.start_lat)) && Number.isFinite(Number(body.start_lng))
      ? { lat: Number(body.start_lat), lng: Number(body.start_lng) }
      : null;
  const startLabel = String(body.start_label || "").trim();
  const rangeKm = Number(body.range_km || 0) || null;
  const packId = String(body.pack_id || "").trim();
  const city = String(body.city || "").trim();

  let pack = null;
  let checkpoints = [];
  if (packId) {
    pack = await getCityPackById(env, packId);
    checkpoints = pack ? await getPackCheckpoints(env, pack.id, false) : [];
  } else if (city) {
    pack = await getPublishedCityPackByCity(env, normalizeCitySlug(city));
    checkpoints = pack ? await getPackCheckpoints(env, pack.id, true) : [];
  }

  const dbBuilt =
    pack && checkpoints.length
      ? buildMessengerManifestFromPack({
          pack: {
            slug: pack.slug,
            name: pack.name,
            route_note: pack.route_note,
            finish_label: pack.finish_label,
            safety_note: pack.safety_note,
          },
          checkpoints: checkpoints.map((checkpoint) => ({
            id: checkpoint.slug,
            name: checkpoint.name,
            lat: checkpoint.lat,
            lng: checkpoint.lng,
            hint: checkpoint.hint,
            task_local: checkpoint.task_local,
            task_fast: checkpoint.task_fast,
            task_chaotic: checkpoint.task_chaotic,
          })),
          difficulty,
          style,
          seed,
          startPoint,
          startLabel,
          rangeKm,
          checkpointCount,
        })
      : null;
  const fallbackBuilt = buildMessengerManifest({ city, difficulty, style, seed, startPoint, startLabel, rangeKm, checkpointCount });
  const built = dbBuilt?.error ? fallbackBuilt : dbBuilt || fallbackBuilt;

  if (built.error) return json({ error: built.error }, { status: 400 });
  return json({ manifest: built.manifest, source: pack ? "database" : "fallback" });
}
