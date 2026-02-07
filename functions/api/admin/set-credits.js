import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const { device_id, free_used = 0, donation_credits = 0 } = body;
  if (!device_id) return json({ error: "device_id required" }, { status: 400 });

  await supabaseRequest(env, "device_usage", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({ device_id, free_used, donation_credits }),
  });

  return json({ ok: true, device_id, free_used, donation_credits });
}
