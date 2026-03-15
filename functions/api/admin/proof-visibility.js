import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const proofId = String(body.proof_id || "").trim();
  const isPublic = Boolean(body.is_public);

  if (!proofId) return json({ error: "proof_id required" }, { status: 400 });

  const existingRows = await supabaseRequest(
    env,
    `messenger_proof_posts?id=eq.${encodeURIComponent(proofId)}&select=id,rider_name,city_name,checkpoint_name,is_public`,
    { method: "GET" }
  );
  const existing = existingRows?.[0] || null;
  if (!existing) return json({ error: "proof not found" }, { status: 404 });

  const updated = await supabaseRequest(
    env,
    `messenger_proof_posts?id=eq.${encodeURIComponent(proofId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({ is_public: isPublic }),
    }
  );

  await supabaseRequest(env, "moderation_action_history", {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      admin_user_id: admin.id || null,
      admin_email: admin.email || "",
      action: isPublic ? "proof_publish" : "proof_hide",
      target_type: "proof",
      target_id: proofId,
      target_label: existing.checkpoint_name || existing.city_name || proofId,
      details: {
        rider_name: existing.rider_name || "",
        city_name: existing.city_name || "",
        checkpoint_name: existing.checkpoint_name || "",
        previous_public: existing.is_public,
        next_public: isPublic,
      },
    }),
  }).catch(() => null);

  return json({
    ok: true,
    proof: updated?.[0] || null,
  });
}
