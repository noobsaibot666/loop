import { json, parseJSON, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const device_id = body.device_id;
  if (!device_id) return json({ error: "device_id required" }, { status: 400 });

  const rows = await supabaseRequest(env, `device_usage?device_id=eq.${encodeURIComponent(device_id)}&select=device_id,free_used,donation_credits`, {
    method: "GET",
  });

  const usage = rows?.[0] || { device_id, free_used: 0, donation_credits: 0 };

  let allowed = false;
  let free_used = usage.free_used;
  let donation_credits = usage.donation_credits;

  if (free_used < 5) {
    free_used += 1;
    allowed = true;
  } else if (donation_credits > 0) {
    donation_credits -= 1;
    allowed = true;
  }

  if (!allowed) {
    return json({ allowed: false, free_used, donation_credits });
  }

  await supabaseRequest(env, "device_usage", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates" },
    body: JSON.stringify({ device_id, free_used, donation_credits }),
  });

  return json({ allowed: true, free_used, donation_credits });
}
