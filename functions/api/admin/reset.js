import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const device_id = body.device_id;

  if (device_id) {
    await supabaseRequest(env, `device_usage?device_id=eq.${encodeURIComponent(device_id)}`, {
      method: "DELETE",
    });
    return json({ ok: true, device_id });
  }

  await supabaseRequest(env, "device_usage?device_id=neq.", { method: "DELETE" });
  return json({ ok: true, cleared: "all" });
}
