import { json, supabaseRequest } from "../_utils.js";
import { buildQuarterLeaderboard, deriveBadges, getQuarterWindow } from "../../shared/quarterly.js";
import { buildSharedRiders } from "../../shared/account.js";

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
      `messenger_runs?user_id=eq.${encodeURIComponent(userId)}&status=eq.finished&select=id,manifest_id,finished_at,finish_seconds&order=finished_at.desc`,
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
  const cityBreakdown = [...proofsByCity.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([city_name, proof_count]) => ({
      city_name,
      proof_count,
    }));
  const bestFinish = runs
    .map((run) => Number(run.finish_seconds || 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)[0] || null;

  const riderName = profile?.rider_name || proofs[0]?.rider_name || "Rider";

  const runManifestIds = [...new Set((runs || []).map((run) => run.manifest_id).filter(Boolean))];
  let runManifests = [];
  if (runManifestIds.length) {
    runManifests = await supabaseRequest(
      env,
      `messenger_manifests?id=in.(${runManifestIds.map((id) => encodeURIComponent(id)).join(",")})&select=id,city_name,manifest_title,ghost_seconds`,
      { method: "GET" }
    ).catch(() => []);
  }

  const challengeEntries = await supabaseRequest(
    env,
    `messenger_challenge_entries?user_id=eq.${encodeURIComponent(userId)}&select=challenge_id,user_id,manifest_id,joined_at&order=joined_at.desc`,
    { method: "GET" }
  ).catch(() => []);

  const challengeIds = [...new Set((challengeEntries || []).map((entry) => entry.challenge_id).filter(Boolean))];
  const manifestIds = [...new Set((challengeEntries || []).map((entry) => entry.manifest_id).filter(Boolean))];

  let allEntries = [];
  let manifests = [];
  let rivalProfiles = [];

  if (challengeIds.length) {
    allEntries = await supabaseRequest(
      env,
      `messenger_challenge_entries?challenge_id=in.(${challengeIds.map((id) => encodeURIComponent(id)).join(",")})&select=challenge_id,user_id,manifest_id,joined_at`,
      { method: "GET" }
    ).catch(() => []);
  }

  if (manifestIds.length) {
    manifests = await supabaseRequest(
      env,
      `messenger_manifests?id=in.(${manifestIds.map((id) => encodeURIComponent(id)).join(",")})&select=id,city_name`,
      { method: "GET" }
    ).catch(() => []);
  }

  const rivalIds = [...new Set((allEntries || []).map((entry) => entry.user_id).filter((id) => id && id !== userId))];
  if (rivalIds.length) {
    rivalProfiles = await supabaseRequest(
      env,
      `user_profiles?user_id=in.(${rivalIds.map((id) => encodeURIComponent(id)).join(",")})&select=user_id,rider_name`,
      { method: "GET" }
    ).catch(() => []);
  }

  const sharedRiders = buildSharedRiders({
    userId,
    allEntries: allEntries || [],
    challenges: [],
    manifests: manifests || [],
    proofs: [
      ...proofs,
      ...(rivalProfiles || []).map((profileRow) => ({
        user_id: profileRow.user_id,
        rider_name: profileRow.rider_name,
      })),
    ],
  });

  const lastProofAt = proofs[0]?.created_at ? new Date(proofs[0].created_at).getTime() : 0;
  const lastRunAt = runs[0]?.finished_at ? new Date(runs[0].finished_at).getTime() : 0;
  const lastActiveAt = Math.max(lastProofAt, lastRunAt) || null;
  const recentRuns = runs.slice(0, 6).map((run) => {
    const manifest = (runManifests || []).find((item) => item.id === run.manifest_id);
    const ghostSeconds = typeof manifest?.ghost_seconds === "number" ? manifest.ghost_seconds : null;
    return {
      id: run.id,
      finished_at: run.finished_at,
      finish_seconds: run.finish_seconds,
      city_name: manifest?.city_name || "",
      manifest_title: manifest?.manifest_title || "Manifest",
      ghost_seconds: ghostSeconds,
      ghost_delta: ghostSeconds !== null && typeof run.finish_seconds === "number" ? run.finish_seconds - ghostSeconds : null,
    };
  });

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
      shared_challenges: challengeIds.length,
      rivals: sharedRiders.length,
      last_active_at: lastActiveAt ? new Date(lastActiveAt).toISOString() : null,
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
    recent_rivals: sharedRiders.slice(0, 6),
    recent_runs: recentRuns,
    city_breakdown: cityBreakdown,
  });
}
