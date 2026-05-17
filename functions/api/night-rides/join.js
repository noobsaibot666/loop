import {
  json,
  parseJSON,
  getAuthUser,
  isAdminEmail,
  supabaseRequest,
} from '../../_utils.js';
import {NIGHT_RIDE_CREW_JOIN_COST} from '../../../shared/night-rides.js';

const riderLabelFromEmail = (email = '') => {
  const [local] = String(email || '').split('@');
  return local ? local.slice(0, 24) : 'rider';
};

const consumeNightRideCredit = async (env, user) => {
  if (isAdminEmail(env, user?.email || '')) {
    return {
      ok: true,
      credits_remaining: 9999,
      unlimited_credits: true,
      is_admin: true,
    };
  }
  const creditRows = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,credits,free_used`,
    {method: 'GET'},
  ).catch(() => []);
  const usage = creditRows?.[0] || {user_id: user.id, credits: 0, free_used: 0};
  let credits = usage.credits || 0;
  let freeUsed = usage.free_used || 0;
  if (freeUsed < 3) {
    freeUsed += 1;
  } else if (credits >= NIGHT_RIDE_CREW_JOIN_COST) {
    credits -= NIGHT_RIDE_CREW_JOIN_COST;
  } else {
    return {ok: false, error: 'Night Ride needs 1 credit or a free loop left.'};
  }
  await supabaseRequest(env, 'user_credits', {
    method: 'POST',
    headers: {Prefer: 'resolution=merge-duplicates'},
    body: JSON.stringify({user_id: user.id, credits, free_used: freeUsed}),
  });
  return {
    ok: true,
    credits_remaining: credits,
    free_used: freeUsed,
    unlimited_credits: false,
    is_admin: false,
  };
};

export async function onRequest({request, env}) {
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});
  const user = await getAuthUser(env, request);
  if (!user?.id) return json({error: 'login required'}, {status: 401});
  const body = await parseJSON(request);
  const code = String(body.code || '')
    .trim()
    .toUpperCase();
  if (!code) return json({error: 'code required'}, {status: 400});

  const sessionRows = await supabaseRequest(
    env,
    `night_ride_sessions?share_code=eq.${encodeURIComponent(code)}&select=*`,
    {method: 'GET'},
  );
  const session = sessionRows?.[0] || null;
  if (!session)
    return json({error: 'night ride code not found'}, {status: 404});
  if (session.status !== 'open')
    return json({error: 'night ride is closed'}, {status: 409});
  if (session.session_type !== 'crew')
    return json(
      {error: 'single night rides do not take join codes'},
      {status: 409},
    );

  const existingRows = await supabaseRequest(
    env,
    `night_ride_participants?session_id=eq.${encodeURIComponent(session.id)}&user_id=eq.${encodeURIComponent(user.id)}&select=id`,
    {method: 'GET'},
  ).catch(() => []);
  const alreadyJoined = Boolean(existingRows?.length);
  let creditResult = {
    credits_remaining: null,
    is_admin: false,
    unlimited_credits: false,
  };
  if (!alreadyJoined) {
    const consume = await consumeNightRideCredit(env, user);
    if (!consume.ok) return json({error: consume.error}, {status: 402});
    creditResult = consume;
    const profileRows = await supabaseRequest(
      env,
      `user_profiles?user_id=eq.${encodeURIComponent(user.id)}&select=rider_name`,
      {method: 'GET'},
    ).catch(() => []);
    const profile = profileRows?.[0] || null;
    await supabaseRequest(env, 'night_ride_participants', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        session_id: session.id,
        user_id: user.id,
        rider_name:
          profile?.rider_name?.trim() || riderLabelFromEmail(user.email || ''),
        joined_via: 'code',
        credits_spent: NIGHT_RIDE_CREW_JOIN_COST,
      }),
    });
  }

  return json({
    ok: true,
    session,
    already_joined: alreadyJoined,
    route_url: session.route_url,
    credits_remaining: creditResult.credits_remaining,
    is_admin: creditResult.is_admin,
    unlimited_credits: creditResult.unlimited_credits,
  });
}
