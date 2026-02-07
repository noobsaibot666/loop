import { json, parseJSON, requireEnv } from "../_utils.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const { coords, distance_km, seed } = body;
  if (!coords || coords.length !== 2) return json({ error: "coords required" }, { status: 400 });

  const key = requireEnv(env, "ORS_API_KEY");
  const payload = {
    coordinates: [[coords[0], coords[1]]],
    options: {
      round_trip: {
        length: Math.max(1000, distance_km * 1000),
        points: 3,
        seed: seed || 1,
      },
    },
  };

  const response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: key,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    return json(
      {
        error: data?.error?.message || data?.message || "ORS error",
        detail: data,
      },
      { status: response.status }
    );
  }
  return json(data);
}
