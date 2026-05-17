import {json, parseJSON, getAuthUser, supabaseRequest} from '../../_utils.js';
import {
  getChallengeById,
  getChallengeEntries,
  getManifest,
  MESSENGER_TABLES,
} from './_helpers.js';
import {
  buildChallengeSummary,
  deriveChallengeStatus,
} from '../../../shared/challenges.js';

export async function onRequest({request, env}) {
  const body =
    request.method === 'GET'
      ? Object.fromEntries(new URL(request.url).searchParams.entries())
      : await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || '';
  if (!userId) return json({error: 'login required'}, {status: 401});

  let challengeId = body?.challenge_id || '';
  const manifestId = body?.manifest_id || '';

  if (!challengeId && manifestId) {
    const manifest = await getManifest(env, manifestId);
    challengeId = manifest?.source_challenge_id || '';
  }

  if (!challengeId) return json({leaderboard: [], challenge: null});

  const challenge = await getChallengeById(env, challengeId);
  if (!challenge) return json({leaderboard: [], challenge: null});

  const entries = await getChallengeEntries(env, challengeId);
  const manifestIds = entries.map(entry => entry.manifest_id);
  const proofNames = manifestIds.length
    ? await supabaseRequest(
        env,
        `${MESSENGER_TABLES.proofs}?manifest_id=in.(${manifestIds.map(id => encodeURIComponent(id)).join(',')})&select=user_id,rider_name`,
        {method: 'GET'},
      ).catch(() => [])
    : [];
  const riderNames = new Map();
  for (const proof of proofNames || []) {
    if (proof?.user_id && proof?.rider_name && !riderNames.has(proof.user_id))
      riderNames.set(proof.user_id, proof.rider_name);
  }
  const leaderboard = [];

  for (const entry of entries) {
    const manifest = await getManifest(env, entry.manifest_id);
    const runs = await supabaseRequest(
      env,
      `${MESSENGER_TABLES.runs}?manifest_id=eq.${encodeURIComponent(entry.manifest_id)}&user_id=eq.${encodeURIComponent(
        entry.user_id,
      )}&order=finish_seconds.asc.nullslast,started_at.asc&select=*`,
      {method: 'GET'},
    );
    const bestRun =
      (runs || []).find(
        run =>
          run.status === 'finished' && typeof run.finish_seconds === 'number',
      ) || null;
    const riderName =
      riderNames.get(entry.user_id) ||
      (entry.user_id === challenge.creator_user_id
        ? 'Creator'
        : `Rider ${String(entry.user_id).slice(0, 4)}`);
    leaderboard.push({
      user_id: entry.user_id,
      manifest_id: entry.manifest_id,
      joined_at: entry.joined_at,
      rider_name: riderName,
      city_name: manifest?.city_name || manifest?.manifest?.city || '',
      best_seconds: bestRun?.finish_seconds || null,
      best_run_id: bestRun?.id || null,
      status: bestRun ? 'finished' : 'open',
      is_creator: entry.user_id === challenge.creator_user_id,
    });
  }

  leaderboard.sort((left, right) => {
    if (left.best_seconds === null && right.best_seconds === null)
      return left.joined_at.localeCompare(right.joined_at);
    if (left.best_seconds === null) return 1;
    if (right.best_seconds === null) return -1;
    return left.best_seconds - right.best_seconds;
  });

  return json({
    challenge: {
      id: challenge.id,
      code: challenge.code,
      creator_user_id: challenge.creator_user_id,
      created_at: challenge.created_at,
      status: deriveChallengeStatus(challenge, leaderboard),
    },
    leaderboard,
    summary: buildChallengeSummary({challenge, leaderboard, userId}),
  });
}
