import {json, parseJSON, getAuthUser, supabaseRequest} from '../../_utils.js';
import {
  getManifest,
  getRun,
  getRunCheckins,
  MESSENGER_TABLES,
} from './_helpers.js';
import {
  ALLEYCAT_CHECKIN_RADIUS_METERS,
  distanceBetweenMeters,
} from '../../../shared/messenger.js';

export async function onRequest({request, env}) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || '';
  if (!userId) return json({error: 'login required'}, {status: 401});

  const {run_id: runId, checkpoint_id: checkpointId, lat, lng} = body;
  if (!runId || !checkpointId) {
    return json({error: 'run_id and checkpoint_id required'}, {status: 400});
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return json({error: 'location required for check-in'}, {status: 400});
  }

  const run = await getRun(env, runId);
  if (!run || run.user_id !== userId)
    return json({error: 'run not found'}, {status: 404});
  if (run.status !== 'active')
    return json({error: 'run is not active'}, {status: 400});

  const manifest = await getManifest(env, run.manifest_id);
  const checkpoints = manifest?.manifest?.checkpoints || [];
  const checkpoint = checkpoints.find(item => item.id === checkpointId);
  if (!checkpoint)
    return json({error: 'checkpoint not part of manifest'}, {status: 400});
  const checkins = await getRunCheckins(env, runId);
  const existing = checkins.find(item => item.checkpoint_id === checkpointId);
  if (existing) {
    return json(
      {
        ok: true,
        already_checked_in: true,
        checkpoint_id: checkpointId,
        completed_ids: checkins.map(row => row.checkpoint_id),
        message: `${checkpoint.name} is already checked in.`,
      },
      {status: 200},
    );
  }

  const distanceMeters = distanceBetweenMeters(
    {lat, lng},
    {lat: checkpoint.lat, lng: checkpoint.lng},
  );

  if (distanceMeters > ALLEYCAT_CHECKIN_RADIUS_METERS) {
    return json(
      {
        error: `Move closer to ${checkpoint.name} before checking in. You are ${distanceMeters}m away.`,
        distance_meters: distanceMeters,
        max_distance_meters: ALLEYCAT_CHECKIN_RADIUS_METERS,
        meters_to_move: distanceMeters - ALLEYCAT_CHECKIN_RADIUS_METERS,
      },
      {status: 400},
    );
  }

  await supabaseRequest(env, MESSENGER_TABLES.checkins, {
    method: 'POST',
    headers: {
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      run_id: runId,
      checkpoint_id: checkpointId,
      rider_lat: lat,
      rider_lng: lng,
      distance_meters: distanceMeters,
    }),
  });

  const updatedCheckins = await getRunCheckins(env, runId);
  return json({
    ok: true,
    run_id: runId,
    checkpoint_id: checkpointId,
    completed_ids: updatedCheckins.map(row => row.checkpoint_id),
    checkins: updatedCheckins.map(row => ({
      checkpoint_id: row.checkpoint_id,
      checked_in_at: row.checked_in_at,
      distance_meters: row.distance_meters,
    })),
    distance_meters: distanceMeters,
  });
}
