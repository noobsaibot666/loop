import { getAuthUser, json, parseJSON, supabaseRequest } from "../_utils.js";

export async function onRequest({ request, env }) {
  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  const body = await parseJSON(request);
  const loopPoint = String(body.loop_point || "").trim();
  const routeUrl = String(body.route_url || "").trim();
  const distanceKm = Number(body.distance_km || 0);
  const unit = String(body.unit || "").trim();
  const bikeId = String(body.bike_id || "").trim() || null;
  const bikeName = String(body.bike_name || "").trim() || null;
  const bikeRatio = String(body.bike_ratio || "").trim() || null;

  // Accept difficulty/style (mobile) or terrain/surface/vibe (legacy web)
  const difficulty = String(body.difficulty || "").trim().toLowerCase();
  const style = String(body.style || "").trim().toLowerCase();
  let terrain = String(body.terrain || "").trim();
  let surface = String(body.surface || "").trim();
  let vibe = String(body.vibe || "").trim();
  if (!terrain && !surface && !vibe) {
    terrain = difficulty === "hard" ? "climb" : difficulty === "easy" ? "road" : "mix";
    surface = style === "fast" ? "mixed" : "paved";
    vibe = style === "chaotic" ? "Scenic" : difficulty === "hard" ? "Energy" : "Elegant";
  }

  if (!loopPoint || !routeUrl || !distanceKm || !unit) {
    return json({ error: "missing loop history fields" }, { status: 400 });
  }

  let rows;
  try {
    rows = await supabaseRequest(env, "loop_history", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: user.id,
        loop_point: loopPoint,
        distance_km: distanceKm,
        unit,
        terrain,
        surface,
        vibe,
        route_url: routeUrl,
        bike_id: bikeId,
        bike_name: bikeName,
        bike_ratio: bikeRatio,
      }),
    });
  } catch {
    rows = await supabaseRequest(env, "loop_history", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: user.id,
        loop_point: loopPoint,
        distance_km: distanceKm,
        unit,
        terrain,
        surface,
        vibe,
        route_url: routeUrl,
      }),
    });
  }

  return json({
    ok: true,
    loop: rows?.[0] || null,
  });
}
