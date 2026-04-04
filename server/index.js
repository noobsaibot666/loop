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
import {
  NIGHT_RIDE_CREDIT_COST,
  NIGHT_RIDE_CREW_BUILD_COST,
  NIGHT_RIDE_CREW_JOIN_COST,
  normalizeNightRideMode,
  normalizeNightRideDifficulty,
  normalizeNightRideSessionType,
  createNightRideCode,
  buildNightRideFallbackLoopWaypoints,
  sampleLoopWaypoints,
  buildNightRideMapsUrl,
  buildRouletteWaypoint,
  distanceBetweenKm,
  sanitizeCrewMembers,
} from "../shared/night-rides.js";
import {
  buildGoogleMapsLoopUrl,
  buildLoopCandidateRequest,
  buildLoopCandidateProfiles,
  evaluateLoopCandidate,
  hasUsableLoopWaypoints,
  selectBestLoopCandidate,
} from "../shared/loop-quality.js";
import {
  buildMembershipUpsert,
  COMMUNITY_CURRENCY,
  createDiscordLinkState,
  COMMUNITY_INTERVAL,
  COMMUNITY_INVITE_URL,
  COMMUNITY_PLAN_CODE,
  COMMUNITY_PRICE_CENTS,
  deriveMembershipAccessState,
  isMembershipActive,
  sanitizeMembershipForClient,
  toIsoOrNull,
} from "../shared/community-membership.js";
import {
  addDiscordRole,
  buildDiscordAuthorizeUrl,
  buildDiscordGuildUrl,
  exchangeDiscordCode,
  formatDiscordUsername,
  getDiscordConfig,
  getDiscordUser,
  joinDiscordGuild,
  syncDiscordMembershipAccess,
} from "../shared/discord-community.js";
import {
  sendCommunityActivatedEmail,
  sendCommunityCanceledEmail,
  sendCommunityDiscordLinkedEmail,
} from "../shared/community-email.js";
import { listRecentCommunityEvents, recordCommunityEvent } from "../shared/community-events.js";

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

const safeMaybeSingle = async (builder) => {
  try {
    return await builder.maybeSingle();
  } catch {
    return { data: null, error: null };
  }
};

const safeNoThrow = async (promise) => {
  try {
    return await promise;
  } catch {
    return null;
  }
};

const sanitizeBikePayload = (input = {}) => ({
  bike_id: String(input?.bike_id || "").trim() || null,
  bike_name: String(input?.bike_name || "").trim().slice(0, 60) || null,
  bike_ratio: String(input?.bike_ratio || "").trim().slice(0, 40) || null,
});

const sanitizeRedirectUrl = (value, fallback) => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (/^https?:\/\//i.test(raw) || /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return raw;
  return fallback;
};

const appendRedirectParams = (url, params) => {
  try {
    const nextUrl = new URL(url);
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      nextUrl.searchParams.set(key, String(value));
    });
    return nextUrl.toString();
  } catch {
    return url;
  }
};

const encodeRedirectState = (state, redirectTo) => {
  const target = String(redirectTo || "").trim();
  if (!target) return state;
  return `${state}::${Buffer.from(target, "utf8").toString("base64url")}`;
};

const decodeRedirectState = (state) => {
  const raw = String(state || "");
  const dividerIndex = raw.indexOf("::");
  if (dividerIndex === -1) return "";
  const encoded = raw.slice(dividerIndex + 2);
  if (!encoded) return "";
  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return "";
  }
};

const getCommunityRecipient = async (userId) => {
  if (!userId) return { email: "", riderName: "" };
  const authResult = await supabase.auth.admin.getUserById(userId).catch(() => ({ data: { user: null } }));
  const authUser = authResult?.data?.user || null;
  const { data: profile } = await safeMaybeSingle(
    supabase.from("user_profiles").select("rider_name").eq("user_id", userId)
  );
  return {
    email: authUser?.email || "",
    riderName: profile?.rider_name?.trim() || authUser?.email?.split("@")[0] || "Rider",
  };
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

const buildManifestFromDatabasePack = ({ pack, checkpoints, ghostEnabled = true, difficulty, style, seed, startPoint, startLabel, rangeKm, checkpointCount }) =>
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
      district: checkpoint.district,
      category: checkpoint.category,
      vibe: checkpoint.vibe,
      hint: checkpoint.hint,
      task_local: checkpoint.task_local,
      task_fast: checkpoint.task_fast,
      task_chaotic: checkpoint.task_chaotic,
    })),
    ghostEnabled,
    difficulty,
    style,
    seed,
    startPoint,
    startLabel,
    rangeKm,
    checkpointCount,
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

const riderLabelFromEmail = (email = "") => {
  const [local] = String(email || "").split("@");
  return local ? local.slice(0, 24) : "rider";
};

const consumeNightRideCredit = async (authUser, sessionType = "single") => {
  const creditCost = sessionType === "crew" ? NIGHT_RIDE_CREW_BUILD_COST : sessionType === "join" ? NIGHT_RIDE_CREW_JOIN_COST : NIGHT_RIDE_CREDIT_COST;
  if (isAdminEmail(authUser?.email || "")) {
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
    .eq("user_id", authUser.id)
    .maybeSingle();
  if (error) throw error;
  const usage = data || { user_id: authUser.id, free_used: 0, credits: 0 };
  let free_used = usage.free_used || 0;
  let credits_remaining = usage.credits || 0;
  if ((sessionType === "single" || sessionType === "join") && free_used < 3) {
    free_used += 1;
  } else if (credits_remaining >= creditCost) {
    credits_remaining -= creditCost;
  } else {
    return {
      ok: false,
      error: sessionType === "crew" ? "Crew Night Ride needs 2 credits." : sessionType === "join" ? "Joining a crew Night Ride needs 1 credit or a free loop left." : "Night Ride needs 1 credit or a free loop left.",
    };
  }
  const { error: updateError } = await supabase
    .from("user_credits")
    .upsert({ user_id: authUser.id, free_used, credits: credits_remaining }, { onConflict: "user_id" });
  if (updateError) throw updateError;
  return {
    ok: true,
    credits_remaining,
    free_used,
    is_admin: false,
    unlimited_credits: false,
  };
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
    const isMembership = session.mode === "subscription" || session.metadata?.plan_code === "discord_access";
    if (isMembership && user_id) {
      let subscription = null;
      if (session.subscription) {
        try {
          subscription = await stripe.subscriptions.retrieve(session.subscription);
        } catch {}
      }
      const { data: existingMembership } = await safeMaybeSingle(
        supabase.from("community_memberships").select("*").eq("user_id", user_id)
      );
      let nextMembership = {
        ...(existingMembership || {}),
        ...buildMembershipUpsert({ userId: user_id, checkoutSession: session, subscription }),
      };
      if (nextMembership.discord_user_id) {
        nextMembership = await syncDiscordMembershipAccess({
          env: process.env,
          membership: nextMembership,
        });
      }
      await supabase
        .from("community_memberships")
        .upsert(nextMembership, { onConflict: "user_id" });
      await recordCommunityEvent(process.env, {
        user_id,
        event_type: "membership_activated",
        membership_status: nextMembership.status,
        discord_role_status: nextMembership.discord_role_status,
        details: {
          stripe_checkout_session_id: session.id,
          stripe_subscription_id: nextMembership.stripe_subscription_id || null,
        },
      }).catch(() => null);
      const recipient = await getCommunityRecipient(user_id);
      try {
        await sendCommunityActivatedEmail({
          env: process.env,
          request: req,
          membership: nextMembership,
          user: recipient,
        });
        await recordCommunityEvent(process.env, {
          user_id,
          event_type: "email_activation_sent",
          membership_status: nextMembership.status,
          discord_role_status: nextMembership.discord_role_status,
          details: { email: recipient.email || null },
        }).catch(() => null);
      } catch (error) {
        await recordCommunityEvent(process.env, {
          user_id,
          event_type: "email_activation_failed",
          membership_status: nextMembership.status,
          discord_role_status: nextMembership.discord_role_status,
          details: {
            email: recipient.email || null,
            error: error instanceof Error ? error.message : "Activation email failed",
          },
        }).catch(() => null);
      }
      return res.json({ received: true });
    }

    const amount = session.amount_total || 0;
    const creditAdd = creditsFromAmount(amount);

    if (user_id) {
      const { data: existingSession } = await safeMaybeSingle(
        supabase
          .from("stripe_sessions")
          .select("session_id, status")
          .eq("session_id", session.id)
      );
      if (existingSession?.status === "credited") {
        return res.json({ received: true, duplicate: true });
      }

      const { data } = await supabase
        .from("user_credits")
        .select("user_id, credits, free_used")
        .eq("user_id", user_id)
        .maybeSingle();

      const currentCredits = data?.credits || 0;
      await supabase
        .from("user_credits")
        .upsert({ user_id, credits: currentCredits + creditAdd }, { onConflict: "user_id" });

      await safeNoThrow(supabase.from("stripe_sessions").upsert({
        session_id: session.id,
        user_id,
        amount_cents: amount,
        credits_to_grant: creditAdd,
        status: "credited",
      }, { onConflict: "session_id" }));

      await supabase.from("donations").insert({
        user_id,
        amount,
        stripe_session_id: session.id,
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const { data: membership } = await safeMaybeSingle(
      supabase
        .from("community_memberships")
        .select("*")
        .eq("stripe_subscription_id", subscription.id)
    );
    if (membership?.user_id) {
      let nextMembership = {
        ...membership,
        ...buildMembershipUpsert({
          userId: membership.user_id,
          checkoutSession: {
            id: membership.stripe_checkout_session_id || null,
            customer: subscription.customer || null,
            subscription: subscription.id,
            metadata: {
              plan_code: subscription?.metadata?.plan_code || COMMUNITY_PLAN_CODE,
              discord_invite_url: subscription?.metadata?.discord_invite_url || COMMUNITY_INVITE_URL,
            },
          },
          subscription,
        }),
        status: event.type === "customer.subscription.deleted" ? "canceled" : subscription.status || "active",
        cancel_at_period_end: event.type === "customer.subscription.deleted" ? false : Boolean(subscription.cancel_at_period_end),
      };
      if (nextMembership.discord_user_id) {
        nextMembership = await syncDiscordMembershipAccess({
          env: process.env,
          membership: nextMembership,
        });
      }
      await supabase
        .from("community_memberships")
        .upsert(nextMembership, { onConflict: "user_id" });
      if (event.type === "customer.subscription.deleted") {
        await recordCommunityEvent(process.env, {
          user_id: membership.user_id,
          event_type: "membership_canceled",
          membership_status: nextMembership.status,
          discord_role_status: nextMembership.discord_role_status,
          details: {
            stripe_subscription_id: subscription.id,
          },
        }).catch(() => null);
        const recipient = await getCommunityRecipient(membership.user_id);
        try {
          await sendCommunityCanceledEmail({
            env: process.env,
            request: req,
            membership: nextMembership,
            user: recipient,
          });
          await recordCommunityEvent(process.env, {
            user_id: membership.user_id,
            event_type: "email_cancellation_sent",
            membership_status: nextMembership.status,
            discord_role_status: nextMembership.discord_role_status,
            details: { email: recipient.email || null },
          }).catch(() => null);
        } catch (error) {
          await recordCommunityEvent(process.env, {
            user_id: membership.user_id,
            event_type: "email_cancellation_failed",
            membership_status: nextMembership.status,
            discord_role_status: nextMembership.discord_role_status,
            details: {
              email: recipient.email || null,
              error: error instanceof Error ? error.message : "Cancellation email failed",
            },
          }).catch(() => null);
        }
      }
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

const recordModerationAction = async ({
  adminUser,
  action,
  targetType,
  targetId = null,
  targetLabel = null,
  details = {},
}) => {
  if (!adminUser?.email) return;
  await safeNoThrow(supabase.from("moderation_action_history").insert({
    admin_user_id: adminUser.id || null,
    admin_email: adminUser.email,
    action,
    target_type: targetType,
    target_id: targetId,
    target_label: targetLabel,
    details,
  }));
};

app.post("/api/admin/check", async (req, res) => {
  const authUser = await getAuthUser(req);
  const requestedUserId = String(req.body?.user_id || "").trim();
  if (!authUser) return res.json({ ok: true, is_admin: false });
  if (requestedUserId && requestedUserId !== authUser.id) {
    return res.status(403).json({ error: "session mismatch" });
  }
  return res.json({
    ok: true,
    is_admin: isAdminEmail(authUser.email || ""),
    user_id: authUser.id,
    email: authUser.email || "",
  });
});

app.post("/api/admin/rider-list", requireAdmin, async (req, res) => {
  try {
    const { data: credits, error: creditsError } = await supabase
      .from("user_credits")
      .select("user_id, credits, free_used, updated_at")
      .order("updated_at", { ascending: false });

    if (creditsError) return res.status(500).json({ error: creditsError.message });

    const { data: profiles, error: profilesError } = await supabase
      .from("user_profiles")
      .select("user_id, rider_name");

    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });
    if (authError) console.error("Admin rider-list auth error:", authError);

    const emailMap = new Map((authData?.users || []).map((u) => [u.id, u.email]));
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.rider_name]));

    const riders = (credits || []).map((c) => ({
      user_id: c.user_id,
      email: emailMap.get(c.user_id) || "unknown",
      rider_name: nameMap.get(c.user_id) || "",
      credits: c.credits || 0,
      free_used: c.free_used || 0,
      updated_at: c.updated_at,
    }));

    return res.json({ ok: true, riders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

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
    communityEvents,
  ] =
    await Promise.all([
      supabase.from("user_credits").select("user_id, credits, free_used"),
      supabase.from("stripe_sessions").select("session_id, status, amount_cents").order("created_at", { ascending: false }).limit(5),
      supabase.from("messenger_manifests").select("id, city_name, manifest_title, checkpoint_count, ghost_seconds"),
      supabase.from("messenger_runs").select("id, user_id, manifest_id, status, finish_seconds, finished_at, bike_name, bike_ratio"),
      supabase.from("messenger_challenges").select("id"),
      supabase
        .from("messenger_proof_posts")
        .select("id, rider_name, city_name, checkpoint_name, is_public, created_at, public_url, storage_path")
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
      listRecentCommunityEvents(process.env, 12).catch(() => []),
    ]);

  const error = creditsError || stripeError || manifestsError || runsError || challengesError || proofsError || quarterProofsError || quarterRunsError;
  if (error) return res.status(500).json({ error: error.message });
  const quarterLeaderboard = buildQuarterLeaderboard({
    proofs: quarterProofs || [],
    finishedRuns: quarterRuns || [],
  });
  const manifestMap = new Map((manifests || []).map((manifest) => [manifest.id, manifest]));
  const fastestRunCandidates = (runs || [])
    .filter((run) => run.status === "finished" && typeof run.finish_seconds === "number" && manifestMap.has(run.manifest_id))
    .sort((left, right) => left.finish_seconds - right.finish_seconds)
    .slice(0, 12);
  const fastestUserIds = [...new Set(fastestRunCandidates.map((run) => run.user_id).filter(Boolean))];
  const { data: profileRows } = fastestUserIds.length
    ? await supabase.from("user_profiles").select("user_id, rider_name").in("user_id", fastestUserIds)
    : { data: [] };
  const profileMap = new Map((profileRows || []).map((profile) => [profile.user_id, profile.rider_name]));
  const fastest_runs = fastestRunCandidates.map((run) => {
    const manifest = manifestMap.get(run.manifest_id);
    return {
      run_id: run.id,
      rider_name: profileMap.get(run.user_id) || "Rider",
      city_name: manifest?.city_name || "",
      manifest_title: manifest?.manifest_title || "",
      checkpoint_count: manifest?.checkpoint_count || null,
      ghost_seconds: manifest?.ghost_seconds || null,
      finish_seconds: run.finish_seconds,
      finished_at: run.finished_at,
      bike_name: run.bike_name || null,
      bike_ratio: run.bike_ratio || null,
    };
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
    fastest_runs,
    community_events: communityEvents || [],
    quarter: {
      label: quarter.label,
      leaders: quarterLeaderboard.slice(0, 3),
    },
  });
});

app.post("/api/admin/community-retry", requireAdmin, async (req, res) => {
  const eventId = String(req.body?.event_id || "").trim();
  if (!eventId) return res.status(400).json({ error: "event_id required" });

  const { data: event } = await safeMaybeSingle(
    supabase.from("community_membership_events").select("*").eq("id", eventId)
  );
  if (!event) return res.status(404).json({ error: "event not found" });
  if (!event.user_id) return res.status(400).json({ error: "event has no user_id" });

  const { data: membership } = await safeMaybeSingle(
    supabase.from("community_memberships").select("*").eq("user_id", event.user_id)
  );
  if (!membership) return res.status(404).json({ error: "membership not found" });

  try {
    if (event.event_type === "discord_link_failed") {
      const nextMembership = await syncDiscordMembershipAccess({
        env: process.env,
        request: req,
        membership,
      });
      await safeNoThrow(supabase.from("community_memberships").upsert(nextMembership, { onConflict: "user_id" }));
      await recordCommunityEvent(process.env, {
        user_id: nextMembership.user_id,
        event_type: "discord_sync_retried",
        membership_status: nextMembership.status,
        discord_role_status: nextMembership.discord_role_status,
        details: {
          source_event_id: eventId,
          admin_email: req.adminUser?.email || null,
        },
      }).catch(() => null);
      return res.json({ ok: true, retried: "discord_sync", membership: nextMembership });
    }

    const recipient = await getCommunityRecipient(membership.user_id);
    if (event.event_type === "email_activation_failed") {
      await sendCommunityActivatedEmail({ env: process.env, request: req, membership, user: recipient });
    } else if (event.event_type === "email_discord_linked_failed") {
      await sendCommunityDiscordLinkedEmail({ env: process.env, request: req, membership, user: recipient });
    } else if (event.event_type === "email_cancellation_failed") {
      await sendCommunityCanceledEmail({ env: process.env, request: req, membership, user: recipient });
    } else {
      return res.status(400).json({ error: "event type is not retryable" });
    }

    await recordCommunityEvent(process.env, {
      user_id: membership.user_id,
      event_type: `${String(event.event_type).replace(/_failed$/, "")}_retried`,
      membership_status: membership.status,
      discord_role_status: membership.discord_role_status,
      details: {
        source_event_id: eventId,
        admin_email: req.adminUser?.email || null,
        email: recipient.email || null,
      },
    }).catch(() => null);

    return res.json({ ok: true, retried: "email", membership });
  } catch (error) {
    await recordCommunityEvent(process.env, {
      user_id: membership.user_id,
      event_type: "community_retry_failed",
      membership_status: membership.status,
      discord_role_status: membership.discord_role_status,
      details: {
        source_event_id: eventId,
        source_event_type: event.event_type,
        admin_email: req.adminUser?.email || null,
        error: error instanceof Error ? error.message : "Retry failed",
      },
    }).catch(() => null);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Retry failed" });
  }
});

app.post("/api/admin/night-rides", requireAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from("night_ride_posts")
    .select("id, user_id, rider_name, crew_name, city_name, route_title, distance_km, caption, image_url, aspect_ratio, is_public, moderation_status, created_at")
    .order("created_at", { ascending: false })
    .limit(48);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, posts: data || [] });
});

app.post("/api/admin/night-ride-moderation", requireAdmin, async (req, res) => {
  const post_id = String(req.body?.post_id || "").trim();
  const moderation_status = String(req.body?.moderation_status || "").trim().toLowerCase();
  if (!post_id) return res.status(400).json({ error: "post_id required" });
  if (!["live", "flagged", "hidden"].includes(moderation_status)) {
    return res.status(400).json({ error: "invalid moderation_status" });
  }

  const { data: existing, error: existingError } = await supabase
    .from("night_ride_posts")
    .select("id, rider_name, crew_name, city_name, route_title, moderation_status, is_public")
    .eq("id", post_id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ error: existingError.message });
  if (!existing) return res.status(404).json({ error: "post not found" });

  const nextPublic = moderation_status === "hidden" ? false : existing.is_public !== false;
  const { data, error } = await supabase
    .from("night_ride_posts")
    .update({
      moderation_status,
      is_public: nextPublic,
    })
    .eq("id", post_id)
    .select("*")
    .limit(1);
  if (error) return res.status(500).json({ error: error.message });

  await recordModerationAction({
    adminUser: req.adminUser,
    action: `night_ride_${moderation_status}`,
    targetType: "night_ride_post",
    targetId: post_id,
    targetLabel: existing.route_title || existing.city_name || existing.crew_name || post_id,
    details: {
      rider_name: existing.rider_name || "",
      crew_name: existing.crew_name || "",
      city_name: existing.city_name || "",
      previous_status: existing.moderation_status || "pending",
      next_status: moderation_status,
      previous_public: existing.is_public,
      next_public: nextPublic,
    },
  });

  return res.json({ ok: true, post: data?.[0] || null });
});

app.post("/api/admin/city-packs", requireAdmin, async (req, res) => {
  const getPackReadiness = (pack, countData, districtsByPack) => {
    const checkpoint_count = countData?.checkpoint_count || 0;
    const active_checkpoint_count = countData?.active_checkpoint_count || 0;
    const district_count = districtsByPack.get(pack.id)?.size || 0;
    const copy_ready = Boolean(pack.route_note && pack.finish_label && pack.safety_note);
    const can_publish = copy_ready && active_checkpoint_count >= 4 && district_count >= 3;

    let readiness_status = "draft";
    if (pack.is_active) readiness_status = "live";
    else if (can_publish) readiness_status = "ready";
    else if (copy_ready || checkpoint_count > 0) readiness_status = "review";

    return {
      checkpoint_count,
      active_checkpoint_count,
      district_count,
      copy_ready,
      can_publish,
      readiness_status,
    };
  };

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

  const [packsRes, checkpointsRes] = await Promise.all([
    supabase.from("city_packs").select("*").order("name", { ascending: true }),
    supabase.from("city_checkpoints").select("pack_id,id,is_active,district"),
  ]);
  if (packsRes.error) return res.status(500).json({ error: packsRes.error.message });
  if (checkpointsRes.error) return res.status(500).json({ error: checkpointsRes.error.message });
  const counts = new Map();
  const districtsByPack = new Map();
  for (const checkpoint of checkpointsRes.data || []) {
    const current = counts.get(checkpoint.pack_id) || { checkpoint_count: 0, active_checkpoint_count: 0 };
    current.checkpoint_count += 1;
    if (checkpoint.is_active !== false) current.active_checkpoint_count += 1;
    counts.set(checkpoint.pack_id, current);
    if (checkpoint.district) {
      const districtSet = districtsByPack.get(checkpoint.pack_id) || new Set();
      districtSet.add(String(checkpoint.district).trim());
      districtsByPack.set(checkpoint.pack_id, districtSet);
    }
  }
  return res.json({
    packs: (packsRes.data || []).map((pack) => ({
      ...pack,
      ...getPackReadiness(pack, counts.get(pack.id), districtsByPack),
    })),
  });
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
  const checkpointCount = Number(req.body?.checkpoint_count || 0) || null;
  const startPoint =
    Number.isFinite(Number(req.body?.start_lat)) && Number.isFinite(Number(req.body?.start_lng))
      ? { lat: Number(req.body.start_lat), lng: Number(req.body.start_lng) }
      : null;
  const startLabel = String(req.body?.start_label || "").trim();
  const rangeKm = Number(req.body?.range_km || 0) || null;
  const packId = String(req.body?.pack_id || "").trim();
  const city = String(req.body?.city || "").trim();

  let built;
  if (packId) {
    const { data: pack } = await supabase.from("city_packs").select("*").eq("id", packId).maybeSingle();
    const checkpoints = pack ? await getDbPackCheckpoints(pack.id, false) : [];
    const dbBuilt =
      pack && checkpoints.length
        ? buildManifestFromDatabasePack({ pack, checkpoints, difficulty, style, seed, startPoint, startLabel, rangeKm, checkpointCount })
        : { error: "Pack not found or empty." };
    const fallbackBuilt = buildMessengerManifest({ city: pack?.name || city, difficulty, style, seed, startPoint, startLabel, rangeKm, checkpointCount });
    built = dbBuilt?.error ? fallbackBuilt : dbBuilt;
  } else {
    const pack = await getDbCityPackByCity(city);
    const checkpoints = pack ? await getDbPackCheckpoints(pack.id, true) : [];
    const dbBuilt =
      pack && checkpoints.length
        ? buildManifestFromDatabasePack({ pack, checkpoints, difficulty, style, seed, startPoint, startLabel, rangeKm, checkpointCount })
        : null;
    const fallbackBuilt = buildMessengerManifest({ city, difficulty, style, seed, startPoint, startLabel, rangeKm, checkpointCount });
    built = dbBuilt?.error ? fallbackBuilt : dbBuilt || fallbackBuilt;
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

  const { data: existing, error: existingError } = await supabase
    .from("messenger_proof_posts")
    .select("id, rider_name, city_name, checkpoint_name, is_public")
    .eq("id", proof_id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ error: existingError.message });
  if (!existing) return res.status(404).json({ error: "proof not found" });

  const { data, error } = await supabase
    .from("messenger_proof_posts")
    .update({ is_public })
    .eq("id", proof_id)
    .select("id, rider_name, city_name, checkpoint_name, is_public, created_at, public_url")
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  await recordModerationAction({
    adminUser: req.adminUser,
    action: is_public ? "proof_publish" : "proof_hide",
    targetType: "proof",
    targetId: proof_id,
    targetLabel: existing.checkpoint_name || existing.city_name || proof_id,
    details: {
      rider_name: existing.rider_name || "",
      city_name: existing.city_name || "",
      checkpoint_name: existing.checkpoint_name || "",
      previous_public: existing.is_public,
      next_public: is_public,
    },
  });
  return res.json({
    ok: true,
    proof: data?.[0] || null,
  });
});

app.post("/api/admin/proof-delete", requireAdmin, async (req, res) => {
  const proof_id = String(req.body?.proof_id || "").trim();
  if (!proof_id) return res.status(400).json({ error: "proof_id required" });

  const { data: proof, error: proofError } = await supabase
    .from("messenger_proof_posts")
    .select("id, storage_path, rider_name, city_name, checkpoint_name, is_public, archived_at")
    .eq("id", proof_id)
    .maybeSingle();
  if (proofError) return res.status(500).json({ error: proofError.message });
  if (!proof) return res.status(404).json({ error: "proof not found" });

  if (proof.storage_path) {
    await supabase.from("storage.objects").delete().eq("bucket_id", "alleycat-proofs").eq("name", proof.storage_path);
  }

  const { error } = await supabase.from("messenger_proof_posts").delete().eq("id", proof_id);
  if (error) return res.status(500).json({ error: error.message });
  await recordModerationAction({
    adminUser: req.adminUser,
    action: "proof_delete",
    targetType: "proof",
    targetId: proof_id,
    targetLabel: proof.checkpoint_name || proof.city_name || proof_id,
    details: {
      rider_name: proof.rider_name || "",
      city_name: proof.city_name || "",
      checkpoint_name: proof.checkpoint_name || "",
      was_public: proof.is_public,
      was_archived: Boolean(proof.archived_at),
    },
  });
  return res.json({ ok: true, deleted_id: proof_id });
});

app.post("/api/admin/city-requests", requireAdmin, async (req, res) => {
  if (String(req.body?.action || "") === "ai_draft") {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    const requestId = String(req.body?.request_id || "").trim();
    if (!requestId) return res.status(400).json({ error: "request_id required" });

    const { data: requestRows, error: requestError } = await supabase
      .from("city_requests")
      .select("*")
      .eq("id", requestId)
      .limit(1);
    if (requestError) return res.status(500).json({ error: requestError.message });
    const requestRow = requestRows?.[0];
    if (!requestRow) return res.status(404).json({ error: "request not found" });

    const slugifyCity = (value = "") =>
      String(value)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 48);
    const titleCaseCity = (value = "") =>
      String(value)
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

    const cityName = titleCaseCity(requestRow.requested_city || requestRow.requested_location || "");
    const slug = slugifyCity(cityName);
    if (!cityName || !slug) return res.status(400).json({ error: "request needs a city name before drafting" });

    const draft = await callOpenAIJson({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      schemaName: "alleycat_pack_draft",
      schema: packDraftSchema,
      userPrompt: buildPackDraftPrompt({
        city: cityName,
        route_note: "",
        finish_label: "",
        checkpoints: [],
      }),
    });

    const { data: existingPack } = await supabase
      .from("city_packs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    const { data: packRows, error: packError } = await supabase
      .from("city_packs")
      .upsert({
        id: existingPack?.id,
        slug,
        name: cityName,
        route_note: String(draft.route_note || "").trim(),
        finish_label: String(draft.finish_label || "").trim(),
        safety_note: "Ride inside local laws, stay sharp in traffic, and keep every task safe and doable.",
        is_active: false,
      }, { onConflict: "slug" })
      .select()
      .limit(1);
    if (packError) return res.status(500).json({ error: packError.message });
    const pack = packRows?.[0] || null;

    const { data: updatedRows, error: updateError } = await supabase
      .from("city_requests")
      .update({
        status: "ai_drafted",
        admin_note: `AI draft ready for ${cityName}${pack?.id ? ` · pack ${pack.id}` : ""}`,
        handled_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .limit(1);
    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.json({
      ok: true,
      request: updatedRows?.[0] || null,
      pack,
      draft,
    });
  }

  if (String(req.body?.action || "") === "update") {
    const requestId = String(req.body?.request_id || "").trim();
    const status = String(req.body?.status || "").trim() || "reviewing";
    const adminNote = String(req.body?.admin_note || "").trim();
    if (!requestId) return res.status(400).json({ error: "request_id required" });

    const { data, error } = await supabase
      .from("city_requests")
      .update({
        status,
        admin_note: adminNote,
        handled_at: status === "new" ? null : new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .limit(1);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, request: data?.[0] || null });
  }

  if (String(req.body?.action || "") === "delete") {
    const requestId = String(req.body?.request_id || "").trim();
    if (!requestId) return res.status(400).json({ error: "request_id required" });

    const { error } = await supabase
      .from("city_requests")
      .delete()
      .eq("id", requestId);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, deleted_id: requestId });
  }

  const { data, error } = await supabase
    .from("city_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ requests: data || [] });
});

app.post("/api/admin/collaborations", requireAdmin, async (req, res) => {
  if (String(req.body?.action || "") === "update") {
    const userId = String(req.body?.user_id || "").trim();
    const collaborationStatus = String(req.body?.collaboration_status || "").trim() || "pending";
    if (!userId) return res.status(400).json({ error: "user_id required" });

    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        collaboration_status: collaborationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("user_id, rider_name, home_location, collaboration_note, collaboration_status, collaboration_requested_at, updated_at")
      .limit(1);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true, request: data?.[0] || null });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, rider_name, home_location, collaboration_note, collaboration_status, collaboration_requested_at, updated_at")
    .not("collaboration_note", "is", null)
    .neq("collaboration_note", "")
    .order("collaboration_requested_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ requests: data || [] });
});

app.post("/api/account/summary", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });
  const quarter = getQuarterWindow();

  const [
    { data: profile, error: profileError },
    { data: bikes, error: bikesError },
    { data: purchases, error: purchasesError },
    { data: loopHistory, error: loopHistoryError },
    { data: manifests, error: manifestsError },
    { data: runs, error: runsError },
    { data: challengeEntries, error: challengeEntriesError },
    { data: proofs, error: proofsError },
    { data: quarterProofs, error: quarterProofsError },
    { data: quarterRuns, error: quarterRunsError },
    { data: communityMembership, error: communityMembershipError },
  ] =
    await Promise.all([
      (async () => {
        try {
          return await supabase
            .from("user_profiles")
            .select("user_id, rider_name, home_location, bike_name, bike_ratio, primary_bike_id, collaboration_note, collaboration_status, collaboration_requested_at")
            .eq("user_id", user_id)
            .maybeSingle();
        } catch {
          return { data: null, error: null };
        }
      })(),
      supabase
        .from("user_bikes")
        .select("id, bike_name, bike_ratio, is_default, sort_order")
        .eq("user_id", user_id)
        .order("sort_order", { ascending: true }),
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
        .select("id, user_id, run_id, is_public, city_name, manifest_id, checkpoint_id, checkpoint_name, location_label, public_url, created_at")
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
      (async () => {
        try {
          return await supabase
            .from("community_memberships")
            .select("user_id, plan_code, status, price_cents, currency, interval, current_period_end, cancel_at_period_end, discord_invite_url, discord_user_id, discord_username, discord_role_status, discord_access_granted_at, discord_access_revoked_at")
            .eq("user_id", user_id)
            .maybeSingle();
        } catch {
          return { data: null, error: null };
        }
      })(),
    ]);

  const error =
    profileError ||
    purchasesError ||
    loopHistoryError ||
    manifestsError ||
    runsError ||
    challengeEntriesError ||
    proofsError ||
    quarterProofsError ||
    quarterRunsError ||
    communityMembershipError;
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
    profile: profile || {
      user_id,
      rider_name: "",
      home_location: "",
      bike_name: "",
      bike_ratio: "",
      collaboration_note: "",
      collaboration_status: "",
      collaboration_requested_at: null,
    },
    bikes: bikes || [],
    purchases: purchases || [],
    community_membership: sanitizeMembershipForClient(communityMembership || null),
    alleycat: {
      manifests: userManifests.length,
      runs: userRuns.length,
      finished_runs: userRuns.filter((run) => run.status === "finished").length,
      challenges: userChallenges.length,
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

app.post("/api/account/profile", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });
  const submitCollaboration = Boolean(req.body?.collaboration_submit);

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const inputBikes = Array.isArray(req.body?.bikes) ? req.body.bikes : [];
  let bikesToUpsert = inputBikes
    .slice(0, 10)
    .map((b, i) => ({
      id: uuidRegex.test(b.id) ? b.id : undefined,
      user_id,
      bike_name: String(b.bike_name || "").trim().slice(0, 60),
      bike_ratio: String(b.bike_ratio || "").trim().slice(0, 40),
      is_default: Boolean(b.is_default),
      sort_order: i,
    }))
    .filter((b) => b.bike_name || b.bike_ratio);

  // Default to legacy fallback if no bikes are provided
  if (!bikesToUpsert.length && (req.body?.bike_name || req.body?.bike_ratio)) {
    bikesToUpsert = [{
      user_id,
      bike_name: String(req.body?.bike_name || "").trim().slice(0, 60),
      bike_ratio: String(req.body?.bike_ratio || "").trim().slice(0, 40),
      is_default: true,
      sort_order: 0,
    }];
  }

  const incomingIds = bikesToUpsert.map((b) => b.id).filter(Boolean);
  if (incomingIds.length) {
    await supabase.from("user_bikes").delete().eq("user_id", user_id).not("id", "in", `(${incomingIds.join(",")})`);
  } else {
    await supabase.from("user_bikes").delete().eq("user_id", user_id);
  }

  let finalBikes = [];
  if (bikesToUpsert.length) {
    const { data: upsertedBikes } = await supabase.from("user_bikes").upsert(bikesToUpsert, { onConflict: "id", returning: "representation" }).select();
    if (upsertedBikes) {
      finalBikes = upsertedBikes;
    }
  }

  const primaryBike = finalBikes.find((b) => b.is_default) || finalBikes[0] || null;

  const payload = {
    user_id,
    rider_name: String(req.body?.rider_name || "").trim().slice(0, 40),
    home_location: String(req.body?.home_location || "").trim().slice(0, 120),
    bike_name: primaryBike?.bike_name || null,
    bike_ratio: primaryBike?.bike_ratio || null,
    primary_bike_id: primaryBike?.id || null,
    collaboration_note: String(req.body?.collaboration_note || "").trim().slice(0, 600),
    collaboration_status: submitCollaboration ? "pending" : String(req.body?.collaboration_status || "").trim().slice(0, 20) || null,
    collaboration_requested_at: submitCollaboration ? new Date().toISOString() : req.body?.collaboration_requested_at || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("user_profiles").upsert(payload, { onConflict: "user_id" }).select().limit(1);
  if (error) {
    if (String(error.message || "").toLowerCase().includes("user_profiles")) {
      return res.status(500).json({ error: "Profile fields are not ready in Supabase yet. Apply user_profiles.sql first." });
    }
    return res.status(500).json({ error: error.message });
  }
  const { error: proofsError } = await supabase
    .from("messenger_proof_posts")
    .update({
      rider_name: payload.rider_name || null,
      bike_name: payload.bike_name || null,
      bike_ratio: payload.bike_ratio || null,
    })
    .eq("user_id", user_id);
  if (proofsError) {
    return res.status(500).json({ error: proofsError.message });
  }
  return res.json({ ok: true, profile: data?.[0] || null, bikes: finalBikes });
});

app.post("/api/account-feedback", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const trimFeedback = (value = "") => String(value).replace(/\s+/g, " ").trim();
  const countWords = (value = "") => (trimFeedback(value).match(/\S+/g) || []).length;
  const WORD_LIMIT = 200;
  const CHAR_LIMIT = 1200;

  const feedback = trimFeedback(req.body?.feedback || "");
  const rider_name = trimFeedback(req.body?.rider_name || "").slice(0, 60);

  if (!feedback) return res.status(400).json({ error: "feedback required" });
  if (feedback.length > CHAR_LIMIT) return res.status(400).json({ error: `keep it under ${CHAR_LIMIT} characters` });
  if (countWords(feedback) > WORD_LIMIT) return res.status(400).json({ error: `keep it under ${WORD_LIMIT} words` });

  const { error } = await supabase.from("account_feedback").insert({
    user_id,
    email: authUser?.email || null,
    rider_name: rider_name || null,
    feedback,
    source: "account",
  });

  if (error) {
    if (String(error.message || "").toLowerCase().includes("account_feedback")) {
      return res.status(500).json({ error: "Feedback table is not ready in Supabase yet. Apply account_feedback.sql first." });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.json({ ok: true });
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

  const successRedirectTo = sanitizeRedirectUrl(req.body?.success_redirect_to, `${APP_URL}/account`);
  const cancelRedirectTo = sanitizeRedirectUrl(req.body?.cancel_redirect_to, `${APP_URL}/account`);

  const amountInCents = Math.max(500, Number(amount || 500));
  const creditsToGrant = creditsFromAmount(amountInCents);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: appendRedirectParams(successRedirectTo, {
      donation: "success",
      session_id: "{CHECKOUT_SESSION_ID}",
    }),
    cancel_url: appendRedirectParams(cancelRedirectTo, {
      donation: "cancel",
    }),
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

  await safeNoThrow(supabase.from("stripe_sessions").upsert({
    session_id: session.id,
    user_id,
    amount_cents: amountInCents,
    credits_to_grant: creditsToGrant,
    status: "checkout_created",
  }, { onConflict: "session_id" }));

  res.json({ url: session.url });
});

app.post("/api/create-membership-session", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "auth required" });
  const { data: existingMembership } = await safeMaybeSingle(
    supabase.from("community_memberships").select("*").eq("user_id", user_id)
  );

  const successRedirectTo = sanitizeRedirectUrl(req.body?.success_redirect_to, `${APP_URL}/account`);
  const cancelRedirectTo = sanitizeRedirectUrl(req.body?.cancel_redirect_to, `${APP_URL}/account`);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: appendRedirectParams(successRedirectTo, {
      membership: "success",
      session_id: "{CHECKOUT_SESSION_ID}",
    }),
    cancel_url: appendRedirectParams(cancelRedirectTo, {
      membership: "cancel",
    }),
    line_items: [
      {
        price_data: {
          currency: COMMUNITY_CURRENCY,
          product_data: {
            name: "Loop community access",
            description: "Discord community access with optional bonus credits later.",
          },
          unit_amount: COMMUNITY_PRICE_CENTS,
          recurring: { interval: COMMUNITY_INTERVAL },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id,
      plan_code: COMMUNITY_PLAN_CODE,
      discord_invite_url: COMMUNITY_INVITE_URL,
    },
    subscription_data: {
      metadata: {
        user_id,
        plan_code: COMMUNITY_PLAN_CODE,
        discord_invite_url: COMMUNITY_INVITE_URL,
      },
    },
  });

  await safeNoThrow(supabase.from("community_memberships").upsert({
    ...(existingMembership || {}),
    user_id,
    stripe_checkout_session_id: session.id,
    plan_code: COMMUNITY_PLAN_CODE,
    status: "checkout_created",
    price_cents: COMMUNITY_PRICE_CENTS,
    currency: COMMUNITY_CURRENCY,
    interval: COMMUNITY_INTERVAL,
    discord_invite_url: COMMUNITY_INVITE_URL,
  }, { onConflict: "user_id" }));

  res.json({ url: session.url });
});

app.post("/api/stripe/verify-session", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  const session_id = String(req.body?.session_id || "").trim();
  if (!user_id) return res.status(401).json({ error: "auth required" });
  if (!session_id) return res.status(400).json({ error: "session_id required" });

  const { data: existingSession } = await safeMaybeSingle(
    supabase
      .from("stripe_sessions")
      .select("session_id,user_id,status,credits_to_grant")
      .eq("session_id", session_id)
  );
  if (existingSession?.user_id && existingSession.user_id !== user_id) {
    return res.status(403).json({ error: "session mismatch" });
  }
  if (existingSession?.status === "credited") {
    return res.json({ ok: true, credited: true, duplicate: true });
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);
  if (session.metadata?.user_id !== user_id) return res.status(403).json({ error: "session mismatch" });
  if (!(session.payment_status === "paid" || session.status === "complete")) {
    return res.json({ ok: true, credited: false, status: session.payment_status || session.status || "unknown" });
  }

  const amount = Number(session.amount_total || 0);
  const creditAdd = existingSession?.credits_to_grant || creditsFromAmount(amount);
  const { data } = await supabase
    .from("user_credits")
    .select("user_id, credits")
    .eq("user_id", user_id)
    .maybeSingle();
  const currentCredits = data?.credits || 0;

  await supabase
    .from("user_credits")
    .upsert({ user_id, credits: currentCredits + creditAdd }, { onConflict: "user_id" });

  await safeNoThrow(supabase.from("stripe_sessions").upsert({
    session_id,
    user_id,
    amount_cents: amount,
    credits_to_grant: creditAdd,
    status: "credited",
  }, { onConflict: "session_id" }));

  await safeNoThrow(supabase.from("donations").insert({
    user_id,
    amount,
    stripe_session_id: session_id,
  }));

  res.json({ ok: true, credited: true, credits_added: creditAdd });
});

app.post("/api/stripe/verify-membership-session", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  const session_id = String(req.body?.session_id || "").trim();
  if (!user_id) return res.status(401).json({ error: "auth required" });
  if (!session_id) return res.status(400).json({ error: "session_id required" });

  const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["subscription"] });
  if (session.metadata?.user_id !== user_id) return res.status(403).json({ error: "session mismatch" });
  if (!(session.payment_status === "paid" || session.status === "complete")) {
    return res.json({ ok: true, activated: false, status: session.payment_status || session.status || "unknown" });
  }
  const subscription = typeof session.subscription === "string" ? await stripe.subscriptions.retrieve(session.subscription) : session.subscription;
  const membership = buildMembershipUpsert({
    userId: user_id,
    checkoutSession: {
      ...session,
      metadata: {
        ...session.metadata,
        plan_code: session.metadata?.plan_code || COMMUNITY_PLAN_CODE,
        discord_invite_url: session.metadata?.discord_invite_url || COMMUNITY_INVITE_URL,
      },
    },
    subscription,
  });
  const { data: existingMembership } = await safeMaybeSingle(
    supabase.from("community_memberships").select("*").eq("user_id", user_id)
  );
  let mergedMembership = {
    ...(existingMembership || {}),
    ...membership,
  };
  if (mergedMembership.discord_user_id) {
    mergedMembership = await syncDiscordMembershipAccess({
      env: process.env,
      membership: mergedMembership,
    });
  }
  await supabase.from("community_memberships").upsert(mergedMembership, { onConflict: "user_id" });

  res.json({
    ok: true,
    activated: true,
    status: mergedMembership.status || "active",
    access_state: deriveMembershipAccessState(mergedMembership),
    community_membership: sanitizeMembershipForClient(mergedMembership),
  });
});

app.post("/api/community-membership/discord-start", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "auth required" });

  const { data: membership } = await safeMaybeSingle(
    supabase.from("community_memberships").select("*").eq("user_id", user_id)
  );
  if (!membership) return res.status(404).json({ error: "membership not found" });
  if (!isMembershipActive(membership)) {
    return res.status(403).json({ error: "membership inactive", access_state: "inactive" });
  }

  const redirectTo = sanitizeRedirectUrl(req.body?.redirect_to, `${APP_URL}/account`);
  const { state, expiresAt } = createDiscordLinkState();
  const linkState = encodeRedirectState(state, redirectTo);
  const config = getDiscordConfig(process.env, { url: `${APP_URL}/api/community-membership/discord-start` });
  await safeNoThrow(
    supabase.from("community_memberships").upsert(
      {
        ...membership,
        discord_link_state: linkState,
        discord_link_state_expires_at: expiresAt,
        discord_last_error: null,
      },
      { onConflict: "user_id" }
    )
  );

  res.json({
    ok: true,
    url: buildDiscordAuthorizeUrl(config, linkState),
  });
});

app.get("/api/community-membership/discord-callback", async (req, res) => {
  const errorCode = String(req.query?.error || "").trim();
  const code = String(req.query?.code || "").trim();
  const state = String(req.query?.state || "").trim();
  const redirectBase = sanitizeRedirectUrl(decodeRedirectState(state), `${APP_URL}/account`);
  const redirect = (outcome) => res.redirect(appendRedirectParams(redirectBase, { community: outcome }));

  if (errorCode) return redirect("discord-denied");
  if (!code || !state) return redirect("discord-error");

  const { data: membership } = await safeMaybeSingle(
    supabase.from("community_memberships").select("*").eq("discord_link_state", state)
  );
  if (!membership) return redirect("discord-expired");

  const stateExpiry = membership.discord_link_state_expires_at ? new Date(membership.discord_link_state_expires_at).getTime() : 0;
  if (!stateExpiry || Number.isNaN(stateExpiry) || stateExpiry < Date.now()) {
    await safeNoThrow(
      supabase.from("community_memberships").upsert(
        {
          ...membership,
          discord_link_state: null,
          discord_link_state_expires_at: null,
          discord_last_error: "Discord link expired",
        },
        { onConflict: "user_id" }
      )
    );
    return redirect("discord-expired");
  }
  if (!isMembershipActive(membership)) return redirect("discord-inactive");

  try {
    const config = getDiscordConfig(process.env, { url: `${APP_URL}/api/community-membership/discord-callback` });
    const token = await exchangeDiscordCode(config, code);
    const discordUser = await getDiscordUser(token.access_token);
    await joinDiscordGuild(config, discordUser.id, token.access_token);
    await addDiscordRole(config, discordUser.id);

    await safeNoThrow(
      supabase.from("community_memberships").upsert(
        {
          ...membership,
          discord_user_id: discordUser.id,
          discord_username: formatDiscordUsername(discordUser),
          discord_linked_at: membership.discord_linked_at || new Date().toISOString(),
          discord_role_status: "granted",
          discord_access_granted_at: new Date().toISOString(),
          discord_access_revoked_at: null,
          discord_link_state: null,
          discord_link_state_expires_at: null,
          discord_last_error: null,
          discord_invite_url: membership.discord_invite_url || COMMUNITY_INVITE_URL,
        },
        { onConflict: "user_id" }
      )
    );
    await recordCommunityEvent(process.env, {
      user_id: membership.user_id,
      event_type: "discord_linked",
      membership_status: membership.status,
      discord_role_status: "granted",
      details: {
        discord_user_id: discordUser.id,
        discord_username: formatDiscordUsername(discordUser),
      },
    }).catch(() => null);

    const recipient = await getCommunityRecipient(membership.user_id);
    try {
      await sendCommunityDiscordLinkedEmail({
        env: process.env,
        request: req,
        membership: {
          ...membership,
          discord_user_id: discordUser.id,
          discord_username: formatDiscordUsername(discordUser),
          discord_role_status: "granted",
        },
        user: recipient,
      });
      await recordCommunityEvent(process.env, {
        user_id: membership.user_id,
        event_type: "email_discord_linked_sent",
        membership_status: membership.status,
        discord_role_status: "granted",
        details: { email: recipient.email || null },
      }).catch(() => null);
    } catch (error) {
      await recordCommunityEvent(process.env, {
        user_id: membership.user_id,
        event_type: "email_discord_linked_failed",
        membership_status: membership.status,
        discord_role_status: "granted",
        details: {
          email: recipient.email || null,
          error: error instanceof Error ? error.message : "Discord linked email failed",
        },
      }).catch(() => null);
    }

    return redirect("discord-linked");
  } catch (error) {
    await recordCommunityEvent(process.env, {
      user_id: membership.user_id,
      event_type: "discord_link_failed",
      membership_status: membership.status,
      discord_role_status: "link_required",
      details: {
        error: error instanceof Error ? error.message : "Discord link failed",
      },
    }).catch(() => null);
    await safeNoThrow(
      supabase.from("community_memberships").upsert(
        {
          ...membership,
          discord_link_state: null,
          discord_link_state_expires_at: null,
          discord_role_status: "link_required",
          discord_last_error: error instanceof Error ? error.message : "Discord link failed",
        },
        { onConflict: "user_id" }
      )
    );
    return redirect("discord-error");
  }
});

app.post("/api/community-membership/access", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "auth required" });

  const { data: membership } = await safeMaybeSingle(
    supabase
      .from("community_memberships")
      .select("*")
      .eq("user_id", user_id)
  );
  if (!membership) return res.status(404).json({ error: "membership not found", access_state: "inactive" });

  let currentMembership = membership;
  if (membership.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
      currentMembership = {
        ...membership,
        stripe_customer_id: subscription.customer || membership.stripe_customer_id || null,
        status: subscription.status || membership.status,
        current_period_start: toIsoOrNull(subscription.current_period_start),
        current_period_end: toIsoOrNull(subscription.current_period_end),
        cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
        discord_invite_url: subscription?.metadata?.discord_invite_url || membership.discord_invite_url || COMMUNITY_INVITE_URL,
      };
      await safeNoThrow(supabase.from("community_memberships").upsert(currentMembership, { onConflict: "user_id" }));
    } catch {}
  }

  if (currentMembership?.discord_user_id) {
    currentMembership = await syncDiscordMembershipAccess({
      env: process.env,
      membership: currentMembership,
    });
    await safeNoThrow(supabase.from("community_memberships").upsert(currentMembership, { onConflict: "user_id" }));
  }

  const accessState = deriveMembershipAccessState(currentMembership);
  if (!isMembershipActive(currentMembership)) {
    return res.status(403).json({ error: "membership inactive", access_state: accessState });
  }
  if (!currentMembership.discord_user_id || currentMembership.discord_role_status === "link_required") {
    return res.status(409).json({
      error: "discord link required",
      access_state: accessState,
      requires_discord_link: true,
    });
  }

  return res.json({
    ok: true,
    access_state: accessState,
    url: buildDiscordGuildUrl(getDiscordConfig(process.env, req).guildId),
  });
});

app.post("/api/stripe/portal", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "auth required" });

  const returnUrl = sanitizeRedirectUrl(req.body?.return_url, `${APP_URL}/account`);
  const { data: membership, error } = await supabase
    .from("community_memberships")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!membership) return res.status(404).json({ error: "membership not found" });

  let customerId = membership.stripe_customer_id || null;
  if (!customerId && membership.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(membership.stripe_subscription_id);
      customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null;
      if (customerId) {
        await safeNoThrow(supabase
          .from("community_memberships")
          .update({ stripe_customer_id: customerId })
          .eq("user_id", user_id));
      }
    } catch (subscriptionError) {
      return res.status(500).json({
        error: subscriptionError instanceof Error ? subscriptionError.message : "Could not resolve subscription customer",
      });
    }
  }

  if (!customerId) return res.status(400).json({ error: "customer portal unavailable" });

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return res.json({ ok: true, url: session.url });
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
  const { coords, distance_km, seed, terrain, surface, vibe } = req.body || {};
  if (!coords || coords.length !== 2) return res.status(400).json({ error: "coords required" });
  if (!ORS_API_KEY) return res.status(500).json({ error: "ORS_API_KEY missing" });
  const authUser = await getAuthUser(req);

  const requestedDistanceKm = Math.max(1, Number(distance_km || 0));
  const origin = { lng: Number(coords[0]), lat: Number(coords[1]) };
  if (!Number.isFinite(origin.lng) || !Number.isFinite(origin.lat)) {
    return res.status(400).json({ error: "coords must be numeric" });
  }
  const recentRoutes =
    authUser?.id
      ? (
          await safeNoThrow(
            supabase
              .from("loop_history")
              .select("route_url, distance_km, created_at")
              .eq("user_id", authUser.id)
              .order("created_at", { ascending: false })
              .limit(10),
          )
        )?.data || []
      : [];

  const requestCandidate = async (profile, candidateIndex) => {
    const candidateSeed = Number(seed || 1) + (profile.seedOffset || 0);
    const payload = buildLoopCandidateRequest({
      origin,
      targetDistanceKm: requestedDistanceKm,
      terrain,
      surface,
      vibe,
      seed: candidateSeed,
      profile,
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    let data;
    try {
      response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: ORS_API_KEY,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const raw = await response.text();
      data = raw ? JSON.parse(raw) : {};
    } catch (error) {
      clearTimeout(timeout);
      return {
        ok: false,
        status: error?.name === "AbortError" ? 504 : 502,
        error: error?.name === "AbortError" ? "ORS request timed out" : "ORS request failed",
        detail: error instanceof Error ? error.message : null,
        profile,
        candidateIndex,
        candidateSeed,
      };
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data?.error?.message || data?.message || "ORS error",
        detail: data,
        profile,
        candidateIndex,
        candidateSeed,
      };
    }
    const evaluation = evaluateLoopCandidate({
      routeData: data,
      origin,
      targetDistanceKm: requestedDistanceKm,
      terrain,
      surface,
      vibe,
      recentRoutes,
    });
    return {
      ok: true,
      data,
      evaluation,
      profile,
      candidateIndex,
      candidateSeed,
    };
  };

  const runCandidateBatch = async (reroll = false, strict = false) => {
    const profiles = buildLoopCandidateProfiles({ terrain, surface, vibe, reroll, strict });
    return Promise.all(profiles.map((profile, candidateIndex) => requestCandidate(profile, candidateIndex)));
  };

  const firstPass = await runCandidateBatch(false);
  const successfulFirstPass = firstPass.filter((candidate) => candidate.ok);
  let candidates = successfulFirstPass;
  if (!successfulFirstPass.some((candidate) => candidate.evaluation.valid)) {
    const secondPass = await runCandidateBatch(true);
    candidates = [...successfulFirstPass, ...secondPass.filter((candidate) => candidate.ok)];
  }
  if (!candidates.some((candidate) => candidate.evaluation.valid)) {
    const strictPass = await runCandidateBatch(true, true);
    candidates = [...candidates, ...strictPass.filter((candidate) => candidate.ok)];
  }

  if (!candidates.length) {
    const fallbackWaypoints = buildFallbackLoopWaypoints(origin, distance_km, seed);
    return res.json({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: fallbackWaypoints.map((point) => [point.lng, point.lat]),
          },
          properties: {
            fallback: true,
          },
        },
      ],
      route_url: buildGoogleMapsLoopUrl(origin, fallbackWaypoints),
      quality_score: 0,
      overlap_ratio: 0,
      candidate_seed: seed,
      candidate_index: -1,
      candidate_profile: "fallback-loop",
      route_debug: {
        fallback_applied: true,
        fallback_reason: "no_candidates",
        sampled_waypoint_count: fallbackWaypoints.length,
      },
      sampled_waypoints: fallbackWaypoints,
    });
  }

  const bestCandidate = selectBestLoopCandidate(candidates);
  if (!bestCandidate) {
    return res.status(502).json({ error: "loop generation failed" });
  }
  let sampledWaypoints = bestCandidate.evaluation.sampledWaypoints;
  let routeDebug = {
    ...bestCandidate.evaluation.metrics,
    fallback_applied: false,
  };
  if (
    !bestCandidate.evaluation.valid &&
    (
      bestCandidate.evaluation.sampledWaypoints.length < 5 ||
      bestCandidate.evaluation.metrics.overlapRatio >= 0.66 ||
      bestCandidate.evaluation.metrics.corridorDuplication >= 0.74 ||
      bestCandidate.evaluation.metrics.dominantLegRatio >= 0.76
    )
  ) {
    sampledWaypoints = bestCandidate.evaluation.sampledWaypoints.length >= 5
      ? bestCandidate.evaluation.sampledWaypoints
      : buildFallbackLoopWaypoints(origin, distance_km, seed);
    routeDebug = {
      ...routeDebug,
      fallback_applied: true,
      fallback_reason: "loop_quality_guard",
      sampled_waypoint_count: sampledWaypoints.length,
    };
  }
  return res.json({
    ...bestCandidate.data,
    route_url: buildGoogleMapsLoopUrl(origin, sampledWaypoints),
    quality_score: bestCandidate.evaluation.score,
    overlap_ratio: bestCandidate.evaluation.metrics.overlapRatio,
    candidate_seed: bestCandidate.candidateSeed,
    candidate_index: bestCandidate.candidateIndex,
    candidate_profile: bestCandidate.profile.label,
    route_debug: routeDebug,
    sampled_waypoints: sampledWaypoints,
  });
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

app.post(["/api/night-rides/create", "/api/night-rides/generate"], async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });
  if (!ORS_API_KEY) return res.status(500).json({ error: "ORS_API_KEY missing" });

  const session_type = normalizeNightRideSessionType(req.body?.session_type);
  const mode = normalizeNightRideMode(req.body?.mode);
  const difficulty = normalizeNightRideDifficulty(req.body?.difficulty);
  const unit = req.body?.unit === "mi" ? "mi" : "km";
  const distance_km = Number(req.body?.distance_km || 0);
  const origin_label = String(req.body?.origin_label || "").trim();
  const destination_label = String(req.body?.destination_label || "").trim();
  const crew_name = String(req.body?.crew_name || "").trim().slice(0, 80);
  const ride_city = String(req.body?.ride_city || "").trim().slice(0, 80);
  const crew_members = sanitizeCrewMembers(req.body?.crew_members);
  const requestedBike = sanitizeBikePayload(req.body);
  const origin = { lat: Number(req.body?.origin_lat), lng: Number(req.body?.origin_lng) };
  const destination =
    mode === "roulette"
      ? { lat: Number(req.body?.destination_lat), lng: Number(req.body?.destination_lng) }
      : null;

  if (!origin_label || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) {
    return res.status(400).json({ error: "origin required" });
  }
  if (!distance_km || !Number.isFinite(distance_km)) {
    return res.status(400).json({ error: "distance_km required" });
  }
  if (mode === "roulette" && (!destination_label || !destination || !Number.isFinite(destination.lat) || !Number.isFinite(destination.lng))) {
    return res.status(400).json({ error: "destination required for roulette" });
  }
  if (session_type === "crew" && !crew_name) {
    return res.status(400).json({ error: "crew name required" });
  }

  let route_payload = null;
  let route_url = "";
  let title = "";

  if (mode === "loop") {
    const response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [[origin.lng, origin.lat]],
        options: {
          round_trip: {
            length: Math.max(1000, distance_km * 1000),
            points: difficulty === "hard" ? 4 : 3,
            seed: Math.floor(Math.random() * 1000) + 1,
          },
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || data?.message || "ORS error" });
    route_payload = data;
    const coords = data?.features?.[0]?.geometry?.coordinates || [];
    const waypoints = sampleLoopWaypoints(coords, distance_km);
    const resolvedWaypoints =
      hasUsableLoopWaypoints(waypoints)
        ? waypoints
        : buildNightRideFallbackLoopWaypoints(origin, distance_km, Math.floor(Math.random() * 1000) + 1);
    route_url = buildNightRideMapsUrl({ origin, destination: origin, waypoints: resolvedWaypoints });
    title = session_type === "crew" ? `${crew_name} · Night Loop` : `Night Loop · ${origin_label}`;
  } else {
    const via = buildRouletteWaypoint({ start: origin, end: destination, targetKm: distance_km, difficulty });
    const response = await fetch("https://api.openrouteservice.org/v2/directions/cycling-regular", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: [
          [origin.lng, origin.lat],
          [via.lng, via.lat],
          [destination.lng, destination.lat],
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || data?.message || "ORS error" });
    route_payload = { ...data, via };
    route_url = buildNightRideMapsUrl({ origin, destination, waypoints: [via] });
    title = session_type === "crew"
      ? `${crew_name} · Night Roulette`
      : `Night Roulette · ${origin_label} to ${destination_label} · ${distanceBetweenKm(origin, destination).toFixed(1)} km direct`;
  }

  const creditResult = await consumeNightRideCredit(authUser, session_type);
  if (!creditResult.ok) return res.status(402).json({ error: creditResult.error });

  let share_code = createNightRideCode();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: existing } = await supabase.from("night_ride_sessions").select("id").eq("share_code", share_code).limit(1);
    if (!existing?.length) break;
    share_code = createNightRideCode();
  }

  const { data: profile } = await safeMaybeSingle(
    supabase
      .from("user_profiles")
      .select("rider_name, bike_name, bike_ratio")
      .eq("user_id", user_id)
  );

  const bikePayload = {
    bike_id: requestedBike.bike_id,
    bike_name: requestedBike.bike_name || profile?.bike_name || null,
    bike_ratio: requestedBike.bike_ratio || profile?.bike_ratio || null,
  };

  const { data: sessions, error } = await supabase
    .from("night_ride_sessions")
    .insert({
      creator_user_id: user_id,
      creator_email: authUser.email || "",
      creator_rider_name: profile?.rider_name?.trim() || riderLabelFromEmail(authUser.email || ""),
      session_type,
      mode,
      title,
      difficulty,
      unit,
      distance_km: Number(distance_km.toFixed(2)),
      ride_city: ride_city || null,
      crew_name: session_type === "crew" ? crew_name : null,
      crew_members,
      bike_id: bikePayload.bike_id,
      bike_name: bikePayload.bike_name,
      bike_ratio: bikePayload.bike_ratio,
      origin_label,
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_label: mode === "roulette" ? destination_label : null,
      destination_lat: mode === "roulette" ? destination.lat : null,
      destination_lng: mode === "roulette" ? destination.lng : null,
      share_code,
      route_url,
      route_payload,
      status: "open",
    })
    .select("*")
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  const session = sessions?.[0] || null;

  if (session?.id) {
    await safeNoThrow(supabase.from("night_ride_participants").insert({
      session_id: session.id,
      user_id,
      rider_name: profile?.rider_name?.trim() || riderLabelFromEmail(authUser.email || ""),
      joined_via: "creator",
      credits_spent: session_type === "crew" ? NIGHT_RIDE_CREW_BUILD_COST : 1,
    }));
  }

  return res.json({
    ok: true,
    session,
    share_code,
    route_url,
    credits_remaining: creditResult.credits_remaining,
    is_admin: creditResult.is_admin,
    unlimited_credits: creditResult.unlimited_credits,
  });
});

app.post("/api/night-rides/join", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const code = String(req.body?.code || req.body?.share_code || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ error: "code required" });

  const { data: session, error } = await supabase
    .from("night_ride_sessions")
    .select("*")
    .eq("share_code", code)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!session) return res.status(404).json({ error: "night ride code not found" });
  if (session.status !== "open") return res.status(409).json({ error: "night ride is closed" });
  if (session.session_type !== "crew") return res.status(409).json({ error: "single night rides do not take join codes" });

  const { data: existing } = await supabase
    .from("night_ride_participants")
    .select("id")
    .eq("session_id", session.id)
    .eq("user_id", user_id)
    .limit(1);
  const already_joined = Boolean(existing?.length);

  let creditResult = { credits_remaining: null, is_admin: false, unlimited_credits: false };
  if (!already_joined) {
    const consume = await consumeNightRideCredit(authUser, "join");
    if (!consume.ok) return res.status(402).json({ error: consume.error });
    creditResult = consume;
    const { data: profile } = await safeMaybeSingle(
      supabase
        .from("user_profiles")
        .select("rider_name")
        .eq("user_id", user_id)
    );
    await supabase.from("night_ride_participants").insert({
      session_id: session.id,
      user_id,
      rider_name: profile?.rider_name?.trim() || riderLabelFromEmail(authUser.email || ""),
      joined_via: "code",
      credits_spent: NIGHT_RIDE_CREW_JOIN_COST,
    });
  }

  return res.json({
    ok: true,
    session,
    already_joined,
    route_url: session.route_url,
    credits_remaining: creditResult.credits_remaining,
    is_admin: creditResult.is_admin,
    unlimited_credits: creditResult.unlimited_credits,
  });
});

app.post("/api/night-rides/post", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "auth required" });

  const sessionId = String(req.body?.session_id || "").trim();
  const imageUrl = String(req.body?.image_url || "").trim();
  const storagePath = String(req.body?.storage_path || "").trim();
  const aspectRatio = String(req.body?.aspect_ratio || "1:1").trim() === "16:9" ? "16:9" : "1:1";
  const caption = String(req.body?.caption || "").trim().slice(0, 280);
  const isPublic = req.body?.is_public !== false;
  if (!sessionId || !imageUrl || !storagePath) {
    return res.status(400).json({ error: "session_id, image_url, and storage_path required" });
  }

  const { data: session } = await supabase
    .from("night_ride_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (!session) return res.status(404).json({ error: "night ride session not found" });

  const isCreator = session.creator_user_id === user_id;
  let isParticipant = false;
  if (!isCreator) {
    const { data: participant } = await supabase
      .from("night_ride_participants")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_id", user_id)
      .maybeSingle();
    isParticipant = Boolean(participant?.id);
  }
  if (!isCreator && !isParticipant) {
    return res.status(403).json({ error: "not part of this night ride" });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("rider_name")
    .eq("user_id", user_id)
    .maybeSingle();
  const riderName = profile?.rider_name?.trim() || riderLabelFromEmail(authUser?.email || "");

  const { data, error } = await supabase
    .from("night_ride_posts")
    .insert({
      session_id: session.id,
      user_id,
      rider_name: riderName,
      crew_name: session.crew_name || null,
      city_name: session.ride_city || null,
      route_title: session.title || null,
      distance_km: session.distance_km ?? null,
      caption: caption || null,
      storage_path: storagePath,
      image_url: imageUrl,
      aspect_ratio: aspectRatio,
      is_public: isPublic,
      moderation_status: "live",
    })
    .select("*")
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, post: data?.[0] || null });
});

app.get("/api/night-rides/mine", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });
  const { data: owned, error } = await supabase
    .from("night_ride_sessions")
    .select("id, title, session_type, mode, difficulty, distance_km, ride_city, crew_name, crew_members, bike_id, bike_name, bike_ratio, created_at")
    .eq("creator_user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) return res.status(500).json({ error: error.message });
  const { data: joined } = await supabase
    .from("night_ride_participants")
    .select("session_id, created_at")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false })
    .limit(12);
  const joinedIds = Array.from(new Set((joined || []).map((row) => row.session_id).filter(Boolean)));
  let joinedSessions = [];
  if (joinedIds.length) {
    const { data } = await supabase
      .from("night_ride_sessions")
      .select("id, title, session_type, mode, difficulty, distance_km, ride_city, crew_name, crew_members, bike_id, bike_name, bike_ratio, created_at")
      .in("id", joinedIds);
    joinedSessions = data || [];
  }
  const merged = [...(owned || []), ...joinedSessions];
  const deduped = Array.from(new Map(merged.map((session) => [session.id, session])).values())
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 12);
  return res.json({ sessions: deduped });
});

app.post("/api/messenger/generate", async (req, res) => {
  const authUser = await getAuthUser(req);
  const user_id = authUser?.id || "";
  if (!user_id) return res.status(401).json({ error: "login required" });

  const { city, difficulty, style, start_lat, start_lng, start_label, range_km, checkpoint_count } = req.body || {};
  const ghostEnabled = req.body?.ghost_enabled !== false && req.body?.ghost_enabled !== "false" && req.body?.ghost_enabled !== 0;
  if (!String(start_label || "").trim() || !Number.isFinite(Number(start_lat)) || !Number.isFinite(Number(start_lng))) {
    return res.status(400).json({ error: "start area required" });
  }
  const seed = Math.floor(Math.random() * 100000);
  const startPoint =
    Number.isFinite(Number(start_lat)) && Number.isFinite(Number(start_lng))
      ? { lat: Number(start_lat), lng: Number(start_lng) }
      : null;
  const dbPack = await getDbCityPackByCity(city);
  const dbCheckpoints = dbPack ? await getDbPackCheckpoints(dbPack.id, true) : [];
  const dbBuilt =
    dbPack && dbCheckpoints.length
        ? buildManifestFromDatabasePack({
          pack: dbPack,
          checkpoints: dbCheckpoints,
          ghostEnabled,
          difficulty: ghostEnabled ? difficulty : null,
          style,
          seed,
          startPoint,
          startLabel: String(start_label || ""),
          rangeKm: Number(range_km || 0) || null,
          checkpointCount: Number(checkpoint_count || 0) || null,
        })
      : null;
  const fallbackBuilt = buildMessengerManifest({
    city,
    ghostEnabled,
    difficulty: ghostEnabled ? difficulty : null,
    style,
    seed,
    startPoint,
    startLabel: String(start_label || ""),
    rangeKm: Number(range_km || 0) || null,
    checkpointCount: Number(checkpoint_count || 0) || null,
  });
  const built = dbBuilt?.error ? fallbackBuilt : dbBuilt || fallbackBuilt;

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

  const requestedBike = sanitizeBikePayload(req.body);
  const { data: profile } = await safeMaybeSingle(
    supabase
      .from("user_profiles")
      .select("bike_name, bike_ratio")
      .eq("user_id", user_id)
  );
  const bikePayload = {
    bike_id: requestedBike.bike_id,
    bike_name: requestedBike.bike_name || profile?.bike_name || null,
    bike_ratio: requestedBike.bike_ratio || profile?.bike_ratio || null,
  };

  try {
    const activeRun = await getActiveMessengerRun(manifestId, user_id);
    if (activeRun) {
      return res.json({
        run_id: activeRun.id,
        manifest_id: manifestId,
        started_at: activeRun.started_at,
        status: activeRun.status,
        bike_id: activeRun.bike_id || null,
        bike_name: activeRun.bike_name || null,
        bike_ratio: activeRun.bike_ratio || null,
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
      bike_id: bikePayload.bike_id,
      bike_name: bikePayload.bike_name,
      bike_ratio: bikePayload.bike_ratio,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({
    run_id: run.id,
    manifest_id: manifestId,
    started_at: run.started_at,
    status: run.status,
    bike_id: run.bike_id || null,
    bike_name: run.bike_name || null,
    bike_ratio: run.bike_ratio || null,
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
  let sourceRun = null;
  if (runId) {
    const { data } = await supabase
      .from("messenger_runs")
      .select("*")
      .eq("id", runId)
      .eq("user_id", user_id)
      .maybeSingle();
    sourceRun = data || null;
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

  const requestedBike = sanitizeBikePayload(req.body);
  const nextBike = {
    bike_id: requestedBike.bike_id || sourceRun?.bike_id || null,
    bike_name: requestedBike.bike_name || sourceRun?.bike_name || null,
    bike_ratio: requestedBike.bike_ratio || sourceRun?.bike_ratio || null,
  };

  const { data: run, error: createError } = await supabase
    .from("messenger_runs")
    .insert({
      manifest_id: effectiveManifestId,
      user_id,
      status: "active",
      bike_id: nextBike.bike_id,
      bike_name: nextBike.bike_name,
      bike_ratio: nextBike.bike_ratio,
    })
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
    .select("checkpoint_id, checked_in_at")
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
    ghost_seconds:
      typeof manifest?.ghost_seconds === "number"
        ? manifest.ghost_seconds
        : typeof manifest?.manifest?.ghost_seconds === "number"
          ? manifest.manifest.ghost_seconds
          : null,
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
      checkins: checkins || [],
      bike_id: run.bike_id || null,
      bike_name: run.bike_name || null,
      bike_ratio: run.bike_ratio || null,
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

  const { data: profile } = await safeMaybeSingle(
    supabase
      .from("user_profiles")
      .select("rider_name, bike_name, bike_ratio")
      .eq("user_id", user_id)
  );
  const riderName = profile?.rider_name?.trim()
    ? profile.rider_name.trim().slice(0, 40)
    : String(authUser?.email || "rider").split("@")[0].slice(0, 24) || "rider";
  const basePayload = {
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
  };
  let proofRows;
  let proofError;
  ({ data: proofRows, error: proofError } = await supabase
    .from("messenger_proof_posts")
    .upsert(
      {
        ...basePayload,
        bike_name: profile?.bike_name || null,
        bike_ratio: profile?.bike_ratio || null,
      },
      { onConflict: "run_id,checkpoint_id" }
    )
    .select());
  if (proofError) {
    ({ data: proofRows, error: proofError } = await supabase
      .from("messenger_proof_posts")
      .upsert(basePayload, { onConflict: "run_id,checkpoint_id" })
      .select());
  }
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
  const city = req.query.city || "";
  const checkpointCount = Number(req.query.checkpoints || req.query.checkpoint_count || 0) || null;
  try {
    const { data: posts, error } = await supabase
      .from("messenger_proof_posts")
      .select("id, run_id, manifest_id, user_id, rider_name, city_name, city_slug, checkpoint_name, location_label, is_public, created_at, public_url, storage_path, bike_name, bike_ratio")
      .eq("is_public", true)
      .ilike("city_name", `%${city}%`)
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) return res.status(500).json({ error: error.message });
    const groups = new Map();
    for (const post of posts || []) {
      const key = post.run_id || post.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(post);
    }
    const picked = [...groups.values()]
      .map((group) => group[Math.floor(Math.random() * group.length)] || group[0])
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 40);
    const manifestIds = [...new Set(picked.map((post) => post.manifest_id).filter(Boolean))];
    const { data: manifests, error: manifestsError } = manifestIds.length
      ? await supabase.from("messenger_manifests").select("id, manifest_title, checkpoint_count").in("id", manifestIds)
      : { data: [], error: null };
    if (manifestsError) return res.status(500).json({ error: manifestsError.message });
    const manifestMap = new Map((manifests || []).map((manifest) => [manifest.id, manifest]));
    const enriched = picked
      .map((post) => {
        const manifest = manifestMap.get(post.manifest_id);
        return {
          ...post,
          manifest_title: manifest?.manifest_title || "",
          checkpoint_count: manifest?.checkpoint_count || null,
        };
      })
      .filter((post) => !checkpointCount || Number(post.checkpoint_count || 0) === checkpointCount)
      .map(({ manifest_id, ...post }) => post);
    return res.json({ posts: enriched });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/messenger/wall", async (req, res) => {
  const city = req.body.city || "";
  const checkpointCount = Number(req.body.checkpoint_count || 0) || null;
  try {
    const { data: posts, error } = await supabase
      .from("messenger_proof_posts")
      .select("id, run_id, manifest_id, user_id, rider_name, city_name, city_slug, checkpoint_name, location_label, is_public, created_at, public_url, storage_path, bike_name, bike_ratio")
      .eq("is_public", true)
      .ilike("city_name", `%${city}%`)
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) return res.status(500).json({ error: error.message });
    const groups = new Map();
    for (const post of posts || []) {
      const key = post.run_id || post.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(post);
    }
    const picked = [...groups.values()]
      .map((group) => group[Math.floor(Math.random() * group.length)] || group[0])
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 40);
    const manifestIds = [...new Set(picked.map((post) => post.manifest_id).filter(Boolean))];
    const { data: manifests, error: manifestsError } = manifestIds.length
      ? await supabase.from("messenger_manifests").select("id, manifest_title, checkpoint_count").in("id", manifestIds)
      : { data: [], error: null };
    if (manifestsError) return res.status(500).json({ error: manifestsError.message });
    const manifestMap = new Map((manifests || []).map((manifest) => [manifest.id, manifest]));
    const enriched = picked
      .map((post) => {
        const manifest = manifestMap.get(post.manifest_id);
        return {
          ...post,
          manifest_title: manifest?.manifest_title || "",
          checkpoint_count: manifest?.checkpoint_count || null,
        };
      })
      .filter((post) => !checkpointCount || Number(post.checkpoint_count || 0) === checkpointCount)
      .map(({ manifest_id, ...post }) => post);
    return res.json({ posts: enriched });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

const handleNightRideFeed = async (req, res, input = {}) => {
  const city = String(input.city ?? req.body?.city ?? req.query?.city ?? "").trim();
  try {
    const query = supabase
      .from("night_ride_posts")
      .select("id, user_id, rider_name, crew_name, city_name, route_title, distance_km, caption, image_url, aspect_ratio, moderation_status, created_at")
      .eq("is_public", true)
      .neq("moderation_status", "hidden")
      .order("created_at", { ascending: false })
      .limit(24);
    if (city) query.ilike("city_name", `%${city}%`);
    const { data: posts, error } = await query;

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ posts: posts || [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

app.post("/api/night-ride/feed", async (req, res) => {
  return handleNightRideFeed(req, res);
});

app.post("/api/night-rides/feed", async (req, res) => {
  return handleNightRideFeed(req, res);
});

app.get("/api/night-rides/feed", async (req, res) => {
  return handleNightRideFeed(req, res);
});

app.get("/api/rider-profile", async (req, res) => {
  const userId = String(req.query.user_id || "").trim();
  if (!userId) return res.status(400).json({ error: "user_id required" });

  const quarter = getQuarterWindow();
  const [profileRes, proofsRes, runsRes, quarterProofsRes, quarterRunsRes, communityRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("user_id, rider_name, home_location, bike_name, bike_ratio")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("messenger_proof_posts")
      .select("id, user_id, rider_name, city_name, city_slug, checkpoint_name, location_label, public_url, created_at, bike_name, bike_ratio")
      .eq("user_id", userId)
      .eq("is_public", true)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(18),
    supabase
      .from("messenger_runs")
      .select("id, finished_at, finish_seconds")
      .eq("user_id", userId)
      .eq("status", "finished")
      .order("finished_at", { ascending: false }),
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
    supabase
      .from("community_memberships")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (proofsRes.error) return res.status(500).json({ error: proofsRes.error.message });
  if (runsRes.error) return res.status(500).json({ error: runsRes.error.message });

  const proofs = proofsRes.data || [];
  const runs = runsRes.data || [];
  const riderName = profileRes.data?.rider_name || proofs[0]?.rider_name || "Rider";
  const quarterBoard = buildQuarterLeaderboard({
    proofs: quarterProofsRes.data || [],
    finishedRuns: quarterRunsRes.data || [],
  });
  const quarterEntry = quarterBoard.find((entry) => entry.user_id === userId) || null;
  const proofsByCity = new Map();
  for (const proof of proofs) {
    const key = proof.city_name || "Unknown city";
    proofsByCity.set(key, (proofsByCity.get(key) || 0) + 1);
  }
  const topCity = [...proofsByCity.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const bestFinish = runs
    .map((run) => Number(run.finish_seconds || 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)[0] || null;

  const isCommunityMember = !!communityRes?.data;

  return res.json({
    profile: {
      user_id: userId,
      rider_name: riderName,
      home_location: profileRes.data?.home_location || proofs[0]?.city_name || "",
      bike_name: profileRes.data?.bike_name || proofs[0]?.bike_name || "",
      bike_ratio: profileRes.data?.bike_ratio || proofs[0]?.bike_ratio || "",
      is_community_member: isCommunityMember,
    },
    stats: {
      public_proofs: proofs.length,
      finished_runs: runs.length,
      cities: new Set(proofs.map((proof) => proof.city_name).filter(Boolean)).size,
      top_city: topCity,
      best_finish_seconds: bestFinish,
      quarter_rank: quarterEntry?.rank || null,
      quarter_public_proofs: quarterEntry?.public_proofs || 0,
      quarter_finishes: quarterEntry?.finished_runs || 0,
    },
    badges: deriveBadges({
      quarterStats: quarterEntry
        ? {
            rank: quarterEntry.rank,
            public_proofs: quarterEntry.public_proofs,
            finished_runs: quarterEntry.finished_runs,
          }
        : null,
      proofs,
      manifests: [],
      challenges: [],
    }),
    recent_proofs: proofs,
  });
});

app.post("/api/rider/profile", async (req, res) => {
  const userId = String(req.body.user_id || "").trim();
  if (!userId) return res.status(400).json({ error: "user_id required" });

  const quarter = getQuarterWindow();
  const [profileRes, proofsRes, runsRes, quarterProofsRes, quarterRunsRes, communityRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("user_id, rider_name, home_location, bike_name, bike_ratio")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("messenger_proof_posts")
      .select("id, user_id, rider_name, city_name, city_slug, checkpoint_name, location_label, public_url, created_at, bike_name, bike_ratio")
      .eq("user_id", userId)
      .eq("is_public", true)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(18),
    supabase
      .from("messenger_runs")
      .select("id, finished_at, finish_seconds")
      .eq("user_id", userId)
      .eq("status", "finished")
      .order("finished_at", { ascending: false }),
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
    supabase
      .from("community_memberships")
      .select("status")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (proofsRes.error) return res.status(500).json({ error: proofsRes.error.message });
  if (runsRes.error) return res.status(500).json({ error: runsRes.error.message });

  const proofs = proofsRes.data || [];
  const runs = runsRes.data || [];
  const riderName = profileRes.data?.rider_name || proofs[0]?.rider_name || "Rider";
  const quarterBoard = buildQuarterLeaderboard({
    proofs: quarterProofsRes.data || [],
    finishedRuns: quarterRunsRes.data || [],
  });
  const quarterEntry = quarterBoard.find((entry) => entry.user_id === userId) || null;
  const proofsByCity = new Map();
  for (const proof of proofs) {
    const key = proof.city_name || "Unknown city";
    proofsByCity.set(key, (proofsByCity.get(key) || 0) + 1);
  }
  const topCity = [...proofsByCity.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const bestFinish = runs
    .map((run) => Number(run.finish_seconds || 0))
    .filter((value) => value > 0)
    .sort((a, b) => a - b)[0] || null;

  const isCommunityMember = !!communityRes?.data;

  return res.json({
    profile: {
      user_id: userId,
      rider_name: riderName,
      home_location: profileRes.data?.home_location || proofs[0]?.city_name || "",
      bike_name: profileRes.data?.bike_name || proofs[0]?.bike_name || "",
      bike_ratio: profileRes.data?.bike_ratio || proofs[0]?.bike_ratio || "",
      is_community_member: isCommunityMember,
    },
    stats: {
      public_proofs: proofs.length,
      finished_runs: runs.length,
      cities: new Set(proofs.map((proof) => proof.city_name).filter(Boolean)).size,
      top_city: topCity,
      best_finish_seconds: bestFinish,
      quarter_rank: quarterEntry?.rank || null,
      quarter_public_proofs: quarterEntry?.public_proofs || 0,
      quarter_finishes: quarterEntry?.finished_runs || 0,
    },
    badges: deriveBadges({
      quarterStats: quarterEntry
        ? {
            rank: quarterEntry.rank,
            public_proofs: quarterEntry.public_proofs,
            finished_runs: quarterEntry.finished_runs,
          }
        : null,
      proofs,
      manifests: [],
      challenges: [],
    }),
    recent_proofs: proofs,
  });
});

app.post("/api/admin/proofs", requireAdmin, async (_req, res) => {
  const { data, error } = await supabase
    .from("messenger_proof_posts")
    .select("id, rider_name, city_name, checkpoint_name, is_public, created_at, public_url, storage_path, archived_at")
    .order("created_at", { ascending: false })
    .limit(250);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ proofs: data || [] });
});

app.post("/api/admin/proof-archive-month", requireAdmin, async (req, res) => {
  const month = String(req.body?.month || "").trim();
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) return res.status(400).json({ error: "month must be YYYY-MM" });
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1)).toISOString();
  const end = new Date(Date.UTC(year, monthIndex + 1, 1)).toISOString();

  const { data, error } = await supabase
    .from("messenger_proof_posts")
    .update({ archived_at: new Date().toISOString() })
    .gte("created_at", start)
    .lt("created_at", end)
    .is("archived_at", null)
    .select("id");
  if (error) return res.status(500).json({ error: error.message });
  await recordModerationAction({
    adminUser: req.adminUser,
    action: "proof_archive_month",
    targetType: "proof_month",
    targetId: month,
    targetLabel: month,
    details: {
      month,
      archived_count: data?.length || 0,
    },
  });
  return res.json({ ok: true, month, archived: data?.length || 0 });
});

async function handlePublicLeaderboard(req, res, input = {}) {
  const city = String(input.city ?? req.query.city ?? "").trim().toLowerCase();
  const country = String(input.country ?? req.query.country ?? "").trim().toLowerCase();
  const checkpointCount = Number(input.checkpoint_count ?? req.body?.checkpoint_count ?? req.query.checkpoints ?? req.query.checkpoint_count ?? 0) || null;
  const cityCountryMap = {
    amsterdam: "netherlands",
    bangkok: "thailand",
    barcelona: "spain",
    berlin: "germany",
    bogota: "colombia",
    buenosaires: "argentina",
    chicago: "united states",
    krakow: "poland",
    london: "united kingdom",
    losangeles: "united states",
    mexicocity: "mexico",
    milan: "italy",
    newyork: "united states",
    paris: "france",
    philadelphia: "united states",
    sanfrancisco: "united states",
    santos: "brazil",
    saopaulo: "brazil",
    seattle: "united states",
    seoul: "south korea",
    taipei: "taiwan",
    tokyo: "japan",
    vienna: "austria",
    warsaw: "poland",
  };
  const cityScope = country
    ? Object.entries(cityCountryMap)
        .filter(([, mappedCountry]) => mappedCountry === country)
        .map(([slug]) => slug)
    : [];
  const quarter = getQuarterWindow();
  const proofsQuery = supabase
    .from("messenger_proof_posts")
    .select("user_id,rider_name,city_name,created_at,manifest_id")
    .eq("is_public", true)
    .gte("created_at", quarter.start.toISOString())
    .lt("created_at", quarter.end.toISOString());
  if (city) proofsQuery.eq("city_slug", city);
  if (!city && country && cityScope.length) proofsQuery.in("city_slug", cityScope);
  let manifestIds = [];
  if (city || (country && cityScope.length) || checkpointCount) {
    const manifestsQuery = supabase.from("messenger_manifests").select("id");
    if (city) manifestsQuery.eq("city_slug", city);
    else if (country && cityScope.length) manifestsQuery.in("city_slug", cityScope);
    if (checkpointCount) manifestsQuery.eq("checkpoint_count", checkpointCount);
    const manifestsRes = await manifestsQuery;
    if (manifestsRes.error) return res.status(500).json({ error: manifestsRes.error.message });
    manifestIds = (manifestsRes.data || []).map((item) => item.id).filter(Boolean);
    if (!manifestIds.length) {
      return res.json({
        quarter: {
          label: quarter.label,
          city,
          country,
          leaders: [],
        },
      });
    }
    proofsQuery.in("manifest_id", manifestIds);
  }
  const proofsRes = await proofsQuery;
  const runsQuery = supabase
    .from("messenger_runs")
    .select("user_id,finished_at")
    .eq("status", "finished")
    .gte("finished_at", quarter.start.toISOString())
    .lt("finished_at", quarter.end.toISOString());
  if (manifestIds.length) runsQuery.in("manifest_id", manifestIds);
  const runsRes = await runsQuery;
  if (proofsRes.error) return res.status(500).json({ error: proofsRes.error.message });
  if (runsRes.error) return res.status(500).json({ error: runsRes.error.message });

  const leaders = buildQuarterLeaderboard({ proofs: proofsRes.data || [], finishedRuns: runsRes.data || [] }).slice(0, 25);
  const userIds = leaders.map((l) => l.user_id).filter(Boolean);

  let memberships = [];
  if (userIds.length) {
    const { data: mData } = await supabase
      .from("community_memberships")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "active");
    memberships = mData || [];
  }

  const memberSet = new Set(memberships.map((m) => m.user_id));

  return res.json({
    quarter: {
      label: quarter.label,
      city,
      country,
      leaders: leaders.map((l) => ({
        ...l,
        is_community_member: memberSet.has(l.user_id),
      })),
    },
  });
}

app.get("/api/leaderboard", async (req, res) => handlePublicLeaderboard(req, res));

app.post("/api/messenger/public-leaderboard", async (req, res) => {
  return handlePublicLeaderboard(req, res, {
    city: req.body?.city,
    country: req.body?.country,
    checkpoint_count: req.body?.checkpoint_count,
  });
});

async function handleCreateCityRequest(req, res) {
  const requested_city = String(req.body?.city || "").trim();
  const requested_location = String(req.body?.location || "").trim();
  const note = String(req.body?.note || "").trim();
  const requester_email = String(req.body?.email || "").trim();
  if (!requested_city && !requested_location) {
    return res.status(400).json({ error: "city or location required" });
  }
  const { data, error } = await supabase
    .from("city_requests")
    .insert({
      requested_city,
      requested_location,
      note,
      requester_email,
      status: "new",
    })
    .select()
    .limit(1);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true, request: data?.[0] || null });
}

app.post("/api/city-request", handleCreateCityRequest);
app.post("/api/cities/request", handleCreateCityRequest);

app.get("/api/city-demand", async (_req, res) => {
  const { data, error } = await supabase
    .from("city_requests")
    .select("requested_city,requested_location,status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return res.status(500).json({ error: error.message });

  const normalizeCityKey = (value = "") =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s-]/gu, "");
  const titleCaseCity = (value = "") =>
    String(value)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const counts = new Map();
  let open_requests = 0;
  let queued_requests = 0;
  for (const row of data || []) {
    const cityKey = normalizeCityKey(row.requested_city || row.requested_location || "");
    if (!cityKey) continue;
    const current = counts.get(cityKey) || { city: titleCaseCity(cityKey), count: 0 };
    current.count += 1;
    counts.set(cityKey, current);
    if (row.status !== "done") open_requests += 1;
    if (row.status === "queued") queued_requests += 1;
  }

  const top_cities = [...counts.values()]
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city))
    .slice(0, 5);

  return res.json({
    total_requests: (data || []).length,
    open_requests,
    queued_requests,
    top_cities,
  });
});

app.get("/api/city-lanes", handleGetCityLanes);
app.post("/api/cities/lanes", handleGetCityLanes);

async function handleGetCityLanes(_req, res) {
  const normalizeCityKey = (value = "") =>
    String(value)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s-]/gu, "");
  const slugifyCity = (value = "") =>
    String(value)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  const titleCaseCity = (value = "") =>
    String(value)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  const getPackStatus = (pack, countData, districtCount) => {
    const checkpointCount = countData?.checkpoint_count || 0;
    const activeCheckpointCount = countData?.active_checkpoint_count || 0;
    const copyReady = Boolean(pack.route_note && pack.finish_label && pack.safety_note);
    const canPublish = copyReady && activeCheckpointCount >= 4 && districtCount >= 3;
    if (pack.is_active) return "live";
    if (canPublish) return "ready";
    if (copyReady || checkpointCount > 0) return "review";
    return "draft";
  };

  const [packsRes, checkpointsRes, requestsRes, proofsRes] = await Promise.all([
    supabase.from("city_packs").select("id,slug,name,route_note,finish_label,safety_note,is_active,created_at").order("name", { ascending: true }),
    supabase.from("city_checkpoints").select("pack_id,id,is_active,district"),
    supabase.from("city_requests").select("requested_city,requested_location,status,created_at").order("created_at", { ascending: false }).limit(300),
    supabase
      .from("messenger_proof_posts")
      .select("id,city_name,public_url,created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(400),
  ]);
  if (packsRes.error) return res.status(500).json({ error: packsRes.error.message });
  if (checkpointsRes.error) return res.status(500).json({ error: checkpointsRes.error.message });
  if (requestsRes.error) return res.status(500).json({ error: requestsRes.error.message });
  if (proofsRes.error) return res.status(500).json({ error: proofsRes.error.message });

  const checkpointCounts = new Map();
  const districtsByPack = new Map();
  for (const checkpoint of checkpointsRes.data || []) {
    const current = checkpointCounts.get(checkpoint.pack_id) || { checkpoint_count: 0, active_checkpoint_count: 0 };
    current.checkpoint_count += 1;
    if (checkpoint.is_active !== false) current.active_checkpoint_count += 1;
    checkpointCounts.set(checkpoint.pack_id, current);
    if (checkpoint.district) {
      const districtSet = districtsByPack.get(checkpoint.pack_id) || new Set();
      districtSet.add(String(checkpoint.district).trim());
      districtsByPack.set(checkpoint.pack_id, districtSet);
    }
  }

  const requestCounts = new Map();
  for (const row of requestsRes.data || []) {
    const cityValue = row.requested_city || row.requested_location || "";
    const normalized = normalizeCityKey(cityValue);
    if (!normalized) continue;
    const current = requestCounts.get(normalized) || {
      city_name: titleCaseCity(cityValue),
      city_slug: slugifyCity(cityValue),
      demand_count: 0,
      open_count: 0,
      last_requested_at: null,
    };
    current.demand_count += 1;
    if (row.status !== "done") current.open_count += 1;
    if (!current.last_requested_at || row.created_at > current.last_requested_at) current.last_requested_at = row.created_at;
    requestCounts.set(normalized, current);
  }

  const recentProofsByCity = new Map();
  for (const proof of proofsRes.data || []) {
    const normalized = normalizeCityKey(proof.city_name || "");
    if (!normalized) continue;
    const current = recentProofsByCity.get(normalized) || [];
    if (current.length >= 8) continue;
    current.push({
      id: proof.id,
      public_url: proof.public_url,
      created_at: proof.created_at || null,
    });
    recentProofsByCity.set(normalized, current);
  }

  const packedCityKeys = new Set();
  const lanes = (packsRes.data || []).map((pack) => {
    const countData = checkpointCounts.get(pack.id);
    const districtCount = districtsByPack.get(pack.id)?.size || 0;
    const demand = requestCounts.get(normalizeCityKey(pack.name));
    packedCityKeys.add(normalizeCityKey(pack.name));
    return {
      city_slug: pack.slug,
      city_name: pack.name,
      status: getPackStatus(pack, countData, districtCount),
      checkpoint_count: countData?.checkpoint_count || 0,
      active_checkpoint_count: countData?.active_checkpoint_count || 0,
      district_count: districtCount,
      demand_count: demand?.demand_count || 0,
      open_request_count: demand?.open_count || 0,
      route_note: pack.route_note || "",
      finish_label: pack.finish_label || "",
      last_requested_at: demand?.last_requested_at || null,
      recent_proofs: recentProofsByCity.get(normalizeCityKey(pack.name)) || [],
    };
  });

  for (const [cityKey, demand] of requestCounts.entries()) {
    if (packedCityKeys.has(cityKey)) continue;
    lanes.push({
      city_slug: demand.city_slug,
      city_name: demand.city_name,
      status: "requested",
      checkpoint_count: 0,
      active_checkpoint_count: 0,
      district_count: 0,
      demand_count: demand.demand_count,
      open_request_count: demand.open_count,
      route_note: "",
      finish_label: "",
      last_requested_at: demand.last_requested_at,
      recent_proofs: recentProofsByCity.get(cityKey) || [],
    });
  }

  const statusOrder = { live: 0, ready: 1, review: 2, draft: 3, requested: 4 };
  lanes.sort((left, right) => {
    const statusDiff = (statusOrder[left.status] ?? 99) - (statusOrder[right.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    const demandDiff = (right.demand_count || 0) - (left.demand_count || 0);
    if (demandDiff !== 0) return demandDiff;
    return left.city_name.localeCompare(right.city_name);
  });

  return res.json({ lanes });
}

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
