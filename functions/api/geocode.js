import { json, parseJSON, requireEnv } from "../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const text = body.text;
  if (!text) return json({ error: "text required" }, { status: 400 });

  const key = requireEnv(env, "ORS_API_KEY");
  const url = `https://api.openrouteservice.org/geocode/search?api_key=${key}&text=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  const data = await response.json();
  return json(data);
}
