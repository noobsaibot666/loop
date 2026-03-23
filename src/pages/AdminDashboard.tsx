import React, { useEffect, useMemo, useState } from "react";
import { Crown, Eye, EyeOff, Search, Shield, Trash2, Trophy, Users, Zap } from "lucide-react";
import adminHero from "../images/hero1.png";
import Hero from "../components/Hero";
import { useI18n } from "../i18n";
import { useAuthStore } from "../store/useAuthStore";
import { postJSON } from "../utils/routeUtils";

type AdminTab = "metrics" | "riders" | "night" | "proofs";

type AdminOverview = {
  admin_email: string;
  metrics: {
    riders_with_credits: number;
    total_paid_credits: number;
    alleycat_manifests: number;
    alleycat_runs: number;
    finished_runs: number;
    shared_challenges: number;
  };
  recent_sessions: {
    session_id: string;
    status: string;
    amount_cents: number;
  }[];
  recent_proofs: AdminProof[];
  quarter: {
    label: string;
    leaders: {
      user_id: string;
      rider_name: string;
      public_proofs: number;
      finished_runs: number;
      rank: number;
    }[];
  };
};

type AdminRider = {
  user_id: string;
  email: string;
  rider_name: string;
  credits: number;
  free_used: number;
  updated_at?: string;
};

type AdminNightPost = {
  id: string;
  rider_name: string;
  crew_name?: string | null;
  city_name?: string | null;
  route_title?: string | null;
  distance_km?: number | null;
  caption?: string | null;
  image_url: string;
  moderation_status?: string | null;
  created_at: string;
};

type AdminProof = {
  id: string;
  rider_name: string;
  city_name: string;
  checkpoint_name: string;
  public_url: string;
  is_public?: boolean;
  archived_at?: string | null;
  created_at: string;
};

const AdminDashboard: React.FC = () => {
  const { t, formatDate } = useI18n();
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("metrics");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [nightPosts, setNightPosts] = useState<AdminNightPost[]>([]);
  const [proofs, setProofs] = useState<AdminProof[]>([]);
  const [riderSearch, setRiderSearch] = useState("");
  const [riderDrafts, setRiderDrafts] = useState<Record<string, { credits: string; free_used: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  const pushStatus = (tone: "success" | "error" | "info", text: string) => setActionStatus({ tone, text });

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = await postJSON<AdminOverview>("/api/admin/overview", {});
      setOverview(data);
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRiders = async () => {
    setIsLoading(true);
    try {
      const data = await postJSON<{ riders: AdminRider[] }>("/api/admin/rider-list", {});
      const nextRiders = data.riders || [];
      setRiders(nextRiders);
      setRiderDrafts(
        nextRiders.reduce<Record<string, { credits: string; free_used: string }>>((acc, rider) => {
          acc[rider.user_id] = {
            credits: String(rider.credits || 0),
            free_used: String(rider.free_used || 0),
          };
          return acc;
        }, {})
      );
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNightPosts = async () => {
    setIsLoading(true);
    try {
      const data = await postJSON<{ posts: AdminNightPost[] }>("/api/admin/night-rides", {});
      setNightPosts(data.posts || []);
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProofs = async () => {
    setIsLoading(true);
    try {
      const data = await postJSON<{ proofs: AdminProof[] }>("/api/admin/proofs", {});
      setProofs(data.proofs || []);
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsChecking(false);
        return;
      }
      try {
        const data = await postJSON<{ is_admin: boolean }>("/api/admin/check", {});
        setIsAdmin(Boolean(data.is_admin));
      } catch {
        setIsAdmin(false);
      } finally {
        setIsChecking(false);
      }
    }
    void checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === "metrics") void fetchOverview();
    if (activeTab === "riders") void fetchRiders();
    if (activeTab === "night") void fetchNightPosts();
    if (activeTab === "proofs") void fetchProofs();
  }, [activeTab, isAdmin]);

  const filteredRiders = useMemo(() => {
    const query = riderSearch.trim().toLowerCase();
    if (!query) return riders;
    return riders.filter((rider) =>
      [rider.email, rider.rider_name, rider.user_id].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [riderSearch, riders]);

  const handleNightModeration = async (postId: string, moderationStatus: "live" | "flagged" | "hidden") => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/night-ride-moderation", { post_id: postId, moderation_status: moderationStatus });
      pushStatus("success", t("admin.messages.nightUpdated", { status: moderationStatus }));
      await fetchNightPosts();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleProofVisibility = async (proofId: string, isPublic: boolean) => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/proof-visibility", { proof_id: proofId, is_public: isPublic });
      pushStatus("success", isPublic ? t("admin.messages.proofLive") : t("admin.messages.proofHidden"));
      await fetchProofs();
      if (overview) await fetchOverview();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleProofDelete = async (proofId: string) => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/proof-delete", { proof_id: proofId });
      pushStatus("success", t("admin.messages.proofDeleted"));
      await fetchProofs();
      if (overview) await fetchOverview();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleSetCredits = async (userId: string) => {
    const draft = riderDrafts[userId];
    if (!draft) return;
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/set-credits", {
        user_id: userId,
        credits: Number(draft.credits || 0),
        free_used: Number(draft.free_used || 0),
      });
      pushStatus("success", t("admin.messages.creditsUpdated"));
      await fetchRiders();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleResetRider = async (userId: string) => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/reset", { user_id: userId });
      pushStatus("success", t("admin.messages.riderReset"));
      await fetchRiders();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const formatMoney = (amountCents: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format((amountCents || 0) / 100);

  if (isChecking) {
    return <div className="status-message page-loader">{t("admin.loadingCheck")}</div>;
  }

  if (!isAdmin) {
    return <div className="status-message error page-loader">{t("admin.unauthorized")}</div>;
  }

  return (
    <div className="sequential-layout sub-page page-admin page-stage-enter">
      <Hero
        title={t("admin.title")}
        subtitle={t("admin.subtitle", { email: overview?.admin_email || user?.email || "" })}
        image={adminHero}
        actions={
          <div className="hero-actions">
            <button className={`pill ${activeTab === "metrics" ? "active" : ""}`} onClick={() => setActiveTab("metrics")}>
              {t("admin.tabs.metrics")}
            </button>
            <button className={`pill ${activeTab === "riders" ? "active" : ""}`} onClick={() => setActiveTab("riders")}>
              {t("admin.tabs.riders")}
            </button>
            <button className={`pill ${activeTab === "night" ? "active" : ""}`} onClick={() => setActiveTab("night")}>
              {t("admin.tabs.night")}
            </button>
            <button className={`pill ${activeTab === "proofs" ? "active" : ""}`} onClick={() => setActiveTab("proofs")}>
              {t("admin.tabs.proofs")}
            </button>
          </div>
        }
      />

      <section className="builder-grid single reveals">
        <div className="account-shell">
          {isLoading && <div className="status-message">{t("common.loading")}</div>}
          {actionStatus && <div className={`status-message ${actionStatus.tone}`}>{actionStatus.text}</div>}
        </div>

        {activeTab === "metrics" && overview && (
          <div className="account-grid">
            <div className="glass-card form-card account-stats-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.metrics.title")}</div>
                  <div className="form-subtitle">{t("admin.metrics.subtitle")}</div>
                </div>
                <div className="achievement-badge gold"><Crown size={14} /> {overview.admin_email}</div>
              </div>
              <div className="result-grid result-grid-three">
                <div className="metric-group">
                  <span>{t("admin.metrics.ridersWithCredits")}</span>
                  <strong>{overview.metrics.riders_with_credits}</strong>
                </div>
                <div className="metric-group">
                  <span>{t("admin.metrics.totalPaidCredits")}</span>
                  <strong>{overview.metrics.total_paid_credits}</strong>
                </div>
                <div className="metric-group">
                  <span>{t("admin.metrics.manifests")}</span>
                  <strong>{overview.metrics.alleycat_manifests}</strong>
                </div>
                <div className="metric-group">
                  <span>{t("admin.metrics.runs")}</span>
                  <strong>{overview.metrics.alleycat_runs}</strong>
                </div>
                <div className="metric-group">
                  <span>{t("admin.metrics.finishedRuns")}</span>
                  <strong>{overview.metrics.finished_runs}</strong>
                </div>
                <div className="metric-group">
                  <span>{t("admin.metrics.sharedChallenges")}</span>
                  <strong>{overview.metrics.shared_challenges}</strong>
                </div>
              </div>
            </div>

            <div className="glass-card form-card account-quarter-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.metrics.quarterBoard")}</div>
                  <div className="form-subtitle">{overview.quarter.label}</div>
                </div>
                <Trophy size={18} className="text-muted" />
              </div>
              <div className="history-list">
                {overview.quarter.leaders.map((leader) => (
                  <div key={leader.user_id} className="history-row">
                    <div>
                      <strong>{leader.rider_name}</strong>
                      <span>{leader.public_proofs} proofs · {leader.finished_runs} finishes</span>
                    </div>
                    <div className="history-actions">
                      <strong>#{leader.rank}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.metrics.sessions")}</div>
                  <div className="form-subtitle">{t("admin.metrics.sessionsSubtitle")}</div>
                </div>
                <Zap size={18} className="text-muted" />
              </div>
              <div className="purchase-list">
                {overview.recent_sessions.map((session) => (
                  <div key={session.session_id} className="purchase-row">
                    <div>
                      <strong>{formatMoney(session.amount_cents)}</strong>
                      <span>{session.session_id}</span>
                    </div>
                    <div className="history-actions">
                      <strong>{session.status}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "riders" && (
          <div className="account-grid">
            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.riders.title")}</div>
                  <div className="form-subtitle">{t("admin.riders.subtitle")}</div>
                </div>
                <Users size={18} className="text-muted" />
              </div>
              <label className="field">
                <span>{t("admin.riders.search")}</span>
                <div className="admin-search-shell">
                  <Search size={16} className="text-muted" />
                  <input
                    type="text"
                    value={riderSearch}
                    placeholder={t("admin.riders.searchPlaceholder")}
                    onChange={(event) => setRiderSearch(event.target.value)}
                  />
                </div>
              </label>
              <div className="history-list">
                {filteredRiders.map((rider) => (
                  <div key={rider.user_id} className="history-row admin-rider-row">
                    <div>
                      <strong>{rider.rider_name || rider.email}</strong>
                      <span>{rider.email}</span>
                      <span>{formatDate(rider.updated_at)}</span>
                    </div>
                    <div className="admin-rider-controls">
                      <label className="field admin-mini-field">
                        <span>{t("admin.riders.credits")}</span>
                        <input
                          type="number"
                          value={riderDrafts[rider.user_id]?.credits || "0"}
                          onChange={(event) =>
                            setRiderDrafts((current) => ({
                              ...current,
                              [rider.user_id]: {
                                credits: event.target.value,
                                free_used: current[rider.user_id]?.free_used || "0",
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="field admin-mini-field">
                        <span>{t("admin.riders.freeUsed")}</span>
                        <input
                          type="number"
                          value={riderDrafts[rider.user_id]?.free_used || "0"}
                          onChange={(event) =>
                            setRiderDrafts((current) => ({
                              ...current,
                              [rider.user_id]: {
                                credits: current[rider.user_id]?.credits || "0",
                                free_used: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <div className="admin-action-row">
                        <button type="button" className="ghost-button small" onClick={() => handleResetRider(rider.user_id)}>
                          {t("admin.riders.reset")}
                        </button>
                        <button type="button" className="primary-button small" onClick={() => handleSetCredits(rider.user_id)}>
                          {t("admin.riders.set")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "night" && (
          <div className="account-grid">
            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.night.title")}</div>
                  <div className="form-subtitle">{t("admin.night.subtitle")}</div>
                </div>
                <Shield size={18} className="text-muted" />
              </div>
              <div className="history-list">
                {nightPosts.map((post) => (
                  <div key={post.id} className="history-row admin-moderation-row">
                    <div className="admin-proof-main">
                      <img src={post.image_url} className="admin-thumb" alt={post.route_title || post.rider_name} />
                      <div>
                        <strong>{post.route_title || post.crew_name || post.rider_name}</strong>
                        <span>{post.rider_name} · {post.city_name || "--"} · {formatDate(post.created_at)}</span>
                        <span>{post.caption || t("admin.night.noCaption")}</span>
                      </div>
                    </div>
                    <div className="admin-action-row">
                      <button type="button" className="ghost-button small" onClick={() => handleNightModeration(post.id, "live")}>
                        {t("admin.night.live")}
                      </button>
                      <button type="button" className="ghost-button small" onClick={() => handleNightModeration(post.id, "flagged")}>
                        {t("admin.night.flag")}
                      </button>
                      <button type="button" className="ghost-button small" onClick={() => handleNightModeration(post.id, "hidden")}>
                        {t("admin.night.hide")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "proofs" && (
          <div className="account-grid">
            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.proofs.title")}</div>
                  <div className="form-subtitle">{t("admin.proofs.subtitle")}</div>
                </div>
                <Shield size={18} className="text-muted" />
              </div>
              <div className="history-list">
                {proofs.map((proof) => (
                  <div key={proof.id} className="history-row admin-moderation-row">
                    <div className="admin-proof-main">
                      <img src={proof.public_url} className="admin-thumb" alt={proof.checkpoint_name} />
                      <div>
                        <strong>{proof.rider_name}</strong>
                        <span>{proof.city_name} · {proof.checkpoint_name}</span>
                        <span>{formatDate(proof.created_at)}</span>
                      </div>
                    </div>
                    <div className="admin-action-row">
                      <button
                        type="button"
                        className="ghost-button small"
                        onClick={() => handleProofVisibility(proof.id, !proof.is_public)}
                      >
                        {proof.is_public ? <EyeOff size={14} /> : <Eye size={14} />}
                        {proof.is_public ? t("admin.proofs.hide") : t("admin.proofs.live")}
                      </button>
                      <button type="button" className="ghost-button small" onClick={() => handleProofDelete(proof.id)}>
                        <Trash2 size={14} />
                        {t("admin.proofs.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
