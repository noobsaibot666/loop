import React, { useEffect, useMemo, useState } from "react";
import {
  Crown,
  Globe,
  History,
  Map,
  Moon,
  Shield,
  ShoppingBag,
  Trophy,
  Users,
  Trash2,
  Download,
  AlertTriangle,
  Activity,
} from "lucide-react";
import accountHero from "../images/hero_8.png";
import Hero from "../components/Hero";
import { useI18n } from "../i18n";
import { supabase } from "../config";
import { useAuthStore } from "../store/useAuthStore";
import { useCreditStore } from "../store/useCreditStore";
import { useUIStore } from "../store/useUIStore";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDuration, getJSON, postJSON } from "../utils/routeUtils";
import { openMapsUrl } from "../utils/maps";
import type { NightRideAccountSession, RiderBike } from "../types";

type StatusTone = "success" | "error" | "info";
type ExpandKey = "purchases" | "loops" | "hunts" | "challenges" | "crew" | "night";
type BikeDraft = RiderBike;

const CREDIT_PACKS = [
  { amount: 500, labelKey: "account.credits.topUpLane" },
  { amount: 1500, labelKey: "account.credits.heavyPull" },
];

const getBikeSlotLabel = (index: number) => `Bike ${String.fromCharCode(65 + index)}`;

const RiderAccount: React.FC = () => {
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, handleLogout } = useAuthStore();
  const { deviceId, setAuthModalOpen, setAuthMode } = useUIStore();
  const { usage, fetchUsage, fetchAccountSummary, accountSummary, isLoading } = useCreditStore();

  const [profileForm, setProfileForm] = useState({
    rider_name: "",
    home_location: "",
    bike_name: "",
    bike_ratio: "",
    collaboration_note: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [bikes, setBikes] = useState<BikeDraft[]>([]);
  const [nightRides, setNightRides] = useState<NightRideAccountSession[]>([]);
  const [isNightLoading, setIsNightLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingCollaboration, setIsSubmittingCollaboration] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [membershipBusy, setMembershipBusy] = useState<"checkout" | "invite" | "portal" | "connect" | null>(null);
  const [creditCheckoutAmount, setCreditCheckoutAmount] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ tone: StatusTone; text: string } | null>(null);
  const [expanded, setExpanded] = useState<Record<ExpandKey, boolean>>({
    purchases: false,
    loops: false,
    hunts: false,
    challenges: false,
    crew: false,
    night: false,
  });

  useEffect(() => {
    if (user && deviceId) {
      fetchUsage(user.id, deviceId);
      if (accessToken) void fetchAccountSummary(accessToken);
    }
  }, [user, deviceId, accessToken, fetchUsage, fetchAccountSummary]);

  useEffect(() => {
    if (!accountSummary?.profile) return;
    setProfileForm({
      rider_name: accountSummary.profile.rider_name || "",
      home_location: accountSummary.profile.home_location || "",
      bike_name: accountSummary.profile.bike_name || "",
      bike_ratio: accountSummary.profile.bike_ratio || "",
      collaboration_note: accountSummary.profile.collaboration_note || "",
    });
    setBikes(
      (accountSummary.bikes || []).length
        ? accountSummary.bikes
        : accountSummary.profile.bike_name || accountSummary.profile.bike_ratio
          ? [
              {
                id: "legacy-bike",
                bike_name: accountSummary.profile.bike_name || "",
                bike_ratio: accountSummary.profile.bike_ratio || "",
                is_default: true,
                sort_order: 0,
              },
            ]
          : []
    );
  }, [accountSummary]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const communityState = params.get("community");
    if (!communityState) return;
    if (communityState === "discord-linked") pushStatus("success", t("account.messages.discordLinked"));
    if (communityState === "discord-denied") pushStatus("info", t("account.messages.discordDenied"));
    if (communityState === "discord-expired") pushStatus("error", t("account.messages.discordExpired"));
    if (communityState === "discord-error") pushStatus("error", t("account.messages.discordError"));
    if (communityState === "discord-inactive") pushStatus("error", t("account.messages.discordInactive"));
    if (accessToken) void fetchAccountSummary(accessToken);
    navigate("/account", { replace: true });
  }, [location.search, accessToken, fetchAccountSummary, navigate, t]);

  useEffect(() => {
    let ignore = false;

    async function loadNightRides() {
      if (!user) {
        setNightRides([]);
        return;
      }
      setIsNightLoading(true);
      try {
        const sessions = await getJSON<NightRideAccountSession[]>("/api/night-rides/mine");
        if (!ignore) setNightRides(Array.isArray(sessions) ? sessions : []);
      } catch {
        if (!ignore) setNightRides([]);
      } finally {
        if (!ignore) setIsNightLoading(false);
      }
    }

    void loadNightRides();
    return () => {
      ignore = true;
    };
  }, [user]);

  const pushStatus = (tone: StatusTone, text: string) => setStatusMessage({ tone, text });
  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const membership = accountSummary?.community_membership || null;
  const isMembershipActive = Boolean(membership?.access_active || membership?.access_state === "active");
  const discordLinked = Boolean(membership?.discord_linked);
  const discordReady = Boolean(
    discordLinked &&
      (!membership?.discord_role_status ||
        membership.discord_role_status === "granted")
  );
  const accountName = accountSummary?.profile?.rider_name || user?.email?.split("@")[0] || "rider";
  const greeting = t("account.greeting", { name: accountName });
  const accountSubtitle = user ? t("account.subtitleAuthed", { greeting }) : t("account.subtitleGuest");
  const activity = accountSummary?.alleycat;
  const quarter = accountSummary?.quarter;
  const badges = accountSummary?.badges || [];

  const quarterLeaders = useMemo(() => quarter?.leaders || [], [quarter]);
  const visiblePurchases = expanded.purchases ? accountSummary?.purchases || [] : (accountSummary?.purchases || []).slice(0, 4);
  const visibleLoops = expanded.loops ? accountSummary?.loop_history || [] : (accountSummary?.loop_history || []).slice(0, 4);
  const visibleHunts = expanded.hunts ? accountSummary?.alleycat_history || [] : (accountSummary?.alleycat_history || []).slice(0, 4);
  const visibleChallenges = expanded.challenges ? accountSummary?.challenge_history || [] : (accountSummary?.challenge_history || []).slice(0, 4);
  const visibleCrew = expanded.crew ? accountSummary?.shared_riders || [] : (accountSummary?.shared_riders || []).slice(0, 4);
  const visibleNight = expanded.night ? nightRides : nightRides.slice(0, 4);

  const toggleExpanded = (key: ExpandKey) => setExpanded((current) => ({ ...current, [key]: !current[key] }));
  const normalizeBikeList = (nextBikes: BikeDraft[]) => {
    const cleaned = nextBikes.map((bike, index) => ({
      ...bike,
      bike_name: bike.bike_name || "",
      bike_ratio: bike.bike_ratio || "",
      sort_order: index,
    }));
    if (!cleaned.length) return [];
    const hasDefault = cleaned.some((bike) => bike.is_default);
    return cleaned.map((bike, index) => ({
      ...bike,
      is_default: hasDefault ? bike.is_default : index === 0,
      sort_order: index,
    }));
  };
  const addBike = () =>
    setBikes((current) =>
      normalizeBikeList([
        ...current,
        {
          id: `bike-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          bike_name: "",
          bike_ratio: "",
          is_default: current.length === 0,
          sort_order: current.length,
        },
      ])
    );
  const updateBike = (bikeId: string, field: "bike_name" | "bike_ratio", value: string) =>
    setBikes((current) =>
      normalizeBikeList(current.map((bike) => (bike.id === bikeId ? { ...bike, [field]: value } : bike)))
    );
  const setDefaultBike = (bikeId: string) =>
    setBikes((current) =>
      normalizeBikeList(current.map((bike) => ({ ...bike, is_default: bike.id === bikeId })))
    );
  const removeBike = (bikeId: string) =>
    setBikes((current) => normalizeBikeList(current.filter((bike) => bike.id !== bikeId)));

  const formatMoney = (amountCents: number, currency = "usd") => {
    const normalized = (currency || "usd").toUpperCase();
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: normalized,
        minimumFractionDigits: 0,
      }).format((amountCents || 0) / 100);
    } catch {
      return `${((amountCents || 0) / 100).toFixed(0)} ${normalized}`;
    }
  };

  const handleManagePortal = async () => {
    try {
      setMembershipBusy("portal");
      const { url } = await postJSON<{ url: string }>("/api/stripe/portal", {});
      window.location.href = url;
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setMembershipBusy(null);
    }
  };

  const handleStartMembership = async () => {
    try {
      setMembershipBusy("checkout");
      const { url } = await postJSON<{ url: string }>("/api/create-membership-session", {});
      window.location.href = url;
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setMembershipBusy(null);
    }
  };

  const handleOpenInvite = async () => {
    try {
      setMembershipBusy("invite");
      const { url } = await postJSON<{ url: string }>("/api/community-membership/access", {});
      window.location.href = url;
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setMembershipBusy(null);
    }
  };

  const handleConnectDiscord = async () => {
    try {
      setMembershipBusy("connect");
      const { url } = await postJSON<{ url: string }>("/api/community-membership/discord-start", {});
      window.location.href = url;
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setMembershipBusy(null);
    }
  };

  const handleCreditCheckout = async (amount: number) => {
    try {
      setCreditCheckoutAmount(amount);
      const { url } = await postJSON<{ url: string }>("/api/create-checkout-session", { amount });
      window.location.href = url;
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setCreditCheckoutAmount(null);
    }
  };

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingProfile(true);
    try {
      const bikesToSave = bikes
        .map((bike, index) => ({
          ...bike,
          bike_name: bike.bike_name.trim(),
          bike_ratio: bike.bike_ratio.trim(),
          sort_order: index,
        }))
        .filter((bike) => bike.bike_name || bike.bike_ratio);
      await postJSON("/api/account/profile", {
        ...profileForm,
        bikes: bikesToSave,
      });
      if (accessToken) await fetchAccountSummary(accessToken);
      pushStatus("success", t("account.messages.profileSaved"));
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    const nextPassword = newPassword.trim();
    if (!nextPassword) {
      pushStatus("error", t("account.messages.addNewPassword"));
      return;
    }
    if (!supabase) {
      pushStatus("error", t("common.authUnavailable"));
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: nextPassword });
      if (error) throw error;
      setNewPassword("");
      pushStatus("success", t("account.messages.passwordUpdated"));
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      pushStatus("error", t("account.messages.addEmailFirst"));
      return;
    }
    if (!supabase) {
      pushStatus("error", t("common.authUnavailable"));
      return;
    }
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/account`,
      });
      if (error) throw error;
      pushStatus("success", t("account.messages.resetSent"));
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCollaborationRequest = async () => {
    setIsSubmittingCollaboration(true);
    try {
      const bikesToSave = bikes
        .map((bike, index) => ({
          ...bike,
          bike_name: bike.bike_name.trim(),
          bike_ratio: bike.bike_ratio.trim(),
          sort_order: index,
        }))
        .filter((bike) => bike.bike_name || bike.bike_ratio);
      await postJSON("/api/account/profile", {
        ...profileForm,
        bikes: bikesToSave,
        collaboration_submit: true,
      });
      if (accessToken) await fetchAccountSummary(accessToken);
      pushStatus("success", t("account.messages.collaborationSent"));
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsSubmittingCollaboration(false);
    }
  };

  const handleFeedbackSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const wordCount = (feedback.trim().match(/\S+/g) || []).length;
    if (wordCount > 200) {
      pushStatus("error", t("account.messages.feedbackTooLong"));
      return;
    }
    setIsSendingFeedback(true);
    try {
      await postJSON("/api/account-feedback", {
        feedback,
        rider_name: profileForm.rider_name || accountSummary?.profile?.rider_name || "",
      });
      setFeedback("");
      pushStatus("success", t("account.messages.feedbackSent"));
    } catch (error: any) {
      pushStatus("error", error.message || t("account.messages.feedbackFailed"));
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleExportData = async () => {
    if (!accountSummary) return;
    setIsExporting(true);
    try {
      const dataStr = JSON.stringify(accountSummary, null, 2);
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `loop-rider-data-${user?.id || "export"}.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      pushStatus("success", t("account.dangerZone.exporting"));
    } catch (err) {
      console.error("Export failed:", err);
      pushStatus("error", "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    if (!supabase || !user) {
      pushStatus("error", t("common.authUnavailable"));
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.from("user_profiles").delete().eq("user_id", user.id);
      
      // We also call the edge function/api to purge auth and other tables
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Purge failed");
      }

      pushStatus("success", t("account.dangerZone.status"));
      setTimeout(() => {
        handleLogout();
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Delete failed:", err);
      pushStatus("error", "Delete failed. Contact support.");
      setIsDeleting(false);
    }
  };

  const handleLogoutAndNotify = async () => {
    await handleLogout();
    pushStatus("info", t("account.messages.loggedOut"));
  };

  if (!user) {
    return (
      <div className="sequential-layout sub-page page-account page-stage-enter">
        <Hero
          title={t("account.guest.title")}
          subtitle={t("account.guest.subtitle")}
          image={accountHero}
          actions={null}
        />
        <section className="builder-grid single reveals">
          <div className="glass-card form-card account-guest-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.guest.title")}</div>
                <div className="form-subtitle">{t("account.auth.subtitle")}</div>
              </div>
              <div className="mini-chip active">{t("nav.accountShort")}</div>
            </div>
            <div className="account-note">{t("account.guest.subtitle")}</div>
            <div className="form-actions centered-actions">
              <button type="button" className="primary-button" onClick={() => openAuth("signin")}>
                {t("account.guest.signIn")}
              </button>
              <button type="button" className="ghost-button" onClick={() => openAuth("signup")}>
                {t("account.guest.create")}
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="sequential-layout sub-page page-account page-stage-enter">
      <Hero
        title={t("account.title")}
        subtitle={accountSubtitle}
        image={accountHero}
        actions={
          <div className="hero-actions">
            {(usage?.is_admin || accountSummary?.is_admin) && (
              <button className="ghost-button small" onClick={() => navigate("/admin")}>
                {t("footer.admin")}
              </button>
            )}
            <button className="ghost-button small" onClick={handleLogoutAndNotify}>
              {t("account.profile.logout")}
            </button>
          </div>
        }
      />

      <section className="builder-grid single reveals">
        <div className="account-shell">
          <div className="account-topbar">
            <div>
              <div className="form-title">{greeting}</div>
              <div className="account-kicker">{t("account.topbar.kicker")}</div>
              <div className="account-identity">
                <strong>{accountSummary?.profile?.rider_name || accountName}</strong>
                <span>{user?.email || t("account.profile.noEmail")}</span>
              </div>
            </div>
            <div className="section-jump-strip account-topbar-actions">
              <a className="mini-chip active" href="#account-setup">{t("account.jump.setup")}</a>
              <a className="mini-chip" href="#account-credits">{t("account.jump.credits")}</a>
              <a className="mini-chip" href="#account-stats">{t("account.jump.stats")}</a>
              <a className="mini-chip" href="#account-history">{t("account.jump.history")}</a>
            </div>
          </div>
        </div>

        <div className="account-grid">
          <div className="glass-card form-card account-summary-card" id="account-setup">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.profile.title")}</div>
                <div className="form-subtitle">{t("account.profile.subtitle")}</div>
              </div>
            </div>
            <div className="account-note">{t("account.profile.helper")}</div>
            <form className="account-stack" onSubmit={handleProfileSave}>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("account.profile.riderName")}</span>
                  <input
                    type="text"
                    value={profileForm.rider_name}
                    placeholder={t("account.profile.riderNamePlaceholder")}
                    onChange={(event) => setProfileForm((current) => ({ ...current, rider_name: event.target.value }))}
                  />
                </label>
                <label className="field">
                  <span>{t("account.profile.homeLocation")}</span>
                  <input
                    type="text"
                    value={profileForm.home_location}
                    placeholder={t("account.profile.homeLocationPlaceholder")}
                    onChange={(event) => setProfileForm((current) => ({ ...current, home_location: event.target.value }))}
                  />
                </label>
              </div>
              <div className="account-bike-block">
                <div className="form-header account-inline-header">
                  <div>
                    <div className="section-title small-title">{t("account.profile.bikesTitle")}</div>
                    <div className="form-subtitle">{t("account.profile.bikesSubtitle")}</div>
                  </div>
                  <button type="button" className="ghost-button small account-card-reset" onClick={addBike}>
                    {t("account.profile.addBike")}
                  </button>
                </div>
                <div className="account-bike-list">
                  {bikes.map((bike, index) => (
                    <div key={bike.id} className={`account-bike-card ${bike.is_default ? "active" : ""}`}>
                      <div className="account-bike-head">
                        <div className="account-bike-title">
                          <span className="account-bike-slot-pill">{getBikeSlotLabel(index)}</span>
                          <strong>{bike.bike_name.trim() || t("account.profile.bikeFallback", { number: index + 1 })}</strong>
                        </div>
                        <div className="account-bike-actions">
                          <button
                            type="button"
                            className={`ghost-button small account-card-reset ${bike.is_default ? "active" : ""}`}
                            onClick={() => setDefaultBike(bike.id)}
                          >
                            {bike.is_default ? t("account.profile.defaultBike") : t("account.profile.makeDefault")}
                          </button>
                          <button type="button" className="ghost-button small account-card-reset" onClick={() => removeBike(bike.id)}>
                            {t("account.profile.deleteBike")}
                          </button>
                        </div>
                      </div>
                      <div className="profile-grid">
                        <label className="field">
                          <span>{t("account.profile.bikeName")}</span>
                          <input
                            type="text"
                            value={bike.bike_name}
                            placeholder={t("account.profile.bikeNamePlaceholder")}
                            onChange={(event) => updateBike(bike.id, "bike_name", event.target.value)}
                          />
                        </label>
                        <label className="field">
                          <span>{t("account.profile.bikeRatio")}</span>
                          <input
                            type="text"
                            value={bike.bike_ratio}
                            placeholder={t("account.profile.bikeRatioPlaceholder")}
                            onChange={(event) => updateBike(bike.id, "bike_ratio", event.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                  {!bikes.length ? (
                    <div className="account-note">{t("account.profile.noBikes")}</div>
                  ) : null}
                </div>
              </div>
              <div className="form-actions account-form-actions">
                <button type="submit" className="primary-button" disabled={isSavingProfile}>
                  {isSavingProfile ? t("account.profile.saving") : t("account.profile.save")}
                </button>
                <button
                  type="button"
                  className="ghost-button small account-card-reset"
                  onClick={() => {
                    setProfileForm({
                      rider_name: accountSummary?.profile?.rider_name || "",
                      home_location: accountSummary?.profile?.home_location || "",
                      bike_name: accountSummary?.profile?.bike_name || "",
                      bike_ratio: accountSummary?.profile?.bike_ratio || "",
                      collaboration_note: accountSummary?.profile?.collaboration_note || "",
                    });
                    setBikes(
                      (accountSummary?.bikes || []).length
                        ? accountSummary?.bikes || []
                        : accountSummary?.profile?.bike_name || accountSummary?.profile?.bike_ratio
                          ? [
                              {
                                id: "legacy-bike",
                                bike_name: accountSummary?.profile?.bike_name || "",
                                bike_ratio: accountSummary?.profile?.bike_ratio || "",
                                is_default: true,
                                sort_order: 0,
                              },
                            ]
                          : []
                    );
                  }}
                >
                  {t("account.common.clear")}
                </button>
              </div>
            </form>
            <div className="account-divider" />
            <div className="account-stack">
              <div>
                <div className="section-title small-title">{t("account.profile.changePassword")}</div>
                <div className="form-subtitle">{user.email || t("account.profile.noEmail")}</div>
              </div>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("account.profile.changePassword")}</span>
                  <input
                    type="password"
                    value={newPassword}
                    placeholder={t("account.profile.newPasswordPlaceholder")}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="button" className="primary-button" disabled={isUpdatingPassword} onClick={handlePasswordUpdate}>
                  {isUpdatingPassword ? t("common.working") : t("account.profile.updatePassword")}
                </button>
                <button type="button" className="ghost-button" disabled={isResettingPassword} onClick={handlePasswordReset}>
                  {isResettingPassword ? t("common.working") : t("account.auth.resetPassword")}
                </button>
              </div>
            </div>
            <div className="account-divider" />
            <div className="account-stack" id="account-collaboration">
              <div>
                <div className="section-title small-title">{t("account.profile.collaborationTitle")}</div>
                <div className="form-subtitle">{t("account.profile.collaborationSubtitle")}</div>
              </div>
              {accountSummary?.profile?.collaboration_status === "pending" && accountSummary?.profile?.collaboration_requested_at ? (
                <div className="account-note">
                  {t("account.profile.collaborationPending", {
                    date: formatDate(accountSummary.profile.collaboration_requested_at),
                  })}
                </div>
              ) : null}
              <div className="account-note">{t("account.profile.collaborationNote")}</div>
              <label className="field">
                <span>{t("account.profile.collaborationLabel")}</span>
                <textarea
                  rows={4}
                  value={profileForm.collaboration_note}
                  placeholder={t("account.profile.collaborationPlaceholder")}
                  onChange={(event) => setProfileForm((current) => ({ ...current, collaboration_note: event.target.value }))}
                />
              </label>
              <div className="form-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSubmittingCollaboration}
                  onClick={handleCollaborationRequest}
                >
                  {isSubmittingCollaboration ? t("common.working") : t("account.profile.collaborationAction")}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card form-card account-credits-card" id="account-credits">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.credits.title")}</div>
                <div className="form-subtitle">{t("account.credits.subtitle")}</div>
              </div>
              {usage?.is_admin && <div className="achievement-badge gold"><Crown size={14} /> {t("credits.admin")}</div>}
            </div>
            <div className="result-grid result-grid-two account-credit-grid">
              <div className="metric-group">
                <span>{t("account.credits.freeLoopsLeft")}</span>
                <strong>{usage?.free_remaining ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.credits.paidCreditsLive")}</span>
                <strong>{usage?.credits_remaining ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.credits.loopBurn")}</span>
                <strong>{t("account.credits.each", { count: 1 })}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.credits.alleycatBurn")}</span>
                <strong>{t("account.credits.each", { count: 3 })}</strong>
              </div>
            </div>
            <div className="account-credit-rules">
              <div className="account-note">
                {t("account.credits.note", { loop: 1, alleycat: 3 })}
              </div>
            </div>
            <div className="result-grid result-grid-two">
              {CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.amount}
                  type="button"
                  className="ghost-button"
                  disabled={creditCheckoutAmount === pack.amount}
                  onClick={() => handleCreditCheckout(pack.amount)}
                >
                  {creditCheckoutAmount === pack.amount
                    ? t("common.working")
                    : `${t(pack.labelKey)} · ${formatMoney(pack.amount)}`}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card form-card account-community-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.community.title")}</div>
                <div className="form-subtitle">{t("account.community.subtitle")}</div>
              </div>
              <div className={`mini-chip ${isMembershipActive ? "active" : ""}`}>
                {membership?.access_state || membership?.status || t("account.community.statusInactive")}
              </div>
            </div>
            <div className="account-note">{t("account.community.note")}</div>
            <div className="account-community-perks">
              <span>• {t("home.community.line1")}</span>
              <span>• {t("home.community.line2")}</span>
              <span>• {t("home.community.line3")}</span>
              <span>• {t("home.community.line4")}</span>
            </div>
            <div className="result-grid result-grid-two account-credit-grid">
              <div className="metric-group">
                <span>{t("account.community.plan")}</span>
                <strong>{t("account.community.planName")}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.community.price")}</span>
                <strong>{membership ? formatMoney(membership.price_cents, membership.currency) : "--"}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.community.access")}</span>
                <strong>{t("account.community.discord")}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.community.status")}</span>
                <strong>{membership?.access_state || membership?.status || t("account.community.statusInactive")}</strong>
              </div>
            </div>
            {discordLinked && membership?.discord_username ? (
              <div className="account-note">{t("account.community.linkedAs", { name: membership.discord_username })}</div>
            ) : null}
            {isMembershipActive && !discordReady ? (
              <div className="account-note">{t("account.community.linkNeeded")}</div>
            ) : null}
            {membership?.current_period_end && (
              <div className="account-note">
                {t("account.community.renews", { date: formatDate(membership.current_period_end) })}
              </div>
            )}
            <div className="form-actions">
              {!isMembershipActive && (
                <button type="button" className="primary-button" disabled={membershipBusy === "checkout"} onClick={handleStartMembership}>
                  {membershipBusy === "checkout" ? t("account.community.loading") : t("account.community.action")}
                </button>
              )}
              {isMembershipActive && !discordReady && (
                <button type="button" className="primary-button" disabled={membershipBusy === "connect"} onClick={handleConnectDiscord}>
                  {membershipBusy === "connect" ? t("account.community.connectingDiscord") : t("account.community.connectDiscord")}
                </button>
              )}
              {isMembershipActive && discordReady && (
                <button type="button" className="primary-button" disabled={membershipBusy === "invite"} onClick={handleOpenInvite}>
                  {membershipBusy === "invite" ? t("account.community.openingInvite") : t("account.community.openInvite")}
                </button>
              )}
              {membership && (
                <button type="button" className="ghost-button account-community-secondary-action" disabled={membershipBusy === "portal"} onClick={handleManagePortal}>
                  {membershipBusy === "portal" ? t("common.working") : t("account.community.manageBilling")}
                </button>
              )}
            </div>
          </div>

          <div className="glass-card form-card account-stats-card" id="account-stats">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.activity.title")}</div>
                <div className="form-subtitle">{t("account.activity.subtitle")}</div>
              </div>
              <div className="mini-chip active">{t("home.alleycat.title")}</div>
            </div>
            <div className="result-grid result-grid-three">
              <div className="metric-group">
                <span>{t("account.activity.manifests")}</span>
                <strong>{activity?.manifests ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.activity.runs")}</span>
                <strong>{activity?.runs ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.activity.finished")}</span>
                <strong>{activity?.finished_runs ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.activity.challenges")}</span>
                <strong>{activity?.challenges ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.activity.proofs")}</span>
                <strong>{activity?.proofs ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.activity.publicProofs")}</span>
                <strong>{activity?.public_proofs ?? 0}</strong>
              </div>
            </div>
            <div className="account-note">
              {t("account.activity.note", { alleycat: 3 })}
            </div>
          </div>

          <div className="glass-card form-card account-quarter-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.quarter.title")}</div>
                <div className="form-subtitle">{t("account.quarter.subtitle", { label: quarter?.label || "--" })}</div>
              </div>
              <div className="achievement-badge gold"><Trophy size={14} /> {quarter?.label || "--"}</div>
            </div>
            <div className="result-grid result-grid-three">
              <div className="metric-group">
                <span>{t("account.quarter.rank")}</span>
                <strong>{quarter?.rank ? `#${quarter.rank}` : "--"}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.quarter.publicProofs")}</span>
                <strong>{quarter?.public_proofs ?? 0}</strong>
              </div>
              <div className="metric-group">
                <span>{t("account.quarter.finishes")}</span>
                <strong>{quarter?.finished_runs ?? 0}</strong>
              </div>
            </div>
            <div className="account-note">
              {quarter?.total_ranked_riders
                ? t("account.quarter.ridersOnBoard", { count: quarter.total_ranked_riders })
                : t("account.quarter.noRanked")}
            </div>
            {!!quarterLeaders.length && (
              <div className="history-list">
                {quarterLeaders.map((leader) => (
                  <div key={leader.user_id} className="history-row">
                    <div>
                      <strong>
                        <button type="button" className="inline-link-button" onClick={() => navigate(`/rider/${leader.user_id}`)}>
                          {leader.rider_name}
                        </button>
                      </strong>
                      <span>{t("account.quarter.proofsFinishes", { proofs: leader.public_proofs, finishes: leader.finished_runs })}</span>
                    </div>
                    <div className="history-actions">
                      <strong>#{leader.rank}</strong>
                      <span>{leader.user_id === user.id ? t("account.quarter.you") : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="badge-list">
              {badges.length ? badges.map((badge) => (
                <div key={badge.id} className="badge-chip">
                  <strong>{badge.label}</strong>
                  <span>{badge.description}</span>
                </div>
              )) : (
                <div className="account-note">{t("account.quarter.noBadges")}</div>
              )}
            </div>
          </div>

          <div className="glass-card form-card account-purchases-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.purchases.title")}</div>
                <div className="form-subtitle">{t("account.purchases.subtitle")}</div>
              </div>
              <ShoppingBag size={18} className="text-muted" />
            </div>
            {!accountSummary?.purchases?.length ? (
              <div className="account-note">{t("account.purchases.empty")}</div>
            ) : (
              <>
                <div className="purchase-list">
                  {visiblePurchases.map((purchase) => (
                    <div key={purchase.session_id} className="purchase-row">
                      <div>
                        <strong>{formatMoney(purchase.amount_cents)}</strong>
                        <span>{formatDate(purchase.created_at)}</span>
                      </div>
                      <div className="history-actions">
                        <strong>{t("account.purchases.credits", { count: purchase.credits_to_grant })}</strong>
                        <span>{purchase.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {accountSummary.purchases.length > 4 && (
                  <button type="button" className="ghost-button small" onClick={() => toggleExpanded("purchases")}>
                    {expanded.purchases ? t("common.showLess") : t("account.purchases.showMore")}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="glass-card form-card account-history-card" id="account-history">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.loopHistory.title")}</div>
                <div className="form-subtitle">{t("account.loopHistory.subtitle")}</div>
              </div>
              <Map size={18} className="text-muted" />
            </div>
            {!accountSummary?.loop_history?.length ? (
              <div className="account-note">{t("account.loopHistory.empty")}</div>
            ) : (
              <>
                <div className="history-list">
                  {visibleLoops.map((route) => (
                    <div key={route.id} className="history-row">
                      <div>
                        <strong>{route.loop_point}</strong>
                        <span>{route.distance_km} km · {route.surface} · {route.vibe}</span>
                        {route.bike_name ? <span>{t("common.bikeUsed")}: {route.bike_name} · {route.bike_ratio || "--"}</span> : null}
                      </div>
                      <div className="history-actions">
                        <strong>{formatDate(route.created_at)}</strong>
                        <button
                          type="button"
                          className="inline-link-button"
                          onClick={() => openMapsUrl(route.route_url)}
                        >
                          {t("account.loopHistory.open")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {accountSummary.loop_history.length > 4 && (
                  <button type="button" className="ghost-button small" onClick={() => toggleExpanded("loops")}>
                    {expanded.loops ? t("common.showLess") : t("account.loopHistory.showMore")}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.alleycatHistory.title")}</div>
                <div className="form-subtitle">{t("account.alleycatHistory.subtitle")}</div>
              </div>
              <History size={18} className="text-muted" />
            </div>
            {!accountSummary?.alleycat_history?.length ? (
              <div className="account-note">{t("account.alleycatHistory.empty")}</div>
            ) : (
              <>
                <div className="history-list">
                  {visibleHunts.map((hunt) => (
                    <div key={hunt.id} className="history-row">
                      <div>
                        <strong>{hunt.manifest_title}</strong>
                        <span>{hunt.city_name} · {hunt.difficulty} · {hunt.style}</span>
                        <span>
                          {hunt.best_seconds ? formatDuration(hunt.best_seconds) : "--:--"} · {t("account.alleycatHistory.proofs", { count: hunt.proof_count })}
                        </span>
                        {hunt.proofs?.length ? (
                          <div className="account-hunt-proof-stack">
                            {hunt.proofs.map((proof) => (
                              <a
                                key={proof.id}
                                className="account-hunt-proof-chip"
                                href={proof.public_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  className="account-hunt-proof-thumb"
                                  src={proof.public_url}
                                  alt={proof.checkpoint_name}
                                  loading="lazy"
                                  decoding="async"
                                />
                                <div className="account-hunt-proof-copy">
                                  <strong>{proof.checkpoint_name}</strong>
                                  <span>{proof.location_label}</span>
                                  <span>{formatDate(proof.created_at)}</span>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="history-actions">
                        <strong>{hunt.source_challenge_id ? t("account.alleycatHistory.shared") : t("account.alleycatHistory.solo")}</strong>
                        <span>{formatDate(hunt.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {accountSummary.alleycat_history.length > 4 && (
                  <button type="button" className="ghost-button small" onClick={() => toggleExpanded("hunts")}>
                    {expanded.hunts ? t("common.showLess") : t("account.alleycatHistory.showMore")}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.challenges.title")}</div>
                <div className="form-subtitle">{t("account.challenges.subtitle")}</div>
              </div>
              <Users size={18} className="text-muted" />
            </div>
            {!accountSummary?.challenge_history?.length ? (
              <div className="account-note">{t("account.challenges.empty")}</div>
            ) : (
              <>
                <div className="history-list">
                  {visibleChallenges.map((challenge) => (
                    <div key={challenge.challenge_id} className="history-row">
                      <div>
                        <strong>{challenge.manifest_title || t("account.challenges.manifestFallback")}</strong>
                        <span>{challenge.city_name} · {t("account.challenges.code", { code: challenge.code })}</span>
                      </div>
                      <div className="history-actions">
                        <strong>{challenge.best_seconds ? formatDuration(challenge.best_seconds) : "--:--"}</strong>
                        <span>{t("account.challenges.rivals", { count: challenge.rival_count })}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {accountSummary.challenge_history.length > 4 && (
                  <button type="button" className="ghost-button small" onClick={() => toggleExpanded("challenges")}>
                    {expanded.challenges ? t("common.showLess") : t("account.challenges.showMore")}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.crew.title")}</div>
                <div className="form-subtitle">{t("account.crew.subtitle")}</div>
              </div>
              <Globe size={18} className="text-muted" />
            </div>
            {!accountSummary?.shared_riders?.length ? (
              <div className="account-note">{t("account.crew.empty")}</div>
            ) : (
              <>
                <div className="history-list">
                  {visibleCrew.map((rider) => (
                    <div key={rider.user_id} className="history-row">
                      <div>
                        <strong>
                          <button type="button" className="inline-link-button" onClick={() => navigate(`/rider/${rider.user_id}`)}>
                            {rider.rider_name}
                          </button>
                        </strong>
                        <span>{t("account.crew.sharedChallenges", { count: rider.shared_challenges })}</span>
                        <span>{rider.cities.length ? rider.cities.join(" · ") : t("account.crew.noCityTags")}</span>
                      </div>
                      <div className="history-actions">
                        <strong>{t("account.crew.lastSeen")}</strong>
                        <span>{formatDate(rider.last_joined_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {accountSummary.shared_riders.length > 4 && (
                  <button type="button" className="ghost-button small" onClick={() => toggleExpanded("crew")}>
                    {expanded.crew ? t("common.showLess") : t("account.crew.showMore")}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.night.title")}</div>
                <div className="form-subtitle">{t("account.night.subtitle")}</div>
              </div>
              <Moon size={18} className="text-muted" />
            </div>
            {isNightLoading ? (
              <div className="status-message">{t("account.night.loading")}</div>
            ) : !nightRides.length ? (
              <div className="account-note">{t("account.night.empty")}</div>
            ) : (
              <>
                <div className="history-list">
                  {visibleNight.map((session) => (
                    <div key={session.id} className="history-row">
                      <div>
                        <strong>{session.title}</strong>
                        <span>{session.ride_city || t("account.common.city")} · {session.mode} · {session.distance_km} km</span>
                        {session.bike_name ? <span>{t("common.bikeUsed")}: {session.bike_name} · {session.bike_ratio || "--"}</span> : null}
                        <span>{session.crew_name || t("account.night.noCrewNames")}</span>
                      </div>
                      <div className="history-actions">
                        <strong>{session.session_type === "crew" ? t("account.night.crewLabel") : t("account.night.singleLabel")}</strong>
                        <span>{formatDate(session.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {nightRides.length > 4 && (
                  <button type="button" className="ghost-button small" onClick={() => toggleExpanded("night")}>
                    {expanded.night ? t("common.showLess") : t("account.night.showMore")}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="glass-card form-card account-purchases-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.feedback.title")}</div>
                <div className="form-subtitle">{t("account.feedback.subtitle")}</div>
              </div>
              <div className="account-card-head-actions">
                <Shield size={18} className="text-muted account-card-icon" />
                <button
                  type="button"
                  className="ghost-button small account-card-reset"
                  onClick={() => setFeedback("")}
                >
                  {t("account.common.clear")}
                </button>
              </div>
            </div>
            <form className="account-stack" onSubmit={handleFeedbackSubmit}>
              <label className="field">
                <span>{t("account.feedback.label")}</span>
                <textarea
                  value={feedback}
                  placeholder={t("account.feedback.placeholder")}
                  onChange={(event) => setFeedback(event.target.value)}
                />
              </label>
              <div className="account-note">
                {t("account.feedback.wordCount", { count: (feedback.trim().match(/\S+/g) || []).length })}
              </div>
              <div className="form-actions account-form-actions">
                <button type="submit" className="primary-button" disabled={isSendingFeedback}>
                  {isSendingFeedback ? t("account.feedback.sending") : t("account.feedback.send")}
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card form-card account-danger-card">
            <div className="form-header">
              <div>
                <div className="form-title">{t("account.dangerZone.title")}</div>
              </div>
              <AlertTriangle size={18} className="text-muted" />
            </div>
            
            <div className="danger-item">
              <div className="danger-item-info">
                <div className="danger-item-title">{t("account.dangerZone.exportTitle")}</div>
                <div className="danger-item-body">{t("account.dangerZone.exportBody")}</div>
              </div>
              <div className="danger-actions">
                <button 
                  className="danger-button outline" 
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  <Download size={16} />
                  {isExporting ? t("account.dangerZone.exporting") : t("account.dangerZone.exportAction")}
                </button>
              </div>
            </div>

            <div className="danger-item">
              <div className="danger-item-info">
                <div className="danger-item-title">{t("account.dangerZone.deleteTitle")}</div>
                <div className="danger-item-body">{t("account.dangerZone.deleteBody")}</div>
              </div>
              <div className="danger-actions">
                {showDeleteConfirm ? (
                  <>
                    <button 
                      className="danger-button" 
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                    >
                      <Trash2 size={16} />
                      {isDeleting ? t("account.dangerZone.deleting") : t("account.dangerZone.confirmDelete")}
                    </button>
                    <button 
                      className="ghost-button small" 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      {t("account.dangerZone.cancel")}
                    </button>
                  </>
                ) : (
                  <button 
                    className="danger-button outline" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} />
                    {t("account.dangerZone.deleteAction")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className={`status-message ${statusMessage.tone}`}>
            {statusMessage.text}
          </div>
        )}

        {isLoading && <div className="status-message">{t("common.loading")}</div>}
      </section>
    </div>
  );
};

export default RiderAccount;
