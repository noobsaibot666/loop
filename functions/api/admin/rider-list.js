import { json, requireAdmin, supabaseRequest, requireEnv } from "../../_utils.js";

export async function onRequest({ request, env }) {
  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  try {
    const [credits, profiles] = await Promise.all([
      supabaseRequest(env, "user_credits?select=user_id,credits,free_used,updated_at&order=updated_at.desc", { method: "GET" }),
      supabaseRequest(env, "user_profiles?select=user_id,rider_name", { method: "GET" }),
    ]);

    // Fetch auth emails - manual fetch since supabaseRequest targets /rest/v1/
    const url = requireEnv(env, "SUPABASE_URL");
    const key = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
    
    const authRes = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
    
    let authData = { users: [] };
    if (authRes.ok) {
      authData = await authRes.json();
    } else {
      console.error("Admin rider-list auth error status:", authRes.status);
    }

    const emailMap = new Map((authData?.users || []).map((u) => [u.id, u.email]));
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.rider_name]));

    const riders = (credits || []).map((c) => ({
      user_id: c.user_id,
      email: emailMap.get(c.user_id) || "unknown",
      rider_name: nameMap.get(c.user_id) || "",
      credits: c.credits || 0,
      free_used: c.free_used || 0,
      updated_at: c.updated_at,
    }));

    return json({ ok: true, riders });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}
