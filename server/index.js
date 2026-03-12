import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  ALLEYCAT_CHECKIN_RADIUS_METERS,
  buildMessengerManifest,
  buildMessengerManifestFromPack,
  distanceBetweenMeters,
  MESSENGER_CREDIT_COST,
  normalizeCitySlug,
} from "../shared/messenger.js";
import { buildQuarterLeaderboard, deriveBadges, getQuarterWindow, isInWindow } from "../shared/quarterly.js";
import { buildAlleycatHistory, buildChallengeHistory, buildSharedRiders } from "../shared/account.js";
import { buildChallengeSummary, deriveChallengeStatus } from "../shared/challenges.js";
import {
  buildCheckpointDraftPrompt,
  buildPackDraftPrompt,
  callOpenAIJson,
  checkpointDraftSchema,
  packDraftSchema,
} from "../shared/ai.js";

const app = express();
const PORT = process.env.PORT || 8787;

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ORS_API_KEY = process.env.ORS_API_KEY;
const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || "http://localhost:5173";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((v) => v.trim()).filter(Boolean);
const FREE_LIMIT = 3;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || undefined;

const creditsFromAmount = (amountInCents = 0) => {
  const credits = Math.floor(Number(amountInCents || 0) / 50);
  return Math.max(1, credits);
};

const isAdminEmail = (email = "") => {
  if (!email) return false;
  return ADMIN_EMAILS.length ? ADMIN_EMAILS.includes(email) : false;
};

const getAuthUser = async (req) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
};

const consumeMessengerCredits = async (user_id, user_email = "") => {
  if (isAdminEmail(user_email)) {
    return {
      ok: true,
      credits_remaining: 9999,
      free_used: 0,
      is_admin: true,
      unlimited_credits: true,
    };
  }

  const { data, error } = await supabase
    .from("user_credits")
    .select("user_id, free_used, credits")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) throw error;

  const usage = data || { user_id, free_used: 0, credits: 0 };
  const credits = usage.credits || 0;
  if (credits < MESSENGER_CREDIT_COST) {
    return {
      ok: false,
      error: `Alleycat Mode costs ${MESSENGER_CREDIT_COST} credits. Top up to unlock a manifest.`,
      credits_remaining: credits,
      free_used: usage.free_used || 0,
    };
  }

  const nextCredits = credits - MESSENGER_CREDIT_COST;
  const { error: updateError } = await supabase
    .from("user_credits")
    .upsert(
      {
        user_id,
        free_used: usage.free_used || 0,
        credits: nextCredits,
      },
      { onConflict: "user_id" }
    );

  if (updateError) throw updateError;

  return {
    ok: true,
    credits_remaining: nextCredits,
    free_used: usage.free_used || 0,
    is_admin: false,
    unlimited_credits: false,
  };
};

const getDbCityPackByCity = async (city) => {
  const normalized = normalizeCitySlug(city);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from("city_packs")
    .select("*")
    .eq("is_active", true)
    .or(`slug.eq.${normalized},name.ilike.*${normalized}*`)
    .limit(1);
  if (error) return null;
  return data?.[0] || null;
};

const getDbPackCheckpoints = async (packId, activeOnly = true) => {
  let query = supabase
    .from("city_checkpoints")
    .select("*")
    .eq("pack_id", packId)
    .order("sort_weight", { ascending: true })
    .order("created_at", { ascending: true });
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) return [];
  return data || [];
};

const buildManifestFromDatabasePack = ({ pack, checkpoints, difficulty, style, seed, startPoint, startLabel, rangeKm }) =>
  buildMessengerManifestFromPack({
    pack: {
      slug: pack.slug,
      name: pack.name,
      route_note: pack.route_note,
      finish_label: pack.finish_label,
      safety_note: pack.safety_note,
    },
    checkpoints: checkpoints.map((checkpoint) => ({
      id: checkpoint.slug,
      name: checkpoint.name,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
      hint: checkpoint.hint,
      task_local: checkpoint.task_local,
      task_fast: checkpoint.task_fast,
      task_chaotic: checkpoint.task_chaotic,
    })),
    difficulty,
    style,
    seed,
    startPoint,
    startLabel,
    rangeKm,
  });

const getActiveMessengerRun = async (manifest_id, user_id) => {
  const { data, error } = await supabase
    .from("messenger_runs")
    .select("*")
    .eq("manifest_id", manifest_id)
    .eq("user_id", user_id)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

const createChallengeCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

app.use(cors({ origin: true }));

app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], stripeWebhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const user_id = session.metadata?.user_id;
    const amount = session.amount_total || 0;
    const creditAdd = creditsFromAmount(amount);

    if (user_id) {
      const { data } = await supabase
        .from("user_credits")
        .select("user_id, credits, free_used")
        .eq("user_id", user_id)
        .maybeSingle();

      const currentCredits = data?.credits || 0;
      await supabase
        .from("user_credits")
        .upsert({ user_id, credits: currentCredits + creditAdd }, { onConflict: "user_id" });

      await supabase.from("donations").insert({
        user_id,
        amount,
        stripe_session_id: session.id,
      });
    }
  }

  res.json({ received: true });
});

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/public-config", (_req, res) => {
  res.json({
    supabaseUrl,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  });
});

app.post("/api/usage/check", async (req, res) => {
  const { device_id } = req.body || {};
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!device_id && !user_id) return res.status(400).json({ error: "device_id or user_id required" });

  if (user_id) {
    const { data, error } = await supabase
      .from("user_credits")
      .select("user_id, free_used, credits")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    const usage = data || { user_id, free_used: 0, credits: 0 };
    const isAdmin = isAdminEmail(authUser?.email || "");
    return res.json({
      user_id,
      free_used: usage.free_used,
      donation_credits: usage.credits,
      free_remaining: isAdmin ? 9999 : Math.max(0, FREE_LIMIT - usage.free_used),
      credits_remaining: isAdmin ? 9999 : usage.credits || 0,
      is_admin: isAdmin,
      unlimited_credits: isAdmin,
    });
  }

  const { data, error } = await supabase
    .from("device_usage")
    .select("device_id, free_used, donation_credits")
    .eq("device_id", device_id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  const usage = data || { device_id, free_used: 0, donation_credits: 0 };
  return res.json({
    ...usage,
    free_remaining: Math.max(0, FREE_LIMIT - usage.free_used),
    credits_remaining: usage.donation_credits || 0,
  });
});

const requireAdmin = async (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "unauthorized" });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.email) return res.status(401).json({ error: "unauthorized" });
  if (ADMIN_EMAILS.length && !ADMIN_EMAILS.includes(data.user.email)) {
    return res.status(403).json({ error: "forbidden" });
  }
  req.adminUser = data.user;
  return next();
};

app.post("/api/admin/reset", requireAdmin, async (req, res) => {
  const { device_id, user_id } = req.body || {};
  if (user_id) {
    const { error } = await supabase.from("user_credits").delete().eq("user_id", user_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, user_id });
  }
  if (device_id) {
    const { error } = await supabase.from("device_usage").delete().eq("device_id", device_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, device_id });
  }
  const { error } = await supabase.from("device_usage").delete().neq("device_id", "");
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, cleared: "all" });
});

app.post("/api/admin/set-credits", requireAdmin, async (req, res) => {
  const { device_id, user_id, free_used = 0, donation_credits = 0, credits = 0 } = req.body || {};
  if (!device_id && !user_id) return res.status(400).json({ error: "device_id or user_id required" });
  if (user_id) {
    const { error } = await supabase
      .from("user_credits")
      .upsert({ user_id, free_used, credits: credits || donation_credits }, { onConflict: "user_id" });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, user_id, free_used, credits: credits || donation_credits });
  }
  const { error } = await supabase
    .from("device_usage")
    .upsert({ device_id, free_used, donation_credits }, { onConflict: "device_id" });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, device_id, free_used, donation_credits });
});

app.post("/api/admin/overview", requireAdmin, async (req, res) => {
  const quarter = getQuarterWindow();
  const [
    { data: credits, error: creditsError },
    { data: stripeSessions, error: stripeError },
    { data: manifests, error: manifestsError },
    { data: runs, error: runsError },
    { data: challenges, error: challengesError },
    { data: proofs, error: proofsError },
    { data: quarterProofs, error: quarterProofsError },
    { data: quarterRuns, error: quarterRunsError },
  ] =
    await Promise.all([
      supabase.from("user_credits").select("user_id, credits, free_used"),
      supabase.from("stripe_sessions").select("session_id, status, amount_cents").order("created_at", { ascending: false }).limit(5),
      supabase.from("messenger_manifests").select("id"),
      supabase.from("messenger_runs").select("id, status"),
      supabase.from("messenger_challenges").select("id"),
      supabase
        .from("messenger_proof_posts")
        .select("id, rider_name, city_name, checkpoint_name, is_public, created_at, public_url")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("messenger_proof_posts")
        .select("user_id, rider_name, city_name, created_at")
        .eq("is_public", true)
        .gte("created_at", quarter.start.toISOString())
        .lt("created_at", quarter.end.toISOString()),
      supabase
        .from("messenger_runs")
        .select("user_id, finished_at")
        .eq("status", "finished")
        .gte("finished_at", quarter.start.toISOString())
        .lt("finished_at", quarter.end.toISOString()),
    ]);

  const error = creditsError || stripeError || manifestsError || runsError || challengesError || proofsError || quarterProofsError || quarterRunsError;
  if (error) return res.status(500).json({ error: error.message });
  const quarterLeaderboard = buildQuarterLeaderboard({
    proofs: quarterProofs || [],
    finishedRuns: quarterRuns || [],
  });

  return res.json({
    ok: true,
    admin_email: req.adminUser?.email || "",
    metrics: {
      riders_with_credits: credits?.length || 0,
      total_paid_credits: (credits || []).reduce((sum, row) => sum + (row.credits || 0), 0),
      alleycat_manifests: manifests?.length || 0,
      alleycat_runs: runs?.length || 0,
      finished_runs: (runs || []).filter((run) => run.status === "finished").length,
      shared_challenges: challenges?.length || 0,
    },
    recent_sessions: stripeSessions || [],
    recent_proofs: proofs || [],
    quarter: {
      label: quarter.label,
      leaders: quarterLeaderboard.slice(0, 3),
    },
  });
});

app.post("/api/admin/city-packs", requireAdmin, async (req, res) => {
  if (req.body?.action === "save") {
    const payload = {
      id: req.body?.id || undefined,
      slug: String(req.body?.slug || "").trim().toLowerCase(),
      name: String(req.body?.name || "").trim(),
      route_note: String(req.body?.route_note || "").trim(),
      finish_label: String(req.body?.finish_label || "").trim(),
      safety_note: String(req.body?.safety_note || "").trim(),
      is_active: req.body?.is_active !== false,
    };
    if (!payload.slug || !payload.name) return res.status(400).json({ error: "slug and name required" });
    const { data, error } = await supabase.from("city_packs").upsert(payload, { onConflict: "slug" }).select().limit(1);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, pack: data?.[0] || null });
  }

  const { data, error } = await supabase.from("city_packs").select("*").order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ packs: data || [] });
});

app.post("/api/admin/city-checkpoints", requireAdmin, async (req, res) => {
  const packId = String(req.body?.pack_id || "").trim();
  if (req.body?.action === "save") {
    const payload = {
      id: req.body?.id || undefined,
      pack_id: packId,
      slug: String(req.body?.slug || "").trim().toLowerCase(),
      name: String(req.body?.name || "").trim(),
      lat: Number(req.body?.lat),
      lng: Number(req.body?.lng),
      district: String(req.body?.district || "").trim(),
      category: String(req.body?.category || "").trim(),
      vibe: String(req.body?.vibe || "").trim(),
      hint: String(req.body?.hint || "").trim(),
      task_local: String(req.body?.task_local || "").trim(),
      task_fast: String(req.body?.task_fast || "").trim(),
      task_chaotic: String(req.body?.task_chaotic || "").trim(),
      sort_weight: Number(req.body?.sort_weight || 100),
      is_active: req.body?.is_active !== false,
    };
    if (!payload.pack_id || !payload.slug || !payload.name || !Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) {
      return res.status(400).json({ error: "pack_id, slug, name, lat, and lng required" });
    }
    if (!payload.hint || !payload.task_local || !payload.task_fast || !payload.task_chaotic) {
      return res.status(400).json({ error: "hint and all task variants required" });
    }
    const { data, error } = await supabase.from("city_checkpoints").upsert(payload, { onConflict: "slug" }).select().limit(1);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, checkpoint: data?.[0] || null });
  }
  if (!packId) return res.json({ checkpoints: [] });
  const { data, error } = await supabase
    .from("city_checkpoints")
    .select("*")
    .eq("pack_id", packId)
    .order("sort_weight", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ checkpoints: data || [] });
});

app.post("/api/admin/preview-manifest", requireAdmin, async (req, res) => {
  const difficulty = String(req.body?.difficulty || "medium").trim().toLowerCase();
  const style = String(req.body?.style || "local").trim().toLowerCase();
  const seed = Number(req.body?.seed || 777);
  const packId = String(req.body?.pack_id || "").trim();
  const city = String(req.body?.city || "").trim();

  let built;
  if (packId) {
    const { data: pack } = await supabase.from("city_packs").select("*").eq("id", packId).maybeSingle();
    const checkpoints = pack ? await getDbPackCheckpoints(pack.id, false) : [];
    built =
      pack && checkpoints.length
        ? buildManifestFromDatabasePack({ pack, checkpoints, difficulty, style, seed })
        : { error: "Pack not found or empty." };
  } else {
    const pack = await getDbCityPackByCity(city);
    const checkpoints = pack ? await getDbPackCheckpoints(pack.id, true) : [];
    built =
      pack && checkpoints.length
        ? buildManifestFromDatabasePack({ pack, checkpoints, difficulty, style, seed })
        : buildMessengerManifest({ city, difficulty, style, seed });
  }

  if (built.error) return res.status(400).json({ error: built.error });
  return res.json({ manifest: built.manifest, source: packId || city ? "database-or-fallback" : "fallback" });
});

app.post("/api/admin/ai-draft", requireAdmin, async (req, res) => {
  if (!OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });
  const kind = String(req.body?.kind || "").trim();
  try {
    if (kind === "checkpoint") {
      const draft = await callOpenAIJson({
        apiKey: OPENAI_API_KEY,
        model: OPENAI_MODEL,
        schemaName: "alleycat_checkpoint_draft",
        schema: checkpointDraftSchema,
        userPrompt: buildCheckpointDraftPrompt(req.body || {}),
      });
      return res.json({ ok: true, kind, draft });
    }
    if (kind === "pack") {
      const draft = await callOpenAIJson({
        apiKey: OPENAI_API_KEY,
        model: OPENAI_MODEL,
        schemaName: "alleycat_pack_draft",
        schema: packDraftSchema,
        userPrompt: buildPackDraftPrompt(req.body || {}),
      });
      return res.json({ ok: true, kind, draft });
    }
    return res.status(400).json({ error: "kind must be checkpoint or pack" });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : "AI draft failed" });
  }
});

app.post("/api/admin/proof-visibility", requireAdmin, async (req, res) => {
  const proof_id = String(req.body?.proof_id || "").trim();
  const is_public = Boolean(req.body?.is_public);
  if (!proof_id) return res.status(400).json({ error: "proof_id required" });

  const { data, error } = await supabase
    .from("messenger_proof_posts")
    .update({ is_public })
    .eq("id", proof_id)
    .select("id, rider_name, city_name, checkpoint_name, is_public, created_at, public_url")
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({
    ok: true,
    proof: data?.[0] || null,
  });
});

app.post("/api/account/summary", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });
  const quarter = getQuarterWindow();

  const [
    { data: purchases, error: purchasesError },
    { data: loopHistory, error: loopHistoryError },
    { data: manifests, error: manifestsError },
    { data: runs, error: runsError },
    { data: challengeEntries, error: challengeEntriesError },
    { data: proofs, error: proofsError },
    { data: quarterProofs, error: quarterProofsError },
    { data: quarterRuns, error: quarterRunsError },
  ] =
    await Promise.all([
      supabase
        .from("stripe_sessions")
        .select("session_id, amount_cents, credits_to_grant, status, created_at")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("loop_history")
        .select("id, loop_point, distance_km, unit, terrain, surface, vibe, route_url, created_at")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("messenger_manifests")
        .select("id, city_name, manifest_title, difficulty, style, created_at, source_challenge_id, ghost_seconds")
        .eq("user_id", user_id),
      supabase
        .from("messenger_runs")
        .select("id, user_id, manifest_id, status, finish_seconds, finished_at, started_at")
        .eq("user_id", user_id),
      supabase
        .from("messenger_challenge_entries")
        .select("id, challenge_id, user_id, manifest_id, joined_at")
        .eq("user_id", user_id),
      supabase
        .from("messenger_proof_posts")
        .select("id, user_id, is_public, city_name, manifest_id, created_at")
        .eq("user_id", user_id),
      supabase
        .from("messenger_proof_posts")
        .select("user_id, rider_name, city_name, created_at")
        .eq("is_public", true)
        .gte("created_at", quarter.start.toISOString())
        .lt("created_at", quarter.end.toISOString()),
      supabase
        .from("messenger_runs")
        .select("user_id, finished_at")
        .eq("status", "finished")
        .gte("finished_at", quarter.start.toISOString())
        .lt("finished_at", quarter.end.toISOString()),
    ]);

  const error =
    purchasesError ||
    loopHistoryError ||
    manifestsError ||
    runsError ||
    challengeEntriesError ||
    proofsError ||
    quarterProofsError ||
    quarterRunsError;
  if (error) return res.status(500).json({ error: error.message });

  const userRuns = runs || [];
  const userProofs = proofs || [];
  const userManifests = manifests || [];
  const userChallengeEntries = challengeEntries || [];
  const challengeIds = [...new Set(userChallengeEntries.map((entry) => entry.challenge_id))];
  const [userChallenges, challengeEntriesByChallenge, challengeManifests, challengeRuns, challengeProofNames] = await Promise.all([
    challengeIds.length
      ? Promise.all(
          challengeIds.map(async (challengeId) => {
            const { data } = await supabase
              .from("messenger_challenges")
              .select("id, code, creator_user_id, claimed_by_user_id, created_at")
              .eq("id", challengeId)
              .limit(1);
            return data?.[0] || null;
          })
        ).then((rows) => rows.filter(Boolean))
      : Promise.resolve([]),
    challengeIds.length
      ? Promise.all(
          challengeIds.map(async (challengeId) => {
            const { data } = await supabase
              .from("messenger_challenge_entries")
              .select("id, challenge_id, user_id, manifest_id, joined_at")
              .eq("challenge_id", challengeId);
            return data || [];
          })
        ).then((rows) => rows.flat())
      : Promise.resolve([]),
    challengeIds.length
      ? Promise.all(
          challengeIds.map(async (challengeId) => {
            const { data: entriesData } = await supabase
              .from("messenger_challenge_entries")
              .select("manifest_id")
              .eq("challenge_id", challengeId);
            const manifestIds = (entriesData || []).map((entry) => entry.manifest_id);
            if (!manifestIds.length) return [];
            const { data } = await supabase
              .from("messenger_manifests")
              .select("id, city_name, manifest_title, difficulty, style, created_at, source_challenge_id, ghost_seconds")
              .in("id", manifestIds);
            return data || [];
          })
        ).then((rows) => rows.flat())
      : Promise.resolve([]),
    challengeIds.length
      ? Promise.all(
          challengeIds.map(async (challengeId) => {
            const { data: entriesData } = await supabase
              .from("messenger_challenge_entries")
              .select("manifest_id")
              .eq("challenge_id", challengeId);
            const manifestIds = (entriesData || []).map((entry) => entry.manifest_id);
            if (!manifestIds.length) return [];
            const { data } = await supabase
              .from("messenger_runs")
              .select("id, user_id, manifest_id, status, finish_seconds, finished_at, started_at")
              .in("manifest_id", manifestIds);
            return data || [];
          })
        ).then((rows) => rows.flat())
      : Promise.resolve([]),
    challengeIds.length
      ? Promise.all(
          challengeIds.map(async (challengeId) => {
            const { data: entriesData } = await supabase
              .from("messenger_challenge_entries")
              .select("manifest_id")
              .eq("challenge_id", challengeId);
            const manifestIds = (entriesData || []).map((entry) => entry.manifest_id);
            if (!manifestIds.length) return [];
            const { data } = await supabase.from("messenger_proof_posts").select("user_id, rider_name").in("manifest_id", manifestIds);
            return data || [];
          })
        ).then((rows) => rows.flat())
      : Promise.resolve([]),
  ]);
  const quarterLeaderboard = buildQuarterLeaderboard({
    proofs: quarterProofs || [],
    finishedRuns: quarterRuns || [],
  });
  const userQuarterRuns = userRuns.filter((run) => run.status === "finished" && isInWindow(run.finished_at, quarter.start, quarter.end));
  const userQuarterProofs = userProofs.filter((proof) => proof.is_public && isInWindow(proof.created_at, quarter.start, quarter.end));
  const challengeManifestIds = new Set(userManifests.filter((manifest) => manifest.source_challenge_id).map((manifest) => manifest.id));
  const userQuarterRank = quarterLeaderboard.find((entry) => entry.user_id === user_id)?.rank || null;
  const badges = deriveBadges({
    quarterStats: {
      rank: userQuarterRank,
      finished_runs: userQuarterRuns.length,
    },
    proofs: userProofs,
    manifests: userManifests,
    challenges: userRuns.map((run) => ({
      status: run.status,
      source_challenge_id: challengeManifestIds.has(run.manifest_id),
    })),
  });

  return res.json({
    purchases: purchases || [],
    alleycat: {
      manifests: userManifests.length,
      runs: userRuns.length,
      finished_runs: userRuns.filter((run) => run.status === "finished").length,
      challenges: challenges?.length || 0,
      proofs: userProofs.length,
      public_proofs: userProofs.filter((proof) => proof.is_public).length,
    },
    quarter: {
      label: quarter.label,
      public_proofs: userQuarterProofs.length,
      finished_runs: userQuarterRuns.length,
      rank: userQuarterRank,
      total_ranked_riders: quarterLeaderboard.length,
      leaders: quarterLeaderboard.slice(0, 3),
    },
    badges,
    loop_history: loopHistory || [],
    alleycat_history: buildAlleycatHistory({
      manifests: [...userManifests, ...challengeManifests.filter((item) => !userManifests.find((own) => own.id === item.id))],
      runs: [...userRuns, ...challengeRuns.filter((item) => !userRuns.find((own) => own.id === item.id))],
      proofs: userProofs,
    }),
    challenge_history: buildChallengeHistory({
      userId: user_id,
      entries: userChallengeEntries,
      allEntries: challengeEntriesByChallenge,
      challenges: userChallenges,
      manifests: challengeManifests,
      runs: challengeRuns,
    }),
    shared_riders: buildSharedRiders({
      userId: user_id,
      allEntries: challengeEntriesByChallenge,
      challenges: userChallenges,
      manifests: challengeManifests,
      proofs: challengeProofNames,
    }),
  });
});

app.post("/api/usage/consume", async (req, res) => {
  const { device_id } = req.body || {};
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  const isAdmin = isAdminEmail(authUser?.email || "");
  if (!device_id && !user_id) return res.status(400).json({ error: "device_id or user_id required" });

  if (isAdmin) {
    return res.json({
      allowed: true,
      free_used: 0,
      donation_credits: 9999,
      credits_remaining: 9999,
      is_admin: true,
      unlimited_credits: true,
    });
  }

  if (user_id) {
    const { data, error } = await supabase
      .from("user_credits")
      .select("user_id, free_used, credits")
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });

    const usage = data || { user_id, free_used: 0, credits: 0 };

    let allowed = false;
    let free_used = usage.free_used;
    let credits = usage.credits;

    if (free_used < FREE_LIMIT) {
      free_used += 1;
      allowed = true;
    } else if (credits > 0) {
      credits -= 1;
      allowed = true;
    }

    if (!allowed) {
      return res.json({ allowed: false, free_used, donation_credits: credits, credits_remaining: credits });
    }

    const { error: upsertError } = await supabase
      .from("user_credits")
      .upsert({ user_id, free_used, credits }, { onConflict: "user_id" });

    if (upsertError) return res.status(500).json({ error: upsertError.message });

    return res.json({
      allowed: true,
      free_used,
      donation_credits: credits,
      credits_remaining: credits,
      is_admin: false,
      unlimited_credits: false,
    });
  }

  const { data, error } = await supabase
    .from("device_usage")
    .select("device_id, free_used, donation_credits")
    .eq("device_id", device_id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  const usage = data || { device_id, free_used: 0, donation_credits: 0 };

  let allowed = false;
  let free_used = usage.free_used;
  let donation_credits = usage.donation_credits;

  if (free_used < FREE_LIMIT) {
    free_used += 1;
    allowed = true;
  } else if (donation_credits > 0) {
    donation_credits -= 1;
    allowed = true;
  }

  if (!allowed) {
    return res.json({ allowed: false, free_used, donation_credits, credits_remaining: donation_credits });
  }

  const { error: upsertError } = await supabase
    .from("device_usage")
    .upsert({ device_id, free_used, donation_credits }, { onConflict: "device_id" });

  if (upsertError) return res.status(500).json({ error: upsertError.message });

  res.json({ allowed: true, free_used, donation_credits, credits_remaining: donation_credits, is_admin: false, unlimited_credits: false });
});

app.post("/api/save-setup", async (req, res) => {
  const { device_id, loop_point, distance, unit, terrain, surface, vibe } = req.body || {};
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || null;
  if (!device_id) return res.status(400).json({ error: "device_id required" });

  const { error } = await supabase.from("saved_setups").insert({
    device_id,
    user_id,
    loop_point,
    distance,
    unit,
    terrain,
    surface,
    vibe,
  });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

app.post("/api/create-checkout-session", async (req, res) => {
  const { amount } = req.body || {};
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "auth required" });

  const amountInCents = Math.max(500, Number(amount || 500));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${APP_URL}/?donation=success`,
    cancel_url: `${APP_URL}/?donation=cancel`,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Loop credits donation" },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    metadata: { user_id },
  });

  res.json({ url: session.url });
});

app.post("/api/geocode", async (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text required" });
  if (!ORS_API_KEY) return res.status(500).json({ error: "ORS_API_KEY missing" });

  const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
    text
  )}`;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.post("/api/loop", async (req, res) => {
  const { coords, distance_km, seed } = req.body || {};
  if (!coords || coords.length !== 2) return res.status(400).json({ error: "coords required" });
  if (!ORS_API_KEY) return res.status(500).json({ error: "ORS_API_KEY missing" });

  const body = {
    coordinates: [[coords[0], coords[1]]],
    options: {
      round_trip: {
        length: Math.max(1000, distance_km * 1000),
        points: 3,
        seed: seed || 1,
      },
    },
  };

  const response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: ORS_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  res.json(data);
});

app.post("/api/loop-history", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const loop_point = String(req.body?.loop_point || "").trim();
  const route_url = String(req.body?.route_url || "").trim();
  const distance_km = Number(req.body?.distance_km || 0);
  const unit = String(req.body?.unit || "").trim();
  const terrain = String(req.body?.terrain || "").trim();
  const surface = String(req.body?.surface || "").trim();
  const vibe = String(req.body?.vibe || "").trim();

  if (!loop_point || !route_url || !distance_km || !unit || !terrain || !surface || !vibe) {
    return res.status(400).json({ error: "missing loop history fields" });
  }

  const { data, error } = await supabase
    .from("loop_history")
    .insert({
      user_id,
      loop_point,
      distance_km,
      unit,
      terrain,
      surface,
      vibe,
      route_url,
    })
    .select("id, loop_point, distance_km, unit, terrain, surface, vibe, route_url, created_at")
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, loop: data?.[0] || null });
});

app.post("/api/messenger/generate", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const { city, difficulty, style, start_lat, start_lng, start_label, range_km } = req.body || {};
  const seed = Math.floor(Math.random() * 100000);
  const startPoint =
    Number.isFinite(Number(start_lat)) && Number.isFinite(Number(start_lng))
      ? { lat: Number(start_lat), lng: Number(start_lng) }
      : null;
  const dbPack = await getDbCityPackByCity(city);
  const dbCheckpoints = dbPack ? await getDbPackCheckpoints(dbPack.id, true) : [];
  const built =
    dbPack && dbCheckpoints.length
      ? buildManifestFromDatabasePack({
          pack: dbPack,
          checkpoints: dbCheckpoints,
          difficulty,
          style,
          seed,
          startPoint,
          startLabel: String(start_label || ""),
          rangeKm: Number(range_km || 0) || null,
        })
      : buildMessengerManifest({
          city,
          difficulty,
          style,
          seed,
          startPoint,
          startLabel: String(start_label || ""),
          rangeKm: Number(range_km || 0) || null,
        });

  if (built.error) return res.status(400).json({ error: built.error });

  try {
    const creditResult = await consumeMessengerCredits(user_id, authUser?.email || "");
    if (!creditResult.ok) {
      return res.status(402).json({
        error: creditResult.error,
        credits_remaining: creditResult.credits_remaining,
        free_used: creditResult.free_used,
      });
    }

    const manifest = built.manifest;
    const { data, error } = await supabase
      .from("messenger_manifests")
      .insert({
        id: manifest.id,
        user_id,
        city_slug: manifest.city_slug,
        city_name: manifest.city,
        difficulty: manifest.difficulty,
        style: manifest.style,
        manifest_title: manifest.manifest_title,
        estimated_minutes: manifest.estimated_minutes,
        ghost_seconds: manifest.ghost_seconds,
        checkpoint_count: manifest.checkpoint_count,
        manifest,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({
      manifest_id: data.id,
      manifest,
      credits_remaining: creditResult.credits_remaining,
      is_admin: creditResult.is_admin || false,
      unlimited_credits: creditResult.unlimited_credits || false,
      premium_cost: MESSENGER_CREDIT_COST,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Messenger generation failed";
    return res.status(500).json({ error: message });
  }
});

app.post("/api/messenger/start", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const { manifest_id: manifestId } = req.body || {};
  if (!manifestId) return res.status(400).json({ error: "manifest_id required" });

  const { data: manifest, error: manifestError } = await supabase
    .from("messenger_manifests")
    .select("*")
    .eq("id", manifestId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (manifestError) return res.status(500).json({ error: manifestError.message });
  if (!manifest) return res.status(404).json({ error: "manifest not found" });

  try {
    const activeRun = await getActiveMessengerRun(manifestId, user_id);
    if (activeRun) {
      return res.json({
        run_id: activeRun.id,
        manifest_id: manifestId,
        started_at: activeRun.started_at,
        status: activeRun.status,
        reused: true,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "run lookup failed";
    return res.status(500).json({ error: message });
  }

  const { data: run, error } = await supabase
    .from("messenger_runs")
    .insert({
      user_id,
      manifest_id: manifestId,
      status: "active",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({
    run_id: run.id,
    manifest_id: manifestId,
    started_at: run.started_at,
    status: run.status,
  });
});

app.post("/api/messenger/abandon", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const runId = String(req.body?.run_id || "").trim();
  if (!runId) return res.status(400).json({ error: "run_id required" });

  const { data: run, error: runError } = await supabase
    .from("messenger_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user_id)
    .maybeSingle();
  if (runError) return res.status(500).json({ error: runError.message });
  if (!run) return res.status(404).json({ error: "run not found" });
  if (run.status !== "active") return res.status(400).json({ error: "run is not active" });

  const { data: updated, error: updateError } = await supabase
    .from("messenger_runs")
    .update({ status: "abandoned", finished_at: new Date().toISOString() })
    .eq("id", runId)
    .select()
    .single();
  if (updateError) return res.status(500).json({ error: updateError.message });
  return res.json({ ok: true, run: updated });
});

app.post("/api/messenger/restart", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const manifestIdInput = String(req.body?.manifest_id || "").trim();
  const runId = String(req.body?.run_id || "").trim();
  if (!manifestIdInput && !runId) return res.status(400).json({ error: "manifest_id or run_id required" });

  let effectiveManifestId = manifestIdInput;
  if (runId) {
    const { data: sourceRun } = await supabase
      .from("messenger_runs")
      .select("*")
      .eq("id", runId)
      .eq("user_id", user_id)
      .maybeSingle();
    if (!sourceRun) return res.status(404).json({ error: "run not found" });
    effectiveManifestId = sourceRun.manifest_id;
  }

  const { data: manifest, error: manifestError } = await supabase
    .from("messenger_manifests")
    .select("*")
    .eq("id", effectiveManifestId)
    .eq("user_id", user_id)
    .maybeSingle();
  if (manifestError) return res.status(500).json({ error: manifestError.message });
  if (!manifest) return res.status(404).json({ error: "manifest not found" });

  await supabase
    .from("messenger_runs")
    .update({ status: "abandoned", finished_at: new Date().toISOString() })
    .eq("manifest_id", effectiveManifestId)
    .eq("user_id", user_id)
    .eq("status", "active");

  const { data: run, error: createError } = await supabase
    .from("messenger_runs")
    .insert({ manifest_id: effectiveManifestId, user_id, status: "active" })
    .select()
    .single();
  if (createError) return res.status(500).json({ error: createError.message });

  return res.json({ ok: true, run, manifest_id: effectiveManifestId });
});

app.post("/api/messenger/check-in", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const { run_id: runId, checkpoint_id: checkpointId, lat, lng } = req.body || {};
  if (!runId || !checkpointId) return res.status(400).json({ error: "run_id and checkpoint_id required" });
  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "location required for check-in" });
  }

  const { data: run, error: runError } = await supabase
    .from("messenger_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (runError) return res.status(500).json({ error: runError.message });
  if (!run) return res.status(404).json({ error: "run not found" });
  if (run.status !== "active") return res.status(400).json({ error: "run is not active" });

  const { data: manifest, error: manifestError } = await supabase
    .from("messenger_manifests")
    .select("manifest")
    .eq("id", run.manifest_id)
    .maybeSingle();

  if (manifestError) return res.status(500).json({ error: manifestError.message });
  const checkpoints = manifest?.manifest?.checkpoints || [];
  const checkpoint = checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) {
    return res.status(400).json({ error: "checkpoint not part of manifest" });
  }
  const { data: existingCheckins } = await supabase
    .from("messenger_run_checkins")
    .select("checkpoint_id")
    .eq("run_id", runId);
  if ((existingCheckins || []).some((item) => item.checkpoint_id === checkpointId)) {
    return res.json({
      ok: true,
      already_checked_in: true,
      run_id: runId,
      checkpoint_id: checkpointId,
      completed_ids: (existingCheckins || []).map((row) => row.checkpoint_id),
      message: `${checkpoint.name} is already checked in.`,
    });
  }

  const distanceMeters = distanceBetweenMeters(
    { lat, lng },
    { lat: checkpoint.lat, lng: checkpoint.lng }
  );
  if (distanceMeters > ALLEYCAT_CHECKIN_RADIUS_METERS) {
    return res.status(400).json({
      error: `Move closer to ${checkpoint.name} before checking in. You are ${distanceMeters}m away.`,
      distance_meters: distanceMeters,
      max_distance_meters: ALLEYCAT_CHECKIN_RADIUS_METERS,
      meters_to_move: distanceMeters - ALLEYCAT_CHECKIN_RADIUS_METERS,
    });
  }

  const { error: insertError } = await supabase
    .from("messenger_run_checkins")
    .upsert(
      {
        run_id: runId,
        checkpoint_id: checkpointId,
        rider_lat: lat,
        rider_lng: lng,
        distance_meters: distanceMeters,
      },
      { onConflict: "run_id,checkpoint_id" }
    );

  if (insertError) return res.status(500).json({ error: insertError.message });

  const { data: checkins, error: checkinsError } = await supabase
    .from("messenger_run_checkins")
    .select("checkpoint_id")
    .eq("run_id", runId);

  if (checkinsError) return res.status(500).json({ error: checkinsError.message });
  return res.json({
    ok: true,
    run_id: runId,
    checkpoint_id: checkpointId,
    completed_ids: (checkins || []).map((row) => row.checkpoint_id),
    distance_meters: distanceMeters,
  });
});

app.post("/api/messenger/finish", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const { run_id: runId } = req.body || {};
  if (!runId) return res.status(400).json({ error: "run_id required" });

  const { data: run, error: runError } = await supabase
    .from("messenger_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (runError) return res.status(500).json({ error: runError.message });
  if (!run) return res.status(404).json({ error: "run not found" });
  if (run.status !== "active") return res.status(400).json({ error: "run is not active" });

  const { data: manifest, error: manifestError } = await supabase
    .from("messenger_manifests")
    .select("manifest,ghost_seconds")
    .eq("id", run.manifest_id)
    .maybeSingle();

  if (manifestError) return res.status(500).json({ error: manifestError.message });

  const { data: checkins, error: checkinsError } = await supabase
    .from("messenger_run_checkins")
    .select("checkpoint_id")
    .eq("run_id", runId);

  if (checkinsError) return res.status(500).json({ error: checkinsError.message });

  const completed = new Set((checkins || []).map((row) => row.checkpoint_id));
  const missing = (manifest?.manifest?.checkpoints || []).filter((checkpoint) => !completed.has(checkpoint.id));
  if (missing.length) {
    return res.status(400).json({
      error: "Complete every checkpoint before finishing.",
      missing_ids: missing.map((checkpoint) => checkpoint.id),
    });
  }

  const finishSeconds = Math.max(1, Math.round((Date.now() - new Date(run.started_at).getTime()) / 1000));
  const { data: updated, error: updateError } = await supabase
    .from("messenger_runs")
    .update({
      status: "finished",
      finished_at: new Date().toISOString(),
      finish_seconds: finishSeconds,
    })
    .eq("id", runId)
    .select()
    .single();

  if (updateError) return res.status(500).json({ error: updateError.message });
  return res.json({
    ok: true,
    run_id: runId,
    status: updated.status,
    finished_at: updated.finished_at,
    finish_seconds: finishSeconds,
    ghost_seconds: manifest?.ghost_seconds || manifest?.manifest?.ghost_seconds || 0,
  });
});

app.all("/api/messenger/run-state", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const runId = (req.method === "GET" ? req.query.run_id : req.body?.run_id) || "";
  if (!runId) return res.status(400).json({ error: "run_id required" });

  const { data: run, error: runError } = await supabase
    .from("messenger_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (runError) return res.status(500).json({ error: runError.message });
  if (!run) return res.status(404).json({ error: "run not found" });

  const { data: manifest, error: manifestError } = await supabase
    .from("messenger_manifests")
    .select("*")
    .eq("id", run.manifest_id)
    .maybeSingle();

  if (manifestError) return res.status(500).json({ error: manifestError.message });

  const { data: checkins, error: checkinsError } = await supabase
    .from("messenger_run_checkins")
    .select("checkpoint_id")
    .eq("run_id", runId);

  if (checkinsError) return res.status(500).json({ error: checkinsError.message });

  const { data: proofs, error: proofsError } = await supabase
    .from("messenger_proof_posts")
    .select("id, checkpoint_id, checkpoint_name, public_url, location_label, is_public, created_at")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (proofsError) return res.status(500).json({ error: proofsError.message });

  let challenge = null;
  if (manifest?.source_challenge_id) {
    const { data: challengeRow } = await supabase
      .from("messenger_challenges")
      .select("*")
      .eq("id", manifest.source_challenge_id)
      .maybeSingle();
    if (challengeRow) {
      challenge = {
        id: challengeRow.id,
        code: challengeRow.code,
      };
    }
  }

  return res.json({
    run: {
      id: run.id,
      status: run.status,
      started_at: run.started_at,
      finished_at: run.finished_at,
      finish_seconds: run.finish_seconds,
      completed_ids: (checkins || []).map((row) => row.checkpoint_id),
    },
    manifest_id: manifest?.id || run.manifest_id,
    manifest: manifest?.manifest || null,
    proofs: proofs || [],
    challenge,
  });
});

app.post("/api/messenger/proof", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const { run_id: runId, checkpoint_id: checkpointId, storage_path: storagePath, public_url: publicUrl, is_public: isPublic } = req.body || {};
  if (!runId || !checkpointId || !storagePath || !publicUrl) {
    return res.status(400).json({ error: "run_id, checkpoint_id, storage_path, and public_url required" });
  }

  const { data: run, error: runError } = await supabase
    .from("messenger_runs")
    .select("*")
    .eq("id", runId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (runError) return res.status(500).json({ error: runError.message });
  if (!run) return res.status(404).json({ error: "run not found" });

  const { data: checkins, error: checkinsError } = await supabase
    .from("messenger_run_checkins")
    .select("checkpoint_id")
    .eq("run_id", runId);

  if (checkinsError) return res.status(500).json({ error: checkinsError.message });
  if (!(checkins || []).some((row) => row.checkpoint_id === checkpointId)) {
    return res.status(400).json({ error: "check in at the checkpoint before posting proof" });
  }
  const { data: existingProofs, error: existingProofsError } = await supabase
    .from("messenger_proof_posts")
    .select("id, checkpoint_id, checkpoint_name, public_url, location_label, is_public, created_at")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (existingProofsError) return res.status(500).json({ error: existingProofsError.message });
  const existingProof = (existingProofs || []).find((item) => item.checkpoint_id === checkpointId);
  if (existingProof) {
    return res.status(409).json({
      error: "proof already uploaded for this checkpoint",
      proof: existingProof,
      proofs: existingProofs || [],
    });
  }

  const { data: manifest, error: manifestError } = await supabase
    .from("messenger_manifests")
    .select("*")
    .eq("id", run.manifest_id)
    .maybeSingle();

  if (manifestError) return res.status(500).json({ error: manifestError.message });
  const checkpoints = manifest?.manifest?.checkpoints || [];
  const checkpoint = checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) return res.status(400).json({ error: "checkpoint not part of manifest" });

  const riderName = String(authUser?.email || "rider").split("@")[0].slice(0, 24) || "rider";
  const { data: proofRows, error: proofError } = await supabase
    .from("messenger_proof_posts")
    .upsert(
      {
        user_id,
        run_id: runId,
        manifest_id: run.manifest_id,
        checkpoint_id: checkpointId,
        checkpoint_name: checkpoint.name,
        city_slug: manifest?.city_slug || manifest?.manifest?.city_slug || "",
        city_name: manifest?.city_name || manifest?.manifest?.city || "",
        rider_name: riderName,
        media_type: "image",
        storage_path: storagePath,
        public_url: publicUrl,
        location_label: checkpoint.name,
        is_public: isPublic !== false,
      },
      { onConflict: "run_id,checkpoint_id" }
    )
    .select();

  if (proofError) return res.status(500).json({ error: proofError.message });

  const { data: proofs, error: proofsError } = await supabase
    .from("messenger_proof_posts")
    .select("id, checkpoint_id, checkpoint_name, public_url, location_label, is_public, created_at")
    .eq("run_id", runId)
    .order("created_at", { ascending: true });

  if (proofsError) return res.status(500).json({ error: proofsError.message });

  return res.json({
    ok: true,
    proof: proofRows?.[0] || null,
    proofs: proofs || [],
  });
});

app.get("/api/wall", async (req, res) => {
  const city = String(req.query.city || "").trim().toLowerCase();
  let query = supabase
    .from("messenger_proof_posts")
    .select("id, rider_name, city_name, city_slug, checkpoint_name, location_label, public_url, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (city) query = query.eq("city_slug", city);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ posts: data || [] });
});

app.post("/api/messenger/share", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const code = req.body?.code ? String(req.body.code).trim().toUpperCase() : "";
  if (code) {
    const { data: challenge, error: challengeError } = await supabase
      .from("messenger_challenges")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (challengeError) return res.status(500).json({ error: challengeError.message });
    if (!challenge) return res.status(404).json({ error: "share code not found" });

    const { data: challengeEntriesForStatus } = await supabase
      .from("messenger_challenge_entries")
      .select("*")
      .eq("challenge_id", challenge.id)
      .order("joined_at", { ascending: true });
    const challengeStatusRows = [];
    for (const entry of challengeEntriesForStatus || []) {
      const { data: runs } = await supabase
        .from("messenger_runs")
        .select("*")
        .eq("manifest_id", entry.manifest_id)
        .eq("user_id", entry.user_id)
        .order("finish_seconds", { ascending: true, nullsFirst: false })
        .order("started_at", { ascending: true });
      const bestRun = (runs || []).find((run) => run.status === "finished" && typeof run.finish_seconds === "number") || null;
      challengeStatusRows.push({
        user_id: entry.user_id,
        status: bestRun ? "finished" : "open",
        best_seconds: bestRun?.finish_seconds || null,
      });
    }
    const joinStatus = deriveChallengeStatus(challenge, challengeStatusRows);

    const { data: existingEntry } = await supabase
      .from("messenger_challenge_entries")
      .select("*")
      .eq("challenge_id", challenge.id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingEntry) {
      const { data: existingManifest } = await supabase
        .from("messenger_manifests")
        .select("*")
        .eq("id", existingEntry.manifest_id)
        .maybeSingle();

      return res.json({
        manifest_id: existingEntry.manifest_id,
        manifest: existingManifest?.manifest || null,
        source_code: challenge.code,
        challenge_id: challenge.id,
        reused: true,
      });
    }

    if (joinStatus === "expired") {
      return res.status(410).json({ error: "share code expired" });
    }
    if (joinStatus === "finished") {
      return res.status(409).json({ error: "challenge already closed" });
    }

    const { data: sourceManifest, error: sourceManifestError } = await supabase
      .from("messenger_manifests")
      .select("*")
      .eq("id", challenge.manifest_id)
      .maybeSingle();

    if (sourceManifestError) return res.status(500).json({ error: sourceManifestError.message });
    if (!sourceManifest) return res.status(404).json({ error: "source manifest missing" });

    const clonedManifestId = crypto.randomUUID();
    const { data: clonedManifest, error: cloneError } = await supabase
      .from("messenger_manifests")
      .insert({
        id: clonedManifestId,
        user_id,
        source_challenge_id: challenge.id,
        city_slug: sourceManifest.city_slug,
        city_name: sourceManifest.city_name,
        difficulty: sourceManifest.difficulty,
        style: sourceManifest.style,
        manifest_title: sourceManifest.manifest_title,
        estimated_minutes: sourceManifest.estimated_minutes,
        ghost_seconds: sourceManifest.ghost_seconds,
        checkpoint_count: sourceManifest.checkpoint_count,
        manifest: sourceManifest.manifest,
      })
      .select()
      .single();

    if (cloneError) return res.status(500).json({ error: cloneError.message });

    await supabase.from("messenger_challenge_entries").insert({
      challenge_id: challenge.id,
      user_id,
      manifest_id: clonedManifestId,
    });

    return res.json({
      manifest_id: clonedManifest.id,
      manifest: sourceManifest.manifest,
      source_code: challenge.code,
      challenge_id: challenge.id,
    });
  }

  const manifestId = req.body?.manifest_id || "";
  if (!manifestId) return res.status(400).json({ error: "manifest_id required" });

  const { data: manifest, error: manifestError } = await supabase
    .from("messenger_manifests")
    .select("*")
    .eq("id", manifestId)
    .eq("user_id", user_id)
    .maybeSingle();

  if (manifestError) return res.status(500).json({ error: manifestError.message });
  if (!manifest) return res.status(404).json({ error: "manifest not found" });

  if (manifest.source_challenge_id) {
    const { data: existingChallenge } = await supabase
      .from("messenger_challenges")
      .select("*")
      .eq("id", manifest.source_challenge_id)
      .maybeSingle();
    if (existingChallenge) {
      return res.json({
        challenge_id: existingChallenge.id,
        code: existingChallenge.code,
        reused: true,
      });
    }
  }

  let challengeCode = createChallengeCode();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data: existing } = await supabase
      .from("messenger_challenges")
      .select("id")
      .eq("code", challengeCode)
      .maybeSingle();
    if (!existing) break;
    challengeCode = createChallengeCode();
  }

  const { data: challenge, error: challengeInsertError } = await supabase
    .from("messenger_challenges")
    .insert({
      creator_user_id: user_id,
      manifest_id: manifestId,
      code: challengeCode,
    })
    .select()
    .single();

  if (challengeInsertError) return res.status(500).json({ error: challengeInsertError.message });
  await supabase.from("messenger_manifests").update({ source_challenge_id: challenge.id }).eq("id", manifestId);
  await supabase.from("messenger_challenge_entries").upsert(
    {
      challenge_id: challenge.id,
      user_id,
      manifest_id: manifestId,
    },
    { onConflict: "challenge_id,user_id" }
  );
  return res.json({
    challenge_id: challenge.id,
    code: challenge.code,
  });
});

app.all("/api/messenger/leaderboard", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  let challengeId = (req.method === "GET" ? req.query.challenge_id : req.body?.challenge_id) || "";
  const manifestId = (req.method === "GET" ? req.query.manifest_id : req.body?.manifest_id) || "";

  if (!challengeId && manifestId) {
    const { data: manifest } = await supabase
      .from("messenger_manifests")
      .select("*")
      .eq("id", manifestId)
      .maybeSingle();
    challengeId = manifest?.source_challenge_id || "";
  }

  if (!challengeId) return res.json({ challenge: null, leaderboard: [] });

  const { data: challenge, error: challengeError } = await supabase
    .from("messenger_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();
  if (challengeError) return res.status(500).json({ error: challengeError.message });
  if (!challenge) return res.json({ challenge: null, leaderboard: [] });

  const { data: entries, error: entriesError } = await supabase
    .from("messenger_challenge_entries")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("joined_at", { ascending: true });
  if (entriesError) return res.status(500).json({ error: entriesError.message });
  const manifestIds = (entries || []).map((entry) => entry.manifest_id);
  const { data: proofNames } = manifestIds.length
    ? await supabase.from("messenger_proof_posts").select("user_id, rider_name").in("manifest_id", manifestIds)
    : { data: [] };
  const riderNames = new Map();
  for (const proof of proofNames || []) {
    if (proof?.user_id && proof?.rider_name && !riderNames.has(proof.user_id)) riderNames.set(proof.user_id, proof.rider_name);
  }

  const leaderboard = [];
  for (const entry of entries || []) {
    const { data: manifest } = await supabase
      .from("messenger_manifests")
      .select("*")
      .eq("id", entry.manifest_id)
      .maybeSingle();
    const { data: runs } = await supabase
      .from("messenger_runs")
      .select("*")
      .eq("manifest_id", entry.manifest_id)
      .eq("user_id", entry.user_id)
      .order("finish_seconds", { ascending: true, nullsFirst: false })
      .order("started_at", { ascending: true });
    const bestRun = (runs || []).find((run) => run.status === "finished" && typeof run.finish_seconds === "number") || null;
    const riderName =
      riderNames.get(entry.user_id) ||
      (entry.user_id === challenge.creator_user_id ? "Creator" : `Rider ${String(entry.user_id).slice(0, 4)}`);
    leaderboard.push({
      user_id: entry.user_id,
      manifest_id: entry.manifest_id,
      joined_at: entry.joined_at,
      rider_name: riderName,
      city_name: manifest?.city_name || manifest?.manifest?.city || "",
      best_seconds: bestRun?.finish_seconds || null,
      best_run_id: bestRun?.id || null,
      status: bestRun ? "finished" : "open",
      is_creator: entry.user_id === challenge.creator_user_id,
    });
  }

  leaderboard.sort((left, right) => {
    if (left.best_seconds === null && right.best_seconds === null) return left.joined_at.localeCompare(right.joined_at);
    if (left.best_seconds === null) return 1;
    if (right.best_seconds === null) return -1;
    return left.best_seconds - right.best_seconds;
  });

  return res.json({
    challenge: {
      id: challenge.id,
      code: challenge.code,
      creator_user_id: challenge.creator_user_id,
      created_at: challenge.created_at,
      status: deriveChallengeStatus(challenge, leaderboard),
    },
    leaderboard,
    summary: buildChallengeSummary({ challenge, leaderboard, userId: user_id }),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
