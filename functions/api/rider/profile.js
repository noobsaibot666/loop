import {json, parseJSON} from '../../_utils.js';
import {onRequest as handleRiderProfile} from '../rider-profile.js';

export async function onRequest(context) {
  const {request} = context;
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});

  const body = await parseJSON(request);
  const userId = String(body?.user_id || '').trim();
  if (!userId) return json({error: 'user_id required'}, {status: 400});

  const nextUrl = new URL(request.url);
  nextUrl.searchParams.set('user_id', userId);
  const nextRequest = new Request(nextUrl.toString(), {
    method: 'GET',
    headers: request.headers,
  });

  return handleRiderProfile({...context, request: nextRequest});
}
