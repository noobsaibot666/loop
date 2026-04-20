import { json, parseJSON, getAuthUser, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  try {
    const body = await parseJSON(request);
    const authUser = await getAuthUser(env, request);
    const cityName = String(body?.city_name || "").trim();
    if (!cityName) return json({ error: "city_name required" }, { status: 400 });

    await supabaseRequest(
      env,
      "city_requests",
      {
        method: "POST",
        body: JSON.stringify({
          requested_city: cityName,
          requester_email: authUser?.email || null,
          status: "new",
        }),
      },
    ).catch(() => null);

    return json({ ok: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Request failed" }, { status: 500 });
  }
}
