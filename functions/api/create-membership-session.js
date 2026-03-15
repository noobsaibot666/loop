import { json, requireEnv, getAuthUser, supabaseRequest } from "../_utils.js";

const toForm = (data) =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const authUser = await getAuthUser(env, request);
  if (!authUser?.id) return json({ error: "login required" }, { status: 401 });

  const secret = requireEnv(env, "STRIPE_SECRET_KEY");
  const appUrl = new URL(request.url).origin;
  const priceCents = 500;
  const inviteUrl = "https://discord.gg/2wWFKuQ7";

  const payload = {
    mode: "subscription",
    success_url: `${appUrl}/?membership=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/?membership=cancel`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "Loop community access",
    "line_items[0][price_data][product_data][description]": "Discord community access with optional bonus credits later.",
    "line_items[0][price_data][unit_amount]": priceCents,
    "line_items[0][price_data][recurring][interval]": "month",
    "line_items[0][quantity]": 1,
    "metadata[user_id]": authUser.id,
    "metadata[plan_code]": "discord_access",
    "metadata[discord_invite_url]": inviteUrl,
    "subscription_data[metadata][user_id]": authUser.id,
    "subscription_data[metadata][plan_code]": "discord_access",
    "subscription_data[metadata][discord_invite_url]": inviteUrl,
  };

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toForm(payload),
  });

  const data = await response.json();
  if (!response.ok) return json({ error: data.error?.message || "Stripe error" }, { status: 400 });

  try {
    await supabaseRequest(env, "community_memberships", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: authUser.id,
        stripe_checkout_session_id: data.id,
        plan_code: "discord_access",
        status: "checkout_created",
        price_cents: priceCents,
        currency: "usd",
        interval: "month",
        discord_invite_url: inviteUrl,
      }),
    });
  } catch {}

  return json({ url: data.url });
}
