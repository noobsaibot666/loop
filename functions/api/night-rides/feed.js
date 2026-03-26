import { json, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, { status: 405 });
  const url = new URL(request.url);
  const city = String(url.searchParams.get("city") || "").trim();
  const filters = [
    "is_public=eq.true",
    "moderation_status=in.(live,pending)",
    "select=id,user_id,moderation_status,session_id,rider_name,crew_name,city_name,route_title,distance_km,aspect_ratio,caption,image_url,created_at",
    "order=created_at.desc",
    "limit=32",
  ];
  if (city) {
    filters.unshift(`city_name=ilike.*${encodeURIComponent(city)}*`);
  }
  const rows = await supabaseRequest(
    env,
    `night_ride_posts?${filters.join("&")}`,
    { method: "GET" }
  ).catch(() => []);
  const sessionIds = Array.from(new Set((rows || []).map((row) => row.session_id).filter(Boolean)));
  let sessionsById = {};
  if (sessionIds.length) {
    const sessionRows = await supabaseRequest(
      env,
      `night_ride_sessions?id=in.(${sessionIds.join(",")})&select=id,title,ride_city,crew_name,distance_km`,
      { method: "GET" }
    ).catch(() => []);
    sessionsById = Object.fromEntries((sessionRows || []).map((session) => [session.id, session]));
  }
  const posts = (rows || []).map((row) => {
    const session = row.session_id ? sessionsById[row.session_id] : null;
    return {
      ...row,
      crew_name: row.crew_name || session?.crew_name || null,
      city_name: row.city_name || session?.ride_city || null,
      route_title: row.route_title || session?.title || null,
      distance_km: row.distance_km ?? session?.distance_km ?? null,
    };
  });
  return json({ posts });
}
