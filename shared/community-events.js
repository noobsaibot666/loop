const resolveSupabaseAdmin = (env) => {
  const url = env?.SUPABASE_URL || env?.VITE_SUPABASE_URL || "";
  const key = env?.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Missing Supabase admin env for community events");
  return { url, key };
};

const requestSupabase = async (env, path, options = {}) => {
  const { url, key } = resolveSupabaseAdmin(env);
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }
  if (!response.ok) throw new Error(data?.message || data?.error || response.statusText || "Community event request failed");
  return data;
};

export const recordCommunityEvent = async (env, payload) => {
  if (!payload?.event_type) return null;
  return requestSupabase(env, "community_membership_events", {
    method: "POST",
    body: JSON.stringify({
      user_id: payload.user_id || null,
      event_type: payload.event_type,
      membership_status: payload.membership_status || null,
      discord_role_status: payload.discord_role_status || null,
      details: payload.details || {},
    }),
  });
};

export const listRecentCommunityEvents = async (env, limit = 12) =>
  requestSupabase(
    env,
    `community_membership_events?select=id,user_id,event_type,membership_status,discord_role_status,details,created_at&order=created_at.desc&limit=${Math.max(
      1,
      Math.min(50, Number(limit) || 12)
    )}`,
    { method: "GET" }
  );
