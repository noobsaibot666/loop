import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  if (String(body.action || "") === "update") {
    const requestId = String(body.request_id || "").trim();
    const status = String(body.status || "").trim() || "reviewing";
    const adminNote = String(body.admin_note || "").trim();
    if (!requestId) return json({ error: "request_id required" }, { status: 400 });

    const rows = await supabaseRequest(env, `city_requests?id=eq.${encodeURIComponent(requestId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        admin_note: adminNote,
        handled_at: status === "new" ? null : new Date().toISOString(),
      }),
    });

    return json({ ok: true, request: rows?.[0] || null });
  }

  const rows = await supabaseRequest(
    env,
    "city_requests?select=*&order=created_at.desc&limit=50",
    { method: "GET" }
  ).catch(() => []);

  return json({ requests: rows || [] });
}
