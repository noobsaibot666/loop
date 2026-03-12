import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

function getPackReadiness(pack, countData, districtsByPack) {
  const checkpoint_count = countData?.checkpoint_count || 0;
  const active_checkpoint_count = countData?.active_checkpoint_count || 0;
  const district_count = districtsByPack.get(pack.id)?.size || 0;
  const copy_ready = Boolean(pack.route_note && pack.finish_label && pack.safety_note);
  const can_publish = copy_ready && active_checkpoint_count >= 4 && district_count >= 3;

  let readiness_status = "draft";
  if (pack.is_active) readiness_status = "live";
  else if (can_publish) readiness_status = "ready";
  else if (copy_ready || checkpoint_count > 0) readiness_status = "review";

  return {
    checkpoint_count,
    active_checkpoint_count,
    district_count,
    copy_ready,
    can_publish,
    readiness_status,
  };
}

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  if (body?.action === "save") {
    const payload = {
      slug: String(body.slug || "").trim().toLowerCase(),
      name: String(body.name || "").trim(),
      route_note: String(body.route_note || "").trim(),
      finish_label: String(body.finish_label || "").trim(),
      safety_note: String(body.safety_note || "").trim(),
      is_active: body.is_active !== false,
    };
    if (!payload.slug || !payload.name) return json({ error: "slug and name required" }, { status: 400 });
    if (body.id) payload.id = String(body.id);
    const rows = await supabaseRequest(env, "city_packs", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });
    return json({ ok: true, pack: rows?.[0] || null });
  }

  const [packs, checkpoints] = await Promise.all([
    supabaseRequest(env, "city_packs?order=name.asc&select=*", { method: "GET" }).catch(() => []),
    supabaseRequest(env, "city_checkpoints?select=pack_id,id,is_active,district", { method: "GET" }).catch(() => []),
  ]);

  const counts = new Map();
  const districtsByPack = new Map();
  for (const checkpoint of checkpoints || []) {
    const current = counts.get(checkpoint.pack_id) || { checkpoint_count: 0, active_checkpoint_count: 0 };
    current.checkpoint_count += 1;
    if (checkpoint.is_active !== false) current.active_checkpoint_count += 1;
    counts.set(checkpoint.pack_id, current);
    if (checkpoint.district) {
      const districtSet = districtsByPack.get(checkpoint.pack_id) || new Set();
      districtSet.add(String(checkpoint.district).trim());
      districtsByPack.set(checkpoint.pack_id, districtSet);
    }
  }

  return json({
    packs: (packs || []).map((pack) => ({
      ...pack,
      ...getPackReadiness(pack, counts.get(pack.id), districtsByPack),
    })),
  });
}
