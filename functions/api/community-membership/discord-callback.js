import {supabaseAdminAuthRequest, supabaseRequest} from '../../_utils.js';
import {
  COMMUNITY_INVITE_URL,
  isMembershipActive,
} from '../../../shared/community-membership.js';
import {sendCommunityDiscordLinkedEmail} from '../../../shared/community-email.js';
import {recordCommunityEvent} from '../../../shared/community-events.js';
import {
  addDiscordRole,
  exchangeDiscordCode,
  formatDiscordUsername,
  getDiscordConfig,
  getDiscordUser,
  joinDiscordGuild,
} from '../../../shared/discord-community.js';

const redirectToAccount = (request, outcome) => {
  const url = new URL('/account', request.url);
  url.searchParams.set('community', outcome);
  return Response.redirect(url.toString(), 302);
};

const getMembershipRecipient = async (env, userId) => {
  if (!userId) return {email: '', riderName: ''};
  const authUser = await supabaseAdminAuthRequest(
    env,
    `admin/users/${encodeURIComponent(userId)}`,
    {
      method: 'GET',
    },
  ).catch(() => null);
  const profileRows = await supabaseRequest(
    env,
    `user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=rider_name&limit=1`,
    {method: 'GET'},
  ).catch(() => []);
  return {
    email: authUser?.user?.email || '',
    riderName:
      profileRows?.[0]?.rider_name?.trim() ||
      authUser?.user?.email?.split('@')[0] ||
      'Rider',
  };
};

export async function onRequest({request, env}) {
  if (request.method !== 'GET') {
    return new Response('method not allowed', {status: 405});
  }

  const url = new URL(request.url);
  const errorCode = url.searchParams.get('error');
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (errorCode) return redirectToAccount(request, 'discord-denied');
  if (!code || !state) return redirectToAccount(request, 'discord-error');

  const rows = await supabaseRequest(
    env,
    `community_memberships?discord_link_state=eq.${encodeURIComponent(state)}&select=*&limit=1`,
    {method: 'GET'},
  ).catch(() => []);
  const membership = rows?.[0] || null;
  if (!membership) return redirectToAccount(request, 'discord-expired');

  const stateExpiry = membership.discord_link_state_expires_at
    ? new Date(membership.discord_link_state_expires_at).getTime()
    : 0;
  if (!stateExpiry || Number.isNaN(stateExpiry) || stateExpiry < Date.now()) {
    await supabaseRequest(env, 'community_memberships', {
      method: 'POST',
      headers: {Prefer: 'resolution=merge-duplicates'},
      body: JSON.stringify({
        ...membership,
        discord_link_state: null,
        discord_link_state_expires_at: null,
        discord_last_error: 'Discord link expired',
      }),
    }).catch(() => null);
    return redirectToAccount(request, 'discord-expired');
  }

  if (!isMembershipActive(membership)) {
    return redirectToAccount(request, 'discord-inactive');
  }

  try {
    const config = getDiscordConfig(env, request);
    const nowIso = new Date().toISOString();
    const token = await exchangeDiscordCode(config, code);
    const discordUser = await getDiscordUser(token.access_token);
    await joinDiscordGuild(config, discordUser.id, token.access_token);
    await addDiscordRole(config, discordUser.id);

    const nextMembership = {
      ...membership,
      discord_user_id: discordUser.id,
      discord_username: formatDiscordUsername(discordUser),
      discord_linked_at: membership.discord_linked_at || nowIso,
      discord_role_status: 'granted',
      discord_access_granted_at: nowIso,
      discord_access_revoked_at: null,
      discord_link_state: null,
      discord_link_state_expires_at: null,
      discord_last_error: null,
      discord_invite_url: membership.discord_invite_url || COMMUNITY_INVITE_URL,
    };

    await supabaseRequest(env, 'community_memberships', {
      method: 'POST',
      headers: {Prefer: 'resolution=merge-duplicates'},
      body: JSON.stringify(nextMembership),
    });
    await recordCommunityEvent(env, {
      user_id: membership.user_id,
      event_type: 'discord_linked',
      membership_status: nextMembership.status,
      discord_role_status: nextMembership.discord_role_status,
      details: {
        discord_user_id: discordUser.id,
        discord_username: nextMembership.discord_username,
      },
    }).catch(() => null);

    const recipient = await getMembershipRecipient(env, membership.user_id);
    try {
      await sendCommunityDiscordLinkedEmail({
        env,
        request,
        membership: nextMembership,
        user: recipient,
      });
      await recordCommunityEvent(env, {
        user_id: membership.user_id,
        event_type: 'email_discord_linked_sent',
        membership_status: nextMembership.status,
        discord_role_status: nextMembership.discord_role_status,
        details: {email: recipient.email || null},
      }).catch(() => null);
    } catch (error) {
      await recordCommunityEvent(env, {
        user_id: membership.user_id,
        event_type: 'email_discord_linked_failed',
        membership_status: nextMembership.status,
        discord_role_status: nextMembership.discord_role_status,
        details: {
          email: recipient.email || null,
          error:
            error instanceof Error
              ? error.message
              : 'Discord linked email failed',
        },
      }).catch(() => null);
    }

    return redirectToAccount(request, 'discord-linked');
  } catch (error) {
    await recordCommunityEvent(env, {
      user_id: membership.user_id,
      event_type: 'discord_link_failed',
      membership_status: membership.status,
      discord_role_status: 'link_required',
      details: {
        error: error instanceof Error ? error.message : 'Discord link failed',
      },
    }).catch(() => null);
    await supabaseRequest(env, 'community_memberships', {
      method: 'POST',
      headers: {Prefer: 'resolution=merge-duplicates'},
      body: JSON.stringify({
        ...membership,
        discord_link_state: null,
        discord_link_state_expires_at: null,
        discord_role_status: 'link_required',
        discord_last_error:
          error instanceof Error ? error.message : 'Discord link failed',
      }),
    }).catch(() => null);
    return redirectToAccount(request, 'discord-error');
  }
}
