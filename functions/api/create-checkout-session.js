import { json, parseJSON, requireEnv } from "../_utils.js";

const toForm = (data) =>
  Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const { device_id, amount } = body;
  if (!device_id) return json({ error: "device_id required" }, { status: 400 });

  const secret = requireEnv(env, "STRIPE_SECRET_KEY");
  const appUrl = env.APP_URL || "http://localhost:5173";

  const amountInCents = Math.max(100, Number(amount || 500));

  const payload = {
    mode: "payment",
    success_url: `${appUrl}/?donation=success`,
    cancel_url: `${appUrl}/?donation=cancel`,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": "Loop credits donation",
    "line_items[0][price_data][unit_amount]": amountInCents,
    "line_items[0][quantity]": 1,
    "metadata[device_id]": device_id,
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

  return json({ url: data.url });
}
