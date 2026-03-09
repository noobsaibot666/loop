import { json, supabaseRequest } from "../_utils.js";

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") || "";
  const filters = [
    "is_public=eq.true",
    "order=created_at.desc",
    "limit=40",
    "select=id,rider_name,city_name,city_slug,checkpoint_name,location_label,public_url,created_at",
  ];
  if (city.trim()) {
    filters.unshift(`city_slug=eq.${encodeURIComponent(city.trim().toLowerCase())}`);
  }

  const rows = await supabaseRequest(env, `messenger_proof_posts?${filters.join("&")}`, {
    method: "GET",
  });

  return json({
    posts: rows || [],
  });
}
