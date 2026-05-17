import {json, parseJSON, getAuthUser} from '../../_utils.js';
import {
  getChallengeById,
  getManifest,
  getRun,
  getRunCheckins,
  getRunProofs,
} from './_helpers.js';

export async function onRequest({request, env}) {
  const body =
    request.method === 'GET'
      ? Object.fromEntries(new URL(request.url).searchParams.entries())
      : await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || '';
  if (!userId) return json({error: 'login required'}, {status: 401});

  const runId = body?.run_id;
  if (!runId) return json({error: 'run_id required'}, {status: 400});

  const run = await getRun(env, runId);
  if (!run || run.user_id !== userId)
    return json({error: 'run not found'}, {status: 404});

  const manifest = await getManifest(env, run.manifest_id);
  const checkins = await getRunCheckins(env, runId);
  const proofs = await getRunProofs(env, runId);
  const challenge = manifest?.source_challenge_id
    ? await getChallengeById(env, manifest.source_challenge_id)
    : null;

  return json({
    run: {
      id: run.id,
      status: run.status,
      started_at: run.started_at,
      finished_at: run.finished_at,
      finish_seconds: run.finish_seconds,
      bike_id: run.bike_id || null,
      bike_name: run.bike_name || null,
      bike_ratio: run.bike_ratio || null,
      completed_ids: checkins.map(row => row.checkpoint_id),
      checkins: checkins.map(row => ({
        checkpoint_id: row.checkpoint_id,
        checked_in_at: row.checked_in_at,
        distance_meters: row.distance_meters,
      })),
    },
    manifest_id: manifest?.id || run.manifest_id,
    manifest: manifest?.manifest || null,
    proofs: proofs || [],
    challenge: challenge
      ? {
          id: challenge.id,
          code: challenge.code,
        }
      : null,
  });
}
