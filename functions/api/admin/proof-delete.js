import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const proofId = String(body.proof_id || "").trim();
  if (!proofId) return json({ error: "proof_id required" }, { status: 400 });

  const proofRows = await supabaseRequest(
    env,
    `messenger_proof_posts?id=eq.${encodeURIComponent(proofId)}&select=id,storage_path`,
    { method: "GET" }
  );
  const proof = proofRows?.[0] || null;
  if (!proof) return json({ error: "proof not found" }, { status: 404 });

  if (proof.storage_path) {
    await supabaseRequest(
      env,
      `storage.objects?bucket_id=eq.alleycat-proofs&name=eq.${encodeURIComponent(proof.storage_path)}`,
      { method: "DELETE" }
    ).catch(() => null);
  }

  await supabaseRequest(env, `messenger_proof_posts?id=eq.${encodeURIComponent(proofId)}`, {
    method: "DELETE",
    headers: {
      Prefer: "return=minimal",
    },
  });

  return json({ ok: true, deleted_id: proofId });
}
