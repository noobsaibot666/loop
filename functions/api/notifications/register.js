import {getAuthUser, json, parseJSON, supabaseRequest} from '../../_utils.js';

export async function onRequest({request, env}) {
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});

  const user = await getAuthUser(env, request);
  if (!user?.id) return json({error: 'login required'}, {status: 401});

  const body = await parseJSON(request);
  const {token, platform} = body ?? {};

  if (!token || !platform)
    return json({error: 'token and platform required'}, {status: 400});
  if (platform !== 'ios' && platform !== 'android')
    return json({error: 'invalid platform'}, {status: 400});

  await supabaseRequest(env, 'push_tokens', {
    method: 'POST',
    headers: {Prefer: 'resolution=merge-duplicates'},
    body: JSON.stringify({
      user_id: user.id,
      token,
      platform,
      updated_at: new Date().toISOString(),
    }),
  });

  return json({ok: true});
}
