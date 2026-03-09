import { json, parseJSON, supabaseRequest, getAuthUser, isAdminEmail } from "../../_utils.js";

export async function onRequest({ request, env }) {
  await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || "";
  if (!user_id) return json({ error: "login required" }, { status: 401 });
  const isAdmin = isAdminEmail(env, authUser?.email || "");
  if (isAdmin) {
    return json({
      allowed: true,
      free_used: 0,
      donation_credits: 9999,
      credits_remaining: 9999,
      is_admin: true,
      unlimited_credits: true,
    });
  }

  // Prefer atomic consume via SQL function to prevent race conditions.
  try {
    const rpcRows = await supabaseRequest(env, "rpc/consume_user_credit", {
      method: "POST",
      body: JSON.stringify({
        p_user_id: user_id,
        p_free_limit: 3,
      }),
    });
    const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
    if (row && typeof row.allowed === "boolean") {
      return json({
        allowed: row.allowed,
        free_used: row.free_used || 0,
        donation_credits: row.credits_remaining || 0,
        credits_remaining: row.credits_remaining || 0,
      });
    }
  } catch {
    // Fall back to legacy flow until SQL migration is applied.
  }

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
