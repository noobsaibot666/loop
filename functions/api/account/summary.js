import { getAuthUser, json, supabaseRequest } from "../../_utils.js";
import { buildAlleycatHistory, buildChallengeHistory, buildSharedRiders } from "../../../shared/account.js";
import { buildQuarterLeaderboard, deriveBadges, getQuarterWindow, isInWindow } from "../../../shared/quarterly.js";

export async function onRequest({ request, env }) {
  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  const quarter = getQuarterWindow();
  const [purchases, loopHistory, manifests, runs, challengeEntries, proofs, quarterProofs, quarterRuns] = await Promise.all([
    supabaseRequest(
      env,
      `stripe_sessions?user_id=eq.${encodeURIComponent(user.id)}&select=session_id,amount_cents,credits_to_grant,status,created_at&order=created_at.desc&limit=5`,
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      `loop_history?user_id=eq.${encodeURIComponent(user.id)}&select=id,loop_point,distance_km,unit,terrain,surface,vibe,route_url,created_at&order=created_at.desc&limit=8`,
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      `messenger_manifests?user_id=eq.${encodeURIComponent(user.id)}&select=id,city_name,manifest_title,difficulty,style,created_at,source_challenge_id,ghost_seconds`,
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      `messenger_runs?user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,manifest_id,status,finish_seconds,finished_at,started_at`,
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      `messenger_challenge_entries?user_id=eq.${encodeURIComponent(user.id)}&select=id,challenge_id,user_id,manifest_id,joined_at`,
      { method: "GET" }
    ),
    supabaseRequest(
      env,
      `messenger_proof_posts?user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,is_public,city_name,manifest_id,created_at`,
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

  const userProofs = proofs || [];
  const userRuns = runs || [];
  const userManifests = manifests || [];
  const userChallengeEntries = challengeEntries || [];
  const challengeIds = [...new Set(userChallengeEntries.map((entry) => entry.challenge_id))];
  const userChallenges = challengeIds.length
    ? (
        await Promise.all(
          challengeIds.map((challengeId) =>
            supabaseRequest(
              env,
              `messenger_challenges?id=eq.${encodeURIComponent(challengeId)}&select=id,code,creator_user_id,claimed_by_user_id,created_at`,
              { method: "GET" }
            )
          )
        )
      )
        .flat()
        .filter(Boolean)
    : [];
  const challengeEntriesByChallenge = challengeIds.length
    ? (
        await Promise.all(
          challengeIds.map((challengeId) =>
            supabaseRequest(
              env,
              `messenger_challenge_entries?challenge_id=eq.${encodeURIComponent(challengeId)}&select=id,challenge_id,user_id,manifest_id,joined_at`,
              { method: "GET" }
            )
          )
        )
      ).flat()
    : [];
  const challengeManifestIds = [...new Set(challengeEntriesByChallenge.map((entry) => entry.manifest_id))];
  const challengeManifests = challengeManifestIds.length
    ? (
        await Promise.all(
          challengeManifestIds.map((manifestId) =>
            supabaseRequest(
              env,
              `messenger_manifests?id=eq.${encodeURIComponent(manifestId)}&select=id,city_name,manifest_title,difficulty,style,created_at,source_challenge_id,ghost_seconds`,
              { method: "GET" }
            )
          )
        )
      )
        .flat()
        .filter(Boolean)
    : [];
  const challengeRuns = challengeManifestIds.length
    ? (
        await Promise.all(
          challengeManifestIds.map((manifestId) =>
            supabaseRequest(
              env,
              `messenger_runs?manifest_id=eq.${encodeURIComponent(manifestId)}&select=id,user_id,manifest_id,status,finish_seconds,finished_at,started_at`,
              { method: "GET" }
            )
          )
        )
      ).flat()
    : [];
  const challengeProofNames = challengeIds.length
    ? (
        await Promise.all(
          challengeIds.map((challengeId) =>
            supabaseRequest(
              env,
              `messenger_proof_posts?manifest_id=in.(${challengeEntriesByChallenge
                .filter((entry) => entry.challenge_id === challengeId)
                .map((entry) => entry.manifest_id)
                .join(",")})&select=user_id,rider_name`,
              { method: "GET" }
            ).catch(() => [])
          )
        )
      ).flat()
    : [];
  const quarterLeaderboard = buildQuarterLeaderboard({
    proofs: quarterProofs || [],
    finishedRuns: quarterRuns || [],
  });
  const userQuarterRuns = userRuns.filter((run) => run.status === "finished" && isInWindow(run.finished_at, quarter.start, quarter.end));
  const userQuarterProofs = userProofs.filter((proof) => proof.is_public && isInWindow(proof.created_at, quarter.start, quarter.end));
  const challengeManifestSet = new Set(userManifests.filter((manifest) => manifest.source_challenge_id).map((manifest) => manifest.id));
  const badges = deriveBadges({
    quarterStats: {
      rank: quarterLeaderboard.find((entry) => entry.user_id === user.id)?.rank || null,
      finished_runs: userQuarterRuns.length,
    },
    proofs: userProofs,
    manifests: userManifests,
    challenges: userRuns.map((run) => ({
      status: run.status,
      source_challenge_id: challengeManifestSet.has(run.manifest_id),
    })),
  });
  const userQuarterRank = quarterLeaderboard.find((entry) => entry.user_id === user.id)?.rank || null;

  return json({
    purchases: purchases || [],
    alleycat: {
      manifests: userManifests.length,
      runs: userRuns.length,
      finished_runs: userRuns.filter((run) => run.status === "finished").length,
      challenges: challenges?.length || 0,
      proofs: userProofs.length,
      public_proofs: userProofs.filter((proof) => proof.is_public).length,
    },
    quarter: {
      label: quarter.label,
      public_proofs: userQuarterProofs.length,
      finished_runs: userQuarterRuns.length,
      rank: userQuarterRank,
      total_ranked_riders: quarterLeaderboard.length,
      leaders: quarterLeaderboard.slice(0, 3),
    },
    badges,
    loop_history: loopHistory || [],
    alleycat_history: buildAlleycatHistory({
      manifests: challengeManifests.length ? [...userManifests, ...challengeManifests.filter((item) => !userManifests.find((own) => own.id === item.id))] : userManifests,
      runs: challengeRuns.length ? [...userRuns, ...challengeRuns.filter((item) => !userRuns.find((own) => own.id === item.id))] : userRuns,
      proofs: userProofs,
    }),
    challenge_history: buildChallengeHistory({
      userId: user.id,
      entries: userChallengeEntries,
      allEntries: challengeEntriesByChallenge,
      challenges: userChallenges,
      manifests: challengeManifests,
      runs: challengeRuns,
    }),
    shared_riders: buildSharedRiders({
      userId: user.id,
      allEntries: challengeEntriesByChallenge,
      challenges: userChallenges,
      manifests: challengeManifests,
      proofs: challengeProofNames,
    }),
  });
}
