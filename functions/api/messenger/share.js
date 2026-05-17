import {json, parseJSON, getAuthUser, supabaseRequest} from '../../_utils.js';
import {deriveChallengeStatus} from '../../../shared/challenges.js';
import {
  consumeMessengerCredits,
  createChallengeCode,
  getManifest,
  getChallengeByCode,
  getChallengeEntries,
  MESSENGER_TABLES,
} from './_helpers.js';

export async function onRequest({request, env}) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || '';
  if (!userId) return json({error: 'login required'}, {status: 401});

  if (body?.code) {
    const challenge = await getChallengeByCode(
      env,
      String(body.code).trim().toUpperCase(),
    );
    if (!challenge) return json({error: 'share code not found'}, {status: 404});
    const challengeEntriesForStatus = await getChallengeEntries(
      env,
      challenge.id,
    );
    const challengeStatusRows = [];
    for (const entry of challengeEntriesForStatus || []) {
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
      challengeStatusRows.push({
        user_id: entry.user_id,
        status: bestRun ? 'finished' : 'open',
        best_seconds: bestRun?.finish_seconds || null,
      });
    }
    const joinStatus = deriveChallengeStatus(challenge, challengeStatusRows);

    const existingEntries = challengeEntriesForStatus;
    const existingEntry = existingEntries.find(
      entry => entry.user_id === userId,
    );
    if (existingEntry) {
      const existingManifest = await getManifest(
        env,
        existingEntry.manifest_id,
      );
      return json({
        manifest_id: existingEntry.manifest_id,
        manifest: existingManifest?.manifest || null,
        source_code: challenge.code,
        challenge_id: challenge.id,
        reused: true,
      });
    }

    if (joinStatus === 'expired') {
      return json({error: 'share code expired'}, {status: 410});
    }
    if (joinStatus === 'finished') {
      return json({error: 'challenge already closed'}, {status: 409});
    }

    const sourceManifest = await getManifest(env, challenge.manifest_id);
    if (!sourceManifest)
      return json({error: 'source manifest missing'}, {status: 404});

    const creditResult = await consumeMessengerCredits(
      env,
      userId,
      3,
      authUser?.email || '',
    );
    if (!creditResult.ok) {
      return creditResult.response;
    }

    const clonedManifestId = crypto.randomUUID();
    const rows = await supabaseRequest(env, MESSENGER_TABLES.manifests, {
      method: 'POST',
      headers: {Prefer: 'return=representation'},
      body: JSON.stringify({
        id: clonedManifestId,
        user_id: userId,
        source_challenge_id: challenge.id,
        city_slug: sourceManifest.city_slug,
        city_name: sourceManifest.city_name,
        difficulty: sourceManifest.difficulty,
        style: sourceManifest.style,
        manifest_title: sourceManifest.manifest_title,
        estimated_minutes: sourceManifest.estimated_minutes,
        ghost_seconds: sourceManifest.ghost_seconds,
        checkpoint_count: sourceManifest.checkpoint_count,
        manifest: sourceManifest.manifest,
      }),
    });

    await supabaseRequest(env, MESSENGER_TABLES.challengeEntries, {
      method: 'POST',
      headers: {Prefer: 'return=minimal'},
      body: JSON.stringify({
        challenge_id: challenge.id,
        user_id: userId,
        manifest_id: clonedManifestId,
      }),
    });

    return json({
      manifest_id: rows?.[0]?.id || clonedManifestId,
      manifest: sourceManifest.manifest,
      source_code: challenge.code,
      challenge_id: challenge.id,
    });
  }

  const manifestId = body?.manifest_id;
  if (!manifestId) return json({error: 'manifest_id required'}, {status: 400});

  const manifest = await getManifest(env, manifestId);
  if (!manifest || manifest.user_id !== userId) {
    return json({error: 'manifest not found'}, {status: 404});
  }

  if (manifest.source_challenge_id) {
    const existingChallenge = await supabaseRequest(
      env,
      `${MESSENGER_TABLES.challenges}?id=eq.${encodeURIComponent(manifest.source_challenge_id)}&select=*`,
      {method: 'GET'},
    );
    const challenge = existingChallenge?.[0];
    if (challenge) {
      return json({
        challenge_id: challenge.id,
        code: challenge.code,
        reused: true,
      });
    }
  }

  let code = createChallengeCode();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await getChallengeByCode(env, code);
    if (!existing) break;
    code = createChallengeCode();
  }

  const rows = await supabaseRequest(env, MESSENGER_TABLES.challenges, {
    method: 'POST',
    headers: {Prefer: 'return=representation'},
    body: JSON.stringify({
      creator_user_id: userId,
      manifest_id: manifestId,
      code,
    }),
  });

  const challengeId = rows?.[0]?.id;
  if (challengeId) {
    await supabaseRequest(
      env,
      `${MESSENGER_TABLES.manifests}?id=eq.${encodeURIComponent(manifestId)}`,
      {
        method: 'PATCH',
        headers: {Prefer: 'return=minimal'},
        body: JSON.stringify({source_challenge_id: challengeId}),
      },
    );

    await supabaseRequest(env, MESSENGER_TABLES.challengeEntries, {
      method: 'POST',
      headers: {Prefer: 'return=minimal,resolution=merge-duplicates'},
      body: JSON.stringify({
        challenge_id: challengeId,
        user_id: userId,
        manifest_id: manifestId,
      }),
    });
  }

  return json({
    challenge_id: challengeId,
    code,
  });
}
