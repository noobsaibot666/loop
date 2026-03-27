import { getAuthUser, json, parseJSON, supabaseRequest } from "../../_utils.js";

const clean = (value, max = 80) => String(value || "").trim().slice(0, max);

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ error: "method not allowed" }, { status: 405 });

  const user = await getAuthUser(env, request);
  if (!user?.id) return json({ error: "login required" }, { status: 401 });

  const body = await parseJSON(request);
  const submitCollaboration = Boolean(body?.collaboration_submit);
  const payload = {
    user_id: user.id,
    rider_name: clean(body?.rider_name, 40),
    home_location: clean(body?.home_location, 120),
    bike_name: clean(body?.bike_name, 60),
    bike_ratio: clean(body?.bike_ratio, 40),
    collaboration_note: clean(body?.collaboration_note, 600),
    collaboration_status: submitCollaboration ? "pending" : clean(body?.collaboration_status, 20) || undefined,
    collaboration_requested_at: submitCollaboration ? new Date().toISOString() : body?.collaboration_requested_at || undefined,
    updated_at: new Date().toISOString(),
  };

  let rows;
  try {
    rows = await supabaseRequest(env, "user_profiles", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(payload),
    });
    await supabaseRequest(env, `messenger_proof_posts?user_id=eq.${encodeURIComponent(user.id)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        rider_name: payload.rider_name || null,
        bike_name: payload.bike_name || null,
        bike_ratio: payload.bike_ratio || null,
      }),
    }).catch(() => null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save profile.";
    if (message.toLowerCase().includes("user_profiles")) {
      return json({ error: "Profile fields are not ready in Supabase yet. Apply user_profiles.sql first." }, { status: 500 });
    }
    return json({ error: message }, { status: 500 });
  }

  return json({
    ok: true,
    profile: rows?.[0] || null,
  });
}
