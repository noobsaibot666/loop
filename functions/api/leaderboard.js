import { json, supabaseRequest } from "../_utils.js";
import { buildQuarterLeaderboard, getQuarterWindow } from "../../shared/quarterly.js";

const normalizeCitySlug = (value = "") => String(value).trim().toLowerCase().replace(/\s+/g, "");

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const city = normalizeCitySlug(url.searchParams.get("city") || "");
  const quarter = getQuarterWindow();
  const proofs = await supabaseRequest(
    env,
    `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(
      quarter.end.toISOString()
    )}${city ? `&city_slug=eq.${encodeURIComponent(city)}` : ""}&select=user_id,rider_name,city_name,created_at`,
    { method: "GET" }
  ).catch(() => []);

  let runs = [];
  if (city) {
    const manifests = await supabaseRequest(
      env,
      `messenger_manifests?city_slug=eq.${encodeURIComponent(city)}&select=id`,
      { method: "GET" }
    ).catch(() => []);
    const manifestIds = (manifests || []).map((item) => item.id).filter(Boolean);
    if (manifestIds.length) {
      runs = await supabaseRequest(
        env,
        `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(
          quarter.end.toISOString()
        )}&manifest_id=in.(${manifestIds.map((id) => encodeURIComponent(id)).join(",")})&select=user_id,finished_at`,
        { method: "GET" }
      ).catch(() => []);
    }
  } else {
    runs = await supabaseRequest(
      env,
      `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(
        quarter.end.toISOString()
      )}&select=user_id,finished_at`,
      { method: "GET" }
    ).catch(() => []);
  }

  return json({
    quarter: {
      label: quarter.label,
      city: city || "",
      leaders: buildQuarterLeaderboard({ proofs: proofs || [], finishedRuns: runs || [] }).slice(0, 25),
    },
  });
}
