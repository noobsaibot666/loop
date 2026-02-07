import { json, parseJSON, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const device_id = body.device_id;
  const user_id = body.user_id;
  if (!device_id && !user_id) return json({ error: "device_id or user_id required" }, { status: 400 });

  if (user_id) {
    const creditRows = await supabaseRequest(
      env,
      `user_credits?user_id=eq.${encodeURIComponent(user_id)}&select=user_id,credits,free_used`,
      { method: "GET" }
    );
    const usage = creditRows?.[0] || { user_id, credits: 0, free_used: 0 };
    return json({
      user_id,
      free_used: usage.free_used || 0,
      donation_credits: usage.credits || 0,
      free_remaining: Math.max(0, 3 - (usage.free_used || 0)),
      credits_remaining: usage.credits || 0,
    });
  }

  let usage = { device_id, free_used: 0, donation_credits: 0 };
  if (device_id) {
    const rows = await supabaseRequest(
      env,
      `device_usage?device_id=eq.${encodeURIComponent(device_id)}&select=device_id,free_used,donation_credits`,
      { method: "GET" }
    );
    usage = rows?.[0] || usage;
  }

  return json({
    ...usage,
    free_remaining: Math.max(0, 3 - usage.free_used),
    credits_remaining: usage.donation_credits || 0,
  });
}
