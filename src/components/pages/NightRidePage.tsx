import { useEffect, useMemo, useRef, useState } from "react";
import Hero from "../Hero";
import { useI18n } from "../../i18n";
import { normalizeMapsUrl, openMapsUrl } from "../../utils/maps";
import { 
  Users, Zap, Camera, 
  Compass, 
  Image as ImageIcon, X
} from "lucide-react";

type Suggestion = {
  label: string;
  lat: number;
  lng: number;
};

type NightRidePost = {
  id: string;
  user_id?: string | null;
  moderation_status?: string | null;
  rider_name: string;
  crew_name?: string | null;
  city_name?: string | null;
  route_title?: string | null;
  distance_km?: number | null;
  caption?: string | null;
  image_url: string;
  aspect_ratio?: string | null;
  created_at: string;
};

type NightRideSession = {
  id: string;
  title: string;
  session_type: "single" | "crew";
  mode: "loop" | "roulette";
  difficulty: "easy" | "medium" | "hard";
  share_code: string;
  route_url: string;
  distance_km: number;
  origin_label: string;
  destination_label?: string | null;
  ride_city?: string | null;
  crew_name?: string | null;
  crew_members?: string[] | null;
  created_at?: string;
};

type NightRideHistorySession = {
  id: string;
  title: string;
  session_type: "single" | "crew";
  mode: "loop" | "roulette";
  difficulty: "easy" | "medium" | "hard";
  distance_km: number;
  ride_city?: string | null;
  crew_name?: string | null;
  crew_members?: string[] | null;
  created_at: string;
};

type Props = {
  apiBase: string;
  user: { id: string; email?: string } | null;
  supabase: any;
  bucketName: string;
  totalCredits: number;
  hasUnlimitedCredits: boolean;
  requireLogin: (message: string) => void;
  postJSON: <T>(path: string, body: Record<string, unknown>) => Promise<T>;
  formatDate: (value?: string | null) => string;
  feed: NightRidePost[];
  history: NightRideHistorySession[];
  onPostCreated: (post: NightRidePost) => void;
  heroImage?: string;
};

const NightRidePage = ({
  apiBase,
  user,
  supabase,
  bucketName,
  totalCredits,
  hasUnlimitedCredits,
  requireLogin,
  postJSON,
  formatDate,
  feed,
  history,
  onPostCreated,
  heroImage,
}: Props) => {
  const { t } = useI18n();
  const [mode, setMode] = useState<"loop" | "roulette">("loop");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [unit, setUnit] = useState<"km" | "mi">("km");
  const [distance, setDistance] = useState(16);
  const [startLabel, setStartLabel] = useState("");
  const [startCoords, setStartCoords] = useState<Suggestion | null>(null);
  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);
  const [endLabel, setEndLabel] = useState("");
  const [endCoords, setEndCoords] = useState<Suggestion | null>(null);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);
  const [crewName, setCrewName] = useState("");
  const [crewMembersInput, setCrewMembersInput] = useState("");
  const [shareInput, setShareInput] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [status, setStatus] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [session, setSession] = useState<NightRideSession | null>(null);

  const [showPostModal, setShowPostModal] = useState(false);
  const [postCaption, setPostCaption] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState("");
  const startSuggestionRef = useRef<HTMLDivElement | null>(null);
  const endSuggestionRef = useRef<HTMLDivElement | null>(null);
  const normalizeSessionRoute = (nextSession: NightRideSession) => ({
    ...nextSession,
    route_url: normalizeMapsUrl(nextSession.route_url),
  });

  const searchLocations = async (query: string, setResults: (results: Suggestion[]) => void) => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    try {
      const data = await postJSON<{ features?: Array<{ properties?: { label?: string; name?: string }; geometry: { coordinates: [number, number] } }> }>(
        "/api/geocode",
        { text: query },
      );
      const suggestions =
        data.features?.slice(0, 5).map((feature) => ({
          label: feature.properties?.label || feature.properties?.name || "Unknown",
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        })) || [];
      setResults(suggestions);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchLocations(startLabel, setStartSuggestions), 400);
    return () => clearTimeout(timer);
  }, [startLabel]);

  useEffect(() => {
    const timer = setTimeout(() => searchLocations(endLabel, setEndSuggestions), 400);
    return () => clearTimeout(timer);
  }, [endLabel]);

  useEffect(() => {
    if (!startSuggestions.length && !endSuggestions.length) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (startSuggestionRef.current && !startSuggestionRef.current.contains(target)) {
        setStartSuggestions([]);
      }
      if (endSuggestionRef.current && !endSuggestionRef.current.contains(target)) {
        setEndSuggestions([]);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setStartSuggestions([]);
        setEndSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [startSuggestions.length, endSuggestions.length]);

  useEffect(() => {
    if (!showCodeModal) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCodeModal(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCodeModal]);

  useEffect(() => {
    if (!showPostModal) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowPostModal(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPostModal]);

  const handleBuild = async () => {
    if (!user?.id) {
      requireLogin(t("night.messages.loginBuild"));
      return;
    }
    if (!startCoords) {
      setStatus(t("night.messages.originRequired"));
      return;
    }
    if (mode === "roulette" && !endCoords) {
      setStatus(t("night.messages.destinationRequired"));
      return;
    }
    if (!crewName.trim()) {
      setStatus(t("night.messages.crewNameRequired"));
      return;
    }

    setIsBuilding(true);
    setStatus("");
    try {
      const members = crewMembersInput.split(",").map((m) => m.trim()).filter(Boolean);
      const payload = {
        user_id: user.id,
        title: crewName.trim(),
        session_type: "crew",
        mode,
        difficulty,
        distance_km: unit === "km" ? distance : distance * 1.60934,
        origin_label: startLabel,
        origin_lat: startCoords.lat,
        origin_lng: startCoords.lng,
        destination_label: mode === "roulette" ? endLabel : null,
        destination_lat: mode === "roulette" ? (endCoords?.lat || null) : null,
        destination_lng: mode === "roulette" ? (endCoords?.lng || null) : null,
        crew_name: crewName.trim(),
        crew_members: members.length > 0 ? members : null,
      };

      const results = await postJSON<{ session: NightRideSession }>("/api/night-rides/create", payload);
      if (results?.session) {
        setSession(normalizeSessionRoute(results.session));
        setStatus(t("night.messages.built"));
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("night.messages.buildFailed"));
    } finally {
      setIsBuilding(false);
    }
  };

  const handleJoin = async () => {
    if (!user?.id) {
      requireLogin(t("night.messages.loginJoin"));
      return;
    }
    const code = shareInput.trim().toUpperCase();
    if (!code) return;

    setIsJoining(true);
    setStatus("");
    try {
      const results = await postJSON<{ session: NightRideSession }>("/api/night-rides/join", {
        user_id: user.id,
        share_code: code,
      });
      if (results?.session) {
        setSession(normalizeSessionRoute(results.session));
        setStatus(t("night.messages.joined"));
        setShowCodeModal(false);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("night.messages.joinFailed"));
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpenCodeModal = () => {
    if (!user?.id) {
      requireLogin(t("night.messages.loginJoin"));
      return;
    }
    setStatus("");
    setShowCodeModal(true);
  };

  const handlePostSubmit = async () => {
    if (!supabase) {
      setPostStatus(t("night.messages.uploadUnavailable"));
      return;
    }
    if (!session) {
      setPostStatus(t("night.messages.sessionRequired"));
      return;
    }
    if (!postFile) {
      setPostStatus(t("night.messages.photoRequired"));
      return;
    }

    setIsPosting(true);
    setPostStatus("");
    try {
      const extension = postFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${user?.id}/${session.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const upload = await supabase.storage.from(bucketName).upload(storagePath, postFile, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upload.error) throw upload.error;
      const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);

      const response = await postJSON<{ post: NightRidePost }>("/api/night-rides/post", {
        session_id: session.id,
        image_url: publicData.publicUrl,
        storage_path: storagePath,
        aspect_ratio: "16:9",
        caption: postCaption.trim(),
      });

      if (response?.post) onPostCreated(response.post);
      setPostCaption("");
      setPostFile(null);
      setPostStatus(t("night.messages.posted"));
      setShowPostModal(false);
    } catch (error) {
      setPostStatus(error instanceof Error ? error.message : t("night.messages.postFailed"));
    } finally {
      setIsPosting(false);
    }
  };

  const flow = useMemo(
    () => [
      { number: "01", title: t("night.flow1.title"), body: t("night.flow1.body"), icon: <Users size={22} /> },
      { number: "02", title: t("night.flow2.title"), body: t("night.flow2.body"), icon: <Compass size={22} /> },
      { number: "03", title: t("night.flow3.title"), body: t("night.flow3.body"), icon: <Zap size={22} /> },
      { number: "04", title: t("night.flow4.title"), body: t("night.flow4.body"), icon: <ImageIcon size={22} /> },
    ],
    [t]
  );

  return (
    <div className="sequential-layout sub-page page-night page-stage-enter">
      <Hero 
        title={t("night.hero.title")}
        subtitle={t("night.hero.subtitle")}
        image={heroImage || ""}
        actions={
          <div className="hero-actions-group">
            <button 
              className="accent-text-button" 
              onClick={() => document.getElementById('night-builder')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>{t("night.hero.action")}</span>
            </button>
          </div>
        }
      />

      <section className="modular-grid flow-grid flow-grid-four reveals route-steps-shell route-steps-shell-wide">
        {flow.map((step) => (
          <div key={step.number} className="module-card route-step-card">
            <div className="module-header route-step-header">
              <span className="module-number route-step-number">{step.number}</span>
              <h3 className="module-title route-step-title">{step.title}</h3>
            </div>
            <p className="module-body route-step-body">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="split-module reveals route-builder-section" id="night-builder">
        <div className="module-content">
          <div className="glass-card form-card night-ride-shell">
            <div className="form-header">
              <div>
                <h2 className="form-title">
                  <span>{t("night.builder.title")}</span>
                </h2>
                <p className="form-subtitle">{t("night.builder.subtitle")}</p>
              </div>
              <div className="loops-left">
                <span className="loops-left-line-focus">{hasUnlimitedCredits ? t("credits.unlimited") : t("credits.balance", { count: totalCredits })}</span>
                <span className="loops-left-line">{t("night.builder.creditLine")}</span>
              </div>
            </div>

            <div className="form-body">
              <div className="form-section section-block-clean">
                <div className="field-grid-two">
                  <label className="field">
                    <span>{t("night.builder.crewName")}</span>
                    <input
                      value={crewName}
                      onChange={(event) => setCrewName(event.target.value)}
                      placeholder={t("night.builder.crewNamePlaceholder")}
                    />
                  </label>
                  <label className="field">
                    <span>{t("night.builder.members")}</span>
                    <input
                      value={crewMembersInput}
                      onChange={(event) => setCrewMembersInput(event.target.value)}
                      placeholder={t("night.builder.membersPlaceholder")}
                    />
                  </label>
                </div>
                <div className="night-ride-helper">
                  {t("night.builder.memberHelper")}
                </div>
              </div>

              <div className="form-section section-block">
                <label className="field">
                  <span>{t("night.builder.routeMode")}</span>
                  <div className="pill-group range-unit-toggle builder-option-grid builder-option-grid-2 night-ride-mode-toggle">
                    <button 
                      className={`pill ${mode === "loop" ? "active" : ""}`} 
                      type="button" 
                      onClick={() => setMode("loop")}
                    >
                      {t("night.builder.modeLoop")}
                    </button>
                    <button 
                      className={`pill ${mode === "roulette" ? "active" : ""}`} 
                      type="button" 
                      onClick={() => setMode("roulette")}
                    >
                      {t("night.builder.modeRoulette")}
                    </button>
                  </div>
                </label>

                <label className="field">
                  <span>{t("night.builder.startPoint")}</span>
                  <div className="search-input-wrapper" ref={startSuggestionRef}>
                    <input
                      value={startLabel}
                      onChange={(event) => {
                        setStartLabel(event.target.value);
                        setStartCoords(null);
                      }}
                      placeholder={t("night.builder.startPlaceholder")}
                    />
                    {startSuggestions.length > 0 && !startCoords && (
                      <div className="suggestions glass-card">
                        {startSuggestions.map((item) => (
                          <button
                            key={`${item.label}-${item.lat}`}
                            className="suggestion-item"
                            type="button"
                            onClick={() => {
                              setStartLabel(item.label);
                              setStartCoords({ label: item.label, lat: item.lat, lng: item.lng });
                              setStartSuggestions([]);
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>

                {mode === "roulette" && (
                  <div className="animation-fade-in">
                    <label className="field">
                      <span>{t("night.builder.endPoint")}</span>
                      <div className="search-input-wrapper" ref={endSuggestionRef}>
                        <input
                          value={endLabel}
                          onChange={(event) => {
                            setEndLabel(event.target.value);
                            setEndCoords(null);
                          }}
                          placeholder={t("night.builder.endPlaceholder")}
                        />
                        {endSuggestions.length > 0 && !endCoords && (
                          <div className="suggestions glass-card">
                            {endSuggestions.map((item) => (
                              <button
                                key={`${item.label}-${item.lat}`}
                                className="suggestion-item"
                                type="button"
                                onClick={() => {
                                  setEndLabel(item.label);
                                  setEndCoords({ label: item.label, lat: item.lat, lng: item.lng });
                                  setEndSuggestions([]);
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="form-section section-block">
                <label className="field range-field">
                  <span>{t("night.builder.distance")}</span>
                  <div className="pill-group range-unit-toggle builder-option-grid builder-option-grid-2 night-ride-unit-toggle">
                    <button className={`pill ${unit === "km" ? "active" : ""}`} type="button" onClick={() => setUnit("km")}>{t("common.km")}</button>
                    <button className={`pill ${unit === "mi" ? "active" : ""}`} type="button" onClick={() => setUnit("mi")}>{t("common.miles")}</button>
                  </div>
                  <input
                    type="range"
                    min={unit === "km" ? 5 : 3}
                    max={unit === "km" ? 40 : 25}
                    step={0.5}
                    value={distance}
                    onChange={(event) => setDistance(Number(event.target.value))}
                    style={{ "--range-progress": `${((distance - (unit === 'km' ? 5 : 3)) / (unit === 'km' ? 35 : 22)) * 100}%` } as any}
                  />
                  <div className="range-labels">
                    <span>{unit === "km" ? 5 : 3} {unit}</span>
                    <div className="range-focus-card"><strong>{Number(distance.toFixed(1))} {unit}</strong></div>
                    <span>{unit === "km" ? 40 : 25} {unit}</span>
                  </div>
                </label>

                <label className="field night-ride-difficulty-field">
                  <span>{t("night.builder.difficulty")}</span>
                  <div className="pill-group checkpoint-count-grid builder-option-grid builder-option-grid-3 night-ride-difficulty-grid">
                    {["easy", "medium", "hard"].map((value) => (
                      <button
                        key={value}
                        className={`pill ${difficulty === value ? "active" : ""}`}
                        type="button"
                        onClick={() => setDifficulty(value as any)}
                      >
                        {t(`difficulty.${value}`)}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="form-actions join-action-row">
                <button 
                  className="primary-button ready" 
                  type="button" 
                  onClick={handleBuild} 
                  disabled={isBuilding}
                >
                  {isBuilding ? t("night.builder.building") : t("night.builder.buildAction")}
                </button>
              </div>
              <div className="form-actions compact-actions messenger-code-entry night-ride-code-entry">
                <button
                  className="text-link-button"
                  type="button"
                  onClick={handleOpenCodeModal}
                >
                  {t("night.builder.haveCode")}
                </button>
              </div>
            </div>

            {status ? <div className="status-message compact-status">{status}</div> : null}

            {session && (
              <div className="night-ride-result-card glass-card animation-slide-up">
                <h3 className="card-title">{session.crew_name || session.title}</h3>
                <div className="result-grid-mini">
                  <span>{session.mode.toUpperCase()}</span>
                  <span>{Number(session.distance_km).toFixed(1)} KM</span>
                  <span>{session.ride_city}</span>
                </div>
                <div className="share-code-box">
                  <span>{t("night.result.crewCode")}</span>
                  <strong className="share-code-value">{session.share_code}</strong>
                </div>
                <div className="form-actions">
                  <button className="primary-button" type="button" onClick={() => openMapsUrl(session.route_url)}>
                    {t("loop.openMaps")}
                  </button>
                  <button className="secondary-button night-ride-post-button" type="button" onClick={() => setShowPostModal(true)}>
                    <Camera size={16} />
                    <span>{t("night.result.postShot")}</span>
                  </button>
                  <button className="ghost-button small" onClick={() => setSession(null)}>
                    {t("night.result.reset")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
      {showPostModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="night-post-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowPostModal(false);
          }}
        >
          <div className="modal-card animation-slide-up">
            <div className="modal-header">
              <div className="modal-title" id="night-post-modal-title">{t("night.modal.title")}</div>
              <button className="modal-close" type="button" onClick={() => setShowPostModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body form-card">
              <div className="form-section section-block">
                <label className="field">
                  <span>{t("night.modal.caption")}</span>
                  <input
                    value={postCaption}
                    onChange={(event) => setPostCaption(event.target.value)}
                    placeholder={t("night.modal.captionPlaceholder")}
                  />
                </label>
                <label className="field">
                  <span>{t("night.modal.photo")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setPostFile(event.target.files?.[0] || null)}
                  />
                </label>
                {postStatus && <div className="status-message">{postStatus}</div>}
              </div>
              <div className="form-actions">
                <button 
                  className="primary-button" 
                  type="button" 
                  onClick={handlePostSubmit} 
                  disabled={isPosting}
                >
                  {isPosting ? t("night.modal.posting") : t("night.modal.postAction")}
                </button>
                <button 
                  className="ghost-button" 
                  type="button" 
                  onClick={() => setShowPostModal(false)}
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCodeModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="night-code-modal-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowCodeModal(false);
          }}
        >
          <div className="modal-card animation-slide-up messenger-code-modal night-ride-code-modal">
            <div className="modal-header">
              <div className="modal-title" id="night-code-modal-title">{t("night.builder.haveCode")}</div>
              <button className="modal-close" type="button" onClick={() => setShowCodeModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body form-card">
              <div className="form-section section-block-clean">
                <label className="field">
                  <span>{t("share.code")}</span>
                  <input
                    autoFocus
                    value={shareInput}
                    onChange={(event) => setShareInput(event.target.value)}
                    placeholder={t("night.builder.joinPlaceholder")}
                  />
                </label>
                {status ? <div className="status-message compact-status">{status}</div> : null}
              </div>
              <div className="form-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={handleJoin}
                  disabled={isJoining || !shareInput.trim()}
                >
                  {isJoining ? t("night.builder.joining") : t("night.builder.loadCode")}
                </button>
                <button className="ghost-button" type="button" onClick={() => setShowCodeModal(false)}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NightRidePage;
