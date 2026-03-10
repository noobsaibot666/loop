import { json, getEnv } from "../_utils.js";

export async function onRequest({ env }) {
  return json({
    supabaseUrl: getEnv(env, "SUPABASE_URL"),
    supabaseAnonKey: getEnv(env, "SUPABASE_ANON_KEY"),
  });
}
