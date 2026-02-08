import { json, parseJSON, supabaseRequest, getAuthUser } from "../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const { device_id, loop_point, distance, unit, terrain, surface, vibe } = body;
  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || "";
  if (!device_id) return json({ error: "device_id required" }, { status: 400 });

  await supabaseRequest(env, "saved_setups", {
    method: "POST",
    body: JSON.stringify({
      device_id,
      user_id: user_id || null,
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
