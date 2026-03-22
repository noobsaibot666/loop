import { useEffect, useMemo, useState } from "react";
import Hero from "../Hero";
import { useI18n } from "../../i18n";
import { 
  Moon, Users, MapPin, Zap, Camera, 
  ChevronRight, Filter, Share2, Compass, Award, 
  Image as ImageIcon, Upload, Info, CheckCircle, X
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
  handleDonate: () => void;
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
  handleDonate,
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
  const [endLabel, setEndLabel] = useState("");
  const [rideCity, setRideCity] = useState("");
  const [crewName, setCrewName] = useState("");
  const [crewMembersInput, setCrewMembersInput] = useState("");
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [startSuggestions, setStartSuggestions] = useState<Suggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Suggestion[]>([]);
  const [session, setSession] = useState<NightRideSession | null>(null);
  const [status, setStatus] = useState("");
  const [shareInput, setShareInput] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [postCaption, setPostCaption] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postStatus, setPostStatus] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);

  const distanceKm = unit === "km" ? distance : distance * 1.60934;
  const crewMembers = useMemo(
    () =>
      crewMembersInput
        .split(",")
        .map((item) => item.trim().replace(/^@+/, ""))
        .filter(Boolean),
    [crewMembersInput]
  );

  const geocode = async (text: string) => {
    const res = await fetch(`${apiBase}/api/geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json().catch(() => ({}));
    return data?.features || [];
  };

  useEffect(() => {
    if (startLabel.trim().length < 3) {
      setStartSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const features = await geocode(startLabel.trim());
        if (cancelled) return;
        setStartSuggestions(
          features.slice(0, 4).map((item: any) => ({
            label: item?.properties?.label || startLabel,
            lng: Number(item?.geometry?.coordinates?.[0]),
            lat: Number(item?.geometry?.coordinates?.[1]),
          }))
        );
      } catch {
        if (!cancelled) setStartSuggestions([]);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [startLabel, apiBase]);

  useEffect(() => {
    if (mode !== "roulette" || endLabel.trim().length < 3) {
      setEndSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const features = await geocode(endLabel.trim());
        if (cancelled) return;
        setEndSuggestions(
          features.slice(0, 4).map((item: any) => ({
            label: item?.properties?.label || endLabel,
            lng: Number(item?.geometry?.coordinates?.[0]),
            lat: Number(item?.geometry?.coordinates?.[1]),
          }))
        );
      } catch {
        if (!cancelled) setEndSuggestions([]);
      }
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, endLabel, apiBase]);

  const flow = useMemo(
    () => [
      { number: "01", title: t("night.flow1.title"), body: t("night.flow1.body") },
      { number: "02", title: t("night.flow2.title"), body: t("night.flow2.body") },
      { number: "03", title: t("night.flow3.title"), body: t("night.flow3.body") },
      { number: "04", title: t("night.flow4.title"), body: t("night.flow4.body") },
    ],
    [t]
  );

  const handleBuild = async () => {
    if (!user?.id) {
      requireLogin(t("night.messages.loginBuild"));
      return;
    }
    if (!startCoords || !startLabel.trim()) {
      setStatus(t("night.messages.startRequired"));
      return;
    }
    if (mode === "roulette" && (!endCoords || !endLabel.trim())) {
      setStatus(t("night.messages.endRequired"));
      return;
    }
    if (!crewName.trim()) {
      setStatus(t("night.messages.crewNameRequired"));
      return;
    }

    setIsBuilding(true);
    setStatus("");
    try {
      const data = await postJSON<{
        session: NightRideSession;
        route_url: string;
        share_code: string;
      }>("/api/night-rides/generate", {
        session_type: "crew",
        mode,
        difficulty,
        unit,
        distance_km: Number(distanceKm.toFixed(2)),
        origin_label: startLabel.trim(),
        origin_lat: startCoords.lat,
        origin_lng: startCoords.lng,
        destination_label: mode === "roulette" ? endLabel.trim() : "",
        destination_lat: mode === "roulette" ? endCoords?.lat : null,
        destination_lng: mode === "roulette" ? endCoords?.lng : null,
        ride_city: rideCity.trim(),
        crew_name: crewName.trim(),
        crew_members: crewMembers,
      });
      setSession(data.session || null);
      setStatus(t("night.messages.built"));
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
    if (!shareInput.trim()) return;
    setIsJoining(true);
    setStatus("");
    try {
      const data = await postJSON<{ session: NightRideSession; already_joined?: boolean }>("/api/night-rides/join", {
        code: shareInput.trim().toUpperCase(),
      });
      setSession(data.session || null);
      setStatus(data.already_joined ? t("night.messages.joinedAgain") : t("night.messages.joined"));
      setShareInput("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t("night.messages.joinFailed"));
    } finally {
      setIsJoining(false);
    }
  };

  const handlePost = async () => {
    if (!user?.id) {
      requireLogin(t("night.messages.loginPost"));
      return;
    }
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
      const storagePath = `${user.id}/${session.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
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

  return (
    <div className="sequential-layout sub-page page-night page-stage-enter">
      <Hero 
        title={t("night.hero.title")}
        subtitle={t("night.hero.subtitle")}
        image={heroImage || ""}
        actions={
          <div className="hero-actions-group">
            <button className="accent-text-button" onClick={() => document.getElementById('night-builder')?.scrollIntoView({ behavior: 'smooth' })}>
              <span>{t("night.hero.action")}</span>
            </button>
          </div>
        }
      />

      <section className="modular-grid flow-grid flow-grid-four reveals">
        {flow.map((step) => (
          <div key={step.number} className="module-card">
            <div className="module-header">
              <span className="module-number">{step.number}</span>
              <h3 className="module-title">{step.title}</h3>
            </div>
            <p className="module-body">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="split-module reveals" id="night-builder">
        <div className="builder-grid single">
          <div className="glass-card form-card night-ride-shell crew-mode">
            <div className="form-header">
              <div>
                <h2 className="form-title">
                  <span>{t("night.builder.title")}</span>
                </h2>
                <p className="form-subtitle">{t("night.builder.subtitle")}</p>
              </div>
              <div className="loops-left">
                <span className="loops-left-line">{hasUnlimitedCredits ? t("credits.unlimited") : t("credits.balance", { count: totalCredits })}</span>
                <span className="loops-left-line">{t("night.builder.creditLine")}</span>
              </div>
            </div>

            <div className="form-section section-block">
              <label className="field range-field">
                <span>{t("night.builder.routeMode")}</span>
                <div className="pill-group range-unit-toggle">
                  <button className={`pill ${mode === "loop" ? "active" : ""}`} type="button" onClick={() => setMode("loop")}>
                    {t("night.builder.modeLoop")}
                  </button>
                  <button className={`pill ${mode === "roulette" ? "active" : ""}`} type="button" onClick={() => setMode("roulette")}>
                    {t("night.builder.modeRoulette")}
                  </button>
                </div>
              </label>
            </div>

            <div className="form-section section-block">
              <div className="field-grid-two">
                <label className="field">
                  <span>{t("night.builder.crewName")}</span>
                  <input value={crewName} onChange={(event) => setCrewName(event.target.value)} placeholder={t("night.builder.crewNamePlaceholder")} />
                </label>
                <label className="field">
                  <span>{t("night.builder.city")}</span>
                  <input value={rideCity} onChange={(event) => setRideCity(event.target.value)} placeholder={t("night.builder.cityPlaceholder")} />
                </label>
              </div>
              <label className="field">
                <span>{t("night.builder.members")}</span>
                <input
                  value={crewMembersInput}
                  onChange={(event) => setCrewMembersInput(event.target.value)}
                  placeholder={t("night.builder.membersPlaceholder")}
                />
              </label>
              <div className="night-ride-helper">{t("night.builder.memberHelper")}</div>
            </div>

            <div className="form-section section-block">
              <label className="field">
                <span>{t("night.builder.startPoint")}</span>
                <input
                  value={startLabel}
                  onChange={(event) => {
                    setStartLabel(event.target.value);
                    setStartCoords(null);
                  }}
                  placeholder={t("night.builder.startPlaceholder")}
                />
              </label>
              {startSuggestions.length > 0 && (
                <div className="suggestion-stack">
                  {startSuggestions.map((item) => (
                    <button
                      key={`${item.label}-${item.lat}`}
                      className="ghost-button small suggestion-button"
                      type="button"
                      onClick={() => {
                        setStartLabel(item.label);
                        setStartCoords({ lat: item.lat, lng: item.lng });
                        setStartSuggestions([]);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              {mode === "roulette" && (
                <>
                  <label className="field">
                    <span>{t("night.builder.endPoint")}</span>
                    <input
                      value={endLabel}
                      onChange={(event) => {
                        setEndLabel(event.target.value);
                        setEndCoords(null);
                      }}
                      placeholder={t("night.builder.endPlaceholder")}
                    />
                  </label>
                  {endSuggestions.length > 0 && (
                    <div className="suggestion-stack">
                      {endSuggestions.map((item) => (
                        <button
                          key={`${item.label}-${item.lat}`}
                          className="ghost-button small suggestion-button"
                          type="button"
                          onClick={() => {
                            setEndLabel(item.label);
                            setEndCoords({ lat: item.lat, lng: item.lng });
                            setEndSuggestions([]);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-section section-block">
              <label className="field range-field">
                <span>{t("night.builder.distance")}</span>
                <div className="pill-group range-unit-toggle">
                  <button className={`pill ${unit === "km" ? "active" : ""}`} type="button" onClick={() => setUnit("km")}>
                    KM
                  </button>
                  <button className={`pill ${unit === "mi" ? "active" : ""}`} type="button" onClick={() => setUnit("mi")}>
                    MI
                  </button>
                </div>
              <input
                type="range"
                min={unit === "km" ? 5 : 3}
                max={unit === "km" ? 40 : 25}
                step={0.5}
                value={distance}
                onChange={(event) => setDistance(Number(event.target.value))}
              />
              <div className="range-labels">
                <span>{unit === "km" ? 5 : 3} {unit}</span>
                <div className="range-focus-card">
                  <strong>{Number(distance.toFixed(1))} {unit}</strong>
                </div>
                <span>{unit === "km" ? 40 : 25} {unit}</span>
              </div>
              </label>

              <label className="field">
                <span>{t("night.builder.difficulty")}</span>
                <div className="pill-grid pill-grid-three" style={{ justifyContent: 'center' }}>
                  {["easy", "medium", "hard"].map((value) => (
                    <button
                      key={value}
                      className={`pill difficulty-pill difficulty-${value} ${difficulty === value ? "active" : ""}`}
                      type="button"
                      onClick={() => setDifficulty(value as "easy" | "medium" | "hard")}
                    >
                      {t(`difficulty.${value}`)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="form-actions">
              <button className="accent-text-button" type="button" onClick={handleBuild} disabled={isBuilding}>
                {isBuilding ? t("common.building") : t("night.builder.buildAction")}
              </button>
              <button className="ghost-button" type="button" onClick={handleDonate}>
                {t("account.credits.add")}
              </button>
            </div>

            <div className="night-ride-join">
              <label className="field compact-field">
                <span>{t("night.builder.joinCode")}</span>
                <input
                  value={shareInput}
                  onChange={(event) => setShareInput(event.target.value.toUpperCase())}
                  placeholder={t("night.builder.joinPlaceholder")}
                />
              </label>
              <button className="ghost-button small" type="button" onClick={handleJoin} disabled={isJoining || !shareInput.trim()}>
                {isJoining ? t("night.builder.joining") : t("night.builder.loadCode")}
              </button>
            </div>

            {status ? <div className="status-message compact-status">{status}</div> : null}
          </div>

          {session && (
            <div className="glass-card form-card night-ride-result-card">
              <div className="form-title">{session.crew_name || session.title}</div>
              <div className="result-grid result-grid-three">
                <div>
                  <span>{t("night.result.rideLabel")}</span>
                  <strong>{t("night.result.rideCrew")}</strong>
                </div>
                <div>
                  <span>{t("night.result.modeLabel")}</span>
                  <strong>{session.mode === "loop" ? t("night.builder.modeLoop") : t("night.builder.modeRoulette")}</strong>
                </div>
                <div>
                  <span>{t("night.result.distanceLabel")}</span>
                  <strong>{Number(session.distance_km).toFixed(1)} km</strong>
                </div>
              </div>
              <div className="night-ride-route-note">
                <strong>{session.ride_city || session.origin_label}</strong>
                <span>{session.destination_label ? `${session.origin_label} to ${session.destination_label}` : t("night.result.loopFallback")}</span>
              </div>
              <div className="share-code-box run-progress">
                <span>{t("night.result.crewCode")}</span>
                <strong>{session.share_code}</strong>
                <em>{t("night.result.crewCodeNote")}</em>
              </div>
              <div className="form-actions">
                <a className="accent-text-button" href={session.route_url} target="_blank" rel="noreferrer">
                  {t("loop.openMaps")}
                </a>
                <button className="secondary-button" type="button" onClick={() => setShowPostModal(true)}>
                  <Camera size={16} />
                  <span>{t("night.result.postShot")}</span>
                </button>
              </div>

            </div>
          )}
        </div>
      </section>

      {showPostModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">{t("night.modal.title")}</div>
              <button className="modal-close" type="button" onClick={() => setShowPostModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body form-card">
              <div className="form-section section-block">
                <div className="manifest-brief mini-brief">
                  <strong>{session?.crew_name || session?.title}</strong>
                  <span>{session?.ride_city || t("night.modal.cityFallback")} · {Number(session?.distance_km || 0).toFixed(1)} km</span>
                </div>
                
                <label className="field">
                  <span>{t("night.modal.caption")}</span>
                  <textarea
                    value={postCaption}
                    onChange={(event) => setPostCaption(event.target.value.slice(0, 280))}
                    placeholder={t("night.modal.captionPlaceholder")}
                    rows={3}
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
              </div>
              <div className="form-actions">
                <button className="primary-button" type="button" onClick={handlePost} disabled={isPosting}>
                  {isPosting ? t("night.modal.posting") : t("night.modal.postAction")}
                </button>
              </div>
              {postStatus ? <div className="status-message compact-status">{postStatus}</div> : null}
            </div>
          </div>
        </div>
      )}

      {/* Night wall removed */}
    </div>
  );
};

export default NightRidePage;
