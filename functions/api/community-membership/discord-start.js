import {getAuthUser, json, supabaseRequest} from '../../_utils.js';
import {
  createDiscordLinkState,
  isMembershipActive,
} from '../../../shared/community-membership.js';
import {
  buildDiscordAuthorizeUrl,
  getDiscordConfig,
} from '../../../shared/discord-community.js';

export async function onRequest({request, env}) {
  if (request.method !== 'POST')
    return json({error: 'method not allowed'}, {status: 405});

  const authUser = await getAuthUser(env, request);
  if (!authUser?.id) return json({error: 'login required'}, {status: 401});

  const rows = await supabaseRequest(
    env,
    `community_memberships?user_id=eq.${encodeURIComponent(authUser.id)}&select=*&limit=1`,
    {method: 'GET'},
  ).catch(() => []);
  const membership = rows?.[0] || null;
  if (!membership) return json({error: 'membership not found'}, {status: 404});
  if (!isMembershipActive(membership)) {
    return json(
      {error: 'membership inactive', access_state: 'inactive'},
      {status: 403},
    );
  }

  const {state, expiresAt} = createDiscordLinkState();
  const config = getDiscordConfig(env, request);
  const nextMembership = {
    ...membership,
    discord_link_state: state,
    discord_link_state_expires_at: expiresAt,
    discord_last_error: null,
  };

  await supabaseRequest(env, 'community_memberships', {
    method: 'POST',
    headers: {Prefer: 'resolution=merge-duplicates'},
    body: JSON.stringify(nextMembership),
  });

  return json({
    ok: true,
    url: buildDiscordAuthorizeUrl(config, state),
  });
}
