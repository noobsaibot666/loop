import {
  getAuthUser,
  isAdminEmail,
  json,
  parseJSON,
  requireEnv,
  supabaseRequest,
} from '../_utils.js';
import {
  buildFallbackLoopWaypoints,
  buildGoogleMapsLoopUrl,
  buildLoopCandidateProfiles,
  buildLoopCandidateRequest,
  evaluateLoopCandidate,
  hasUsableLoopWaypoints,
  selectBestLoopCandidate,
} from '../../shared/loop-quality.js';

const checkLoopCredit = async (env, authUser) => {
  if (!authUser?.id) return {allowed: false, error: 'login required'};
  if (isAdminEmail(env, authUser.email || '')) return {allowed: true};
  const rows = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${encodeURIComponent(authUser.id)}&select=credits,free_used`,
    {method: 'GET'},
  ).catch(() => []);
  const usage = rows?.[0] || {credits: 0, free_used: 0};
  if (Math.max(0, 3 - (usage.free_used || 0)) > 0 || (usage.credits || 0) >= 1)
    return {allowed: true};
  return {
    allowed: false,
    error: 'Free loops are spent. Add credits and keep moving.',
  };
};

const consumeLoopCredit = async (env, authUser) => {
  if (isAdminEmail(env, authUser.email || '')) {
    return {ok: true, credits_remaining: 9999, unlimited_credits: true};
  }
  try {
    const result = await supabaseRequest(env, 'rpc/consume_user_credit', {
      method: 'POST',
      body: JSON.stringify({p_user_id: authUser.id, p_free_limit: 3}),
    });
    const row = Array.isArray(result) ? result[0] : result;
    if (row?.allowed === false)
      return {
        ok: false,
        error: 'Free loops are spent. Add credits and keep moving.',
      };
    return {ok: true, credits_remaining: row?.credits_remaining ?? 0};
  } catch {
    return {ok: false, error: 'Credit consumption failed.'};
  }
};

export async function onRequest({request, env}) {
  try {
    const body = await parseJSON(request);
    const {
      coords,
      distance_km,
      seed,
      terrain,
      surface,
      vibe,
      difficulty,
      style,
    } = body;
    if (!coords || coords.length !== 2)
      return json({error: 'coords required'}, {status: 400});

    const key = requireEnv(env, 'ORS_API_KEY');
    const authUser = await getAuthUser(env, request);
    if (!authUser?.id) return json({error: 'login required'}, {status: 401});
    const preCheck = await checkLoopCredit(env, authUser);
    if (!preCheck.allowed) return json({error: preCheck.error}, {status: 402});
    const requestedDistanceKm = Math.max(1, Number(distance_km || 0));
    const origin = {lng: Number(coords[0]), lat: Number(coords[1])};
    if (!Number.isFinite(origin.lng) || !Number.isFinite(origin.lat)) {
      return json({error: 'coords must be numeric'}, {status: 400});
    }
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
        difficulty,
        style,
        seed: candidateSeed,
        profile,
      });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      let response;
      let data;
      try {
        response = await fetch(
          'https://api.openrouteservice.org/v2/directions/cycling-regular',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: key,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          },
        );
        const raw = await response.text();
        data = raw ? JSON.parse(raw) : {};
      } catch (error) {
        clearTimeout(timeout);
        return {
          ok: false,
          status: error?.name === 'AbortError' ? 504 : 502,
          error:
            error?.name === 'AbortError'
              ? 'ORS request timed out'
              : 'ORS request failed',
          detail: error instanceof Error ? error.message : null,
          profile,
          candidateIndex,
          candidateSeed,
        };
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: data?.error?.message || data?.message || 'ORS error',
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

    const runCandidateBatch = async (reroll = false, strict = false) => {
      const profiles = buildLoopCandidateProfiles({
        terrain,
        surface,
        vibe,
        difficulty,
        style,
        reroll,
        strict,
      });
      return Promise.all(
        profiles.map((profile, candidateIndex) =>
          requestCandidate(profile, candidateIndex),
        ),
      );
    };

    const firstPass = await runCandidateBatch(false);
    const successfulFirstPass = firstPass.filter(candidate => candidate.ok);
    let candidates = successfulFirstPass;
    if (!successfulFirstPass.some(candidate => candidate.evaluation.valid)) {
      const secondPass = await runCandidateBatch(true);
      candidates = [
        ...successfulFirstPass,
        ...secondPass.filter(candidate => candidate.ok),
      ];
    }
    if (!candidates.some(candidate => candidate.evaluation.valid)) {
      const strictPass = await runCandidateBatch(true, true);
      candidates = [
        ...candidates,
        ...strictPass.filter(candidate => candidate.ok),
      ];
    }

    if (!candidates.length) {
      const failed = firstPass.find(candidate => !candidate.ok);
      return json(
        {
          error: failed?.error || 'ORS error',
          detail: failed?.detail || null,
        },
        {status: failed?.status || 502},
      );
    }

    // ORS succeeded — consume the credit now, before returning any result.
    const creditResult = await consumeLoopCredit(env, authUser);
    if (!creditResult.ok)
      return json({error: creditResult.error}, {status: 402});

    const bestCandidate = selectBestLoopCandidate(candidates);
    if (!bestCandidate) {
      const fallbackWaypoints = buildFallbackLoopWaypoints(
        origin,
        requestedDistanceKm,
        seed,
      );
      return json({
        route_url: buildGoogleMapsLoopUrl(origin, fallbackWaypoints),
        sampled_waypoints: fallbackWaypoints,
        quality_score: 0,
        overlap_ratio: 1,
        candidate_seed: Number(seed || 1),
        candidate_index: -1,
        candidate_profile: 'synthetic-fallback',
        credits_remaining: creditResult.credits_remaining,
        route_debug: {
          synthetic: true,
          reason: 'no_candidate',
        },
      });
    }
    const resolvedWaypoints = hasUsableLoopWaypoints(
      bestCandidate.evaluation.sampledWaypoints,
    )
      ? bestCandidate.evaluation.sampledWaypoints
      : buildFallbackLoopWaypoints(
          origin,
          requestedDistanceKm,
          bestCandidate.candidateSeed,
        );
    if (
      !bestCandidate.evaluation.valid &&
      (!hasUsableLoopWaypoints(resolvedWaypoints) ||
        bestCandidate.evaluation.metrics.overlapRatio >= 0.66 ||
        bestCandidate.evaluation.metrics.corridorDuplication >= 0.74 ||
        bestCandidate.evaluation.metrics.dominantLegRatio >= 0.76)
    ) {
      return json({
        ...bestCandidate.data,
        route_url: buildGoogleMapsLoopUrl(origin, resolvedWaypoints),
        quality_score: bestCandidate.evaluation.score,
        overlap_ratio: bestCandidate.evaluation.metrics.overlapRatio,
        candidate_seed: bestCandidate.candidateSeed,
        candidate_index: bestCandidate.candidateIndex,
        candidate_profile: 'synthetic-fallback',
        credits_remaining: creditResult.credits_remaining,
        route_debug: {
          ...bestCandidate.evaluation.metrics,
          synthetic: true,
          reason: 'weak_candidate',
        },
        sampled_waypoints: resolvedWaypoints,
      });
    }
    return json({
      ...bestCandidate.data,
      route_url: buildGoogleMapsLoopUrl(origin, resolvedWaypoints),
      quality_score: bestCandidate.evaluation.score,
      overlap_ratio: bestCandidate.evaluation.metrics.overlapRatio,
      candidate_seed: bestCandidate.candidateSeed,
      candidate_index: bestCandidate.candidateIndex,
      candidate_profile: bestCandidate.profile.label,
      credits_remaining: creditResult.credits_remaining,
      route_debug: bestCandidate.evaluation.metrics,
      sampled_waypoints: resolvedWaypoints,
    });
  } catch (err) {
    return json(
      {error: err instanceof Error ? err.message : 'Loop generation failed'},
      {status: 500},
    );
  }
}
