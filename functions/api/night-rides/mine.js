import { json, getAuthUser, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, { status: 405 });
  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  const owned = await supabaseRequest(
    env,
    `night_ride_sessions?creator_user_id=eq.${encodeURIComponent(user.id)}&select=id,title,session_type,mode,difficulty,distance_km,bike_id,bike_name,bike_ratio,ride_city,crew_name,crew_members,created_at&order=created_at.desc&limit=8`,
    { method: "GET" }
  ).catch(() => []);

  const joinedRows = await supabaseRequest(
    env,
    `night_ride_participants?user_id=eq.${encodeURIComponent(user.id)}&select=session_id,created_at&order=created_at.desc&limit=12`,
    { method: "GET" }
  ).catch(() => []);
  const joinedIds = Array.from(new Set((joinedRows || []).map((row) => row.session_id).filter(Boolean)));
  const joinedSessions = joinedIds.length
    ? await supabaseRequest(
        env,
        `night_ride_sessions?id=in.(${joinedIds.map((id) => encodeURIComponent(id)).join(",")})&select=id,title,session_type,mode,difficulty,distance_km,bike_id,bike_name,bike_ratio,ride_city,crew_name,crew_members,created_at`,
        { method: "GET" }
      ).catch(() => [])
    : [];

  const merged = [...(owned || []), ...(joinedSessions || [])];
  const deduped = Array.from(new Map(merged.map((session) => [session.id, session])).values())
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 12);

  return json({ sessions: deduped });
}
