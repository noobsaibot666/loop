import {json, parseJSON, requireEnv} from '../_utils.js';

async function handleCityRequest(request, env) {
  try {
    const body = await parseJSON(request);
    const city = String(body.city || '').trim();
    const location = String(body.location || '').trim();
    const note = String(body.note || '').trim();
    const email = String(body.email || '').trim();

    if (!city && !location) {
      return json({error: 'city or location required'}, {status: 400});
    }

    const url = requireEnv(env, 'SUPABASE_URL');
    const key = requireEnv(env, 'SUPABASE_SERVICE_ROLE_KEY');
    const response = await fetch(`${url}/rest/v1/city_requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        requested_city: city,
        requested_location: location,
        note,
        requester_email: email,
        status: 'new',
      }),
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {raw: text};
      }
    }

    if (!response.ok) {
      return json(
        {
          error:
            data?.message ||
            data?.error ||
            response.statusText ||
            'Could not save city request',
        },
        {status: response.status},
      );
    }

    return json({ok: true, request: data?.[0] || null});
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not save city request',
      },
      {status: 500},
    );
  }
}

export function onRequestPost({request, env}) {
  return handleCityRequest(request, env);
}

export function onRequest({request, env}) {
  if (request.method !== 'POST') {
    return json({error: 'method not allowed'}, {status: 405});
  }
  return handleCityRequest(request, env);
}
