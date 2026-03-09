import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

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

  const packs = await supabaseRequest(env, "city_packs?order=name.asc&select=*", { method: "GET" }).catch(() => []);
  return json({ packs: packs || [] });
}
