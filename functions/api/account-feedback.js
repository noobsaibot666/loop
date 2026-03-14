import { json, parseJSON, supabaseRequest, getAuthUser } from "../_utils.js";

const WORD_LIMIT = 200;
const CHAR_LIMIT = 1200;

const trimFeedback = (value = "") => String(value).replace(/\s+/g, " ").trim();
const countWords = (value = "") => (trimFeedback(value).match(/\S+/g) || []).length;

export async function onRequest({ request, env }) {
  if (request.method !== "POST") {
    return json({ error: "method not allowed" }, { status: 405 });
  }

  const authUser = await getAuthUser(env, request);
  const user_id = authUser?.id || "";
  if (!user_id) return json({ error: "login required" }, { status: 401 });

  const body = await parseJSON(request);
  const feedback = trimFeedback(body.feedback || "");
  const rider_name = trimFeedback(body.rider_name || "").slice(0, 60);

  if (!feedback) {
    return json({ error: "feedback required" }, { status: 400 });
  }
  if (feedback.length > CHAR_LIMIT) {
    return json({ error: `keep it under ${CHAR_LIMIT} characters` }, { status: 400 });
  }
  if (countWords(feedback) > WORD_LIMIT) {
    return json({ error: `keep it under ${WORD_LIMIT} words` }, { status: 400 });
  }

  await supabaseRequest(env, "account_feedback", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id,
      email: authUser?.email || null,
      rider_name: rider_name || null,
      feedback,
      source: "account",
    }),
  });

  return json({ ok: true });
}
