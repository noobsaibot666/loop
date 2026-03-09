import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  ALLEYCAT_CHECKIN_RADIUS_METERS,
  buildMessengerManifest,
  distanceBetweenMeters,
  MESSENGER_CREDIT_COST,
} from "../shared/messenger.js";

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

const creditsFromAmount = (amountInCents = 0) => {
  const credits = Math.floor(Number(amountInCents || 0) / 50);
  return Math.max(1, credits);
};

const getAuthUser = async (req) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data?.user || null;
};

const consumeMessengerCredits = async (user_id) => {
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
  };
};

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
    return res.json({
      user_id,
      free_used: usage.free_used,
      donation_credits: usage.credits,
      free_remaining: Math.max(0, FREE_LIMIT - usage.free_used),
      credits_remaining: usage.credits || 0,
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
  const [{ data: credits, error: creditsError }, { data: stripeSessions, error: stripeError }, { data: manifests, error: manifestsError }, { data: runs, error: runsError }, { data: challenges, error: challengesError }] =
    await Promise.all([
      supabase.from("user_credits").select("user_id, credits, free_used"),
      supabase.from("stripe_sessions").select("session_id, status, amount_cents").order("created_at", { ascending: false }).limit(5),
      supabase.from("messenger_manifests").select("id"),
      supabase.from("messenger_runs").select("id, status"),
      supabase.from("messenger_challenges").select("id"),
    ]);

  const error = creditsError || stripeError || manifestsError || runsError || challengesError;
  if (error) return res.status(500).json({ error: error.message });

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
  });
});

app.post("/api/account/summary", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const [{ data: purchases, error: purchasesError }, { data: manifests, error: manifestsError }, { data: runs, error: runsError }, { data: challenges, error: challengesError }] =
    await Promise.all([
      supabase
        .from("stripe_sessions")
        .select("session_id, amount_cents, credits_to_grant, status, created_at")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("messenger_manifests").select("id").eq("user_id", user_id),
      supabase.from("messenger_runs").select("id, status").eq("user_id", user_id),
      supabase.from("messenger_challenge_entries").select("id").eq("user_id", user_id),
    ]);

  const error = purchasesError || manifestsError || runsError || challengesError;
  if (error) return res.status(500).json({ error: error.message });

  return res.json({
    purchases: purchases || [],
    alleycat: {
      manifests: manifests?.length || 0,
      runs: runs?.length || 0,
      finished_runs: (runs || []).filter((run) => run.status === "finished").length,
      challenges: challenges?.length || 0,
    },
  });
});

app.post("/api/usage/consume", async (req, res) => {
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

  res.json({ allowed: true, free_used, donation_credits, credits_remaining: donation_credits });
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

app.post("/api/messenger/generate", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const { city, difficulty, style } = req.body || {};
  const built = buildMessengerManifest({
    city,
    difficulty,
    style,
    seed: Math.floor(Math.random() * 100000),
  });

  if (built.error) return res.status(400).json({ error: built.error });

  try {
    const creditResult = await consumeMessengerCredits(user_id);
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

  const distanceMeters = distanceBetweenMeters(
    { lat, lng },
    { lat: checkpoint.lat, lng: checkpoint.lng }
  );
  if (distanceMeters > ALLEYCAT_CHECKIN_RADIUS_METERS) {
    return res.status(400).json({
      error: `Move closer to ${checkpoint.name} before checking in.`,
      distance_meters: distanceMeters,
      max_distance_meters: ALLEYCAT_CHECKIN_RADIUS_METERS,
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
    challenge,
  });
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
    leaderboard.push({
      user_id: entry.user_id,
      manifest_id: entry.manifest_id,
      joined_at: entry.joined_at,
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
    },
    leaderboard,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
