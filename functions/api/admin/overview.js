import { json, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const [credits, stripeSessions, manifests, runs, challenges] = await Promise.all([
    supabaseRequest(env, "user_credits?select=user_id,credits,free_used", { method: "GET" }),
    supabaseRequest(env, "stripe_sessions?select=session_id,status,amount_cents&order=created_at.desc&limit=5", { method: "GET" }),
    supabaseRequest(env, "messenger_manifests?select=id", { method: "GET" }),
    supabaseRequest(env, "messenger_runs?select=id,status", { method: "GET" }),
    supabaseRequest(env, "messenger_challenges?select=id", { method: "GET" }),
  ]);

  return json({
    ok: true,
    admin_email: admin.email || "",
    metrics: {
      riders_with_credits: (credits || []).length,
      total_paid_credits: (credits || []).reduce((sum, row) => sum + (row.credits || 0), 0),
      alleycat_manifests: manifests?.length || 0,
      alleycat_runs: runs?.length || 0,
      finished_runs: (runs || []).filter((run) => run.status === "finished").length,
      shared_challenges: challenges?.length || 0,
    },
    recent_sessions: stripeSessions || [],
  });
}
