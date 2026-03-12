import { json, parseJSON, supabaseRequest } from "../_utils.js";

export async function onRequest({ request, env }) {
  try {
    const body = await parseJSON(request);
    const city = String(body.city || "").trim();
    const location = String(body.location || "").trim();
    const note = String(body.note || "").trim();
    const email = String(body.email || "").trim();

    if (!city && !location) {
      return json({ error: "city or location required" }, { status: 400 });
    }

    const rows = await supabaseRequest(env, "city_requests", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        requested_city: city,
        requested_location: location,
        note,
        requester_email: email,
        status: "new",
      }),
    });

    return json({ ok: true, request: rows?.[0] || null });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Could not save city request" },
      { status: 500 }
    );
  }
}
