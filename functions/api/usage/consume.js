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

    let allowed = false;
    let free_used = usage.free_used || 0;
    let credits_remaining = usage.credits || 0;

    if (free_used < 3) {
      free_used += 1;
      allowed = true;
    } else if (credits_remaining > 0) {
      credits_remaining -= 1;
      allowed = true;
    }

    if (!allowed) {
      return json({ allowed: false, free_used, donation_credits: credits_remaining, credits_remaining });
    }

    await supabaseRequest(env, "user_credits", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ user_id, credits: credits_remaining, free_used }),
    });

    return json({
      allowed: true,
      free_used,
      donation_credits: credits_remaining,
      credits_remaining,
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

  let allowed = false;
  let free_used = usage.free_used;
  let credits_remaining = usage.donation_credits;

  if (free_used < 3) {
    free_used += 1;
    allowed = true;
  } else if (credits_remaining > 0) {
    credits_remaining -= 1;
    allowed = true;
  }

  if (!allowed) {
    return json({ allowed: false, free_used, donation_credits: credits_remaining, credits_remaining });
  }

  if (device_id) {
    await supabaseRequest(env, "device_usage", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ device_id, free_used, donation_credits: credits_remaining }),
    });
  }

  return json({
    allowed: true,
    free_used,
    donation_credits: credits_remaining,
    credits_remaining,
  });
}
