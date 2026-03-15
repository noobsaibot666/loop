import { getAuthUser, json, requireEnv, supabaseRequest } from "../../_utils.js";
import {
  COMMUNITY_INVITE_URL,
  deriveMembershipAccessState,
  isMembershipActive,
} from "../../../shared/community-membership.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const authUser = await getAuthUser(env, request);
  if (!authUser?.id) return json({ error: "login required" }, { status: 401 });

  const rows = await supabaseRequest(
    env,
    `community_memberships?user_id=eq.${encodeURIComponent(authUser.id)}&select=*&limit=1`,
    { method: "GET" }
  ).catch(() => []);
  const membership = rows?.[0] || null;
  if (!membership) {
    return json({ error: "membership not found", access_state: "inactive" }, { status: 404 });
  }

  const stripeSubscriptionId = membership.stripe_subscription_id || null;
  let currentMembership = membership;
  if (stripeSubscriptionId) {
    try {
      const stripeSecret = requireEnv(env, "STRIPE_SECRET_KEY");
      const stripeRes = await fetch(
        `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(stripeSubscriptionId)}`,
        { headers: { Authorization: `Bearer ${stripeSecret}` } }
      );
      const subscription = await stripeRes.json();
      if (stripeRes.ok && subscription?.id) {
        currentMembership = {
          ...membership,
          stripe_customer_id: subscription.customer || membership.stripe_customer_id || null,
          status: subscription.status || membership.status,
          current_period_start: subscription.current_period_start
            ? new Date(Number(subscription.current_period_start) * 1000).toISOString()
            : membership.current_period_start || null,
          current_period_end: subscription.current_period_end
            ? new Date(Number(subscription.current_period_end) * 1000).toISOString()
            : membership.current_period_end || null,
          cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
          discord_invite_url: subscription?.metadata?.discord_invite_url || membership.discord_invite_url || COMMUNITY_INVITE_URL,
        };
        await supabaseRequest(env, "community_memberships", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify(currentMembership),
        }).catch(() => null);
      }
    } catch {}
  }

  const accessState = deriveMembershipAccessState(currentMembership);
  if (!isMembershipActive(currentMembership)) {
    return json({ error: "membership inactive", access_state: accessState }, { status: 403 });
  }

  return json({
    ok: true,
    access_state: accessState,
    url: currentMembership.discord_invite_url || COMMUNITY_INVITE_URL,
  });
}
