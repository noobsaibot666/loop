import { json, parseJSON, getAuthUser, supabaseRequest } from "../../_utils.js";
import { getManifest, getRun, MESSENGER_TABLES } from "./_helpers.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || "";
  if (!userId) return json({ error: "login required" }, { status: 401 });

  const manifestId = String(body.manifest_id || "").trim();
  const runId = String(body.run_id || "").trim();
  if (!manifestId && !runId) return json({ error: "manifest_id or run_id required" }, { status: 400 });

  const run = runId ? await getRun(env, runId) : null;
  const effectiveManifestId = run?.manifest_id || manifestId;
  const manifest = await getManifest(env, effectiveManifestId);
  if (!manifest || manifest.user_id !== userId) return json({ error: "manifest not found" }, { status: 404 });

  const activeRuns = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.runs}?manifest_id=eq.${encodeURIComponent(effectiveManifestId)}&user_id=eq.${encodeURIComponent(
      userId
    )}&status=eq.active&select=*`,
    { method: "GET" }
  );

  for (const activeRun of activeRuns || []) {
    await supabaseRequest(env, `${MESSENGER_TABLES.runs}?id=eq.${encodeURIComponent(activeRun.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: "abandoned",
        finished_at: new Date().toISOString(),
      }),
    });
  }

  let rows;
  try {
    rows = await supabaseRequest(env, MESSENGER_TABLES.runs, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        manifest_id: effectiveManifestId,
        user_id: userId,
        bike_id: run?.bike_id || null,
        bike_name: run?.bike_name || null,
        bike_ratio: run?.bike_ratio || null,
        status: "active",
      }),
    });
  } catch {
    rows = await supabaseRequest(env, MESSENGER_TABLES.runs, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        manifest_id: effectiveManifestId,
        user_id: userId,
        status: "active",
      }),
    });
  }

  return json({ ok: true, run: rows?.[0] || null, manifest_id: effectiveManifestId });
}
