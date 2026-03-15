import { useEffect, useMemo, useState } from "react";

type Suggestion = {
  label: string;
  lat: number;
  lng: number;
};

type NightRidePost = {
  id: string;
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
};

type Props = {
  apiBase: string;
  user: { id: string; email?: string } | null;
  totalCredits: number;
  hasUnlimitedCredits: boolean;
  requireLogin: (message: string) => void;
  handleDonate: () => void;
  postJSON: <T>(path: string, body: Record<string, unknown>) => Promise<T>;
  formatDate: (value?: string | null) => string;
  feed: NightRidePost[];
};

const NightRidePage = ({
  apiBase,
  user,
  totalCredits,
  hasUnlimitedCredits,
  requireLogin,
  handleDonate,
  postJSON,
  formatDate,
  feed,
}: Props) => {
  const [sessionType, setSessionType] = useState<"single" | "crew">("single");
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

  const distanceKm = unit === "km" ? distance : distance * 1.60934;
  const crewMembers = useMemo(
    () =>
      crewMembersInput
        .split(",")
        .map((item) => item.trim().replace(/^@+/, ""))
        .filter(Boolean)
        .slice(0, 12),
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
      { number: "01", title: "Pick the lane", body: "Single keeps it personal. Crew turns it into a shared night out." },
      { number: "02", title: "Shape the route", body: "Loop stays circular. Roulette bends the line between two points." },
      { number: "03", title: "Bring the crew", body: "Crew rides carry names, city, and join codes for the whole pack." },
      { number: "04", title: "Drop the photo", body: "Night ride shots land in their own wall, separate from Alleycat proof." },
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
    if (sessionType === "crew" && !crewName.trim()) {
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
        session_type: sessionType,
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
      setStatus(sessionType === "crew" ? "Crew Night Ride built. Share the code and load the route." : "Single Night Ride built. Open the route and move.");
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
      setSessionType("crew");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not join Crew Night Ride.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header loop-page-header">
        <h1 className="sub-page-title">Night Ride</h1>
        <p className="sub-page-description">
          Separate lane for after-dark routes, crew codes, and the future night wall.
        </p>
      </section>

      <section className="modular-grid flow-grid flow-grid-four reveals">
        {flow.map((step) => (
          <div key={step.number} className="modular-cell module-card">
            <div className="flow-number">{step.number}</div>
            <h3 className="cell-title">{step.title}</h3>
            <p className="cell-body">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="split-module reveals" id="night-builder">
        <div className="builder-grid single">
          <div className="glass-card form-card night-ride-shell">
            <div className="builder-head">
              <div>
                <h2 className="form-title">Night Ride Builder</h2>
                <p className="form-subtitle">Single stays simple. Crew carries code, city, and names.</p>
              </div>
              <div className="loops-left">
                <span className="loops-left-line">{hasUnlimitedCredits ? "Unlimited" : `${totalCredits} credits`}</span>
                <span className="loops-left-line">{sessionType === "crew" ? "Crew build 2 credits · join 1" : "Single build 1 credit"}</span>
              </div>
            </div>

            <div className="form-section section-block">
              <label className="field">
                <span>Ride type</span>
                <div className="unit-toggle loop-centered-pills">
                  <button className={`pill ${sessionType === "single" ? "active" : ""}`} type="button" onClick={() => setSessionType("single")}>
                    Single
                  </button>
                  <button className={`pill ${sessionType === "crew" ? "active" : ""}`} type="button" onClick={() => setSessionType("crew")}>
                    Crew
                  </button>
                </div>
              </label>

              <label className="field">
                <span>Route mode</span>
                <div className="unit-toggle loop-centered-pills">
                  <button className={`pill ${mode === "loop" ? "active" : ""}`} type="button" onClick={() => setMode("loop")}>
                    Night Loop
                  </button>
                  <button className={`pill ${mode === "roulette" ? "active" : ""}`} type="button" onClick={() => setMode("roulette")}>
                    Roulette
                  </button>
                </div>
              </label>
            </div>

            {sessionType === "crew" && (
              <div className="form-section section-block">
                <label className="field">
                  <span>Crew name</span>
                  <input value={crewName} onChange={(event) => setCrewName(event.target.value)} placeholder="Crew da Lapa" />
                </label>
                <label className="field">
                  <span>City</span>
                  <input value={rideCity} onChange={(event) => setRideCity(event.target.value)} placeholder="Sao Paulo" />
                </label>
                <label className="field">
                  <span>Crew members</span>
                  <input
                    value={crewMembersInput}
                    onChange={(event) => setCrewMembersInput(event.target.value)}
                    placeholder="@bia, joao, gui"
                  />
                </label>
                <div className="night-ride-helper">
                  Tag with <strong>@</strong> or drop plain names. The first 12 names are kept.
                </div>
              </div>
            )}

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
              <label className="field">
                <span>Distance</span>
                <div className="unit-toggle loop-centered-pills">
                  <button className={`pill ${unit === "km" ? "active" : ""}`} type="button" onClick={() => setUnit("km")}>
                    KM
                  </button>
                  <button className={`pill ${unit === "mi" ? "active" : ""}`} type="button" onClick={() => setUnit("mi")}>
                    MI
                  </button>
                </div>
              </label>
              <input
                type="range"
                min={unit === "km" ? 5 : 3}
                max={unit === "km" ? 40 : 25}
                step={0.5}
                value={distance}
                onChange={(event) => setDistance(Number(event.target.value))}
              />
              <div className="range-values">
                <span>{unit === "km" ? 5 : 3} {unit}</span>
                <div className="range-focus-card">
                  <strong>{Number(distance.toFixed(1))} {unit}</strong>
                </div>
                <span>{unit === "km" ? 40 : 25} {unit}</span>
              </div>

              <label className="field">
                <span>Difficulty</span>
                <div className="pill-grid pill-grid-three">
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
              <button className="primary-button primary-button-flat" type="button" onClick={handleBuild} disabled={isBuilding}>
                {isBuilding ? "Building..." : sessionType === "crew" ? "Build Crew Ride" : "Build Single Ride"}
              </button>
              <button className="ghost-button" type="button" onClick={handleDonate}>
                Add credits
              </button>
            </div>

            {sessionType === "crew" && (
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
            )}

            {status ? <div className="status-message compact-status">{status}</div> : null}
          </div>

          {session && (
            <div className="glass-card form-card night-ride-result-card">
              <div className="form-title">{session.crew_name || session.title}</div>
              <div className="result-grid result-grid-three">
                <div>
                  <span>Ride</span>
                  <strong>{session.session_type}</strong>
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
              {session.session_type === "crew" && (
                <div className="share-code-box run-progress">
                  <span>Crew code</span>
                  <strong>{session.share_code}</strong>
                  <em>Each rider joins on their own credit.</em>
                </div>
              )}
              <div className="form-actions">
                <a className="primary-button primary-button-flat" href={session.route_url} target="_blank" rel="noreferrer">
                  Open in Maps
                </a>
                {session.session_type === "crew" && (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(session.share_code);
                      } catch {
                        window.prompt("Copy Night Ride code", session.share_code);
                      }
                    }}
                  >
                    Copy code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="glass-card form-card reveals">
        <div className="form-title">Night wall</div>
        <div className="form-subtitle">Crew shots and after-dark proof stay separate from Wall of Fame.</div>
        {feed.length ? (
          <div className="night-feed-grid">
            {feed.map((post) => (
              <article key={post.id} className="night-feed-card">
                <img src={post.image_url} alt={post.caption || post.route_title || "Night ride post"} loading="lazy" decoding="async" />
                <div className="night-feed-meta">
                  <strong>{post.crew_name || post.rider_name}</strong>
                  <span>
                    {(post.route_title || "Night route")}
                    {post.distance_km ? ` · ${Number(post.distance_km).toFixed(1)} km` : ""}
                  </span>
                  <span>{post.city_name || "Night lane"} · {formatDate(post.created_at)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-body">Night wall is wired, but posting stays on hold until the upload and moderation pass lands.</div>
          </div>
        )}
      </section>
    </div>
  );
};

export default NightRidePage;
