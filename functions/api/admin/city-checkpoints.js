import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const packId = String(body.pack_id || new URL(request.url).searchParams.get("pack_id") || "").trim();

  if (body?.action === "save") {
    const payload = {
      pack_id: packId,
      slug: String(body.slug || "").trim().toLowerCase(),
      name: String(body.name || "").trim(),
      lat: Number(body.lat),
      lng: Number(body.lng),
      district: String(body.district || "").trim(),
      category: String(body.category || "").trim(),
      vibe: String(body.vibe || "").trim(),
      hint: String(body.hint || "").trim(),
      task_local: String(body.task_local || "").trim(),
      task_fast: String(body.task_fast || "").trim(),
      task_chaotic: String(body.task_chaotic || "").trim(),
      sort_weight: Number(body.sort_weight || 100),
      is_active: body.is_active !== false,
    };
    if (!payload.pack_id || !payload.slug || !payload.name || !Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) {
      return json({ error: "pack_id, slug, name, lat, and lng required" }, { status: 400 });
    }
    if (!payload.hint || !payload.task_local || !payload.task_fast || !payload.task_chaotic) {
      return json({ error: "hint and all task variants required" }, { status: 400 });
    }
    if (body.id) payload.id = String(body.id);
    const rows = await supabaseRequest(env, "city_checkpoints", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });
    return json({ ok: true, checkpoint: rows?.[0] || null });
  }

  if (!packId) return json({ checkpoints: [] });
  const checkpoints = await supabaseRequest(
    env,
    `city_checkpoints?pack_id=eq.${encodeURIComponent(packId)}&order=sort_weight.asc,created_at.asc&select=*`,
    { method: "GET" }
  ).catch(() => []);
  return json({ checkpoints: checkpoints || [] });
}
