const json = (data, init = {}) => {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
};

const getEnv = (env, key) => env?.[key] || "";

const requireEnv = (env, key) => {
  const value = getEnv(env, key);
  if (!value) throw new Error(`Missing env: ${key}`);
  return value;
};

const supabaseAdmin = (env) => {
  const url = requireEnv(env, "SUPABASE_URL");
  const key = requireEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  return { url, key };
};

const supabaseAnon = (env) => {
  const url = requireEnv(env, "SUPABASE_URL");
  const key = requireEnv(env, "SUPABASE_ANON_KEY");
  return { url, key };
};

const supabaseRequest = async (env, path, options = {}) => {
  const { url, key } = supabaseAdmin(env);
  const headers = new Headers(options.headers || {});
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${url}/rest/v1/${path}`, { ...options, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(data?.message || res.statusText);
  }
  return data;
};

const supabaseAuthUser = async (env, token) => {
  const { url, key } = supabaseAnon(env);
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  return res.json();
};

const getAdminEmails = (env) => (env.ADMIN_EMAILS || "").split(",").map((v) => v.trim()).filter(Boolean);

const getAuthUser = async (env, request) => {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const user = await supabaseAuthUser(env, token);
  return user || null;
};

const requireAdmin = async (env, request) => {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const user = await supabaseAuthUser(env, token);
  if (!user?.email) return null;
  const admins = getAdminEmails(env);
  if (admins.length && !admins.includes(user.email)) return null;
  return user;
};

const parseJSON = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

export {
  json,
  getEnv,
  requireEnv,
  supabaseRequest,
  supabaseAuthUser,
  getAuthUser,
  requireAdmin,
  parseJSON,
};
