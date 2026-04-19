import { json, parseJSON, requireEnv, getAuthUser, supabaseRequest } from "../_utils.js";

const toForm = (data) =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

// Fixed credit products — price IDs are set as Cloudflare env vars.
// credits_to_grant is the source of truth for the grant amount.
const getCreditProducts = (env) => [
  { price_id: env.STRIPE_PRICE_CREDITS_10,  credits_to_grant: 10,  amount_cents: 499,  label: "10 Credits"  },
  { price_id: env.STRIPE_PRICE_CREDITS_50,  credits_to_grant: 50,  amount_cents: 1999, label: "50 Credits"  },
  { price_id: env.STRIPE_PRICE_CREDITS_100, credits_to_grant: 100, amount_cents: 3499, label: "100 Credits" },
];

export async function onRequest({ request, env }) {
  try {
  const body = await parseJSON(request);
  const { price_id, amount, success_redirect_to, cancel_redirect_to } = body;
  const authUser = await getAuthUser(env, request);
  if (!authUser?.id) return json({ error: "login required" }, { status: 401 });
  const user_id = authUser.id;

  const secret = requireEnv(env, "STRIPE_SECRET_KEY");
  const appUrl = new URL(request.url).origin;
  const successUrl = success_redirect_to || `${appUrl}/?donation=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = cancel_redirect_to || `${appUrl}/?donation=cancel`;

  let sessionPayload;
  let amountInCents;
  let creditsToGrant;

  if (price_id) {
    // Fixed product path — look up credits from the known product list.
    const products = getCreditProducts(env);
    const product = products.find((p) => p.price_id && p.price_id === price_id);
    if (!product) return json({ error: "invalid price_id" }, { status: 400 });

    amountInCents = product.amount_cents;
    creditsToGrant = product.credits_to_grant;
    sessionPayload = {
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "line_items[0][price]": price_id,
      "line_items[0][quantity]": 1,
      "metadata[user_id]": user_id,
      "metadata[credits_to_grant]": creditsToGrant,
    };
  } else {
    // Legacy custom-amount path — kept for backward compatibility.
    amountInCents = Math.max(500, Number(amount || 500));
    creditsToGrant = Math.max(1, Math.floor(amountInCents / 50));
    sessionPayload = {
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": "Hard Chain credits",
      "line_items[0][price_data][unit_amount]": amountInCents,
      "line_items[0][quantity]": 1,
      "metadata[user_id]": user_id,
      "metadata[credits_to_grant]": creditsToGrant,
    };
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: toForm(sessionPayload),
  });

  const data = await response.json();
  if (!response.ok) return json({ error: data.error?.message || "Stripe error" }, { status: 400 });

  try {
    await supabaseRequest(env, "stripe_sessions", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        session_id: data.id,
        user_id,
        amount_cents: amountInCents,
        credits_to_grant: creditsToGrant,
        status: "checkout_created",
      }),
    });
  } catch {}

  return json({ url: data.url });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Checkout session failed" }, { status: 500 });
  }
}
