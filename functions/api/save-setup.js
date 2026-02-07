import { json, parseJSON, supabaseRequest } from "../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const { device_id, loop_point, distance, unit, terrain, surface, vibe } = body;
  if (!device_id) return json({ error: "device_id required" }, { status: 400 });

  await supabaseRequest(env, "saved_setups", {
    method: "POST",
    body: JSON.stringify({
      device_id,
      loop_point,
      distance,
      unit,
      terrain,
      surface,
      vibe,
    }),
  });

  return json({ ok: true });
}
