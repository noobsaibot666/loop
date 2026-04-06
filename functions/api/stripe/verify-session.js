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

  let existingSession = null;
  try {
    const sessions = await supabaseRequest(
      env,
      `stripe_sessions?session_id=eq.${encodeURIComponent(session_id)}&select=session_id,user_id,status,amount_cents,credits_to_grant&limit=1`,
      { method: "GET" }
    );
    existingSession = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;
    if (existingSession?.user_id && existingSession.user_id !== user_id) {
      return json({ error: "session mismatch" }, { status: 403 });
    }
    if (existingSession?.status === "credited") {
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
  const creditAdd = existingSession?.credits_to_grant || creditsFromAmount(amount);

  // Apply credits atomically via RPC function.
  try {
    await supabaseRequest(env, "rpc/increment_user_credits", {
      method: "POST",
      body: JSON.stringify({ p_user_id: user_id, p_amount: creditAdd }),
    });
  } catch (error) {
    console.error("Failed to increment credits atomically:", error.message);
    // Silent fallthrough is NOT allowed here for billing integrity.
    return json({ error: "Credit application failed. Contact support with session ID." }, { status: 500 });
  }

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
