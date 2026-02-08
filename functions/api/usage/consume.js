import { json, parseJSON, supabaseRequest, getAuthUser } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || "";
  if (!user_id) return json({ error: "auth required" }, { status: 401 });

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

  return json({ allowed: false, free_used: 0, donation_credits: 0, credits_remaining: 0 });
}
