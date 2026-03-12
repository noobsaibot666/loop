import { json, parseJSON, getAuthUser } from "../../_utils.js";
import { buildMessengerManifest, buildMessengerManifestFromPack, MESSENGER_CREDIT_COST, normalizeCitySlug } from "../../../shared/messenger.js";
import { consumeMessengerCredits, getPackCheckpoints, getPublishedCityPackByCity, persistManifest } from "./_helpers.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || "";
  if (!userId) return json({ error: "login required" }, { status: 401 });

  const { city, difficulty, style, start_lat, start_lng, start_label, range_km, checkpoint_count } = body;
  if (!String(start_label || "").trim() || !Number.isFinite(Number(start_lat)) || !Number.isFinite(Number(start_lng))) {
    return json({ error: "start area required" }, { status: 400 });
  }
  const seed = Math.floor(Math.random() * 100000);
  const startPoint =
    Number.isFinite(Number(start_lat)) && Number.isFinite(Number(start_lng))
      ? { lat: Number(start_lat), lng: Number(start_lng) }
      : null;
  const dbPack = await getPublishedCityPackByCity(env, normalizeCitySlug(city));
  const dbCheckpoints = dbPack ? await getPackCheckpoints(env, dbPack.id, true) : [];
  const built =
    dbPack && dbCheckpoints.length
      ? buildMessengerManifestFromPack({
          pack: {
            slug: dbPack.slug,
            name: dbPack.name,
            route_note: dbPack.route_note,
            finish_label: dbPack.finish_label,
            safety_note: dbPack.safety_note,
          },
          checkpoints: dbCheckpoints.map((checkpoint) => ({
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
          startLabel: String(start_label || ""),
          rangeKm: Number(range_km || 0) || null,
          checkpointCount: Number(checkpoint_count || 0) || null,
        })
      : buildMessengerManifest({
          city,
          difficulty,
          style,
          seed,
          startPoint,
          startLabel: String(start_label || ""),
          rangeKm: Number(range_km || 0) || null,
          checkpointCount: Number(checkpoint_count || 0) || null,
        });

  if (built.error) {
    return json({ error: built.error }, { status: 400 });
  }

  const creditResult = await consumeMessengerCredits(env, userId, MESSENGER_CREDIT_COST, authUser?.email || "");
  if (!creditResult.ok) return creditResult.response;

  const manifest = built.manifest;
  const persisted = await persistManifest(env, {
    id: manifest.id,
    user_id: userId,
    city_slug: manifest.city_slug,
    city_name: manifest.city,
    difficulty: manifest.difficulty,
    style: manifest.style,
    manifest_title: manifest.manifest_title,
    estimated_minutes: manifest.estimated_minutes,
    ghost_seconds: manifest.ghost_seconds,
    checkpoint_count: manifest.checkpoint_count,
    manifest: manifest,
  });

  return json({
    manifest_id: persisted?.id || manifest.id,
    manifest,
    credits_remaining: creditResult.credits_remaining,
    is_admin: creditResult.is_admin || false,
    unlimited_credits: creditResult.unlimited_credits || false,
    premium_cost: MESSENGER_CREDIT_COST,
  });
}
