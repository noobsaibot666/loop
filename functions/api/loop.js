import { getAuthUser, json, parseJSON, requireEnv, supabaseRequest } from "../_utils.js";
import {
  buildLoopCandidateProfiles,
  buildLoopCandidateRequest,
  evaluateLoopCandidate,
  selectBestLoopCandidate,
} from "../../shared/loop-quality.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const { coords, distance_km, seed, terrain, surface, vibe } = body;
  if (!coords || coords.length !== 2) return json({ error: "coords required" }, { status: 400 });

  const key = requireEnv(env, "ORS_API_KEY");
  const authUser = await getAuthUser(env, request);
  const requestedDistanceKm = Math.max(1, Number(distance_km || 0));
  const origin = { lng: Number(coords[0]), lat: Number(coords[1]) };
  let recentRoutes = [];
  if (authUser?.id) {
    try {
      recentRoutes =
        (await supabaseRequest(
          env,
          `loop_history?user_id=eq.${encodeURIComponent(authUser.id)}&select=route_url,distance_km,created_at&order=created_at.desc&limit=10`,
        )) || [];
    } catch {
      recentRoutes = [];
    }
  }

  const requestCandidate = async (profile, candidateIndex) => {
    const candidateSeed = Number(seed || 1) + (profile.seedOffset || 0);
    const payload = buildLoopCandidateRequest({
      origin,
      targetDistanceKm: requestedDistanceKm,
      terrain,
      surface,
      vibe,
      seed: candidateSeed,
      profile,
    });
    const response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: key,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error?.message || data?.message || "ORS error",
        detail: data,
        profile,
        candidateIndex,
        candidateSeed,
      };
    }

    const evaluation = evaluateLoopCandidate({
      routeData: data,
      origin,
      targetDistanceKm: requestedDistanceKm,
      terrain,
      surface,
      vibe,
      recentRoutes,
    });

    return {
      ok: true,
      data,
      evaluation,
      profile,
      candidateIndex,
      candidateSeed,
    };
  };

  const runCandidateBatch = async (reroll = false) => {
    const profiles = buildLoopCandidateProfiles({ terrain, surface, vibe, reroll });
    return Promise.all(profiles.map((profile, candidateIndex) => requestCandidate(profile, candidateIndex)));
  };

  const firstPass = await runCandidateBatch(false);
  const successfulFirstPass = firstPass.filter((candidate) => candidate.ok);
  let candidates = successfulFirstPass;
  if (!successfulFirstPass.some((candidate) => candidate.evaluation.valid)) {
    const secondPass = await runCandidateBatch(true);
    candidates = [...successfulFirstPass, ...secondPass.filter((candidate) => candidate.ok)];
  }

  if (!candidates.length) {
    const failed = firstPass.find((candidate) => !candidate.ok);
    return json(
      {
        error: failed?.error || "ORS error",
        detail: failed?.detail || null,
      },
      { status: failed?.status || 502 },
    );
  }

  const bestCandidate = selectBestLoopCandidate(candidates);
  if (!bestCandidate) {
    return json({ error: "loop generation failed" }, { status: 502 });
  }
  return json({
    ...bestCandidate.data,
    quality_score: bestCandidate.evaluation.score,
    overlap_ratio: bestCandidate.evaluation.metrics.overlapRatio,
    candidate_seed: bestCandidate.candidateSeed,
    candidate_index: bestCandidate.candidateIndex,
    candidate_profile: bestCandidate.profile.label,
    route_debug: bestCandidate.evaluation.metrics,
    sampled_waypoints: bestCandidate.evaluation.sampledWaypoints,
  });
}
