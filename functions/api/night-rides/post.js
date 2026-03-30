import { json, parseJSON, getAuthUser, supabaseRequest } from "../../_utils.js";

const riderLabelFromEmail = (email = "") => {
  const [local] = String(email || "").split("@");
  return local ? local.slice(0, 24) : "rider";
};

const findProfile = async (env, userId) => {
  const rows = await supabaseRequest(
    env,
    `user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=rider_name`,
    { method: "GET" }
  ).catch(() => []);
  return rows?.[0] || null;
};

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  const body = await parseJSON(request);
  const sessionId = String(body.session_id || "").trim();
  const imageUrl = String(body.image_url || "").trim();
  const storagePath = String(body.storage_path || "").trim();
  const aspectRatio = String(body.aspect_ratio || "1:1").trim() === "16:9" ? "16:9" : "1:1";
  const caption = String(body.caption || "").trim().slice(0, 280);
  const isPublic = body.is_public !== false;

  if (!sessionId || !imageUrl || !storagePath) {
    return json({ error: "session_id, image_url, and storage_path required" }, { status: 400 });
  }

  const sessionRows = await supabaseRequest(
    env,
    `night_ride_sessions?id=eq.${encodeURIComponent(sessionId)}&select=*`,
    { method: "GET" }
  ).catch(() => []);
  const session = sessionRows?.[0] || null;
  if (!session) return json({ error: "night ride session not found" }, { status: 404 });

  const isCreator = session.creator_user_id === user.id;
  let isParticipant = false;
  if (!isCreator) {
    const participantRows = await supabaseRequest(
      env,
      `night_ride_participants?session_id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`,
      { method: "GET" }
    ).catch(() => []);
    isParticipant = Boolean(participantRows?.length);
  }
  if (!isCreator && !isParticipant) {
    return json({ error: "not part of this night ride" }, { status: 403 });
  }

  const profile = await findProfile(env, user.id);
  const riderName = profile?.rider_name?.trim() || riderLabelFromEmail(user.email || "");

  let rows;
  try {
    rows = await supabaseRequest(env, "night_ride_posts", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        session_id: session.id,
        user_id: user.id,
        rider_name: riderName,
        crew_name: session.crew_name || null,
        city_name: session.ride_city || null,
        route_title: session.title || null,
        distance_km: session.distance_km ?? null,
        bike_id: session.bike_id || null,
        bike_name: session.bike_name || null,
        bike_ratio: session.bike_ratio || null,
        caption: caption || null,
        storage_path: storagePath,
        image_url: imageUrl,
        aspect_ratio: aspectRatio,
        is_public: isPublic,
        moderation_status: "pending",
      }),
    });
  } catch {
    rows = await supabaseRequest(env, "night_ride_posts", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        session_id: session.id,
        user_id: user.id,
        rider_name: riderName,
        crew_name: session.crew_name || null,
        city_name: session.ride_city || null,
        route_title: session.title || null,
        distance_km: session.distance_km ?? null,
        caption: caption || null,
        storage_path: storagePath,
        image_url: imageUrl,
        aspect_ratio: aspectRatio,
        is_public: isPublic,
        moderation_status: "pending",
      }),
    });
  }

  return json({ ok: true, post: rows?.[0] || null });
}
