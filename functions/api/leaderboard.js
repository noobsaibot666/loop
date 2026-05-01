import { json, supabaseRequest } from "../_utils.js";
import { buildQuarterLeaderboard, getMonthWindow } from "../../shared/quarterly.js";

const normalizeCitySlug = (value = "") => String(value).trim().toLowerCase().replace(/\s+/g, "");

// One proof per user per manifest — prevents inflated scores from duplicate posts
const deduplicateProofs = (proofs) => {
  const seen = new Set();
  return proofs.filter((p) => {
    if (!p.user_id || !p.manifest_id) return false;
    const key = `${p.user_id}:${p.manifest_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const normalizeCountry = (value = "") => String(value).trim().toLowerCase();
const normalizeCheckpointCount = (value = "") => {
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};
const CITY_COUNTRY_MAP = {
  amsterdam: "netherlands",
  austin: "united states",
  bangkok: "thailand",
  barcelona: "spain",
  belohorizonte: "brazil",
  berlin: "germany",
  bogota: "colombia",
  budapest: "hungary",
  buenosaires: "argentina",
  chicago: "united states",
  cologne: "germany",
  copenhagen: "denmark",
  curitiba: "brazil",
  guadalajara: "mexico",
  guarulhos: "brazil",
  hamburg: "germany",
  hongkong: "hong kong",
  jakarta: "indonesia",
  krakow: "poland",
  lima: "peru",
  lisbon: "portugal",
  london: "united kingdom",
  losangeles: "united states",
  madrid: "spain",
  manila: "philippines",
  marseille: "france",
  medellin: "colombia",
  mexicocity: "mexico",
  milan: "italy",
  munich: "germany",
  newyork: "united states",
  osaka: "japan",
  paris: "france",
  philadelphia: "united states",
  portland: "united states",
  prague: "czech republic",
  riodejaneiro: "brazil",
  rotterdam: "netherlands",
  sanfrancisco: "united states",
  santiago: "chile",
  santos: "brazil",
  saopaulo: "brazil",
  seattle: "united states",
  seoul: "south korea",
  shanghai: "china",
  taipei: "taiwan",
  tokyo: "japan",
  toronto: "canada",
  vienna: "austria",
  warsaw: "poland",
  wroclaw: "poland",
};

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const city = normalizeCitySlug(url.searchParams.get("city") || "");
  const country = normalizeCountry(url.searchParams.get("country") || "");
  const checkpointCount = normalizeCheckpointCount(url.searchParams.get("checkpoint_count") || "");
  const limitParam = Number(url.searchParams.get("limit") || "");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 25;
  const quarter = getMonthWindow();
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

  const deduped = deduplicateProofs(proofs || []);
  const leaders = buildQuarterLeaderboard({ proofs: deduped, finishedRuns: runs || [] }).slice(0, limit);
  const userIds = leaders.map((l) => l.user_id).filter(Boolean);

  const [memberships, avatarProfiles] = userIds.length
    ? await Promise.all([
        supabaseRequest(
          env,
          `community_memberships?user_id=in.(${userIds.map((id) => encodeURIComponent(id)).join(",")})&status=eq.active&select=user_id`,
          { method: "GET" }
        ).catch(() => []),
        supabaseRequest(
          env,
          `user_profiles?user_id=in.(${userIds.map((id) => encodeURIComponent(id)).join(",")})&select=user_id,avatar_url`,
          { method: "GET" }
        ).catch(() => []),
      ])
    : [[], []];

  const memberSet = new Set((memberships || []).map((m) => m.user_id));
  const avatarMap = new Map((avatarProfiles || []).map((p) => [p.user_id, p.avatar_url || null]));

  return json({
    quarter: {
      label: quarter.label,
      city: city || "",
      country: country || "",
      checkpoint_count: checkpointCount || null,
      leaders: leaders.map((l) => ({
        ...l,
        is_community_member: memberSet.has(l.user_id),
        avatar_url: avatarMap.get(l.user_id) ?? null,
      })),
    },
  });
}
