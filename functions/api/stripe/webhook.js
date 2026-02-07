import { json, requireEnv, supabaseRequest } from "../../_utils.js";

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
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const device_id = session.metadata?.device_id;
    const amount = session.amount_total || 0;

    if (device_id) {
      const rows = await supabaseRequest(env, `device_usage?device_id=eq.${encodeURIComponent(device_id)}&select=device_id,donation_credits`, {
        method: "GET",
      });
      const currentCredits = rows?.[0]?.donation_credits || 0;
      await supabaseRequest(env, "device_usage", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates" },
        body: JSON.stringify({ device_id, donation_credits: currentCredits + 10 }),
      });
      await supabaseRequest(env, "donations", {
        method: "POST",
        body: JSON.stringify({
          device_id,
          amount,
          stripe_session_id: session.id,
        }),
      });
    }
  }

  return json({ received: true });
}
