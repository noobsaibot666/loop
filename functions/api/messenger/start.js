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
      reused: true,
    });
  }

  const rows = await supabaseRequest(env, MESSENGER_TABLES.runs, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: userId,
      manifest_id: manifestId,
      status: "active",
    }),
  });

  const run = rows?.[0];
  return json({
    run_id: run?.id,
    manifest_id: manifestId,
    started_at: run?.started_at,
    status: run?.status || "active",
  });
}
