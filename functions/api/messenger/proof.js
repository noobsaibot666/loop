import {getAuthUser, json, parseJSON, supabaseRequest} from '../../_utils.js';
import {
  getManifest,
  getRun,
  getRunCheckins,
  getRunProofs,
  MESSENGER_TABLES,
} from './_helpers.js';

const riderLabelFromEmail = (email = '') => {
  const [local] = String(email || '').split('@');
  return local ? local.slice(0, 24) : 'rider';
};

export async function onRequest({request, env}) {
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});

  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || '';
  if (!userId) return json({error: 'login required'}, {status: 401});

  const {
    run_id: runId,
    checkpoint_id: checkpointId,
    storage_path: storagePath,
    public_url: publicUrl,
    is_public: isPublic,
    proof_type: proofType = 'photo',
    answer_text: answerText = null,
  } = body || {};

  if (proofType === 'answer' && (!runId || !checkpointId)) {
    return json({error: 'run_id and checkpoint_id required'}, {status: 400});
  }
  if (
    proofType !== 'answer' &&
    (!runId || !checkpointId || !storagePath || !publicUrl)
  ) {
    return json(
      {error: 'run_id, checkpoint_id, storage_path, and public_url required'},
      {status: 400},
    );
  }

  const run = await getRun(env, runId);
  if (!run || run.user_id !== userId)
    return json({error: 'run not found'}, {status: 404});

  const checkins = await getRunCheckins(env, runId);
  if (!checkins.some(row => row.checkpoint_id === checkpointId)) {
    return json(
      {error: 'check in at the checkpoint before posting proof'},
      {status: 400},
    );
  }
  const existingProofs = await getRunProofs(env, runId);
  const existingProof = existingProofs.find(
    row => row.checkpoint_id === checkpointId,
  );
  if (existingProof) {
    return json(
      {
        error: 'proof already uploaded for this checkpoint',
        proof: existingProof,
        proofs: existingProofs,
      },
      {status: 409},
    );
  }

  const manifest = await getManifest(env, run.manifest_id);
  const checkpoints = manifest?.manifest?.checkpoints || [];
  const checkpoint = checkpoints.find(item => item.id === checkpointId);
  if (!checkpoint)
    return json({error: 'checkpoint not part of manifest'}, {status: 400});
  const profileRows = await supabaseRequest(
    env,
    `user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=rider_name,bike_name,bike_ratio`,
    {method: 'GET'},
  ).catch(() => []);
  const profile = profileRows?.[0] || null;
  const riderName = profile?.rider_name?.trim()
    ? profile.rider_name.trim().slice(0, 40)
    : riderLabelFromEmail(authUser?.email || '');
  const bikeName = run?.bike_name || profile?.bike_name || null;
  const bikeRatio = run?.bike_ratio || profile?.bike_ratio || null;

  const isAnswerProof = proofType === 'answer';
  const basePayload = {
    user_id: userId,
    run_id: runId,
    manifest_id: run.manifest_id,
    checkpoint_id: checkpointId,
    checkpoint_name: checkpoint.name,
    city_slug: manifest?.city_slug || manifest?.manifest?.city_slug || '',
    city_name: manifest?.city_name || manifest?.manifest?.city || '',
    rider_name: riderName,
    media_type: isAnswerProof ? 'answer' : 'image',
    storage_path: storagePath || '',
    public_url: publicUrl || '',
    location_label: checkpoint.name,
    is_public: isAnswerProof ? false : isPublic !== false,
    proof_type: isAnswerProof ? 'answer' : 'photo',
    answer_text: isAnswerProof ? answerText || null : null,
  };

  let rows;
  try {
    rows = await supabaseRequest(env, MESSENGER_TABLES.proofs, {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        ...basePayload,
        bike_name: bikeName,
        bike_ratio: bikeRatio,
      }),
    });
  } catch {
    rows = await supabaseRequest(env, MESSENGER_TABLES.proofs, {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(basePayload),
    });
  }

  const proof = rows?.[0] || null;
  const proofs = await getRunProofs(env, runId);
  return json({
    ok: true,
    proof,
    proofs,
  });
}
