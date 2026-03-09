import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const proofId = String(body.proof_id || "").trim();
  const isPublic = Boolean(body.is_public);

  if (!proofId) return json({ error: "proof_id required" }, { status: 400 });

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

  return json({
    ok: true,
    proof: updated?.[0] || null,
  });
}
