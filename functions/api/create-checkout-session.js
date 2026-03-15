import { json, parseJSON, requireEnv, getAuthUser, supabaseRequest } from "../_utils.js";

const toForm = (data) =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const { amount } = body;
  const authUser = await getAuthUser(env, request);
  if (!authUser?.id) return json({ error: "login required" }, { status: 401 });
  const user_id = authUser.id;

  const secret = requireEnv(env, "STRIPE_SECRET_KEY");
  const appUrl = new URL(request.url).origin;

  const amountInCents = Math.max(500, Number(amount || 500));
  const creditsToGrant = Math.max(1, Math.floor(amountInCents / 50));

  const payload = {
    mode: "payment",
    // Return the checkout session id so the app can verify/credit even if webhook delivery is delayed.
    success_url: `${appUrl}/?donation=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/?donation=cancel`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "Loop credits donation",
    "line_items[0][price_data][unit_amount]": amountInCents,
    "line_items[0][quantity]": 1,
    "metadata[user_id]": user_id,
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

  // Best-effort audit trail for checkout starts. Safe to skip if table is not created yet.
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
}
