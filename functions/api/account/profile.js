import {getAuthUser, json, parseJSON, supabaseRequest} from '../../_utils.js';

const clean = (value, max = 80) =>
  String(value || '')
    .trim()
    .slice(0, max);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const toValidBikeId = value => {
  const id = String(value || '').trim();
  return UUID_RE.test(id) ? id : crypto.randomUUID();
};
const sanitizeBikes = input => {
  const raw = Array.isArray(input) ? input : [];
  const bikes = raw
    .map((bike, index) => ({
      id: toValidBikeId(bike?.id),
      bike_name: clean(bike?.bike_name, 60),
      bike_ratio: clean(bike?.bike_ratio, 40),
      is_default: Boolean(bike?.is_default),
      sort_order: index,
    }))
    .filter(bike => bike.bike_name || bike.bike_ratio)
    .slice(0, 6);
  if (!bikes.length) return [];
  const hasDefault = bikes.some(bike => bike.is_default);
  return bikes.map((bike, index) => ({
    ...bike,
    is_default: hasDefault ? bike.is_default : index === 0,
  }));
};

export async function onRequest({request, env}) {
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});

  const user = await getAuthUser(env, request);
  if (!user?.id) return json({error: 'login required'}, {status: 401});

  const body = await parseJSON(request);
  const submitCollaboration = Boolean(body?.collaboration_submit);
  const bikes = sanitizeBikes(body?.bikes);
  const defaultBike = bikes.find(bike => bike.is_default) || bikes[0] || null;
  const payload = {
    user_id: user.id,
    rider_name: clean(body?.rider_name, 40),
    home_location: clean(body?.home_location, 120),
    primary_bike_id: defaultBike?.id || null,
    bike_name: defaultBike?.bike_name || clean(body?.bike_name, 60),
    bike_ratio: defaultBike?.bike_ratio || clean(body?.bike_ratio, 40),
    avatar_url: body?.avatar_url ? clean(body.avatar_url, 500) : undefined,
    country: body?.country ? clean(body.country, 60) : undefined,
    age: body?.age
      ? Math.min(120, Math.max(1, Number(body.age) || 0)) || undefined
      : undefined,
    collaboration_note: clean(body?.collaboration_note, 600),
    collaboration_status: submitCollaboration
      ? 'pending'
      : clean(body?.collaboration_status, 20) || undefined,
    collaboration_requested_at: submitCollaboration
      ? new Date().toISOString()
      : body?.collaboration_requested_at || undefined,
    updated_at: new Date().toISOString(),
  };

  let rows;
  try {
    rows = await supabaseRequest(env, 'user_profiles', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
    });
    const existingBikeRows = await supabaseRequest(
      env,
      `user_bikes?user_id=eq.${encodeURIComponent(user.id)}&select=id`,
      {method: 'GET'},
    ).catch(() => []);
    const submittedIds = new Set(bikes.map(bike => bike.id));
    const staleBikeIds = (existingBikeRows || [])
      .map(bike => bike.id)
      .filter(id => id && !submittedIds.has(id));
    if (bikes.length) {
      await supabaseRequest(env, 'user_bikes', {
        method: 'POST',
        headers: {
          Prefer: 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify(
          bikes.map(bike => ({
            ...bike,
            user_id: user.id,
            updated_at: new Date().toISOString(),
          })),
        ),
      });
    }
    if (staleBikeIds.length) {
      await supabaseRequest(
        env,
        `user_bikes?user_id=eq.${encodeURIComponent(user.id)}&id=in.(${staleBikeIds.map(id => encodeURIComponent(id)).join(',')})`,
        {
          method: 'DELETE',
          headers: {
            Prefer: 'return=minimal',
          },
        },
      ).catch(() => null);
    }
    await supabaseRequest(
      env,
      `messenger_proof_posts?user_id=eq.${encodeURIComponent(user.id)}`,
      {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          rider_name: payload.rider_name || null,
          bike_name: payload.bike_name || null,
          bike_ratio: payload.bike_ratio || null,
        }),
      },
    ).catch(() => null);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not save profile.';
    const normalized = message.toLowerCase();
    if (
      normalized.includes('user_profiles') ||
      normalized.includes('primary_bike_id')
    ) {
      return json(
        {
          error:
            'Profile fields are not ready in Supabase yet. Apply user_profiles.sql first.',
        },
        {status: 500},
      );
    }
    if (normalized.includes('user_bikes')) {
      return json(
        {
          error:
            'Bike fields are not ready in Supabase yet. Apply user_bikes.sql first.',
        },
        {status: 500},
      );
    }
    return json({error: message}, {status: 500});
  }

  return json({
    ok: true,
    profile: rows?.[0] || null,
    bikes,
  });
}
