import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);

  if (String(body?.action || "") === "update") {
    const userId = String(body?.user_id || "").trim();
    const collaborationStatus = String(body?.collaboration_status || "").trim() || "pending";
    if (!userId) return json({ error: "user_id required" }, { status: 400 });

    const rows = await supabaseRequest(env, `user_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        collaboration_status: collaborationStatus,
        updated_at: new Date().toISOString(),
      }),
    });

    return json({ ok: true, request: rows?.[0] || null });
  }

  const rows = await supabaseRequest(
    env,
    "user_profiles?select=user_id,rider_name,home_location,collaboration_note,collaboration_status,collaboration_requested_at,updated_at&collaboration_note=not.is.null&order=collaboration_requested_at.desc.nullslast,updated_at.desc",
    { method: "GET" }
  ).catch(() => []);

  return json({
    requests: (rows || []).filter((row) => String(row?.collaboration_note || "").trim().length > 0),
  });
}
