import { json, supabaseRequest } from "../_utils.js";
import { buildQuarterLeaderboard, getQuarterWindow } from "../../shared/quarterly.js";

const normalizeCitySlug = (value = "") => String(value).trim().toLowerCase().replace(/\s+/g, "");
const normalizeCountry = (value = "") => String(value).trim().toLowerCase();
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
  const quarter = getQuarterWindow();
  const cityScope = country
    ? Object.entries(CITY_COUNTRY_MAP)
        .filter(([, mappedCountry]) => mappedCountry === country)
        .map(([slug]) => slug)
    : [];
  const proofs = await supabaseRequest(
    env,
    `messenger_proof_posts?is_public=eq.true&created_at=gte.${encodeURIComponent(quarter.start.toISOString())}&created_at=lt.${encodeURIComponent(
      quarter.end.toISOString()
    )}${
      city
        ? `&city_slug=eq.${encodeURIComponent(city)}`
        : country && cityScope.length
          ? `&city_slug=in.(${cityScope.map((slug) => encodeURIComponent(slug)).join(",")})`
          : ""
    }&select=user_id,rider_name,city_name,created_at`,
    { method: "GET" }
  ).catch(() => []);

  let runs = [];
  if (city || (country && cityScope.length)) {
    const manifests = await supabaseRequest(
      env,
      city
        ? `messenger_manifests?city_slug=eq.${encodeURIComponent(city)}&select=id`
        : `messenger_manifests?city_slug=in.(${cityScope.map((slug) => encodeURIComponent(slug)).join(",")})&select=id`,
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
      leaders: leaders.map((l) => ({
        ...l,
        is_community_member: memberSet.has(l.user_id),
      })),
    },
  });
}
