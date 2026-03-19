import { json, requireEnv, supabaseRequest } from "../../_utils.js";

const acceptedGrantEventTypes = new Set(["INITIAL_PURCHASE", "NON_RENEWING_PURCHASE"]);

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
};

const getWebhookSecret = (request) => {
  const auth =
    request.headers.get("authorization") ||
    request.headers.get("x-authorization") ||
    request.headers.get("x-revenuecat-signature") ||
    "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : auth;
};

const parseAmountCents = (event, productRow) => {
  const amount =
    Number(event?.price_in_purchased_currency || 0) ||
    Number(event?.price || 0) ||
    Number(productRow?.price_cents || 0) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return Number(productRow?.price_cents || 0);
  return Math.round(amount * 100);
};

const parsePurchasedAt = (event) => {
  const value = Number(event?.purchased_at_ms || event?.event_timestamp_ms || 0);
  if (Number.isFinite(value) && value > 0) return new Date(value).toISOString();
  const fallback = String(event?.purchased_at || event?.event_timestamp || "").trim();
  return fallback || null;
};

const buildEventId = (event) =>
  String(
    event?.id ||
      [event?.type, event?.app_user_id, event?.product_id, event?.transaction_id || event?.original_transaction_id || event?.event_timestamp_ms || ""]
        .filter(Boolean)
        .join(":"),
  ).trim();

const buildEventRecord = ({ eventId, userId, appUserId, productId, productRow, eventType, event, status }) => ({
  event_id: eventId,
  user_id: userId,
  app_user_id: appUserId,
  store_product_id: productId,
  store_transaction_id: event?.transaction_id || null,
  original_transaction_id: event?.original_transaction_id || null,
  event_type: eventType,
  platform: event?.platform || null,
  store: event?.store || productRow?.store || null,
  environment: event?.environment || null,
  amount_cents: parseAmountCents(event, productRow),
  currency: event?.currency || productRow?.currency || "USD",
  credits_to_grant: Number(productRow?.credits_to_grant || 0),
  status,
  purchased_at: parsePurchasedAt(event),
  raw_payload: event || {},
});

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const expectedSecret = requireEnv(env, "REVENUECAT_WEBHOOK_AUTH");
  const providedSecret = getWebhookSecret(request);
  if (!providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
    return json({ error: "invalid signature" }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const event = payload?.event || payload;
  const eventType = String(event?.type || "UNKNOWN").trim().toUpperCase();
  const appUserId = String(event?.app_user_id || event?.original_app_user_id || "").trim();
  const productId = String(event?.product_id || "").trim();
  const eventId = buildEventId(event);

  if (!appUserId || !productId || !eventId) {
    return json({ error: "invalid payload" }, { status: 400 });
  }

  const existingRows = await supabaseRequest(
    env,
    `mobile_purchase_events?event_id=eq.${encodeURIComponent(eventId)}&select=event_id,status&limit=1`,
    { method: "GET" },
  ).catch(() => []);
  const existing = existingRows?.[0] || null;
  if (existing?.status === "credited") {
    return json({ received: true, duplicate: true });
  }

  const productRows = await supabaseRequest(
    env,
    `mobile_product_catalog?store_product_id=eq.${encodeURIComponent(productId)}&select=store_product_id,display_name,offering_id,platform,store,credits_to_grant,price_cents,currency,is_active&limit=1`,
    { method: "GET" },
  ).catch(() => []);
  const productRow = productRows?.[0] || null;

  let status = "received";
  if (!acceptedGrantEventTypes.has(eventType)) {
    status = `ignored_${eventType.toLowerCase()}`;
  } else if (!productRow) {
    status = "ignored_unknown_product";
  } else if (productRow.is_active === false) {
    status = "ignored_inactive_product";
  }

  if (status !== "received") {
    await supabaseRequest(env, "mobile_purchase_events", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(buildEventRecord({ eventId, userId: appUserId, appUserId, productId, productRow, eventType, event, status })),
    }).catch(() => null);
    return json({ received: true, status });
  }

  const creditRows = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${encodeURIComponent(appUserId)}&select=user_id,credits`,
    { method: "GET" },
  ).catch(() => []);
  const currentCredits = Number(creditRows?.[0]?.credits || 0);
  const creditsToGrant = Number(productRow.credits_to_grant || 0);

  await supabaseRequest(env, "user_credits", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: appUserId,
      credits: currentCredits + creditsToGrant,
    }),
  });

  await supabaseRequest(env, "mobile_purchase_events", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(buildEventRecord({ eventId, userId: appUserId, appUserId, productId, productRow, eventType, event, status: "credited" })),
  }).catch(() => null);

  return json({ received: true, credited: true, credits_added: creditsToGrant });
}
