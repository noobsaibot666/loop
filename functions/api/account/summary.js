import { getAuthUser, isAdminEmail, json, supabaseRequest } from "../../_utils.js";
import { buildAlleycatHistory, buildChallengeHistory, buildSharedRiders } from "../../../shared/account.js";
import { buildQuarterLeaderboard, deriveBadges, getQuarterWindow, isInWindow } from "../../../shared/quarterly.js";
import { sanitizeMembershipForClient } from "../../../shared/community-membership.js";

export async function onRequest({ request, env }) {
  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  try {
  const quarter = getQuarterWindow();
  const [profileRows, bikeRows, stripePurchases, mobilePurchases, loopHistory, manifests, runs, challengeEntries, proofs, quarterProofs, quarterRuns, communityMembershipRows, creditRows] = await Promise.all([
    supabaseRequest(
      env,
      `user_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,rider_name,home_location,primary_bike_id,bike_name,bike_ratio,collaboration_note,collaboration_status,collaboration_requested_at`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `user_bikes?user_id=eq.${encodeURIComponent(user.id)}&select=id,bike_name,bike_ratio,is_default,sort_order&order=sort_order.asc,created_at.asc`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `stripe_sessions?user_id=eq.${encodeURIComponent(user.id)}&select=session_id,amount_cents,credits_to_grant,status,created_at&order=created_at.desc&limit=5`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `mobile_purchase_events?user_id=eq.${encodeURIComponent(user.id)}&status=eq.credited&select=event_id,amount_cents,credits_to_grant,status,purchased_at,created_at&order=created_at.desc&limit=5`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `loop_history?user_id=eq.${encodeURIComponent(user.id)}&select=id,loop_point,distance_km,unit,terrain,surface,vibe,route_url,bike_id,bike_name,bike_ratio,created_at&order=created_at.desc&limit=8`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_manifests?user_id=eq.${encodeURIComponent(user.id)}&select=id,city_name,manifest_title,difficulty,style,created_at,source_challenge_id,ghost_seconds`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_runs?user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,manifest_id,status,finish_seconds,finished_at,started_at,bike_id,bike_name,bike_ratio`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_challenge_entries?user_id=eq.${encodeURIComponent(user.id)}&select=id,challenge_id,user_id,manifest_id,joined_at`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_proof_posts?user_id=eq.${encodeURIComponent(user.id)}&select=id,user_id,run_id,manifest_id,checkpoint_id,checkpoint_name,location_label,public_url,is_public,city_name,created_at`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(quarter.end.toISOString())}&select=user_id,rider_name,city_name,created_at`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(quarter.end.toISOString())}&select=user_id,finished_at`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `community_memberships?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,plan_code,status,price_cents,currency,interval,current_period_end,cancel_at_period_end,discord_invite_url,discord_user_id,discord_username,discord_role_status,discord_access_granted_at,discord_access_revoked_at&limit=1`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `user_credits?user_id=eq.${encodeURIComponent(user.id)}&select=credits,free_used`,
      { method: "GET" }
    ).catch(() => []),
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
  const purchases = [
    ...((stripePurchases || []).map((purchase) => ({
      ...purchase,
      source: "web",
    })) || []),
    ...((mobilePurchases || []).map((purchase) => ({
      session_id: purchase.event_id,
      amount_cents: purchase.amount_cents || 0,
      credits_to_grant: purchase.credits_to_grant || 0,
      status: purchase.status || "credited",
      created_at: purchase.purchased_at || purchase.created_at,
      source: "mobile",
    })) || []),
  ]
    .sort((left, right) => String(right.created_at || "").localeCompare(String(left.created_at || "")))
    .slice(0, 5);
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
  const bikes = (bikeRows || []).map((bike, index) => ({
    id: bike.id,
    bike_name: bike.bike_name || "",
    bike_ratio: bike.bike_ratio || "",
    is_default: Boolean(
      bike.is_default ||
        (profileRows?.[0]?.primary_bike_id && bike.id === profileRows[0].primary_bike_id) ||
        (!bikeRows?.some((entry) => entry.is_default) && index === 0)
    ),
    sort_order: Number(bike.sort_order || index),
  }));
  const defaultBike = bikes.find((bike) => bike.is_default) || bikes[0] || null;

  const isAdmin = isAdminEmail(env, user.email || "");
  const userCredits = creditRows?.[0] || { credits: 0, free_used: 0 };
  const credits_remaining = isAdmin ? 9999 : userCredits.credits || 0;
  const unlimited_credits = isAdmin;

  return json({
    unlimited_credits,
    credits_remaining,
    profile: profileRows?.[0]
      ? {
          ...profileRows[0],
          primary_bike_id: profileRows[0].primary_bike_id || defaultBike?.id || null,
          bike_name: defaultBike?.bike_name || profileRows[0].bike_name || "",
          bike_ratio: defaultBike?.bike_ratio || profileRows[0].bike_ratio || "",
        }
      : {
          user_id: user.id,
          rider_name: "",
          home_location: "",
          primary_bike_id: defaultBike?.id || null,
          bike_name: defaultBike?.bike_name || "",
          bike_ratio: defaultBike?.bike_ratio || "",
          collaboration_note: "",
          collaboration_status: "",
          collaboration_requested_at: null,
        },
    bikes,
    purchases: purchases || [],
    community_membership: sanitizeMembershipForClient(communityMembershipRows?.[0] || null),
    alleycat: {
      manifests: userManifests.length,
      runs: userRuns.length,
      finished_runs: userRuns.filter((run) => run.status === "finished").length,
      challenges: userChallenges.length,
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
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Summary unavailable" }, { status: 500 });
  }
}
