import { getAuthUser, json, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  const [purchases, manifests, runs, challenges] = await Promise.all([
    supabaseRequest(
      env,
      `stripe_sessions?user_id=eq.${encodeURIComponent(user.id)}&select=session_id,amount_cents,credits_to_grant,status,created_at&order=created_at.desc&limit=5`,
      { method: "GET" }
    ),
    supabaseRequest(env, `messenger_manifests?user_id=eq.${encodeURIComponent(user.id)}&select=id`, { method: "GET" }),
    supabaseRequest(env, `messenger_runs?user_id=eq.${encodeURIComponent(user.id)}&select=id,status`, { method: "GET" }),
    supabaseRequest(
      env,
      `messenger_challenge_entries?user_id=eq.${encodeURIComponent(user.id)}&select=id`,
      { method: "GET" }
    ),
  ]);

  return json({
    purchases: purchases || [],
    alleycat: {
      manifests: manifests?.length || 0,
      runs: runs?.length || 0,
      finished_runs: (runs || []).filter((run) => run.status === "finished").length,
      challenges: challenges?.length || 0,
    },
  });
}
