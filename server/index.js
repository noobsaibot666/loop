import "dotenv/config";
import express from "express";
import cors from "cors";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

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
  const { device_id, user_id } = req.body || {};
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

app.post("/api/usage/consume", async (req, res) => {
  const { device_id, user_id } = req.body || {};
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
  const { device_id, user_id, loop_point, distance, unit, terrain, surface, vibe } = req.body || {};
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
  const { user_id, amount } = req.body || {};
  if (!user_id) return res.status(400).json({ error: "user_id required" });

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
