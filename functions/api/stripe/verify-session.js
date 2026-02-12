import { json, parseJSON, requireEnv, getAuthUser, supabaseRequest } from "../../_utils.js";

const creditsFromAmount = (amountInCents = 0) => {
  const credits = Math.floor(Number(amountInCents || 0) / 50);
  return Math.max(1, credits);
};

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const { session_id } = body;

  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || "";
  if (!user_id) return json({ error: "login required" }, { status: 401 });
  if (!session_id || typeof session_id !== "string") return json({ error: "session_id required" }, { status: 400 });

  // If we've already credited this session, do nothing.
  try {
    const existingDonation = await supabaseRequest(
      env,
      `donations?stripe_session_id=eq.${encodeURIComponent(session_id)}&select=stripe_session_id&limit=1`,
      { method: "GET" }
    );
    if (Array.isArray(existingDonation) && existingDonation.length > 0) {
      return json({ ok: true, credited: true, duplicate: true });
    }
  } catch {}

  const stripeSecret = requireEnv(env, "STRIPE_SECRET_KEY");
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`, {
    headers: { Authorization: `Bearer ${stripeSecret}` },
  });
  const session = await res.json();
  if (!res.ok) return json({ error: session?.error?.message || "Stripe error" }, { status: 400 });

  const metaUser = session?.metadata?.user_id;
  if (!metaUser || metaUser !== user_id) return json({ error: "session mismatch" }, { status: 403 });

  const paid = session?.payment_status === "paid" || session?.status === "complete";
  if (!paid) return json({ ok: true, credited: false, status: session?.payment_status || session?.status || "unknown" });

  const amount = Number(session?.amount_total || 0);
  const creditAdd = creditsFromAmount(amount);

  // Apply credits idempotently.
  const rows = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${encodeURIComponent(user_id)}&select=user_id,credits`,
    { method: "GET" }
  );
  const currentCredits = rows?.[0]?.credits || 0;
  await supabaseRequest(env, "user_credits", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ user_id, credits: currentCredits + creditAdd }),
  });

  try {
    await supabaseRequest(env, "stripe_sessions", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        session_id,
        user_id,
        amount_cents: amount,
        credits_to_grant: creditAdd,
        status: "credited",
      }),
    });
  } catch {}

  // Legacy log used by webhook dedupe and admin audits.
  try {
    await supabaseRequest(env, "donations", {
      method: "POST",
      body: JSON.stringify({
        device_id: "",
        user_id,
        amount,
        stripe_session_id: session_id,
      }),
    });
  } catch {}

  return json({ ok: true, credited: true, credits_added: creditAdd });
}

