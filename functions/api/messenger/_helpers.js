import { json, supabaseRequest } from "../../_utils.js";

export const MESSENGER_TABLES = {
  manifests: "messenger_manifests",
  runs: "messenger_runs",
  checkins: "messenger_run_checkins",
  challenges: "messenger_challenges",
  challengeEntries: "messenger_challenge_entries",
};

export const consumeMessengerCredits = async (env, userId, cost) => {
  const creditRows = await supabaseRequest(
    env,
    `user_credits?user_id=eq.${encodeURIComponent(userId)}&select=user_id,credits,free_used`,
    { method: "GET" }
  );
  const usage = creditRows?.[0] || { user_id: userId, credits: 0, free_used: 0 };
  const creditsRemaining = usage.credits || 0;

  if (creditsRemaining < cost) {
    return {
      ok: false,
      response: json(
        {
          error: `Alleycat Mode costs ${cost} credits. Top up to unlock a manifest.`,
          credits_remaining: creditsRemaining,
          free_used: usage.free_used || 0,
        },
        { status: 402 }
      ),
    };
  }

  const nextCredits = creditsRemaining - cost;
  await supabaseRequest(env, "user_credits", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      user_id: userId,
      credits: nextCredits,
      free_used: usage.free_used || 0,
    }),
  });

  return {
    ok: true,
    credits_remaining: nextCredits,
    free_used: usage.free_used || 0,
  };
};

export const persistManifest = async (env, payload) => {
  const rows = await supabaseRequest(env, MESSENGER_TABLES.manifests, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  return rows?.[0] || null;
};

export const getManifest = async (env, manifestId) => {
  const rows = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.manifests}?id=eq.${encodeURIComponent(manifestId)}&select=*`,
    { method: "GET" }
  );
  return rows?.[0] || null;
};

export const getRun = async (env, runId) => {
  const rows = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.runs}?id=eq.${encodeURIComponent(runId)}&select=*`,
    { method: "GET" }
  );
  return rows?.[0] || null;
};

export const getActiveRunForManifest = async (env, manifestId, userId) => {
  const rows = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.runs}?manifest_id=eq.${encodeURIComponent(manifestId)}&user_id=eq.${encodeURIComponent(
      userId
    )}&status=eq.active&order=started_at.desc&limit=1&select=*`,
    { method: "GET" }
  );
  return rows?.[0] || null;
};

export const getRunCheckins = async (env, runId) => {
  return supabaseRequest(
    env,
    `${MESSENGER_TABLES.checkins}?run_id=eq.${encodeURIComponent(
      runId
    )}&select=checkpoint_id,checked_in_at,distance_meters,rider_lat,rider_lng`,
    { method: "GET" }
  );
};

export const createChallengeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const getChallengeByCode = async (env, code) => {
  const rows = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.challenges}?code=eq.${encodeURIComponent(code)}&select=*`,
    { method: "GET" }
  );
  return rows?.[0] || null;
};

export const getChallengeById = async (env, challengeId) => {
  const rows = await supabaseRequest(
    env,
    `${MESSENGER_TABLES.challenges}?id=eq.${encodeURIComponent(challengeId)}&select=*`,
    { method: "GET" }
  );
  return rows?.[0] || null;
};

export const getChallengeEntries = async (env, challengeId) => {
  return supabaseRequest(
    env,
    `${MESSENGER_TABLES.challengeEntries}?challenge_id=eq.${encodeURIComponent(
      challengeId
    )}&order=joined_at.asc&select=*`,
    { method: "GET" }
  );
};
