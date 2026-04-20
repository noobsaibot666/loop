import { json, parseJSON, getAuthUser, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const cityName = String(body?.city_name || "").trim();
  if (!cityName) return json({ error: "city_name required" }, { status: 400 });

  await supabaseRequest(
    env,
    "city_requests",
    {
      method: "POST",
      body: JSON.stringify({ city_name: cityName, requested_by: authUser?.id || null }),
    },
  ).catch(() => null);

  return json({ ok: true });
}
