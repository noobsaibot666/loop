import {requireEnv} from '../functions/_utils.js';
import {
  COMMUNITY_CURRENCY,
  COMMUNITY_INTERVAL,
  COMMUNITY_PLAN_CODE,
  COMMUNITY_PRICE_CENTS,
  COMMUNITY_INVITE_URL,
  isMembershipActive,
} from './community-membership.js';

const DISCORD_API = 'https://discord.com/api/v10';

const resolveOrigin = (env, request) => {
  if (request?.url) return new URL(request.url).origin;
  if (env?.APP_URL) return env.APP_URL;
  if (env?.VITE_APP_URL) return env.VITE_APP_URL;
  return 'http://localhost:5173';
};

const toForm = payload =>
  Object.entries(payload)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

export const getDiscordConfig = (env, request) => {
  const clientId = requireEnv(env, 'DISCORD_CLIENT_ID');
  const clientSecret = requireEnv(env, 'DISCORD_CLIENT_SECRET');
  const botToken = requireEnv(env, 'DISCORD_BOT_TOKEN');
  const guildId = requireEnv(env, 'DISCORD_GUILD_ID');
  const roleId = requireEnv(env, 'DISCORD_COMMUNITY_ROLE_ID');
  const redirectUri =
    env.DISCORD_REDIRECT_URI ||
    `${resolveOrigin(env, request)}/api/community-membership/discord-callback`;
  const kickOnRevoke =
    String(env.DISCORD_KICK_ON_REVOKE || '').toLowerCase() === 'true';
  return {
    clientId,
    clientSecret,
    botToken,
    guildId,
    roleId,
    redirectUri,
    kickOnRevoke,
  };
};

const discordRequest = async (
  path,
  {method = 'GET', token, headers = {}, body} = {},
) => {
  const response = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body,
  });
  if (response.status === 204) return null;
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {raw: text};
    }
  }
  if (!response.ok)
    throw new Error(
      data?.message || `Discord request failed: ${response.status}`,
    );
  return data;
};

const discordBotRequest = async (path, config, options = {}) =>
  discordRequest(path, {
    ...options,
    token: config.botToken,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bot ${config.botToken}`,
    },
  });

export const buildDiscordAuthorizeUrl = (config, state) => {
  const query = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: 'identify guilds.join',
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${query.toString()}`;
};

export const exchangeDiscordCode = async (config, code) => {
  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: toForm({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data?.error_description ||
        data?.message ||
        'Discord token exchange failed',
    );
  return data;
};

export const getDiscordUser = async accessToken =>
  discordRequest('/users/@me', {
    token: accessToken,
  });

export const formatDiscordUsername = discordUser => {
  if (!discordUser) return '';
  if (discordUser.global_name) return discordUser.global_name;
  if (discordUser.discriminator && discordUser.discriminator !== '0') {
    return `${discordUser.username}#${discordUser.discriminator}`;
  }
  return discordUser.username || '';
};

export const buildDiscordGuildUrl = guildId =>
  `https://discord.com/channels/${guildId}`;

export const joinDiscordGuild = async (config, discordUserId, accessToken) =>
  discordBotRequest(
    `/guilds/${config.guildId}/members/${discordUserId}`,
    config,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bot ${config.botToken}`,
      },
      body: JSON.stringify({
        access_token: accessToken,
      }),
    },
  );

export const addDiscordRole = async (config, discordUserId) =>
  discordBotRequest(
    `/guilds/${config.guildId}/members/${discordUserId}/roles/${config.roleId}`,
    config,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${config.botToken}`,
      },
    },
  );

export const removeDiscordRole = async (config, discordUserId) =>
  discordBotRequest(
    `/guilds/${config.guildId}/members/${discordUserId}/roles/${config.roleId}`,
    config,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${config.botToken}`,
      },
    },
  );

export const removeDiscordMember = async (config, discordUserId) =>
  discordBotRequest(
    `/guilds/${config.guildId}/members/${discordUserId}`,
    config,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bot ${config.botToken}`,
      },
    },
  );

export const syncDiscordMembershipAccess = async ({
  env,
  request,
  membership,
}) => {
  if (!membership?.discord_user_id) return membership;
  const config = getDiscordConfig(env, request);
  const active = isMembershipActive(membership);
  const nowIso = new Date().toISOString();
  if (active) {
    try {
      await addDiscordRole(config, membership.discord_user_id);
    } catch (error) {
      return {
        ...membership,
        discord_role_status: 'link_required',
        discord_last_error:
          error instanceof Error ? error.message : 'Discord role grant failed',
      };
    }
    return {
      ...membership,
      discord_role_status: 'granted',
      discord_access_granted_at: membership.discord_access_granted_at || nowIso,
      discord_access_revoked_at: null,
      discord_last_error: null,
      plan_code: membership.plan_code || COMMUNITY_PLAN_CODE,
      price_cents: membership.price_cents ?? COMMUNITY_PRICE_CENTS,
      currency: membership.currency || COMMUNITY_CURRENCY,
      interval: membership.interval || COMMUNITY_INTERVAL,
      discord_invite_url: membership.discord_invite_url || COMMUNITY_INVITE_URL,
    };
  }
  let revokeError = null;
  try {
    await removeDiscordRole(config, membership.discord_user_id);
  } catch (error) {
    revokeError =
      error instanceof Error ? error.message : 'Discord role revoke failed';
  }
  if (config.kickOnRevoke) {
    try {
      await removeDiscordMember(config, membership.discord_user_id);
    } catch (error) {
      revokeError =
        revokeError ||
        (error instanceof Error
          ? error.message
          : 'Discord member removal failed');
    }
  }
  return {
    ...membership,
    discord_role_status: config.kickOnRevoke ? 'removed' : 'revoked',
    discord_access_revoked_at: nowIso,
    discord_last_error: revokeError,
  };
};
