import { json, parseJSON, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const device_id = body.device_id;
  if (!device_id) return json({ error: "device_id required" }, { status: 400 });

  const rows = await supabaseRequest(env, `device_usage?device_id=eq.${encodeURIComponent(device_id)}&select=device_id,free_used,donation_credits`, {
    method: "GET",
  });

  const usage = rows?.[0] || { device_id, free_used: 0, donation_credits: 0 };
  return json({
    ...usage,
    free_remaining: Math.max(0, 5 - usage.free_used),
  });
}
