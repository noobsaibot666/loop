import React, { useEffect, useMemo, useState } from "react";
import { Archive, Crown, Eye, EyeOff, Search, Shield, Sparkles, Trash2, Trophy, Users, Zap } from "lucide-react";
import adminHero from "../images/hero1.png";
import Hero from "../components/Hero";
import { useI18n } from "../i18n";
import { useAuthStore } from "../store/useAuthStore";
import { postJSON } from "../utils/routeUtils";

type AdminTab = "metrics" | "riders" | "night" | "proofs" | "packs" | "requests" | "collaboration";

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
  fastest_runs: {
    run_id: string;
    rider_name: string;
    city_name: string;
    manifest_title: string;
    checkpoint_count: number | null;
    ghost_seconds: number | null;
    finish_seconds: number;
    finished_at?: string | null;
  }[];
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

type AdminCityPack = {
  id: string;
  slug: string;
  name: string;
  route_note?: string | null;
  finish_label?: string | null;
  safety_note?: string | null;
  is_active?: boolean;
  checkpoint_count?: number;
  active_checkpoint_count?: number;
  district_count?: number;
  readiness_status?: string;
  copy_ready?: boolean;
  can_publish?: boolean;
};

type AdminCityCheckpoint = {
  id?: string;
  pack_id?: string;
  slug: string;
  name: string;
  lat: number | string;
  lng: number | string;
  district?: string;
  category?: string;
  vibe?: string;
  hint?: string;
  task_local?: string;
  task_fast?: string;
  task_chaotic?: string;
  sort_weight?: number | string;
  is_active?: boolean;
};

type AdminCityRequest = {
  id: string;
  requested_city?: string | null;
  requested_location?: string | null;
  rider_name?: string | null;
  email?: string | null;
  status?: string | null;
  admin_note?: string | null;
  created_at?: string | null;
  handled_at?: string | null;
};

type AdminCollaborationRequest = {
  user_id: string;
  rider_name?: string | null;
  home_location?: string | null;
  collaboration_note?: string | null;
  collaboration_status?: string | null;
  collaboration_requested_at?: string | null;
  updated_at?: string | null;
};

type PreviewManifest = {
  manifest_title?: string;
  checkpoint_count?: number;
  estimated_minutes?: number;
  route_note?: string;
  finish_label?: string;
  ghost_label?: string | null;
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
  const [packs, setPacks] = useState<AdminCityPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState("");
  const [checkpoints, setCheckpoints] = useState<AdminCityCheckpoint[]>([]);
  const [requests, setRequests] = useState<AdminCityRequest[]>([]);
  const [collaborations, setCollaborations] = useState<AdminCollaborationRequest[]>([]);
  const [riderSearch, setRiderSearch] = useState("");
  const [archiveMonth, setArchiveMonth] = useState("");
  const [packForm, setPackForm] = useState({
    id: "",
    slug: "",
    name: "",
    route_note: "",
    finish_label: "",
    safety_note: "",
    is_active: false,
  });
  const [checkpointForm, setCheckpointForm] = useState<AdminCityCheckpoint>({
    slug: "",
    name: "",
    lat: "",
    lng: "",
    district: "",
    category: "",
    vibe: "",
    hint: "",
    task_local: "",
    task_fast: "",
    task_chaotic: "",
    sort_weight: 100,
    is_active: true,
  });
  const [requestDrafts, setRequestDrafts] = useState<Record<string, { status: string; admin_note: string }>>({});
  const [collaborationDrafts, setCollaborationDrafts] = useState<Record<string, { status: string }>>({});
  const [previewState, setPreviewState] = useState({
    style: "local",
    difficulty: "medium",
    checkpoint_count: "6",
  });
  const [previewManifest, setPreviewManifest] = useState<PreviewManifest | null>(null);
  const [aiDraft, setAiDraft] = useState<any>(null);
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

  const fetchPacks = async () => {
    setIsLoading(true);
    try {
      const data = await postJSON<{ packs: AdminCityPack[] }>("/api/admin/city-packs", {});
      const nextPacks = data.packs || [];
      setPacks(nextPacks);
      if (!selectedPackId && nextPacks[0]?.id) {
        setSelectedPackId(nextPacks[0].id);
      }
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCheckpoints = async (packId: string) => {
    if (!packId) {
      setCheckpoints([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await postJSON<{ checkpoints: AdminCityCheckpoint[] }>("/api/admin/city-checkpoints", { pack_id: packId });
      setCheckpoints(data.checkpoints || []);
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await postJSON<{ requests: AdminCityRequest[] }>("/api/admin/city-requests", {});
      const nextRequests = data.requests || [];
      setRequests(nextRequests);
      setRequestDrafts(
        nextRequests.reduce<Record<string, { status: string; admin_note: string }>>((acc, request) => {
          acc[request.id] = {
            status: String(request.status || "new"),
            admin_note: String(request.admin_note || ""),
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

  const fetchCollaborations = async () => {
    setIsLoading(true);
    try {
      const data = await postJSON<{ requests: AdminCollaborationRequest[] }>("/api/admin/collaborations", {});
      const nextRequests = data.requests || [];
      setCollaborations(nextRequests);
      setCollaborationDrafts(
        nextRequests.reduce<Record<string, { status: string }>>((acc, request) => {
          acc[request.user_id] = {
            status: String(request.collaboration_status || "pending"),
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
    if (activeTab === "packs") void fetchPacks();
    if (activeTab === "requests") void fetchRequests();
    if (activeTab === "collaboration") void fetchCollaborations();
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (activeTab !== "packs" || !selectedPackId) return;
    const selectedPack = packs.find((pack) => pack.id === selectedPackId);
    if (selectedPack) {
      setPackForm({
        id: selectedPack.id,
        slug: selectedPack.slug || "",
        name: selectedPack.name || "",
        route_note: selectedPack.route_note || "",
        finish_label: selectedPack.finish_label || "",
        safety_note: selectedPack.safety_note || "",
        is_active: selectedPack.is_active !== false,
      });
    }
    setCheckpointForm({
      slug: "",
      name: "",
      lat: "",
      lng: "",
      district: "",
      category: "",
      vibe: "",
      hint: "",
      task_local: "",
      task_fast: "",
      task_chaotic: "",
      sort_weight: 100,
      is_active: true,
    });
    void fetchCheckpoints(selectedPackId);
  }, [activeTab, selectedPackId, packs]);

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

  const handleArchiveMonth = async () => {
    if (!archiveMonth) return;
    try {
      pushStatus("info", t("admin.messages.updating"));
      const data = await postJSON<{ archived: number }>("/api/admin/proof-archive-month", { month: archiveMonth });
      pushStatus("success", t("admin.messages.archiveDone", { count: data.archived || 0, month: archiveMonth }));
      await fetchProofs();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handlePackSave = async () => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/city-packs", {
        action: "save",
        ...packForm,
      });
      pushStatus("success", t("admin.messages.packSaved"));
      await fetchPacks();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleCheckpointSave = async () => {
    if (!selectedPackId) return;
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/city-checkpoints", {
        action: "save",
        ...checkpointForm,
        pack_id: selectedPackId,
        lat: Number(checkpointForm.lat),
        lng: Number(checkpointForm.lng),
        sort_weight: Number(checkpointForm.sort_weight || 100),
      });
      pushStatus("success", t("admin.messages.checkpointSaved"));
      await fetchCheckpoints(selectedPackId);
      await fetchPacks();
      setCheckpointForm({
        slug: "",
        name: "",
        lat: "",
        lng: "",
        district: "",
        category: "",
        vibe: "",
        hint: "",
        task_local: "",
        task_fast: "",
        task_chaotic: "",
        sort_weight: 100,
        is_active: true,
      });
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handlePreviewManifest = async () => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      const data = await postJSON<{ manifest: PreviewManifest }>("/api/admin/preview-manifest", {
        pack_id: selectedPackId || undefined,
        city: packForm.name,
        style: previewState.style,
        difficulty: previewState.difficulty,
        checkpoint_count: Number(previewState.checkpoint_count || 6),
      });
      setPreviewManifest(data.manifest || null);
      pushStatus("success", t("admin.messages.previewReady"));
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleAIDraftPack = async () => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      const data = await postJSON<{ draft: any }>("/api/admin/ai-draft", {
        kind: "pack",
        city: packForm.name,
        route_note: packForm.route_note,
        finish_label: packForm.finish_label,
      });
      setAiDraft(data.draft || null);
      if (data.draft) {
        setPackForm((current) => ({
          ...current,
          route_note: String(data.draft.route_note || current.route_note || ""),
          finish_label: String(data.draft.finish_label || current.finish_label || ""),
        }));
      }
      pushStatus("success", t("admin.messages.aiDraftReady"));
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleRequestUpdate = async (requestId: string) => {
    const draft = requestDrafts[requestId];
    if (!draft) return;
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/city-requests", {
        action: "update",
        request_id: requestId,
        status: draft.status,
        admin_note: draft.admin_note,
      });
      pushStatus("success", t("admin.messages.requestUpdated"));
      await fetchRequests();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleRequestDraft = async (requestId: string) => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      const data = await postJSON<{ draft?: any; pack?: AdminCityPack }>("/api/admin/city-requests", {
        action: "ai_draft",
        request_id: requestId,
      });
      setAiDraft(data.draft || null);
      pushStatus("success", t("admin.messages.aiDraftReady"));
      await fetchRequests();
      await fetchPacks();
      if (data.pack?.id) {
        setActiveTab("packs");
        setSelectedPackId(data.pack.id);
      }
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleRequestDelete = async (requestId: string) => {
    try {
      pushStatus("info", t("admin.messages.updating"));
      await postJSON("/api/admin/city-requests", {
        action: "delete",
        request_id: requestId,
      });
      pushStatus("success", t("admin.messages.requestDeleted"));
      await fetchRequests();
    } catch (error: any) {
      pushStatus("error", error.message || t("common.requestFailed"));
    }
  };

  const handleCollaborationUpdate = async (userId: string) => {
    const draft = collaborationDrafts[userId];
    if (!draft) return;
    try {
      await postJSON("/api/admin/collaborations", {
        action: "update",
        user_id: userId,
        collaboration_status: draft.status,
      });
      pushStatus("success", t("admin.messages.collaborationUpdated"));
      await fetchCollaborations();
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
            <button className={`pill ${activeTab === "packs" ? "active" : ""}`} onClick={() => setActiveTab("packs")}>
              {t("admin.tabs.packs")}
            </button>
            <button className={`pill ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
              {t("admin.tabs.requests")}
            </button>
            <button className={`pill ${activeTab === "collaboration" ? "active" : ""}`} onClick={() => setActiveTab("collaboration")}>
              {t("admin.tabs.collaboration")}
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

            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">Fastest runs</div>
                  <div className="form-subtitle">City, manifest, checkpoint bucket, and finish time.</div>
                </div>
                <Zap size={18} className="text-muted" />
              </div>
              <div className="history-list">
                {overview.fastest_runs.map((entry) => (
                  <div key={entry.run_id} className="history-row">
                    <div>
                      <strong>{entry.rider_name}</strong>
                      <span>{entry.city_name} · {entry.manifest_title}</span>
                      <span>
                        {entry.checkpoint_count ? `${entry.checkpoint_count} CP` : "--"} · {entry.ghost_seconds ? `${Math.floor(entry.ghost_seconds / 60)}m ghost` : "no ghost"}
                      </span>
                    </div>
                    <div className="history-actions">
                      <strong>{Math.floor(entry.finish_seconds / 60)}m {String(entry.finish_seconds % 60).padStart(2, "0")}s</strong>
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
                {!nightPosts.length ? (
                  <div className="account-note">{t("admin.night.empty")}</div>
                ) : nightPosts.map((post) => (
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
              <div className="admin-archive-shell">
                <label className="field admin-mini-field">
                  <span>{t("admin.proofs.archiveMonth")}</span>
                  <input type="month" value={archiveMonth} onChange={(event) => setArchiveMonth(event.target.value)} />
                </label>
                <button type="button" className="ghost-button small" onClick={handleArchiveMonth} disabled={!archiveMonth}>
                  <Archive size={14} />
                  {t("admin.proofs.archiveAction")}
                </button>
              </div>
              <div className="history-list">
                {!proofs.length ? (
                  <div className="account-note">{t("admin.proofs.empty")}</div>
                ) : proofs.map((proof) => (
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

        {activeTab === "packs" && (
          <div className="account-grid admin-pack-grid">
            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.packs.title")}</div>
                  <div className="form-subtitle">{t("admin.packs.subtitle")}</div>
                </div>
                <Shield size={18} className="text-muted" />
              </div>
              <label className="field">
                <span>{t("admin.packs.selectPack")}</span>
                <select value={selectedPackId} onChange={(event) => setSelectedPackId(event.target.value)}>
                  <option value="">{t("admin.packs.newPack")}</option>
                  {packs.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.name} · {pack.readiness_status || "draft"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("admin.packs.slug")}</span>
                  <input value={packForm.slug} onChange={(event) => setPackForm((current) => ({ ...current, slug: event.target.value }))} />
                </label>
                <label className="field">
                  <span>{t("admin.packs.name")}</span>
                  <input value={packForm.name} onChange={(event) => setPackForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
              </div>
              <label className="field">
                <span>{t("admin.packs.routeNote")}</span>
                <textarea value={packForm.route_note} onChange={(event) => setPackForm((current) => ({ ...current, route_note: event.target.value }))} />
              </label>
              <label className="field">
                <span>{t("admin.packs.finishLabel")}</span>
                <input value={packForm.finish_label} onChange={(event) => setPackForm((current) => ({ ...current, finish_label: event.target.value }))} />
              </label>
              <label className="field">
                <span>{t("admin.packs.safetyNote")}</span>
                <textarea value={packForm.safety_note} onChange={(event) => setPackForm((current) => ({ ...current, safety_note: event.target.value }))} />
              </label>
              <label className="field admin-checkbox-field">
                <span>{t("admin.packs.active")}</span>
                <input
                  type="checkbox"
                  checked={packForm.is_active}
                  onChange={(event) => setPackForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
              </label>
              <div className="admin-action-row admin-action-row-left">
                <button type="button" className="primary-button small" onClick={handlePackSave}>
                  {t("admin.packs.save")}
                </button>
                <button type="button" className="ghost-button small" onClick={handleAIDraftPack} disabled={!packForm.name.trim()}>
                  <Sparkles size={14} />
                  {t("admin.packs.aiDraft")}
                </button>
                <button type="button" className="ghost-button small" onClick={handlePreviewManifest} disabled={!selectedPackId && !packForm.name.trim()}>
                  {t("admin.packs.preview")}
                </button>
              </div>
              <div className="admin-preview-controls">
                <label className="field admin-mini-field">
                  <span>{t("alleycat.streetTone")}</span>
                  <select value={previewState.style} onChange={(event) => setPreviewState((current) => ({ ...current, style: event.target.value }))}>
                    <option value="local">{t("alleycat.style.local")}</option>
                    <option value="fast">{t("alleycat.style.fast")}</option>
                    <option value="chaotic">{t("alleycat.style.chaotic")}</option>
                  </select>
                </label>
                <label className="field admin-mini-field">
                  <span>{t("alleycat.pressure")}</span>
                  <select value={previewState.difficulty} onChange={(event) => setPreviewState((current) => ({ ...current, difficulty: event.target.value }))}>
                    <option value="easy">{t("difficulty.easy")}</option>
                    <option value="medium">{t("difficulty.medium")}</option>
                    <option value="hard">{t("difficulty.hard")}</option>
                  </select>
                </label>
                <label className="field admin-mini-field">
                  <span>{t("admin.packs.checkpointCount")}</span>
                  <input value={previewState.checkpoint_count} onChange={(event) => setPreviewState((current) => ({ ...current, checkpoint_count: event.target.value }))} />
                </label>
              </div>
              {previewManifest && (
                <div className="glass-card admin-preview-card">
                  <strong>{previewManifest.manifest_title}</strong>
                  <span>{previewManifest.route_note}</span>
                  <span>{previewManifest.finish_label}</span>
                  <div className="admin-preview-metrics">
                    <span>{t("admin.packs.checkpointCount")}: {previewManifest.checkpoint_count || 0}</span>
                    <span>{t("admin.preview.eta")}: {previewManifest.estimated_minutes || 0}m</span>
                    <span>{t("alleycat.ghostRider")}: {previewManifest.ghost_label || t("common.off")}</span>
                  </div>
                </div>
              )}
              {aiDraft && (
                <div className="glass-card admin-ai-card">
                  <strong>{t("admin.packs.aiDraft")}</strong>
                  <pre>{JSON.stringify(aiDraft, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.checkpoints.title")}</div>
                  <div className="form-subtitle">{t("admin.checkpoints.subtitle")}</div>
                </div>
                <Zap size={18} className="text-muted" />
              </div>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("admin.checkpoints.slug")}</span>
                  <input value={String(checkpointForm.slug || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, slug: event.target.value }))} />
                </label>
                <label className="field">
                  <span>{t("admin.checkpoints.name")}</span>
                  <input value={String(checkpointForm.name || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, name: event.target.value }))} />
                </label>
              </div>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("admin.checkpoints.lat")}</span>
                  <input value={String(checkpointForm.lat || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, lat: event.target.value }))} />
                </label>
                <label className="field">
                  <span>{t("admin.checkpoints.lng")}</span>
                  <input value={String(checkpointForm.lng || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, lng: event.target.value }))} />
                </label>
              </div>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("admin.checkpoints.district")}</span>
                  <input value={String(checkpointForm.district || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, district: event.target.value }))} />
                </label>
                <label className="field">
                  <span>{t("admin.checkpoints.category")}</span>
                  <input value={String(checkpointForm.category || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, category: event.target.value }))} />
                </label>
              </div>
              <div className="profile-grid">
                <label className="field">
                  <span>{t("admin.checkpoints.vibe")}</span>
                  <input value={String(checkpointForm.vibe || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, vibe: event.target.value }))} />
                </label>
                <label className="field">
                  <span>{t("admin.checkpoints.sortWeight")}</span>
                  <input value={String(checkpointForm.sort_weight || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, sort_weight: event.target.value }))} />
                </label>
              </div>
              <label className="field">
                <span>{t("admin.checkpoints.hint")}</span>
                <textarea value={String(checkpointForm.hint || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, hint: event.target.value }))} />
              </label>
              <label className="field">
                <span>{t("admin.checkpoints.taskLocal")}</span>
                <textarea value={String(checkpointForm.task_local || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, task_local: event.target.value }))} />
              </label>
              <label className="field">
                <span>{t("admin.checkpoints.taskFast")}</span>
                <textarea value={String(checkpointForm.task_fast || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, task_fast: event.target.value }))} />
              </label>
              <label className="field">
                <span>{t("admin.checkpoints.taskChaotic")}</span>
                <textarea value={String(checkpointForm.task_chaotic || "")} onChange={(event) => setCheckpointForm((current) => ({ ...current, task_chaotic: event.target.value }))} />
              </label>
              <label className="field admin-checkbox-field">
                <span>{t("admin.checkpoints.active")}</span>
                <input
                  type="checkbox"
                  checked={checkpointForm.is_active !== false}
                  onChange={(event) => setCheckpointForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
              </label>
              <div className="admin-action-row admin-action-row-left">
                <button type="button" className="primary-button small" onClick={handleCheckpointSave} disabled={!selectedPackId}>
                  {t("admin.checkpoints.save")}
                </button>
              </div>
              <div className="history-list">
                {checkpoints.map((checkpoint) => (
                  <button
                    key={checkpoint.id || checkpoint.slug}
                    type="button"
                    className="history-row admin-checkpoint-row"
                    onClick={() => setCheckpointForm(checkpoint)}
                  >
                    <div>
                      <strong>{checkpoint.name}</strong>
                      <span>{checkpoint.district || "--"} · {checkpoint.category || "--"} · {checkpoint.vibe || "--"}</span>
                    </div>
                    <div className="history-actions">
                      <strong>{checkpoint.is_active === false ? t("common.off") : t("common.on")}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="account-grid">
            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.requests.title")}</div>
                  <div className="form-subtitle">{t("admin.requests.subtitle")}</div>
                </div>
                <Users size={18} className="text-muted" />
              </div>
              <div className="history-list">
                {!requests.length ? (
                  <div className="account-note">{t("admin.requests.empty")}</div>
                ) : requests.map((request) => (
                  <div key={request.id} className="history-row admin-request-row">
                    <div>
                      <strong>{request.requested_city || request.requested_location || "--"}</strong>
                      <span>{request.rider_name || request.email || "--"} · {formatDate(request.created_at)}</span>
                      <span>{request.admin_note || "--"}</span>
                    </div>
                    <div className="admin-request-controls">
                      <label className="field admin-mini-field">
                        <span>{t("admin.requests.status")}</span>
                        <input
                          value={requestDrafts[request.id]?.status || ""}
                          onChange={(event) =>
                            setRequestDrafts((current) => ({
                              ...current,
                              [request.id]: {
                                status: event.target.value,
                                admin_note: current[request.id]?.admin_note || "",
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="field admin-mini-field">
                        <span>{t("admin.requests.note")}</span>
                        <input
                          value={requestDrafts[request.id]?.admin_note || ""}
                          onChange={(event) =>
                            setRequestDrafts((current) => ({
                              ...current,
                              [request.id]: {
                                status: current[request.id]?.status || "reviewing",
                                admin_note: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <div className="admin-action-row">
                        <button type="button" className="ghost-button small" onClick={() => handleRequestDraft(request.id)}>
                          <Sparkles size={14} />
                          {t("admin.requests.aiDraft")}
                        </button>
                        <button type="button" className="primary-button small" onClick={() => handleRequestUpdate(request.id)}>
                          {t("admin.requests.update")}
                        </button>
                        <button type="button" className="ghost-button small" onClick={() => handleRequestDelete(request.id)}>
                          <Trash2 size={14} />
                          {t("admin.requests.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "collaboration" && (
          <div className="account-grid">
            <div className="glass-card form-card account-purchases-card">
              <div className="form-header">
                <div>
                  <div className="form-title">{t("admin.collaboration.title")}</div>
                  <div className="form-subtitle">{t("admin.collaboration.subtitle")}</div>
                </div>
                <Users size={18} className="text-muted" />
              </div>
              <div className="history-list">
                {!collaborations.length ? (
                  <div className="account-note">{t("admin.collaboration.empty")}</div>
                ) : collaborations.map((request) => (
                  <div key={request.user_id} className="history-row admin-request-row">
                    <div>
                      <strong>{request.rider_name || request.user_id}</strong>
                      <span>{request.home_location || "--"} · {formatDate(request.collaboration_requested_at || request.updated_at)}</span>
                      <span>{request.collaboration_note || "--"}</span>
                    </div>
                    <div className="admin-request-controls">
                      <label className="field admin-mini-field">
                        <span>{t("admin.collaboration.status")}</span>
                        <select
                          value={collaborationDrafts[request.user_id]?.status || "pending"}
                          onChange={(event) =>
                            setCollaborationDrafts((current) => ({
                              ...current,
                              [request.user_id]: {
                                status: event.target.value,
                              },
                            }))
                          }
                        >
                          <option value="pending">{t("admin.collaboration.pending")}</option>
                          <option value="reviewing">{t("admin.collaboration.reviewing")}</option>
                          <option value="approved">{t("admin.collaboration.approved")}</option>
                          <option value="rejected">{t("admin.collaboration.rejected")}</option>
                        </select>
                      </label>
                      <div className="admin-action-row">
                        <button type="button" className="primary-button small" onClick={() => handleCollaborationUpdate(request.user_id)}>
                          {t("admin.collaboration.update")}
                        </button>
                      </div>
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
