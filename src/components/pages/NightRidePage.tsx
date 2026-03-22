import { useEffect, useMemo, useState } from "react";
import Hero from "../Hero";
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
      { number: "01", title: "Name the pack", body: "Set the crew, city, and rider tags before the streets open up." },
      { number: "02", title: "Shape the route", body: "Loop keeps it circular. Roulette bends the line between two night points." },
      { number: "03", title: "Share the code", body: "One rider builds. The rest load the code and spend their own credit." },
      { number: "04", title: "Drop the shot", body: "Night ride posts land in the crew wall, separate from Street Hunt proof." },
    ],
    []
  );

  const handleBuild = async () => {
    if (!user?.id) {
      requireLogin("Log in to build a Night Ride.");
      return;
    }
    if (!startCoords || !startLabel.trim()) {
      setStatus("Drop a clean start point first.");
      return;
    }
    if (mode === "roulette" && (!endCoords || !endLabel.trim())) {
      setStatus("Roulette needs both ends locked.");
      return;
    }
    if (!crewName.trim()) {
      setStatus("Crew mode needs a crew name.");
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
      setStatus("Crew Night Ride built. Share the code and load the route.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not build Night Ride.");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleJoin = async () => {
    if (!user?.id) {
      requireLogin("Log in to join a Crew Night Ride.");
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
      setStatus(data.already_joined ? "Crew code loaded again. You were already in." : "Crew Night Ride joined. Open the route and roll.");
      setShareInput("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not join Crew Night Ride.");
    } finally {
      setIsJoining(false);
    }
  };

  const handlePost = async () => {
    if (!user?.id) {
      requireLogin("Log in to post a Night Ride shot.");
      return;
    }
    if (!supabase) {
      setPostStatus("Night Ride upload is not ready in this browser.");
      return;
    }
    if (!session) {
      setPostStatus("Pick a Night Ride session first.");
      return;
    }
    if (!postFile) {
      setPostStatus("Pick a photo first.");
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
      setPostStatus("Night Ride post landed on the night wall.");
      setShowPostModal(false);
    } catch (error) {
      setPostStatus(error instanceof Error ? error.message : "Could not post Night Ride shot.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="sequential-layout sub-page page-night page-stage-enter">
      <Hero 
        title="Night Ride"
        subtitle="Group-only lane for after-dark rides, share codes, and crew shots."
        image={heroImage || ""}
        actions={
          <div className="hero-actions-group">
            <button className="accent-text-button" onClick={() => document.getElementById('night-builder')?.scrollIntoView({ behavior: 'smooth' })}>
              <span>Build Crew Ride</span>
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
                  <span>Night Ride Builder</span>
                </h2>
                <p className="form-subtitle">Build one crew ride. Share the code. Roll as a pack.</p>
              </div>
              <div className="loops-left">
                <span className="loops-left-line">{hasUnlimitedCredits ? "Unlimited" : `${totalCredits} credits`}</span>
                <span className="loops-left-line">Crew build 2 credits · join 1</span>
              </div>
            </div>

            <div className="form-section section-block">
              <label className="field range-field">
                <span>Route mode</span>
                <div className="pill-group range-unit-toggle">
                  <button className={`pill ${mode === "loop" ? "active" : ""}`} type="button" onClick={() => setMode("loop")}>
                    Loop
                  </button>
                  <button className={`pill ${mode === "roulette" ? "active" : ""}`} type="button" onClick={() => setMode("roulette")}>
                    Roulette
                  </button>
                </div>
              </label>
            </div>

            <div className="form-section section-block">
              <div className="field-grid-two">
                <label className="field">
                  <span>Crew name</span>
                  <input value={crewName} onChange={(event) => setCrewName(event.target.value)} placeholder="Hard Chain Berlin" />
                </label>
                <label className="field">
                  <span>City</span>
                  <input value={rideCity} onChange={(event) => setRideCity(event.target.value)} placeholder="Berlin" />
                </label>
              </div>
              <label className="field">
                <span>Crew members</span>
                <input
                  value={crewMembersInput}
                  onChange={(event) => setCrewMembersInput(event.target.value)}
                  placeholder="@alan, @bia, gui"
                />
              </label>
              <div className="night-ride-helper">
                Use <strong>@</strong> for app riders. Add plain names for the rest of the pack.
              </div>
            </div>

            <div className="form-section section-block">
              <label className="field">
                <span>Start point</span>
                <input
                  value={startLabel}
                  onChange={(event) => {
                    setStartLabel(event.target.value);
                    setStartCoords(null);
                  }}
                  placeholder="Neighborhood, station, or exact address"
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
                    <span>End point</span>
                    <input
                      value={endLabel}
                      onChange={(event) => {
                        setEndLabel(event.target.value);
                        setEndCoords(null);
                      }}
                      placeholder="Where the ride should land"
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
                <span>Distance</span>
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
                <span>Difficulty</span>
                <div className="pill-grid pill-grid-three" style={{ justifyContent: 'center' }}>
                  {["easy", "medium", "hard"].map((value) => (
                    <button
                      key={value}
                      className={`pill difficulty-pill difficulty-${value} ${difficulty === value ? "active" : ""}`}
                      type="button"
                      onClick={() => setDifficulty(value as "easy" | "medium" | "hard")}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="form-actions">
              <button className="accent-text-button" type="button" onClick={handleBuild} disabled={isBuilding}>
                {isBuilding ? "Building..." : "Build Crew Ride"}
              </button>
              <button className="ghost-button" type="button" onClick={handleDonate}>
                Add credits
              </button>
            </div>

            <div className="night-ride-join">
              <label className="field compact-field">
                <span>Join with code</span>
                <input
                  value={shareInput}
                  onChange={(event) => setShareInput(event.target.value.toUpperCase())}
                  placeholder="NIGHT7"
                />
              </label>
              <button className="ghost-button small" type="button" onClick={handleJoin} disabled={isJoining || !shareInput.trim()}>
                {isJoining ? "Joining..." : "Load code"}
              </button>
            </div>

            {status ? <div className="status-message compact-status">{status}</div> : null}
          </div>

          {session && (
            <div className="glass-card form-card night-ride-result-card">
              <div className="form-title">{session.crew_name || session.title}</div>
              <div className="result-grid result-grid-three">
                <div>
                  <span>Ride</span>
                  <strong>Crew</strong>
                </div>
                <div>
                  <span>Mode</span>
                  <strong>{session.mode}</strong>
                </div>
                <div>
                  <span>Distance</span>
                  <strong>{Number(session.distance_km).toFixed(1)} km</strong>
                </div>
              </div>
              <div className="night-ride-route-note">
                <strong>{session.ride_city || session.origin_label}</strong>
                <span>{session.destination_label ? `${session.origin_label} to ${session.destination_label}` : "Loop back to the start."}</span>
              </div>
              <div className="share-code-box run-progress">
                <span>Crew code</span>
                <strong>{session.share_code}</strong>
                <em>Each rider joins on their own credit.</em>
              </div>
              <div className="form-actions">
                <a className="accent-text-button" href={session.route_url} target="_blank" rel="noreferrer">
                  Open in Maps
                </a>
                <button className="secondary-button" type="button" onClick={() => setShowPostModal(true)}>
                  <Camera size={16} />
                  <span>Post Ride Shot</span>
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
              <div className="modal-title">Post to Night Wall</div>
              <button className="modal-close" type="button" onClick={() => setShowPostModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body form-card">
              <div className="form-section section-block">
                <div className="manifest-brief mini-brief">
                  <strong>{session?.crew_name || session?.title}</strong>
                  <span>{session?.ride_city || "Night city"} · {Number(session?.distance_km || 0).toFixed(1)} km</span>
                </div>
                
                <label className="field">
                  <span>Caption</span>
                  <textarea
                    value={postCaption}
                    onChange={(event) => setPostCaption(event.target.value.slice(0, 280))}
                    placeholder="Crew out, wet streets, still smiling."
                    rows={3}
                  />
                </label>

                <label className="field">
                  <span>Photo (16:9 recommended)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setPostFile(event.target.files?.[0] || null)}
                  />
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="button" onClick={handlePost} disabled={isPosting}>
                  {isPosting ? "Posting..." : "Post night shot"}
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
