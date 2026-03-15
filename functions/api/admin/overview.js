import { json, requireAdmin, supabaseRequest } from "../../_utils.js";
import { buildQuarterLeaderboard, getQuarterWindow } from "../../../shared/quarterly.js";

function getPackReadiness(pack, countData, districtsByPack) {
  const checkpointCount = countData?.checkpoint_count || 0;
  const activeCheckpointCount = countData?.active_checkpoint_count || 0;
  const districtCount = districtsByPack.get(pack.id)?.size || 0;
  const copyReady = Boolean(pack.route_note && pack.finish_label && pack.safety_note);
  if (pack.is_active) return "live";
  if (copyReady && activeCheckpointCount >= 4 && districtCount >= 3) return "ready";
  if (copyReady || checkpointCount > 0) return "review";
  return "draft";
}

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });
  const quarter = getQuarterWindow();
  const now = Date.now();
  const last7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [credits, stripeSessions, manifests, runs, challenges, recentProofs, allProofs, quarterProofs, quarterRuns, packs, checkpoints, moderationHistory] = await Promise.all([
    supabaseRequest(env, "user_credits?select=user_id,credits,free_used", { method: "GET" }),
    supabaseRequest(env, "stripe_sessions?select=session_id,status,amount_cents,created_at&order=created_at.desc&limit=20", { method: "GET" }),
    supabaseRequest(env, "messenger_manifests?select=id,city_name,created_at", { method: "GET" }),
    supabaseRequest(env, "messenger_runs?select=id,status", { method: "GET" }),
    supabaseRequest(env, "messenger_challenges?select=id", { method: "GET" }),
    supabaseRequest(
      env,
      "messenger_proof_posts?select=id,rider_name,city_name,checkpoint_name,is_public,created_at,public_url,storage_path&order=created_at.desc&limit=12",
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      "messenger_proof_posts?select=id,user_id,rider_name,city_name,is_public,archived_at,created_at",
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
    supabaseRequest(env, "city_packs?select=id,name,is_active,route_note,finish_label,safety_note", { method: "GET" }).catch(() => []),
    supabaseRequest(env, "city_checkpoints?select=pack_id,is_active,district", { method: "GET" }).catch(() => []),
    supabaseRequest(
      env,
      "moderation_action_history?select=id,admin_email,action,target_type,target_id,target_label,details,created_at&order=created_at.desc&limit=12",
      { method: "GET" }
    ).catch(() => []),
  ]);
  const quarterLeaderboard = buildQuarterLeaderboard({
    proofs: quarterProofs || [],
    finishedRuns: quarterRuns || [],
  });

  const proofs = allProofs || [];
  const recentSessions = stripeSessions || [];
  const counts = new Map();
  const districtsByPack = new Map();
  for (const checkpoint of checkpoints || []) {
    const current = counts.get(checkpoint.pack_id) || { checkpoint_count: 0, active_checkpoint_count: 0 };
    current.checkpoint_count += 1;
    if (checkpoint.is_active !== false) current.active_checkpoint_count += 1;
    counts.set(checkpoint.pack_id, current);
    if (checkpoint.district) {
      const districtSet = districtsByPack.get(checkpoint.pack_id) || new Set();
      districtSet.add(String(checkpoint.district).trim());
      districtsByPack.set(checkpoint.pack_id, districtSet);
    }
  }

  const packReadiness = (packs || []).map((pack) => ({
    name: pack.name,
    readiness: getPackReadiness(pack, counts.get(pack.id), districtsByPack),
  }));

  const cityPulseMap = new Map();
  for (const manifest of manifests || []) {
    const city = manifest.city_name || "Unknown city";
    const current = cityPulseMap.get(city) || { city_name: city, manifests: 0, proofs: 0, public_proofs: 0 };
    current.manifests += 1;
    cityPulseMap.set(city, current);
  }
  for (const proof of proofs) {
    const city = proof.city_name || "Unknown city";
    const current = cityPulseMap.get(city) || { city_name: city, manifests: 0, proofs: 0, public_proofs: 0 };
    current.proofs += 1;
    if (proof.is_public) current.public_proofs += 1;
    cityPulseMap.set(city, current);
  }
  const cityPulse = Array.from(cityPulseMap.values())
    .sort((a, b) => (b.public_proofs - a.public_proofs) || (b.manifests - a.manifests) || a.city_name.localeCompare(b.city_name))
    .slice(0, 8);

  const riderWatchMap = new Map();
  for (const proof of proofs) {
    const riderId = proof.user_id || proof.rider_name || proof.id;
    const current = riderWatchMap.get(riderId) || {
      rider_name: proof.rider_name || "Unknown rider",
      city_name: proof.city_name || "",
      proof_count: 0,
      hidden_count: 0,
      archived_count: 0,
      last_at: proof.created_at || "",
    };
    current.proof_count += 1;
    if (!proof.is_public) current.hidden_count += 1;
    if (proof.archived_at) current.archived_count += 1;
    if (!current.last_at || String(proof.created_at) > current.last_at) current.last_at = proof.created_at || current.last_at;
    riderWatchMap.set(riderId, current);
  }
  const abuseWatch = Array.from(riderWatchMap.values())
    .filter((row) => row.proof_count >= 3 || row.hidden_count > 0 || row.archived_count > 0)
    .sort((a, b) => (b.hidden_count - a.hidden_count) || (b.archived_count - a.archived_count) || (b.proof_count - a.proof_count))
    .slice(0, 6);

  const activeRuns = (runs || []).filter((run) => run.status === "active").length;
  const abandonedRuns = (runs || []).filter((run) => run.status === "abandoned").length;
  const finishedRuns = (runs || []).filter((run) => run.status === "finished").length;
  const checkoutFailures = recentSessions.filter((session) => !["checkout_created", "completed", "paid"].includes(String(session.status || "").toLowerCase())).length;
  const completionRate = runs?.length ? Math.round((finishedRuns / runs.length) * 100) : 0;
  const publicProofs = proofs.filter((proof) => proof.is_public).length;
  const hiddenProofs = proofs.filter((proof) => !proof.is_public).length;
  const archivedProofs = proofs.filter((proof) => proof.archived_at).length;
  const snapshots = [
    {
      label: "Last 7 days",
      manifests: (manifests || []).filter((item) => item.created_at && new Date(item.created_at) >= last7).length,
      proofs: proofs.filter((item) => item.created_at && new Date(item.created_at) >= last7).length,
      topups: recentSessions.filter((item) => item.created_at && new Date(item.created_at) >= last7).length,
    },
    {
      label: "Last 30 days",
      manifests: (manifests || []).filter((item) => item.created_at && new Date(item.created_at) >= last30).length,
      proofs: proofs.filter((item) => item.created_at && new Date(item.created_at) >= last30).length,
      topups: recentSessions.filter((item) => item.created_at && new Date(item.created_at) >= last30).length,
    },
  ];

  return json({
    ok: true,
    admin_email: admin.email || "",
    metrics: {
      riders_with_credits: (credits || []).length,
      total_paid_credits: (credits || []).reduce((sum, row) => sum + (row.credits || 0), 0),
      alleycat_manifests: manifests?.length || 0,
      alleycat_runs: runs?.length || 0,
      active_runs: activeRuns,
      abandoned_runs: abandonedRuns,
      finished_runs: finishedRuns,
      completion_rate: completionRate,
      shared_challenges: challenges?.length || 0,
      proof_posts: proofs.length,
      public_proofs: publicProofs,
      hidden_proofs: hiddenProofs,
      archived_proofs: archivedProofs,
      checkout_failures: checkoutFailures,
      live_city_packs: packReadiness.filter((pack) => pack.readiness === "live").length,
      ready_city_packs: packReadiness.filter((pack) => pack.readiness === "ready").length,
    },
    recent_sessions: recentSessions.slice(0, 5),
    recent_proofs: recentProofs || [],
    city_pulse: cityPulse,
    abuse_watch: abuseWatch,
    moderation_history: moderationHistory || [],
    ops_snapshots: snapshots,
    failure_signals: [
      { label: "Runs still active", value: activeRuns },
      { label: "Runs abandoned", value: abandonedRuns },
      { label: "Checkout failures", value: checkoutFailures },
      { label: "Hidden proofs", value: hiddenProofs },
      { label: "Archived proofs", value: archivedProofs },
      { label: "Ready city packs", value: packReadiness.filter((pack) => pack.readiness === "ready").length },
    ],
    quarter: {
      label: quarter.label,
      leaders: quarterLeaderboard.slice(0, 3),
    },
  });
}
