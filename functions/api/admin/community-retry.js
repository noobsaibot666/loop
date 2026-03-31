import { json, requireAdmin, supabaseAdminAuthRequest, supabaseRequest } from "../../_utils.js";
import {
  sendCommunityActivatedEmail,
  sendCommunityCanceledEmail,
  sendCommunityDiscordLinkedEmail,
} from "../../../shared/community-email.js";
import { recordCommunityEvent } from "../../../shared/community-events.js";
import { syncDiscordMembershipAccess } from "../../../shared/discord-community.js";

const getMembershipRecipient = async (env, userId) => {
  if (!userId) return { email: "", riderName: "" };
  const authUser = await supabaseAdminAuthRequest(env, `admin/users/${encodeURIComponent(userId)}`, {
    method: "GET",
  }).catch(() => null);
  const profileRows = await supabaseRequest(
    env,
    `user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=rider_name&limit=1`,
    { method: "GET" }
  ).catch(() => []);
  return {
    email: authUser?.user?.email || "",
    riderName: profileRows?.[0]?.rider_name?.trim() || authUser?.user?.email?.split("@")[0] || "Rider",
  };
};

const sendEmailForEventType = async ({ env, request, eventType, membership, recipient }) => {
  if (eventType === "email_activation_failed") {
    return sendCommunityActivatedEmail({ env, request, membership, user: recipient });
  }
  if (eventType === "email_discord_linked_failed") {
    return sendCommunityDiscordLinkedEmail({ env, request, membership, user: recipient });
  }
  if (eventType === "email_cancellation_failed") {
    return sendCommunityCanceledEmail({ env, request, membership, user: recipient });
  }
  throw new Error("Unsupported email retry type");
};

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const eventId = String(body?.event_id || "").trim();
  if (!eventId) return json({ error: "event_id required" }, { status: 400 });

  const rows = await supabaseRequest(
    env,
    `community_membership_events?id=eq.${encodeURIComponent(eventId)}&select=*&limit=1`,
    { method: "GET" }
  ).catch(() => []);
  const event = rows?.[0] || null;
  if (!event) return json({ error: "event not found" }, { status: 404 });
  if (!event.user_id) return json({ error: "event has no user_id" }, { status: 400 });

  const membershipRows = await supabaseRequest(
    env,
    `community_memberships?user_id=eq.${encodeURIComponent(event.user_id)}&select=*&limit=1`,
    { method: "GET" }
  ).catch(() => []);
  let membership = membershipRows?.[0] || null;
  if (!membership) return json({ error: "membership not found" }, { status: 404 });

  try {
    if (event.event_type === "discord_link_failed") {
      membership = await syncDiscordMembershipAccess({
        env,
        request,
        membership,
      });
      await supabaseRequest(env, "community_memberships", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(membership),
      });
      await recordCommunityEvent(env, {
        user_id: membership.user_id,
        event_type: "discord_sync_retried",
        membership_status: membership.status,
        discord_role_status: membership.discord_role_status,
        details: {
          source_event_id: eventId,
          admin_email: admin.email || null,
        },
      }).catch(() => null);
      return json({ ok: true, retried: "discord_sync", membership });
    }

    if (String(event.event_type || "").startsWith("email_") && String(event.event_type || "").endsWith("_failed")) {
      const recipient = await getMembershipRecipient(env, membership.user_id);
      await sendEmailForEventType({
        env,
        request,
        eventType: event.event_type,
        membership,
        recipient,
      });
      await recordCommunityEvent(env, {
        user_id: membership.user_id,
        event_type: `${String(event.event_type).replace(/_failed$/, "")}_retried`,
        membership_status: membership.status,
        discord_role_status: membership.discord_role_status,
        details: {
          source_event_id: eventId,
          admin_email: admin.email || null,
          email: recipient.email || null,
        },
      }).catch(() => null);
      return json({ ok: true, retried: "email", membership });
    }

    return json({ error: "event type is not retryable" }, { status: 400 });
  } catch (error) {
    await recordCommunityEvent(env, {
      user_id: membership.user_id,
      event_type: "community_retry_failed",
      membership_status: membership.status,
      discord_role_status: membership.discord_role_status,
      details: {
        source_event_id: eventId,
        source_event_type: event.event_type,
        admin_email: admin.email || null,
        error: error instanceof Error ? error.message : "Retry failed",
      },
    }).catch(() => null);
    return json({ error: error instanceof Error ? error.message : "Retry failed" }, { status: 500 });
  }
}
