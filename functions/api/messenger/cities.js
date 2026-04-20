import { supabaseRequest } from "../../_utils.js";

export async function onRequest({ env }) {
  try {
    const packs = await supabaseRequest(
      env,
      "city_packs?is_active=eq.true&select=name,slug&order=name.asc",
      { method: "GET" },
    );
    const cities = (packs || []).map((p) => ({ name: p.name, slug: p.slug }));
    return new Response(JSON.stringify({ cities }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ cities: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
