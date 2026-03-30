import { json, supabaseRequest } from "../_utils.js";
import { buildQuarterLeaderboard, getQuarterWindow } from "../../shared/quarterly.js";

const normalizeCitySlug = (value = "") => String(value).trim().toLowerCase().replace(/\s+/g, "");
const normalizeCountry = (value = "") => String(value).trim().toLowerCase();
const normalizeCheckpointCount = (value = "") => {
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const CITY_COUNTRY_MAP = {
  amsterdam: "netherlands",
  bangkok: "thailand",
  barcelona: "spain",
  berlin: "germany",
  bogota: "colombia",
  buenosaires: "argentina",
  chicago: "united states",
  krakow: "poland",
  london: "united kingdom",
  losangeles: "united states",
  mexicocity: "mexico",
  milan: "italy",
  newyork: "united states",
  paris: "france",
  philadelphia: "united states",
  sanfrancisco: "united states",
  santos: "brazil",
  saopaulo: "brazil",
  seattle: "united states",
  seoul: "south korea",
  taipei: "taiwan",
  tokyo: "japan",
  vienna: "austria",
  warsaw: "poland",
 };

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const city = normalizeCitySlug(url.searchParams.get("city") || "");
  const country = normalizeCountry(url.searchParams.get("country") || "");
  const checkpointCount = normalizeCheckpointCount(url.searchParams.get("checkpoint_count") || "");
  const quarter = getQuarterWindow();
  const cityScope = country
    ? Object.entries(CITY_COUNTRY_MAP)
        .filter(([, mappedCountry]) => mappedCountry === country)
        .map(([slug]) => slug)
    : [];
  const needsManifestFilter = Boolean(city || (country && cityScope.length) || checkpointCount);
  let manifestIds = [];
  if (needsManifestFilter) {
    const manifestFilters = [];
    if (city) manifestFilters.push(`city_slug=eq.${encodeURIComponent(city)}`);
    else if (country && cityScope.length) manifestFilters.push(`city_slug=in.(${cityScope.map((slug) => encodeURIComponent(slug)).join(",")})`);
    if (checkpointCount) manifestFilters.push(`checkpoint_count=eq.${checkpointCount}`);
    const manifests = await supabaseRequest(
      env,
      `messenger_manifests?${manifestFilters.join("&")}&select=id`,
      { method: "GET" }
    ).catch(() => []);
    manifestIds = (manifests || []).map((item) => item.id).filter(Boolean);
  }

  const proofs = needsManifestFilter
    ? manifestIds.length
      ? await supabaseRequest(
          env,
          `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(
            quarter.end.toISOString()
          )}&manifest_id=in.(${manifestIds.map((id) => encodeURIComponent(id)).join(",")})&select=user_id,rider_name,city_name,manifest_id,created_at`,
          { method: "GET" }
        ).catch(() => [])
      : []
    : await supabaseRequest(
        env,
        `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(
          quarter.end.toISOString()
        )}&select=user_id,rider_name,city_name,manifest_id,created_at`,
        { method: "GET" }
      ).catch(() => []);

  const runs = needsManifestFilter
    ? manifestIds.length
      ? await supabaseRequest(
          env,
          `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(
            quarter.end.toISOString()
          )}&manifest_id=in.(${manifestIds.map((id) => encodeURIComponent(id)).join(",")})&select=user_id,finished_at`,
          { method: "GET" }
        ).catch(() => [])
      : []
    : await supabaseRequest(
        env,
        `messenger_runs?status=eq.finished&finished_at=gte.${encodeURIComponent(quarter.start.toISOString())}&finished_at=lt.${encodeURIComponent(
          quarter.end.toISOString()
        )}&select=user_id,finished_at`,
        { method: "GET" }
      ).catch(() => []);

  const leaders = buildQuarterLeaderboard({ proofs: proofs || [], finishedRuns: runs || [] }).slice(0, 25);
  const userIds = leaders.map((l) => l.user_id).filter(Boolean);

  let memberships = [];
  if (userIds.length) {
    memberships = await supabaseRequest(
      env,
      `community_memberships?user_id=in.(${userIds.map((id) => encodeURIComponent(id)).join(",")})&status=eq.active&select=user_id`,
      { method: "GET" }
    ).catch(() => []);
  }

  const memberSet = new Set((memberships || []).map((m) => m.user_id));

  return json({
    quarter: {
      label: quarter.label,
      city: city || "",
      country: country || "",
      checkpoint_count: checkpointCount || null,
      leaders: leaders.map((l) => ({
        ...l,
        is_community_member: memberSet.has(l.user_id),
      })),
    },
  });
}
