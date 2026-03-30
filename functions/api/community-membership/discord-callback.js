import { supabaseRequest } from "../../_utils.js";
import { COMMUNITY_INVITE_URL, isMembershipActive } from "../../../shared/community-membership.js";
import {
  addDiscordRole,
  exchangeDiscordCode,
  formatDiscordUsername,
  getDiscordConfig,
  getDiscordUser,
  joinDiscordGuild,
} from "../../../shared/discord-community.js";

const redirectToAccount = (request, outcome) => {
  const url = new URL("/account", request.url);
  url.searchParams.set("community", outcome);
  return Response.redirect(url.toString(), 302);
};

export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
    return new Response("method not allowed", { status: 405 });
  }

  const url = new URL(request.url);
  const errorCode = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (errorCode) return redirectToAccount(request, "discord-denied");
  if (!code || !state) return redirectToAccount(request, "discord-error");

  const rows = await supabaseRequest(
    env,
    `community_memberships?discord_link_state=eq.${encodeURIComponent(state)}&select=*&limit=1`,
    { method: "GET" }
  ).catch(() => []);
  const membership = rows?.[0] || null;
  if (!membership) return redirectToAccount(request, "discord-expired");

  const stateExpiry = membership.discord_link_state_expires_at ? new Date(membership.discord_link_state_expires_at).getTime() : 0;
  if (!stateExpiry || Number.isNaN(stateExpiry) || stateExpiry < Date.now()) {
    await supabaseRequest(env, "community_memberships", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        ...membership,
        discord_link_state: null,
        discord_link_state_expires_at: null,
        discord_last_error: "Discord link expired",
      }),
    }).catch(() => null);
    return redirectToAccount(request, "discord-expired");
  }

  if (!isMembershipActive(membership)) {
    return redirectToAccount(request, "discord-inactive");
  }

  try {
    const config = getDiscordConfig(env, request);
    const nowIso = new Date().toISOString();
    const token = await exchangeDiscordCode(config, code);
    const discordUser = await getDiscordUser(token.access_token);
    await joinDiscordGuild(config, discordUser.id, token.access_token);
    await addDiscordRole(config, discordUser.id);

    await supabaseRequest(env, "community_memberships", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        ...membership,
        discord_user_id: discordUser.id,
        discord_username: formatDiscordUsername(discordUser),
        discord_linked_at: membership.discord_linked_at || nowIso,
        discord_role_status: "granted",
        discord_access_granted_at: nowIso,
        discord_access_revoked_at: null,
        discord_link_state: null,
        discord_link_state_expires_at: null,
        discord_last_error: null,
        discord_invite_url: membership.discord_invite_url || COMMUNITY_INVITE_URL,
      }),
    });

    return redirectToAccount(request, "discord-linked");
  } catch (error) {
    await supabaseRequest(env, "community_memberships", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        ...membership,
        discord_link_state: null,
        discord_link_state_expires_at: null,
        discord_role_status: "link_required",
        discord_last_error: error instanceof Error ? error.message : "Discord link failed",
      }),
    }).catch(() => null);
    return redirectToAccount(request, "discord-error");
  }
}
