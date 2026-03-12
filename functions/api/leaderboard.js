import { json, supabaseRequest } from "../_utils.js";
import { buildQuarterLeaderboard, getQuarterWindow } from "../../shared/quarterly.js";

export async function onRequest({ env }) {
  const quarter = getQuarterWindow();
  const [proofs, runs] = await Promise.all([
    supabaseRequest(
      env,
      `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(
        quarter.end.toISOString()
      )}&select=user_id,rider_name,city_name,created_at`,
      { method: "GET" }
    ).catch(() => []),
    supabaseRequest(
      env,
      `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(
        quarter.end.toISOString()
      )}&select=user_id,finished_at`,
      { method: "GET" }
    ).catch(() => []),
  ]);

  return json({
    quarter: {
      label: quarter.label,
      leaders: buildQuarterLeaderboard({ proofs: proofs || [], finishedRuns: runs || [] }).slice(0, 25),
    },
  });
}
