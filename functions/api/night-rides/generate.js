import { json, parseJSON, requireEnv, getAuthUser, isAdminEmail, supabaseRequest } from "../../_utils.js";
import {
  NIGHT_RIDE_CREDIT_COST,
  NIGHT_RIDE_CREW_BUILD_COST,
  normalizeNightRideMode,
  normalizeNightRideDifficulty,
  normalizeNightRideSessionType,
  createNightRideCode,
  buildNightRideFallbackLoopWaypoints,
  sampleLoopWaypoints,
  buildNightRideMapsUrl,
  buildRouletteWaypoint,
  distanceBetweenKm,
  sanitizeCrewMembers,
} from "../../../shared/night-rides.js";
import { hasUsableLoopWaypoints } from "../../../shared/loop-quality.js";

const riderLabelFromEmail = (email = "") => {
  const [local] = String(email || "").split("@");
  return local ? local.slice(0, 24) : "rider";
};

const consumeNightRideCredit = async (env, user, sessionType = "single") => {
  const cost = sessionType === "crew" ? NIGHT_RIDE_CREW_BUILD_COST : NIGHT_RIDE_CREDIT_COST;
  if (isAdminEmail(env, user?.email || "")) {
    return { ok: true, credits_remaining: 9999, unlimited_credits: true, is_admin: true };
  }
  const creditRows = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,credits,free_used`,
    { method: "GET" }
  ).catch(() => []);
  const usage = creditRows?.[0] || { user_id: user.id, credits: 0, free_used: 0 };
  let credits = usage.credits || 0;
  let freeUsed = usage.free_used || 0;
  if (sessionType === "single" && freeUsed < 3) {
    freeUsed += 1;
  } else if (credits >= cost) {
    credits -= cost;
  } else {
    return { ok: false, error: sessionType === "crew" ? "Crew Night Ride needs 2 credits." : "Night Ride needs 1 credit or a free loop left." };
  }
  await supabaseRequest(env, "user_credits", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ user_id: user.id, credits, free_used: freeUsed }),
  });
  return { ok: true, credits_remaining: credits, free_used: freeUsed, unlimited_credits: false, is_admin: false };
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
  const sessionType = normalizeNightRideSessionType(body.session_type);
  const mode = normalizeNightRideMode(body.mode);
  const difficulty = normalizeNightRideDifficulty(body.difficulty);
  const unit = body.unit === "mi" ? "mi" : "km";
  const distanceKm = Number(body.distance_km || 0);
  const originLabel = String(body.origin_label || "").trim();
  const destinationLabel = String(body.destination_label || "").trim();
  const crewName = String(body.crew_name || "").trim().slice(0, 80);
  const rideCity = String(body.ride_city || "").trim().slice(0, 80);
  const crewMembers = sanitizeCrewMembers(body.crew_members);
  const start = {
    lat: Number(body.origin_lat),
    lng: Number(body.origin_lng),
  };
  const end =
    mode === "roulette"
      ? {
          lat: Number(body.destination_lat),
          lng: Number(body.destination_lng),
        }
      : null;

  if (!originLabel || !Number.isFinite(start.lat) || !Number.isFinite(start.lng)) {
    return json({ error: "origin required" }, { status: 400 });
  }
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return json({ error: "distance_km required" }, { status: 400 });
  }
  if (mode === "roulette" && (!destinationLabel || !end || !Number.isFinite(end.lat) || !Number.isFinite(end.lng))) {
    return json({ error: "destination required for roulette" }, { status: 400 });
  }
  if (sessionType === "crew" && !crewName) {
    return json({ error: "crew name required" }, { status: 400 });
  }

  const orsKey = requireEnv(env, "ORS_API_KEY");
  let routePayload = null;
  let routeUrl = "";
  let title = "";

  if (mode === "loop") {
    const response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: orsKey,
      },
      body: JSON.stringify({
        coordinates: [[start.lng, start.lat]],
        options: {
          round_trip: {
            length: Math.max(1000, distanceKm * 1000),
            points: difficulty === "hard" ? 4 : 3,
            seed: Math.floor(Math.random() * 1000) + 1,
          },
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return json({ error: data?.error?.message || data?.message || "ORS error" }, { status: response.status });
    }
    routePayload = data;
    const coords = data?.features?.[0]?.geometry?.coordinates || [];
    const waypoints = sampleLoopWaypoints(coords, distanceKm);
    const resolvedWaypoints =
      hasUsableLoopWaypoints(waypoints)
        ? waypoints
        : buildNightRideFallbackLoopWaypoints(start, distanceKm, Math.floor(Math.random() * 1000) + 1);
    routeUrl = buildNightRideMapsUrl({ origin: start, destination: start, waypoints: resolvedWaypoints });
    title = sessionType === "crew" ? `${crewName} · Night Loop` : `Night Loop · ${originLabel}`;
  } else {
    const via = buildRouletteWaypoint({
      start,
      end,
      targetKm: distanceKm,
      difficulty,
    });
    const response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: orsKey,
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [via.lng, via.lat],
          [end.lng, end.lat],
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return json({ error: data?.error?.message || data?.message || "ORS error" }, { status: response.status });
    }
    routePayload = { ...data, via };
    routeUrl = buildNightRideMapsUrl({ origin: start, destination: end, waypoints: [via] });
    const directKm = distanceBetweenKm(start, end);
    title = sessionType === "crew"
      ? `${crewName} · Night Roulette`
      : `Night Roulette · ${originLabel} to ${destinationLabel} · ${directKm.toFixed(1)} km direct`;
  }

  const creditResult = await consumeNightRideCredit(env, user, sessionType);
  if (!creditResult.ok) return json({ error: creditResult.error }, { status: 402 });

  const profile = await findProfile(env, user.id);
  let shareCode = createNightRideCode();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const existing = await supabaseRequest(
      env,
      `night_ride_sessions?share_code=eq.${encodeURIComponent(shareCode)}&select=id`,
      { method: "GET" }
    ).catch(() => []);
    if (!existing?.length) break;
    shareCode = createNightRideCode();
  }

  const rows = await supabaseRequest(env, "night_ride_sessions", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      creator_user_id: user.id,
      creator_email: user.email || "",
      creator_rider_name: profile?.rider_name?.trim() || riderLabelFromEmail(user.email || ""),
      session_type: sessionType,
      mode,
      title,
      difficulty,
      unit,
      distance_km: Number(distanceKm.toFixed(2)),
      ride_city: rideCity || null,
      crew_name: sessionType === "crew" ? crewName : null,
      crew_members: crewMembers,
      origin_label: originLabel,
      origin_lat: start.lat,
      origin_lng: start.lng,
      destination_label: mode === "roulette" ? destinationLabel : null,
      destination_lat: mode === "roulette" ? end.lat : null,
      destination_lng: mode === "roulette" ? end.lng : null,
      share_code: shareCode,
      route_url: routeUrl,
      route_payload: routePayload || {},
      status: "open",
    }),
  });

  const session = rows?.[0] || null;
  if (session?.id) {
    await supabaseRequest(env, "night_ride_participants", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        session_id: session.id,
        user_id: user.id,
        rider_name: profile?.rider_name?.trim() || riderLabelFromEmail(user.email || ""),
        joined_via: "creator",
        credits_spent: sessionType === "crew" ? NIGHT_RIDE_CREW_BUILD_COST : 1,
      }),
    }).catch(() => null);
  }

  return json({
    ok: true,
    session,
    share_code: shareCode,
    route_url: routeUrl,
    credits_remaining: creditResult.credits_remaining,
    is_admin: creditResult.is_admin,
    unlimited_credits: creditResult.unlimited_credits,
  });
}
