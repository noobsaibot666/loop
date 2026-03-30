import { json, requireEnv, supabaseAdminAuthRequest, supabaseRequest } from "../../_utils.js";
import {
  buildMembershipUpsert,
  COMMUNITY_INVITE_URL,
  COMMUNITY_PLAN_CODE,
  COMMUNITY_PRICE_CENTS,
} from "../../../shared/community-membership.js";
import { sendCommunityActivatedEmail, sendCommunityCanceledEmail } from "../../../shared/community-email.js";
import { syncDiscordMembershipAccess } from "../../../shared/discord-community.js";

const textBuffer = async (request) => {
  const buf = await request.arrayBuffer();
  return new TextDecoder().decode(buf);
};

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
};

const hmacSha256 = async (secret, payload) => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

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
  const riderName = profileRows?.[0]?.rider_name?.trim() || authUser?.user?.email?.split("@")[0] || "Rider";
  return {
    email: authUser?.user?.email || "",
    riderName,
  };
};

const updateMembershipBySubscription = async (env, subscription, overrides = {}) => {
  const subscriptionId = subscription?.id;
  if (!subscriptionId) return;
  const rows = await supabaseRequest(
    env,
    `community_memberships?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=*`,
    { method: "GET" }
  ).catch(() => []);
  const current = rows?.[0];
  if (!current?.user_id) return;
  const membership = buildMembershipUpsert({
    userId: current.user_id,
    checkoutSession: {
      id: current.stripe_checkout_session_id || null,
      customer: subscription.customer || null,
      subscription: subscriptionId,
      metadata: {
        plan_code: subscription?.metadata?.plan_code || COMMUNITY_PLAN_CODE,
        discord_invite_url: subscription?.metadata?.discord_invite_url || COMMUNITY_INVITE_URL,
      },
    },
    subscription,
  });
  let nextMembership = {
    ...(current || {}),
    ...membership,
    ...overrides,
    user_id: current.user_id,
    stripe_subscription_id: subscriptionId,
    stripe_checkout_session_id: current.stripe_checkout_session_id || membership.stripe_checkout_session_id,
    price_cents: overrides.price_cents ?? membership.price_cents ?? COMMUNITY_PRICE_CENTS,
  };
  if (nextMembership.discord_user_id) {
    nextMembership = await syncDiscordMembershipAccess({
      env,
      membership: nextMembership,
    });
  }
  await supabaseRequest(env, "community_memberships", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(nextMembership),
  }).catch(() => null);
};

export async function onRequest({ request, env }) {
  const secret = requireEnv(env, "STRIPE_WEBHOOK_SECRET");
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "missing signature" }, { status: 400 });

  const raw = await textBuffer(request);

  const parts = signature.split(",").reduce((acc, item) => {
    const [k, v] = item.split("=");
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const sig = parts.v1;
  const payload = `${timestamp}.${raw}`;
  const expected = await hmacSha256(secret, payload);
  if (!sig || !timingSafeEqual(sig, expected)) {
    return json({ error: "invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw);

  // Idempotency by Stripe event id (requires stripe_events table).
  // If the table does not exist yet, we continue with session-level fallback checks.
  if (event?.id) {
    try {
      const seen = await supabaseRequest(
        env,
        `stripe_events?event_id=eq.${encodeURIComponent(event.id)}&select=event_id`,
        { method: "GET" }
      );
      if (Array.isArray(seen) && seen.length > 0) {
        return json({ received: true, duplicate: true });
      }
      await supabaseRequest(env, "stripe_events", {
        method: "POST",
        body: JSON.stringify({
          event_id: event.id,
          event_type: event.type || "unknown",
        }),
      });
    } catch {}
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const user_id = session.metadata?.user_id;
    const sessionId = session.id;
    const isMembership = session.mode === "subscription" || session.metadata?.plan_code === "discord_access";
    if (isMembership && user_id && sessionId) {
      const stripeSecret = requireEnv(env, "STRIPE_SECRET_KEY");
      let subscription = null;
      if (session.subscription) {
        const subscriptionRes = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(session.subscription)}`, {
          headers: { Authorization: `Bearer ${stripeSecret}` },
        });
        subscription = await subscriptionRes.json().catch(() => null);
      }
      const membership = buildMembershipUpsert({
        userId: user_id,
        checkoutSession: session,
        subscription,
      });
      const existingRows = await supabaseRequest(
        env,
        `community_memberships?user_id=eq.${encodeURIComponent(user_id)}&select=*&limit=1`,
        { method: "GET" }
      ).catch(() => []);
      let mergedMembership = {
        ...(existingRows?.[0] || {}),
        ...membership,
      };
      if (mergedMembership.discord_user_id) {
        mergedMembership = await syncDiscordMembershipAccess({
          env,
          membership: mergedMembership,
        });
      }
      await supabaseRequest(env, "community_memberships", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(mergedMembership),
      }).catch(() => null);
      const recipient = await getMembershipRecipient(env, user_id);
      await sendCommunityActivatedEmail({
        env,
        request,
        membership: mergedMembership,
        user: recipient,
      }).catch(() => null);
      return json({ received: true });
    }

    const amount = session.amount_total || 0;
    const creditAdd = Math.max(1, Math.floor(amount / 50));

    if (user_id && creditAdd > 0 && sessionId) {
      // Session-level dedupe: prefer stripe_sessions over legacy donations.
      try {
        const existingSession = await supabaseRequest(
          env,
          `stripe_sessions?session_id=eq.${encodeURIComponent(sessionId)}&select=session_id,status&limit=1`,
          { method: "GET" }
        );
        if (Array.isArray(existingSession) && existingSession[0]?.status === "credited") {
          return json({ received: true, duplicate: true });
        }
      } catch {}

      const rows = await supabaseRequest(env, `user_credits?user_id=eq.${encodeURIComponent(user_id)}&select=user_id,credits`, {
        method: "GET",
      });
      const currentCredits = rows?.[0]?.credits || 0;
      await supabaseRequest(env, "user_credits", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ user_id, credits: currentCredits + creditAdd }),
      });

      // Best-effort session audit. Safe if table is not migrated yet.
      try {
        await supabaseRequest(env, "stripe_sessions", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates" },
          body: JSON.stringify({
            session_id: sessionId,
            user_id,
            amount_cents: amount,
            credits_to_grant: creditAdd,
            status: "credited",
          }),
        });
      } catch {}

      // Keep legacy donations log for compatibility.
      try {
        await supabaseRequest(env, "donations", {
          method: "POST",
          body: JSON.stringify({
            device_id: "",
            user_id,
            amount,
            stripe_session_id: sessionId,
          }),
        });
      } catch {}
    }
  }

  if (event.type === "customer.subscription.updated") {
    await updateMembershipBySubscription(env, event.data.object);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await updateMembershipBySubscription(env, subscription, {
      status: "canceled",
      cancel_at_period_end: false,
    });
    const rows = await supabaseRequest(
      env,
      `community_memberships?stripe_subscription_id=eq.${encodeURIComponent(subscription.id)}&select=*&limit=1`,
      { method: "GET" }
    ).catch(() => []);
    const membership = rows?.[0] || null;
    if (membership?.user_id) {
      const recipient = await getMembershipRecipient(env, membership.user_id);
      await sendCommunityCanceledEmail({
        env,
        request,
        membership,
        user: recipient,
      }).catch(() => null);
    }
  }

  return json({ received: true });
}
