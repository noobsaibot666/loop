import {json, parseJSON, getAuthUser, supabaseRequest} from '../../_utils.js';
import {getRun, MESSENGER_TABLES} from './_helpers.js';

export async function onRequest({request, env}) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || '';
  if (!userId) return json({error: 'login required'}, {status: 401});

  const runId = String(body.run_id || '').trim();
  if (!runId) return json({error: 'run_id required'}, {status: 400});

  const run = await getRun(env, runId);
  if (!run || run.user_id !== userId)
    return json({error: 'run not found'}, {status: 404});
  if (run.status !== 'active')
    return json({error: 'run is not active'}, {status: 400});

  const rows = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.runs}?id=eq.${encodeURIComponent(runId)}`,
    {
      method: 'PATCH',
      headers: {Prefer: 'return=representation'},
      body: JSON.stringify({
        status: 'abandoned',
        finished_at: new Date().toISOString(),
      }),
    },
  );

  return json({ok: true, run: rows?.[0] || null});
}
