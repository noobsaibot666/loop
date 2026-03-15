import { json, parseJSON, requireEnv, getAuthUser, supabaseRequest } from "../../_utils.js";
import {
  buildMembershipUpsert,
  COMMUNITY_INVITE_URL,
  COMMUNITY_PLAN_CODE,
  deriveMembershipAccessState,
  sanitizeMembershipForClient,
} from "../../../shared/community-membership.js";

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

  const membership = buildMembershipUpsert({
    userId: authUser.id,
    checkoutSession: {
      ...session,
      metadata: {
        ...session?.metadata,
        plan_code: session?.metadata?.plan_code || COMMUNITY_PLAN_CODE,
        discord_invite_url: session?.metadata?.discord_invite_url || COMMUNITY_INVITE_URL,
      },
    },
    subscription,
  });

  await supabaseRequest(env, "community_memberships", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(membership),
  });

  return json({
    ok: true,
    activated: true,
    status: membership.status || "active",
    access_state: deriveMembershipAccessState(membership),
    community_membership: sanitizeMembershipForClient(membership),
  });
}
