import { getAuthUser, isAdminEmail, json, parseJSON } from "../../_utils.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const authUser = await getAuthUser(env, request);
  const body = await parseJSON(request);
  const requestedUserId = String(body?.user_id || "").trim();

  if (!authUser) {
    return json({ ok: true, is_admin: false });
  }

  if (requestedUserId && requestedUserId !== authUser.id) {
    return json({ error: "session mismatch" }, { status: 403 });
  }

  return json({
    ok: true,
    is_admin: isAdminEmail(env, authUser.email || ""),
    user_id: authUser.id,
    email: authUser.email || "",
  });
}
