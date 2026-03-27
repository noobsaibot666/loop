import { json, supabaseRequest } from "../_utils.js";

const normalizeCitySlug = (value = "") => String(value).trim().toLowerCase().replace(/\s+/g, "");

const pickWallPosts = (rows = []) => {
  const groups = new Map();
  for (const row of rows) {
    const key = row.run_id || row.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return [...groups.values()]
    .map((group) => {
      const choice = group[Math.floor(Math.random() * group.length)] || group[0];
      return {
        ...choice,
        proof_count: group.length,
      };
    })
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 40);
};

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const city = normalizeCitySlug(url.searchParams.get("city") || "");
  const buildFilters = (select) => {
    const filters = [
      "is_public=eq.true",
      "archived_at=is.null",
      "order=created_at.desc",
      "limit=120",
      `select=${select}`,
    ];
    if (city) {
      filters.unshift(`city_slug=eq.${encodeURIComponent(city)}`);
    }
    return filters.join("&");
  };

  let rows = [];
  try {
    rows =
      (await supabaseRequest(
        env,
        `messenger_proof_posts?${buildFilters("id,run_id,user_id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at,bike_name,bike_ratio")}`,
        { method: "GET" }
      )) || [];
  } catch {
    rows =
      (await supabaseRequest(
        env,
        `messenger_proof_posts?is_public=eq.true&order=created_at.desc&limit=120${city ? `&city_slug=eq.${encodeURIComponent(city)}` : ""}&select=id,run_id,user_id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at`,
        { method: "GET" }
      )) || [];
  }

  return json({
    posts: pickWallPosts(rows || []),
  });
}
