import { json, parseJSON, getAuthUser, supabaseRequest } from "../../_utils.js";
import { getManifest, getRun, getRunCheckins, MESSENGER_TABLES } from "./_helpers.js";

export async function onRequest({ request, env }) {
  const body = await parseJSON(request);
  const authUser = await getAuthUser(env, request);
  const userId = authUser?.id || "";
  if (!userId) return json({ error: "login required" }, { status: 401 });

  const runId = body?.run_id;
  if (!runId) return json({ error: "run_id required" }, { status: 400 });

  const run = await getRun(env, runId);
  if (!run || run.user_id !== userId) return json({ error: "run not found" }, { status: 404 });
  if (run.status !== "active") return json({ error: "run is not active" }, { status: 400 });

  const manifest = await getManifest(env, run.manifest_id);
  const checkpoints = manifest?.manifest?.checkpoints || [];
  const checkins = await getRunCheckins(env, runId);
  const completed = new Set(checkins.map((row) => row.checkpoint_id));

  const missing = checkpoints.filter((checkpoint) => !completed.has(checkpoint.id));
  if (missing.length) {
    return json(
      {
        error: "Complete every checkpoint before finishing.",
        missing_ids: missing.map((checkpoint) => checkpoint.id),
      },
      { status: 400 }
    );
  }

  const startedAt = new Date(run.started_at).getTime();
  const finishSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

  const rows = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.runs}?id=eq.${encodeURIComponent(runId)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: "finished",
        finished_at: new Date().toISOString(),
        finish_seconds: finishSeconds,
      }),
    }
  );

  const updated = rows?.[0];
  const ghostSeconds =
    typeof manifest?.ghost_seconds === "number" && manifest.ghost_seconds > 0
      ? manifest.ghost_seconds
      : typeof manifest?.manifest?.ghost_seconds === "number" && manifest.manifest.ghost_seconds > 0
        ? manifest.manifest.ghost_seconds
        : null;
  return json({
    ok: true,
    run_id: runId,
    status: updated?.status || "finished",
    finished_at: updated?.finished_at,
    finish_seconds: finishSeconds,
    ghost_seconds: ghostSeconds,
  });
}
