import { json, requireAdmin, supabaseRequest } from "../../_utils.js";
import { buildQuarterLeaderboard, getQuarterWindow } from "../../../shared/quarterly.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });
  const quarter = getQuarterWindow();

  const [credits, stripeSessions, manifests, runs, challenges, proofs, quarterProofs, quarterRuns] = await Promise.all([
    supabaseRequest(env, "user_credits?select=user_id,credits,free_used", { method: "GET" }),
    supabaseRequest(env, "stripe_sessions?select=session_id,status,amount_cents&order=created_at.desc&limit=5", { method: "GET" }),
    supabaseRequest(env, "messenger_manifests?select=id", { method: "GET" }),
    supabaseRequest(env, "messenger_runs?select=id,status", { method: "GET" }),
    supabaseRequest(env, "messenger_challenges?select=id", { method: "GET" }),
    supabaseRequest(
      env,
      "messenger_proof_posts?select=id,rider_name,city_name,checkpoint_name,is_public,created_at,public_url,storage_path&order=created_at.desc&limit=12",
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(quarter.end.toISOString())}&select=user_id,rider_name,city_name,created_at`,
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(quarter.end.toISOString())}&select=user_id,finished_at`,
      { method: "GET" }
    ),
  ]);
  const quarterLeaderboard = buildQuarterLeaderboard({
    proofs: quarterProofs || [],
    finishedRuns: quarterRuns || [],
  });

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
    recent_proofs: proofs || [],
    quarter: {
      label: quarter.label,
      leaders: quarterLeaderboard.slice(0, 3),
    },
  });
}
