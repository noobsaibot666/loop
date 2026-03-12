import { json, supabaseRequest } from "../_utils.js";

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") || "";
  const buildFilters = (select) => {
    const filters = [
      "is_public=eq.true",
      "archived_at=is.null",
      "order=created_at.desc",
      "limit=40",
      `select=${select}`,
    ];
    if (city.trim()) {
      filters.unshift(`city_slug=eq.${encodeURIComponent(city.trim().toLowerCase())}`);
    }
    return filters.join("&");
  };

  let rows = [];
  try {
    rows =
      (await supabaseRequest(
        env,
        `messenger_proof_posts?${buildFilters("id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at,bike_name,bike_ratio")}`,
        { method: "GET" }
      )) || [];
  } catch {
    rows =
      (await supabaseRequest(
        env,
        `messenger_proof_posts?is_public=eq.true&order=created_at.desc&limit=40${city.trim() ? `&city_slug=eq.${encodeURIComponent(city.trim().toLowerCase())}` : ""}&select=id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at`,
        { method: "GET" }
      )) || [];
  }

  return json({
    posts: rows || [],
  });
}
