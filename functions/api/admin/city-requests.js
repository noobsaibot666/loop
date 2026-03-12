import { json, parseJSON, requireAdmin, requireEnv, supabaseRequest } from "../../_utils.js";
import {
  buildPackDraftPrompt,
  callOpenAIJson,
  packDraftSchema,
} from "../../../shared/ai.js";

const slugifyCity = (value = "") =>
  String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);

const titleCaseCity = (value = "") =>
  String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  if (String(body.action || "") === "ai_draft") {
    const requestId = String(body.request_id || "").trim();
    if (!requestId) return json({ error: "request_id required" }, { status: 400 });

    const requests = await supabaseRequest(env, `city_requests?id=eq.${encodeURIComponent(requestId)}&select=*`, {
      method: "GET",
    });
    const requestRow = requests?.[0];
    if (!requestRow) return json({ error: "request not found" }, { status: 404 });

    const cityName = titleCaseCity(requestRow.requested_city || requestRow.requested_location || "");
    const slug = slugifyCity(cityName);
    if (!cityName || !slug) return json({ error: "request needs a city name before drafting" }, { status: 400 });

    const apiKey = requireEnv(env, "OPENAI_API_KEY");
    const draft = await callOpenAIJson({
      apiKey,
      model: env.OPENAI_MODEL || undefined,
      schemaName: "alleycat_pack_draft",
      schema: packDraftSchema,
      userPrompt: buildPackDraftPrompt({
        city: cityName,
        route_note: "",
        finish_label: "",
        checkpoints: [],
      }),
    });

    const packs = await supabaseRequest(env, `city_packs?slug=eq.${encodeURIComponent(slug)}&select=*`, { method: "GET" }).catch(() => []);
    const existingPack = packs?.[0] || null;
    const packRows = await supabaseRequest(env, "city_packs", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        id: existingPack?.id,
        slug,
        name: cityName,
        route_note: String(draft.route_note || "").trim(),
        finish_label: String(draft.finish_label || "").trim(),
        safety_note: "Ride inside local laws, stay sharp in traffic, and keep every task safe and doable.",
        is_active: false,
      }),
    });
    const pack = packRows?.[0] || null;

    const updatedRows = await supabaseRequest(env, `city_requests?id=eq.${encodeURIComponent(requestId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "ai_drafted",
        admin_note: `AI draft ready for ${cityName}${pack?.id ? ` · pack ${pack.id}` : ""}`,
        handled_at: new Date().toISOString(),
      }),
    });

    return json({
      ok: true,
      request: updatedRows?.[0] || null,
      pack,
      draft,
    });
  }

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
