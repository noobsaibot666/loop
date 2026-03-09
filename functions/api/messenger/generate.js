import { json, parseJSON, getAuthUser } from "../../_utils.js";
import { buildMessengerManifest, MESSENGER_CREDIT_COST } from "../../../shared/messenger.js";
import { consumeMessengerCredits, persistManifest } from "./_helpers.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || "";
  if (!userId) return json({ error: "login required" }, { status: 401 });

  const { city, difficulty, style } = body;
  const built = buildMessengerManifest({
    city,
    difficulty,
    style,
    seed: Math.floor(Math.random() * 100000),
  });

  if (built.error) {
    return json({ error: built.error }, { status: 400 });
  }

  const creditResult = await consumeMessengerCredits(env, userId, MESSENGER_CREDIT_COST);
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
    premium_cost: MESSENGER_CREDIT_COST,
  });
}
