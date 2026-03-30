import { json, parseJSON, getAuthUser, supabaseRequest } from "../../_utils.js";
import { getActiveRunForManifest, getManifest, MESSENGER_TABLES } from "./_helpers.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || "";
  if (!userId) return json({ error: "login required" }, { status: 401 });

  const manifestId = body?.manifest_id;
  if (!manifestId) return json({ error: "manifest_id required" }, { status: 400 });

  const manifest = await getManifest(env, manifestId);
  if (!manifest || manifest.user_id !== userId) {
    return json({ error: "manifest not found" }, { status: 404 });
  }

  const activeRun = await getActiveRunForManifest(env, manifestId, userId);
  if (activeRun) {
    return json({
      run_id: activeRun.id,
      manifest_id: manifestId,
      started_at: activeRun.started_at,
      status: activeRun.status || "active",
      bike_id: activeRun.bike_id || null,
      bike_name: activeRun.bike_name || null,
      bike_ratio: activeRun.bike_ratio || null,
      reused: true,
    });
  }

  const selectedBikeId = String(body?.bike_id || "").trim();
  let selectedBike = null;
  if (selectedBikeId) {
    const bikeRows = await supabaseRequest(
      env,
      `user_bikes?user_id=eq.${encodeURIComponent(userId)}&id=eq.${encodeURIComponent(selectedBikeId)}&select=id,bike_name,bike_ratio&limit=1`,
      { method: "GET" }
    ).catch(() => []);
    selectedBike = bikeRows?.[0] || null;
  }
  if (!selectedBike) {
    const profileRows = await supabaseRequest(
      env,
      `user_profiles?user_id=eq.${encodeURIComponent(userId)}&select=primary_bike_id,bike_name,bike_ratio&limit=1`,
      { method: "GET" }
    ).catch(() => []);
    const profile = profileRows?.[0] || null;
    selectedBike = profile
      ? {
          id: profile.primary_bike_id || null,
          bike_name: profile.bike_name || null,
          bike_ratio: profile.bike_ratio || null,
        }
      : null;
  }

  let rows;
  try {
    rows = await supabaseRequest(env, MESSENGER_TABLES.runs, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: userId,
        manifest_id: manifestId,
        bike_id: selectedBike?.id || null,
        bike_name: selectedBike?.bike_name || null,
        bike_ratio: selectedBike?.bike_ratio || null,
        status: "active",
      }),
    });
  } catch {
    rows = await supabaseRequest(env, MESSENGER_TABLES.runs, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: userId,
        manifest_id: manifestId,
        status: "active",
      }),
    });
  }

  const run = rows?.[0];
  return json({
    run_id: run?.id,
    manifest_id: manifestId,
    started_at: run?.started_at,
    status: run?.status || "active",
    bike_id: run?.bike_id || selectedBike?.id || null,
    bike_name: run?.bike_name || selectedBike?.bike_name || null,
    bike_ratio: run?.bike_ratio || selectedBike?.bike_ratio || null,
  });
}
