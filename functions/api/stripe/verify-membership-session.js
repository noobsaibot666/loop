import { json, parseJSON, requireEnv, getAuthUser, supabaseRequest } from "../../_utils.js";

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const body = await parseJSON(request);
  const { session_id } = body;
  const authUser = await getAuthUser(env, request);
  if (!authUser?.id) return json({ error: "login required" }, { status: 401 });
  if (!session_id || typeof session_id !== "string") return json({ error: "session_id required" }, { status: 400 });

  const stripeSecret = requireEnv(env, "STRIPE_SECRET_KEY");
  const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}?expand[]=subscription`, {
    headers: { Authorization: `Bearer ${stripeSecret}` },
  });
  const session = await sessionRes.json();
  if (!sessionRes.ok) return json({ error: session?.error?.message || "Stripe error" }, { status: 400 });

  const metaUser = session?.metadata?.user_id;
  if (!metaUser || metaUser !== authUser.id) return json({ error: "session mismatch" }, { status: 403 });

  const subscription = session?.subscription;
  const paid = session?.payment_status === "paid" || session?.status === "complete";
  if (!paid || !subscription?.id) {
    return json({ ok: true, activated: false, status: session?.payment_status || session?.status || "unknown" });
  }

  await supabaseRequest(env, "community_memberships", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: authUser.id,
      stripe_customer_id: session.customer || null,
      stripe_subscription_id: subscription.id,
      stripe_checkout_session_id: session.id,
      plan_code: session?.metadata?.plan_code || "discord_access",
      status: subscription.status || "active",
      price_cents: 500,
      currency: "usd",
      interval: "month",
      discord_invite_url: session?.metadata?.discord_invite_url || "https://discord.gg/2wWFKuQ7",
      current_period_start: toIsoOrNull(subscription.current_period_start),
      current_period_end: toIsoOrNull(subscription.current_period_end),
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    }),
  });

  return json({ ok: true, activated: true, status: subscription.status || "active" });
}
