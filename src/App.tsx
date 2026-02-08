import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import heroImage from "./images/hero_4.png";
import motionMap from "./videos/motionmap.mp4";

const API_BASE = (() => {
  const configured = import.meta.env.VITE_API_BASE || "";
  if (typeof window !== "undefined") {
    const isLocal = window.location.hostname === "localhost";
    if (!isLocal && configured.includes("localhost")) return window.location.origin;
    return configured || window.location.origin;
  }
  return configured;
})();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

const steps = [
  {
    number: "01",
    title: "Top up credits",
    body: "Nothing is free. 3 loops on us, then top up.",
  },
  {
    number: "02",
    title: "Pick your spot",
    body: "That’s your start and finish.",
  },
  {
    number: "03",
    title: "Set the distance",
    body: "Dial the KM or miles. We shape the loop.",
  },
  {
    number: "04",
    title: "Pick the terrain",
    body: "Road, climb, or mix — we match the vibe.",
  },
];

function useTheme() {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);
}

export default function App() {
  useTheme();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll();
  const parallaxY = useSpring(useTransform(scrollYProgress, [0, 1], [30, -30]), {
    stiffness: 120,
    damping: 25,
  });
  const parallaxX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 18]), {
    stiffness: 120,
    damping: 25,
  });
  const bgShift = useTransform(scrollYProgress, [0, 1], [420, 260]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const bgShiftPx = useMotionTemplate`${bgShift}px`;

  const [loopPoint, setLoopPoint] = useState("");
  const [distance, setDistance] = useState(14);
  const [terrain, setTerrain] = useState("mix");
  const [surface, setSurface] = useState("paved");
  const [vibe, setVibe] = useState("Elegant");
  const [unit, setUnit] = useState<"km" | "mi">("km");
  const [activeStep, setActiveStep] = useState(-1);
  const [deviceId, setDeviceId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [usage, setUsage] = useState<{ free_used: number; donation_credits: number; free_remaining: number; credits_remaining: number } | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastRouteUrl, setLastRouteUrl] = useState<string>("");
  const [step1Touched, setStep1Touched] = useState(false);
  const [step2Touched, setStep2Touched] = useState(false);
  const [step3Touched, setStep3Touched] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [showCredits, setShowCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState("5");

  const isMobile = useMemo(
    () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    []
  );

  const postJSON = async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      const message = data?.error || data?.message || `Request failed: ${response.status}`;
      throw new Error(message);
    }
    return data;
  };

  useEffect(() => {
    const stored = localStorage.getItem("loop_device_id");
    if (stored) {
      setDeviceId(stored);
      return;
    }
    const next = crypto.randomUUID();
    localStorage.setItem("loop_device_id", next);
    setDeviceId(next);
  }, []);


  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email || "" });
        setAccessToken(data.session.access_token);
      }
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || "" });
        setAccessToken(session.access_token);
      } else {
        setUser(null);
        setAccessToken("");
      }
    });
    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  const step1Done = step1Touched && loopPoint.trim().length > 3;
  const step2Done = step2Touched;
  const step3Done = step3Touched;
  const allDone = step1Done && step2Done && step3Done;

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    const fetchUsage = async () => {
      try {
        const data = await postJSON<{
          free_used: number;
          donation_credits: number;
          free_remaining: number;
          credits_remaining: number;
        }>("/api/usage/check", { device_id: deviceId, user_id: user?.id || "" });
        if (active) setUsage(data);
      } catch {
        if (active) setUsage(null);
      }
    };
    fetchUsage();
    return () => {
      active = false;
    };
  }, [deviceId, user?.id]);

  const terrainLabel: Record<string, string> = {
    mix: "Urban mix",
    road: "Road fast",
    climb: "Climb",
    coast: "Coastal",
  };
  const surfaceLabel: Record<string, string> = {
    paved: "Paved",
    mixed: "Mixed",
    gravel: "Gravel",
  };

  const parseLatLng = (value: string) => {
    const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    return { lat: Number(match[1]), lng: Number(match[2]) };
  };

  const computeWaypointFromOrigin = (
    origin: { lat: number; lng: number },
    bearingDeg: number,
    distanceKm: number
  ) => {
    const earthRadiusKm = 6371;
    const bearing = (bearingDeg * Math.PI) / 180;
    const lat1 = (origin.lat * Math.PI) / 180;
    const lng1 = (origin.lng * Math.PI) / 180;
    const lat2 =
      Math.asin(
        Math.sin(lat1) * Math.cos(distanceKm / earthRadiusKm) +
          Math.cos(lat1) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(bearing)
      );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distanceKm / earthRadiusKm) * Math.cos(lat1),
        Math.cos(distanceKm / earthRadiusKm) - Math.sin(lat1) * Math.sin(lat2)
      );
    return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
  };

  const buildMapsUrl = (variant: string) => {
    const params = new URLSearchParams();
    params.set("api", "1");
    params.set("origin", loopPoint);
    params.set("destination", loopPoint);
    params.set("travelmode", "bicycling");
    const bearingMap: Record<string, number> = {
      Fast: 35,
      Scenic: 120,
      Climb: 220,
    };
    const origin = parseLatLng(loopPoint);
    const distanceKm = Math.max(3, (unit === "km" ? distance : distance * 1.60934) * 0.55);
    const waypoint = origin
      ? computeWaypointFromOrigin(origin, bearingMap[variant] ?? 90, distanceKm)
      : null;
    if (waypoint) {
      params.set("waypoints", `via:${waypoint.lat.toFixed(6)},${waypoint.lng.toFixed(6)}`);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const handleCopy = async (variant: string) => {
    const url = variant ? buildMapsUrl(variant) : lastRouteUrl || buildMapsUrl("");
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy your Maps link", url);
    }
  };

  const distanceLabel = Number(distance.toFixed(1));
  const minDistance = unit === "km" ? 5 : 3;
  const maxDistance = unit === "km" ? 80 : 50;
  const rangePercent = ((distance - minDistance) / (maxDistance - minDistance)) * 100;

  const handleUnitChange = (next: "km" | "mi") => {
    if (next === unit) return;
    const converted = next === "km" ? distance * 1.60934 : distance / 1.60934;
    setDistance(Number(converted.toFixed(1)));
    setUnit(next);
  };

  useEffect(() => {
    if (!loopPoint || loopPoint.length < 3) {
      setSuggestions([]);
      return;
    }
    if (selectedCoords) {
      return;
    }
    let active = true;
    setIsSuggesting(true);
    const timer = setTimeout(async () => {
      try {
        const geo = await postJSON<any>("/api/geocode", { text: loopPoint });
        const results =
          geo?.features?.slice(0, 5).map((feature: any) => ({
            label: feature?.properties?.label || feature?.properties?.name || "Unknown",
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
          })) || [];
        if (active) setSuggestions(results);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setIsSuggesting(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [loopPoint, selectedCoords]);

  const handleDonate = async () => {
    if (!user?.id) {
      setAuthMessage("Yo, log in to add credits. We keep it fair — no data games.");
      setShowLogin(true);
      return;
    }
    setShowCredits(true);
  };

  const handleLogin = async () => {
    setShowLogin(true);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthMessage("Logged out.");
  };

  const handleSaveSetup = async () => {
    if (!deviceId) return;
    try {
      await postJSON("/api/save-setup", {
        device_id: deviceId,
        user_id: user?.id || "",
        loop_point: loopPoint,
        distance,
        unit,
        terrain,
        surface,
        vibe,
      });
      setStatusMessage("Setup saved.");
      const refreshed = await postJSON<{ free_used: number; donation_credits: number; free_remaining: number; credits_remaining: number }>(
        "/api/usage/check",
        { device_id: deviceId, user_id: user?.id || "" }
      );
      setUsage(refreshed);
    } catch {
      setStatusMessage("Save failed. Try again.");
    }
  };

  const handleGenerateRoutes = async () => {
    if (!user?.id) {
      setAuthMessage("Yo, log in so we can keep it fair. No data games — just counting loops.");
      setShowLogin(true);
      return;
    }
    setIsGenerating(true);
    setStatusMessage("");
    try {
      const usage = await postJSON<{
        allowed: boolean;
        donation_credits: number;
        free_used: number;
        credits_remaining: number;
      }>("/api/usage/consume", { device_id: deviceId, user_id: user?.id || "" });
      if (!usage.allowed) {
        setStatusMessage("Free runs done. Add credits to keep it moving.");
        setIsGenerating(false);
        return;
      }
      setUsage({
        free_used: usage.free_used,
        donation_credits: usage.donation_credits,
        free_remaining: Math.max(0, 3 - usage.free_used),
        credits_remaining: usage.credits_remaining || 0,
      });

      let origin = selectedCoords || parseLatLng(loopPoint);
      if (!origin) {
        const geo = await postJSON<any>("/api/geocode", { text: loopPoint });
        const first = geo?.features?.[0];
        if (!first) throw new Error("No location found");
        const [lng, lat] = first.geometry.coordinates;
        origin = { lat, lng };
      }

      const distanceKm = unit === "km" ? distance : distance * 1.60934;
      const loop = await postJSON<any>("/api/loop", {
        coords: [origin.lng, origin.lat],
        distance_km: distanceKm,
        seed: Math.floor(Math.random() * 1000),
      });

      const coords = loop?.features?.[0]?.geometry?.coordinates || [];
      const params = new URLSearchParams();
      params.set("api", "1");
      params.set("origin", `${origin.lat},${origin.lng}`);
      params.set("destination", `${origin.lat},${origin.lng}`);
      params.set("travelmode", "bicycling");

      if (coords.length > 6) {
        const pick = (ratio: number) => coords[Math.floor(coords.length * ratio)];
        const p1 = pick(0.25);
        const p2 = pick(0.5);
        const p3 = pick(0.75);
        params.set(
          "waypoints",
          [`${p1[1]},${p1[0]}`, `${p2[1]},${p2[0]}`, `${p3[1]},${p3[0]}`].join("|")
        );
      } else {
        const fallbackDistanceKm = Math.max(2, distanceKm * 0.4);
        const bearings = [40, 160, 260];
        const waypoints = bearings
          .map((bearing) => computeWaypointFromOrigin(origin, bearing, fallbackDistanceKm))
          .filter(Boolean)
          .map((point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`);
        if (waypoints.length) {
          params.set("waypoints", waypoints.join("|"));
        }
      }

      const url = `https://www.google.com/maps/dir/?${params.toString()}`;

      setLastRouteUrl(url);
      setStatusMessage("Grap your Route and Go to Cheat Death in the Streets.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn’t build a loop. Try a different spot.";
      setStatusMessage(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{ "--bg-shift": bgShiftPx, "--bg-scale": bgScale } as React.CSSProperties}
    >
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <div className="brand-title">Gimme The Loop</div>
            <div className="brand-subtitle">Cheat death on the streets.</div>
          </div>
        </div>
        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-expanded={menuOpen}
        >
          Menu
        </button>
        <div className={`header-actions ${menuOpen ? "open" : ""}`}>
          <a className="nav-link hide-mobile" href="#how-it-works">How to set the loop</a>
          <button className="nav-link" type="button" onClick={handleDonate}>
            Add credits
          </button>
          {user ? (
            <button className="nav-link" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="nav-link" type="button" onClick={handleLogin}>
              Login
            </button>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-title">Login</div>
            <div className="modal-subtitle">Get your link. No password.</div>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="you@email.com"
                autoFocus
              />
            </label>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowLogin(false)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={async () => {
                  if (!supabase) return;
                  if (!loginEmail) {
                    setAuthMessage("Add your email.");
                    return;
                  }
                  setAuthMessage("Check your email for the login link.");
                  await supabase.auth.signInWithOtp({
                    email: loginEmail,
                    options: { emailRedirectTo: window.location.origin },
                  });
                  setShowLogin(false);
                  setLoginEmail("");
                }}
              >
                Send link
              </button>
            </div>
          </div>
        </div>
      )}

      {showCredits && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-title">Add credits</div>
            <div className="modal-subtitle">Min $5. $5 = 10 credits. We don’t collect data — just track free loops.</div>
            <label className="field">
              <span>Amount (USD)</span>
              <input
                type="number"
                min="5"
                step="1"
                value={creditAmount}
                onChange={(event) => setCreditAmount(event.target.value)}
                placeholder="5"
              />
            </label>
            <div className="modal-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setShowCredits(false)}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={async () => {
                  if (!user?.id) return;
                  const amount = Math.max(5, Number.parseFloat(creditAmount || "0"));
                  if (Number.isNaN(amount)) {
                    setStatusMessage("Enter a valid amount.");
                    return;
                  }
                  try {
                    const data = await postJSON<{ url: string }>("/api/create-checkout-session", {
                      user_id: user.id,
                      amount: Math.round(amount * 100),
                    });
                    if (data?.url) window.location.href = data.url;
                  } catch {
                    setStatusMessage("Donation link unavailable right now.");
                  } finally {
                    setShowCredits(false);
                    setCreditAmount("5");
                  }
                }}
              >
                Go to checkout
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="hero" ref={heroRef}>
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="hero-eyebrow">Gimme The Loop</div>
          <h1>
            Cheat death on the streets.
          </h1>
          <p>
            Drop a spot, set the distance, get a clean loop back. No fluff.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#loop-builder">Build my loop</a>
          </div>
          <div className="hero-metadata">
            <div>
              <div className="metric">3</div>
              <div className="metric-label">Free loops</div>
            </div>
            <div>
              <div className="metric">$5</div>
              <div className="metric-label">= 10 credits</div>
            </div>
            <div>
              <div className="metric">1 tap</div>
              <div className="metric-label">Grab the route</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
        >
          <motion.div className="hero-image" style={{ y: parallaxY, x: parallaxX }}>
            <img src={heroImage} alt="Cyclist moving through a city loop" />
          </motion.div>
          <motion.div className="glass-card hero-card" style={{ y: parallaxY }}>
            <div className="hero-card-header">
              <div>
            <div className="hero-card-title">Loop preview</div>
            <div className="hero-card-subtitle">Midnight grid</div>
          </div>
              <span className="badge"><span className="live-dot" />Live</span>
            </div>
            <div className="loop-video">
              <video src={motionMap} autoPlay muted loop playsInline />
            </div>
            <div className="hero-card-footer">
              <div className="hero-chip">
                {distanceLabel} {unit}
              </div>
              <div className="hero-chip">+280 m</div>
              <div className="hero-chip">{terrainLabel[terrain]}</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="loop-progress" id="how-it-works">
        <div className="section-title">How to set up</div>
        <div className="progress-track">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className={`progress-step ${activeStep === index ? "active" : ""}`}
              onHoverStart={() => setActiveStep(index)}
              onHoverEnd={() => setActiveStep(-1)}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
            >
              <div className="progress-dot">
                <span>{step.number}</span>
              </div>
              <div className="progress-number">Step {step.number}</div>
              <div className="progress-title">{step.title}</div>
              <div className="progress-body">{step.body}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="builder-section" id="loop-builder">
        <div className="section-title">Build the Loop</div>
        <motion.div
          className="glass-card form-card"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.35 }}
        >
          <div className="form-header">
            <div>
              <div className="form-title">Loop builder</div>
              <div className="form-subtitle">No fluff. Just loops.</div>
            </div>
            {usage && (
              <div className="loops-left">
                Credits {Math.max(0, (usage.credits_remaining || 0) + usage.free_remaining)} · Free {usage.free_remaining}
              </div>
            )}
          </div>
          {authMessage && <div className="status-message"><strong>{authMessage}</strong></div>}

          <div className="form-section">
            <button className={`step-pill ${step1Done ? "active" : ""}`} type="button">
              Step 1 of 3
            </button>
            <label className="field">
              <span>Loop point</span>
              <input
                type="text"
                value={loopPoint}
                onChange={(event) => {
                  setLoopPoint(event.target.value);
                  setSelectedCoords(null);
                  setStep1Touched(true);
                }}
                placeholder="Search neighborhood or drop a pin"
                onFocus={() => setActiveStep(0)}
              />
              {isSuggesting && <div className="field-hint">Searching…</div>}
              {suggestions.length > 0 && (
                <div className="suggestions">
                  {suggestions.map((item) => (
                    <button
                      key={`${item.lat},${item.lng}`}
                      type="button"
                      className="suggestion-item"
                      onClick={() => {
                        setLoopPoint(item.label);
                        setSelectedCoords({ lat: item.lat, lng: item.lng });
                        setSuggestions([]);
                        setStep1Touched(true);
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              <span className="field-hint">Paste a full address or city name.</span>
            </label>
          </div>

          <div className="form-section">
            <button className={`step-pill ${step2Done ? "active" : ""}`} type="button">
              Step 2 of 3
            </button>
            <label className="field">
              <span>Distance</span>
              <div className="unit-toggle">
                <button
                  type="button"
                  className={`pill ${unit === "km" ? "active" : ""}`}
                  onClick={() => {
                    handleUnitChange("km");
                    setStep2Touched(true);
                  }}
                >
                  KM
                </button>
                <button
                  type="button"
                  className={`pill ${unit === "mi" ? "active" : ""}`}
                  onClick={() => {
                    handleUnitChange("mi");
                    setStep2Touched(true);
                  }}
                >
                  Miles
                </button>
              </div>
              <input
                type="range"
                min={minDistance}
                max={maxDistance}
                value={distance}
                onChange={(event) => {
                  setDistance(Number(event.target.value));
                  setStep2Touched(true);
                }}
                onFocus={() => setActiveStep(1)}
                style={{ ["--range-progress" as string]: `${rangePercent}%` }}
              />
              <div className="range-labels">
                <span>{minDistance} {unit}</span>
                <span>{distanceLabel} {unit}</span>
              </div>
            </label>

            <button className={`step-pill step-pill-spaced ${step3Done ? "active" : ""}`} type="button">
              Step 3 of 3
            </button>
            <div className="field-row">
              <label className="field">
                <span>Terrain</span>
                <select
                  value={terrain}
                  onChange={(event) => {
                    setTerrain(event.target.value);
                    setStep3Touched(true);
                  }}
                  onFocus={() => setActiveStep(1)}
                >
                  <option value="mix">Urban mix</option>
                  <option value="road">Road fast</option>
                  <option value="climb">Climb focused</option>
                  <option value="coast">Coastal</option>
                </select>
              </label>
              <label className="field">
                <span>Surface</span>
                <select
                  value={surface}
                  onChange={(event) => {
                    setSurface(event.target.value);
                    setStep3Touched(true);
                  }}
                  onFocus={() => setActiveStep(1)}
                >
                  <option value="paved">Paved</option>
                  <option value="mixed">Mixed</option>
                  <option value="gravel">Gravel</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Ride vibe</span>
              <div className="pill-group">
                {["Elegant", "Energy", "Scenic", "Climb"].map((option) => (
                  <button
                    key={option}
                    className={`pill ${vibe === option ? "active" : ""}`}
                    onClick={() => {
                      setVibe(option);
                      setStep3Touched(true);
                    }}
                    type="button"
                    onFocus={() => setActiveStep(1)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="form-section">
            <div className="form-actions split">
              <button
                className={`primary-button ${allDone ? "ready" : ""}`}
                onFocus={() => setActiveStep(2)}
                onClick={handleGenerateRoutes}
                disabled={isGenerating || !allDone}
              >
                Generate routes
              </button>
            </div>
            {statusMessage && (
              <div className="status-message">
                <strong>{statusMessage}</strong>
              </div>
            )}
            {lastRouteUrl && (
              <div className="route-output">
                <div className="route-actions">
                  <button
                    className="ghost-button small"
                    type="button"
                    onClick={() => handleCopy("")}
                  >
                    Copy link
                  </button>
                  <a className="primary-button small" href={lastRouteUrl} target="_blank" rel="noreferrer">
                    Open in Maps
                  </a>
                </div>
              </div>
            )}
          </div>

        </motion.div>
      </section>

      <section className="user-panel">
        <div className="glass-card user-card">
          <div className="form-title">Account</div>
          <div className="form-subtitle">Credits + login status</div>
          <div className="user-row">
            <div className="user-label">Status</div>
            <div className="user-value">{user ? "Logged in" : "Guest"}</div>
          </div>
          {user?.email && (
            <div className="user-row">
              <div className="user-label">Email</div>
              <div className="user-value">{user.email}</div>
            </div>
          )}
          {usage && (
            <div className="user-row">
              <div className="user-label">Credits left</div>
              <div className="user-value">
                {Math.max(0, (usage.credits_remaining || 0) + usage.free_remaining)} (Free {usage.free_remaining})
              </div>
            </div>
          )}
          <div className="user-actions">
            {!user ? (
              <button className="primary-button" type="button" onClick={handleLogin}>
                Login
              </button>
            ) : (
              <button className="ghost-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            )}
            <button className="ghost-button" type="button" onClick={handleDonate}>
              Add credits
            </button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div>
          <div className="footer-title">Gimme The Loop</div>
          <div className="footer-subtitle">Built for riders who love the return.</div>
        </div>
        <div className="footer-links">
          <a className="ghost-link" href="/privacy.html">Privacy</a>
          <a className="ghost-link" href="/terms.html">Terms</a>
          <a className="ghost-link" href="https://buymeacoffee.com/js4mhwqrdjd">
            Buy me a coffee
          </a>
          <a className="ghost-link admin-link" href="/admin.html">Admin</a>
        </div>
      </footer>
    </motion.div>
  );
}
