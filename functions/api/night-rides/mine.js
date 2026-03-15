import { json, getAuthUser, supabaseRequest } from "../../_utils.js";

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, { status: 405 });
  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  const rows = await supabaseRequest(
    env,
    `night_ride_sessions?creator_user_id=eq.${encodeURIComponent(user.id)}&select=id,title,session_type,mode,difficulty,distance_km,ride_city,crew_name,crew_members,created_at&order=created_at.desc&limit=8`,
    { method: "GET" }
  ).catch(() => []);

  return json({ sessions: rows || [] });
}
