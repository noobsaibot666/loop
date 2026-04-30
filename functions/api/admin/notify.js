import { json, parseJSON, requireAdmin, supabaseRequest } from "../../_utils.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const admin = await requireAdmin(env, request);
  if (!admin) return json({ error: "unauthorized" }, { status: 401 });

  const body = await parseJSON(request);
  const { title, message, route, target, user_ids, platform: filterPlatform } = body ?? {};

  if (!title || !message) return json({ error: "title and message required" }, { status: 400 });

  // Build Supabase query to fetch tokens
  let query = "push_tokens?select=token,platform";
  if (target === "user_ids" && Array.isArray(user_ids) && user_ids.length > 0) {
    query += `&user_id=in.(${user_ids.join(",")})`;
  }
  if (filterPlatform === "ios" || filterPlatform === "android") {
    query += `&platform=eq.${filterPlatform}`;
  }

  const rows = await supabaseRequest(env, query, { method: "GET" });
  if (!Array.isArray(rows) || rows.length === 0) {
    return json({ ok: true, sent: 0, message: "no tokens found" });
  }

  const tokens = rows.map((r) => r.token);

  // Build Expo push messages
  const messages = tokens.map((to) => ({
    to,
    title,
    body: message,
    ...(route ? { data: { route } } : {}),
    sound: "default",
  }));

  // Send in chunks of 100 (Expo limit)
  let totalSucceeded = 0;
  let totalFailed = 0;

  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk),
    });
    if (res.ok) {
      const result = await res.json();
      const receipts = result?.data ?? [];
      for (const receipt of receipts) {
        if (receipt.status === "ok") totalSucceeded++;
        else totalFailed++;
      }
    } else {
      totalFailed += chunk.length;
    }
  }

  return json({ ok: true, sent: totalSucceeded, failed: totalFailed, total: tokens.length });
}
