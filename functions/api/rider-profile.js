import { json, supabaseRequest } from "../_utils.js";
import { buildQuarterLeaderboard, deriveBadges, getQuarterWindow } from "../../shared/quarterly.js";

const uniqueCount = (values = []) => new Set(values.filter(Boolean)).size;

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user_id") || "").trim();
  if (!userId) return json({ error: "user_id required" }, { status: 400 });

  const quarter = getQuarterWindow();

  const [profileRows, publicProofs, finishedRuns, quarterProofs, quarterRuns] = await Promise.all([
    supabaseRequest(
      env,
      `user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,rider_name,home_location,bike_name,bike_ratio`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_proof_posts?user_id=eq.${encodeURIComponent(
        userId
      )}&is_public=eq.true&archived_at=is.null&select=id,user_id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at,bike_name,bike_ratio&order=created_at.desc&limit=18`,
      { method: "GET" }
    ).catch(async () =>
      (await supabaseRequest(
        env,
        `messenger_proof_posts?user_id=eq.${encodeURIComponent(
          userId
        )}&is_public=eq.true&select=id,user_id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at,bike_name,bike_ratio&order=created_at.desc&limit=18`,
        { method: "GET" }
      ).catch(() => [])) || []
    ),
    supabaseRequest(
      env,
      `messenger_runs?user_id=eq.${encodeURIComponent(userId)}&status=eq.finished&select=id,finished_at,finish_seconds&order=finished_at.desc`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(
        quarter.end.toISOString()
      )}&select=user_id,rider_name,city_name,created_at`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(
        quarter.end.toISOString()
      )}&select=user_id,finished_at`,
      { method: "GET" }
    ).catch(() => []),
  ]);

  const profile = profileRows?.[0] || null;
  const proofs = publicProofs || [];
  const runs = finishedRuns || [];
  const quarterBoard = buildQuarterLeaderboard({ proofs: quarterProofs || [], finishedRuns: quarterRuns || [] });
  const quarterEntry = quarterBoard.find((entry) => entry.user_id === userId) || null;
  const proofsByCity = new Map();
  for (const proof of proofs) {
    const key = proof.city_name || "Unknown city";
    proofsByCity.set(key, (proofsByCity.get(key) || 0) + 1);
  }
  const topCity = [...proofsByCity.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const bestFinish = runs
    .map((run) => Number(run.finish_seconds || 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)[0] || null;

  const riderName = profile?.rider_name || proofs[0]?.rider_name || "Rider";

  return json({
    profile: {
      user_id: userId,
      rider_name: riderName,
      home_location: profile?.home_location || proofs[0]?.city_name || "",
      bike_name: profile?.bike_name || proofs[0]?.bike_name || "",
      bike_ratio: profile?.bike_ratio || proofs[0]?.bike_ratio || "",
    },
    stats: {
      public_proofs: proofs.length,
      finished_runs: runs.length,
      cities: uniqueCount(proofs.map((proof) => proof.city_name)),
      top_city: topCity,
      best_finish_seconds: bestFinish,
      quarter_rank: quarterEntry?.rank || null,
      quarter_public_proofs: quarterEntry?.public_proofs || 0,
      quarter_finishes: quarterEntry?.finished_runs || 0,
    },
    badges: deriveBadges({
      quarterStats: quarterEntry
        ? {
            rank: quarterEntry.rank,
            public_proofs: quarterEntry.public_proofs,
            finished_runs: quarterEntry.finished_runs,
          }
        : null,
      proofs,
      manifests: [],
      challenges: [],
    }),
    recent_proofs: proofs,
  });
}
