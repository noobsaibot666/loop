import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const { device_id, user_id, free_used = 0, donation_credits = 0, credits = 0 } = body;
  if (!device_id && !user_id) return json({ error: "device_id or user_id required" }, { status: 400 });

  if (user_id) {
    await supabaseRequest(env, "user_credits", {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ user_id, free_used, credits: credits || donation_credits }),
    });
    return json({ ok: true, user_id, free_used, credits: credits || donation_credits });
  }

  await supabaseRequest(env, "device_usage", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({ device_id, free_used, donation_credits }),
  });

  return json({ ok: true, device_id, free_used, donation_credits });
}
