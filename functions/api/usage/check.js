import { json, parseJSON, supabaseRequest, getAuthUser } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || "";
  if (!user_id) return json({ error: "login required" }, { status: 401 });

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
