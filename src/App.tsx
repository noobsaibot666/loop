import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import heroImage from "./images/hero_6.jpg";
import alleycatImage from "./images/hero_4.jpg";

import Hero from "./components/Hero";
import { formatDuration, getPageView, getRiderIdFromPath } from "./utils/routeUtils";

const WallPage = lazy(() => import("./components/pages/WallPage"));
const LeaderboardPage = lazy(() => import("./components/pages/LeaderboardPage"));
const RiderProfilePage = lazy(() => import("./components/pages/RiderProfilePage"));
const CitiesPage = lazy(() => import("./components/pages/CitiesPage"));

export type PageView = "home" | "loop" | "messenger" | "cities" | "account" | "wall" | "leaderboard" | "rider";

type Usage = {
  free_used: number;
  donation_credits: number;
  free_remaining: number;
  credits_remaining: number;
  is_admin?: boolean;
  unlimited_credits?: boolean;
};
type Suggestion = {
  label: string;
  lat: number;
  lng: number;
};
type MessengerCheckpoint = {
  id: string;
  order: number;
  name: string;
  district: string;
  lat: number;
  lng: number;
  hint: string;
  task: string;
  task_type?: string;
  task_pressure?: string;
  pressure_score?: number;
  score_points?: number;
};
type MessengerManifest = {
  id: string;
  city: string;
  city_slug: string;
  difficulty: string;
  style: string;
  manifest_title: string;
  estimated_minutes: number;
  ghost_seconds: number;
  ghost_label?: string;
  checkpoint_count: number;
  district_count?: number;
  total_score?: number;
  task_mix?: string;
  replay_hook?: string;
  start_label?: string;
  range_km?: number | null;
  effective_range_km?: number | null;
  max_distance_km?: number | null;
  route_note: string;
  finish_label: string;
  safety_note: string;
  checkpoints: MessengerCheckpoint[];
};
type MessengerRun = {
  runId: string;
  startedAt: string;
  completedIds: string[];
  finishSeconds: number | null;
  finishedAt: string | null;
  status?: string;
  proofs?: MessengerProof[];
};
type MessengerProof = {
  id: string;
  checkpoint_id: string;
  checkpoint_name: string;
  public_url: string;
  location_label: string;
  is_public: boolean;
  created_at: string;
};
type AlleycatChallenge = {
  id: string;
  code: string;
  created_at?: string;
  status?: string;
};
type AlleycatLeaderboardEntry = {
  user_id: string;
  manifest_id: string;
  joined_at: string;
  rider_name: string;
  city_name: string;
  best_seconds: number | null;
  best_run_id: string | null;
  status: string;
  is_creator: boolean;
};
type AlleycatChallengeSummary = {
  status: string;
  expires_at: string | null;
  winner_user_id: string | null;
  winner_name: string | null;
  best_seconds: number | null;
  rivalry: string;
  result_label?: string;
  rematch_label?: string;
};
type AccountSummary = {
  profile: {
    user_id: string;
    rider_name: string;
    home_location: string;
    bike_name: string;
    bike_ratio: string;
  };
  purchases: {
    session_id: string;
    amount_cents: number;
    credits_to_grant: number;
    status: string;
    created_at: string;
  }[];
  alleycat: {
    manifests: number;
    runs: number;
    finished_runs: number;
    challenges: number;
    proofs: number;
    public_proofs: number;
  };
  quarter: {
    label: string;
    public_proofs: number;
    finished_runs: number;
    rank: number | null;
    total_ranked_riders: number;
    leaders: {
      user_id: string;
      rider_name: string;
      public_proofs: number;
      finished_runs: number;
      rank: number;
    }[];
  };
  badges: {
    id: string;
    label: string;
    description: string;
  }[];
  loop_history: {
    id: string;
    loop_point: string;
    distance_km: number;
    unit: string;
    terrain: string;
    surface: string;
    vibe: string;
    route_url: string;
    created_at: string;
  }[];
  alleycat_history: {
    id: string;
    city_name: string;
    manifest_title: string;
    difficulty: string;
    style: string;
    created_at: string;
    status: string;
    best_seconds: number | null;
    ghost_seconds: number | null;
    ghost_delta: number | null;
    proof_count: number;
    source_challenge_id: string | null;
  }[];
  challenge_history: {
    challenge_id: string;
    code: string;
    city_name: string;
    manifest_title: string;
    joined_at: string;
    status: string;
    best_seconds: number | null;
    rival_count: number;
  }[];
  shared_riders: {
    user_id: string;
    rider_name: string;
    shared_challenges: number;
    last_joined_at: string;
    cities: string[];
  }[];
};
type WallPost = {
  id: string;
  user_id?: string;
  rider_name: string;
  city_name: string;
  city_slug: string;
  checkpoint_name: string;
  location_label: string;
  bike_name?: string | null;
  bike_ratio?: string | null;
  public_url: string;
  created_at: string;
};
type PublicLeaderboardEntry = {
  user_id: string;
  rider_name: string;
  public_proofs: number;
  finished_runs: number;
  rank: number;
};
type PublicRiderProfile = {
  profile: {
    user_id: string;
    rider_name: string;
    home_location: string;
    bike_name: string;
    bike_ratio: string;
  };
  stats: {
    public_proofs: number;
    finished_runs: number;
    cities: number;
    top_city: string;
    best_finish_seconds: number | null;
    quarter_rank: number | null;
    quarter_public_proofs: number;
    quarter_finishes: number;
    shared_challenges: number;
    rivals: number;
    last_active_at: string | null;
    proof_streak_days: number;
  };
  badges: {
    id: string;
    label: string;
    description: string;
  }[];
  recent_proofs: WallPost[];
  recent_rivals: {
    user_id: string;
    rider_name: string;
    shared_challenges: number;
    last_joined_at: string;
    cities: string[];
  }[];
  recent_runs: {
    id: string;
    finished_at: string;
    finish_seconds: number;
    city_name: string;
    manifest_title: string;
    ghost_seconds: number | null;
    ghost_delta: number | null;
  }[];
  city_breakdown: {
    city_name: string;
    city_slug: string;
    proof_count: number;
  }[];
  city_clusters: {
    city_name: string;
    city_slug: string;
    proof_count: number;
    posts: WallPost[];
  }[];
  city_context: {
    city_name: string;
    city_slug: string;
    quarter_label: string;
    rank: number | null;
    proof_count: number;
    finish_count: number;
    leaders: {
      user_id: string;
      rider_name: string;
      rank: number;
      public_proofs: number;
      finished_runs: number;
    }[];
  } | null;
};
type CityDemand = {
  total_requests: number;
  open_requests: number;
  queued_requests: number;
  top_cities: {
    city: string;
    count: number;
  }[];
};
type CityLane = {
  city_slug: string;
  city_name: string;
  status: "live" | "ready" | "review" | "draft" | "requested";
  checkpoint_count: number;
  active_checkpoint_count: number;
  district_count: number;
  demand_count: number;
  open_request_count: number;
  route_note: string;
  finish_label: string;
  last_requested_at: string | null;
};

const API_BASE = (() => {
  const configured = import.meta.env.VITE_API_BASE || "";
  if (typeof window !== "undefined") {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (!isLocal && configured.includes("localhost")) return window.location.origin;
    return configured || window.location.origin;
  }
  return configured;
})();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnon ? createClient(supabaseUrl, supabaseAnon) : null;

const LOOP_FREE_LIMIT = 3;
const MESSENGER_CREDIT_COST = 3;
const ALLEYCAT_STORAGE_KEY = "loop_alleycat_state";
const ALLEYCAT_CITY_PRESETS = ["Berlin", "London", "Tokyo", "Mexico City", "Bogota", "Warsaw", "Barcelona", "Sao Paulo"];
const PROOF_BUCKET = "alleycat-proofs";
const toCitySlug = (value = "") => value.trim().toLowerCase().replace(/\s+/g, "");
const getCityLabel = (value = "") => ALLEYCAT_CITY_PRESETS.find((city) => toCitySlug(city) === toCitySlug(value)) || value;

const loopSteps = [
  {
    number: "01",
    title: "Drop your point",
    body: "Choose the place you want to leave from and return to.",
  },
  {
    number: "02",
    title: "Tune the ride",
    body: "Set the distance, surface, and feel. Keep it sharp.",
  },
  {
    number: "03",
    title: "Open and go",
    body: "We build the line. You open Maps and go.",
  },
];

const productHighlights = [
  {
    title: "Alleycat Mode",
    body: "City pack, ghost heat, proof, and your own line through town.",
    action: "Open Alleycat",
    page: "messenger" as PageView,
  },
  {
    title: "Loop",
    body: "Fast routes back. Point, build, move.",
    action: "Open Loop",
    page: "loop" as PageView,
  },
];

const messengerFlow = [
  {
    number: "01",
    title: "Pick the city",
    body: "Pick a city and pull the list.",
  },
  {
    number: "02",
    title: "Hit the points",
    body: "Clear the checkpoints your own way.",
  },
  {
    number: "03",
    title: "Proof of passage",
    body: "Post proof and let it hit the wall.",
  },
];




export default function App() {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  const [pageView, setPageView] = useState<PageView>(() => getPageView());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.sequential-layout > section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [pageView]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [deviceId, setDeviceId] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState("5");
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [accountRiderName, setAccountRiderName] = useState("");
  const [accountHomeLocation, setAccountHomeLocation] = useState("");
  const [accountBikeName, setAccountBikeName] = useState("");
  const [accountBikeRatio, setAccountBikeRatio] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
  const [isLoadingWall, setIsLoadingWall] = useState(false);
  const [selectedWallCity, setSelectedWallCity] = useState("");
  const [publicLeaderboard, setPublicLeaderboard] = useState<PublicLeaderboardEntry[]>([]);
  const [publicQuarterLabel, setPublicQuarterLabel] = useState("");
  const [isLoadingPublicLeaderboard, setIsLoadingPublicLeaderboard] = useState(false);
  const [selectedLeaderboardCity, setSelectedLeaderboardCity] = useState("");
  const [publicRiderProfile, setPublicRiderProfile] = useState<PublicRiderProfile | null>(null);
  const [isLoadingPublicRiderProfile, setIsLoadingPublicRiderProfile] = useState(false);
  const [showCityRequest, setShowCityRequest] = useState(false);
  const [cityDemand, setCityDemand] = useState<CityDemand | null>(null);
  const [isLoadingCityDemand, setIsLoadingCityDemand] = useState(false);
  const [cityLanes, setCityLanes] = useState<CityLane[]>([]);
  const [isLoadingCityLanes, setIsLoadingCityLanes] = useState(false);
  const [showShareJoinModal, setShowShareJoinModal] = useState(false);
  const [cityRequestName, setCityRequestName] = useState("");
  const [cityRequestLocation, setCityRequestLocation] = useState("");
  const [cityRequestNote, setCityRequestNote] = useState("");
  const [cityRequestStatus, setCityRequestStatus] = useState("");
  const [isSendingCityRequest, setIsSendingCityRequest] = useState(false);

  const [loopPoint, setLoopPoint] = useState("");
  const [distance, setDistance] = useState(14);
  const [terrain, setTerrain] = useState("mix");
  const [surface, setSurface] = useState("paved");
  const [vibe, setVibe] = useState("Elegant");
  const [unit, setUnit] = useState<"km" | "mi">("km");
  const [isGeneratingLoop, setIsGeneratingLoop] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [lastRouteUrl, setLastRouteUrl] = useState("");
  const [step1Touched, setStep1Touched] = useState(false);
  const [step2Touched, setStep2Touched] = useState(false);
  const [step3Touched, setStep3Touched] = useState(false);

  const [messengerCity, setMessengerCity] = useState("");
  const [messengerLocation, setMessengerLocation] = useState("");
  const [messengerDifficulty, setMessengerDifficulty] = useState("medium");
  const [messengerStyle, setMessengerStyle] = useState("local");
  const [messengerCheckpointCount, setMessengerCheckpointCount] = useState(4);
  const [messengerRange, setMessengerRange] = useState(8);
  const [messengerUnit, setMessengerUnit] = useState<"km" | "mi">("km");
  const [messengerManifest, setMessengerManifest] = useState<MessengerManifest | null>(null);
  const [messengerManifestId, setMessengerManifestId] = useState("");
  const [messengerStatus, setMessengerStatus] = useState("");
  const [isGeneratingMessenger, setIsGeneratingMessenger] = useState(false);
  const [messengerRun, setMessengerRun] = useState<MessengerRun | null>(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const [isHydratingRun, setIsHydratingRun] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [shareInput, setShareInput] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [isSharingManifest, setIsSharingManifest] = useState(false);
  const [isLoadingSharedManifest, setIsLoadingSharedManifest] = useState(false);
  const [challenge, setChallenge] = useState<AlleycatChallenge | null>(null);
  const [challengeSummary, setChallengeSummary] = useState<AlleycatChallengeSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<AlleycatLeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [proofVisibility, setProofVisibility] = useState<Record<string, boolean>>({});
  const [proofFiles, setProofFiles] = useState<Record<string, File | null>>({});
  const [proofStatus, setProofStatus] = useState<Record<string, string>>({});
  const [isUploadingProof, setIsUploadingProof] = useState<Record<string, boolean>>({});
  const geocodeCacheRef = useRef(new Map<string, { lat: number; lng: number; label: string }>());
  const messengerConfigRef = useRef("");

  const isMobile = useMemo(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent), []);

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
    let data: any = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (!response.ok) {
      const message = data?.error || data?.message || text || `Request failed: ${response.status}`;
      throw new Error(message);
    }
    return data;
  };

  const geocodeStartPoint = async (text: string) => {
    const key = text.trim().toLowerCase();
    const cached = geocodeCacheRef.current.get(key);
    if (cached) return cached;
    const response = await postJSON<{ features?: Array<{ geometry?: { coordinates?: number[] }; properties?: { label?: string } }> }>(
      "/api/geocode",
      { text }
    );
    const hit = response.features?.[0];
    const coordinates = hit?.geometry?.coordinates || [];
    if (coordinates.length < 2) {
      throw new Error("Couldn’t place that start spot. Try a clearer area or street name.");
    }
    const resolved = {
      lng: Number(coordinates[0]),
      lat: Number(coordinates[1]),
      label: hit?.properties?.label || text,
    };
    geocodeCacheRef.current.set(key, resolved);
    return resolved;
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
    const onPopState = () => setPageView(getPageView());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
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
        setUsage(null);
        setAccountSummary(null);
      }
    });
    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("donation") !== "success") return;
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        await postJSON("/api/stripe/verify-session", { session_id: sessionId });
        const refreshed = await postJSON<Usage>("/api/usage/check", { device_id: deviceId, user_id: user.id });
        if (!cancelled) setUsage(refreshed);
      } catch {
        // Webhook can settle this later.
      } finally {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("donation");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        } catch {
          // Ignore.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, deviceId]);

  useEffect(() => {
    let active = true;
    if (!user?.id) return;
    const fetchUsage = async () => {
      try {
        const data = await postJSON<Usage>("/api/usage/check", { device_id: deviceId, user_id: user.id });
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

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      setAccountSummary(null);
      return;
    }
    const fetchAccountSummary = async () => {
      try {
        const data = await postJSON<AccountSummary>("/api/account/summary", {});
        if (active) setAccountSummary(data);
      } catch {
        if (active) setAccountSummary(null);
      }
    };
    fetchAccountSummary();
    return () => {
      active = false;
    };
  }, [user?.id, usage?.credits_remaining, messengerRun?.finishSeconds]);

  useEffect(() => {
    setAccountRiderName(accountSummary?.profile?.rider_name || "");
    setAccountHomeLocation(accountSummary?.profile?.home_location || "");
    setAccountBikeName(accountSummary?.profile?.bike_name || "");
    setAccountBikeRatio(accountSummary?.profile?.bike_ratio || "");
  }, [accountSummary?.profile?.rider_name, accountSummary?.profile?.home_location, accountSummary?.profile?.bike_name, accountSummary?.profile?.bike_ratio]);

  useEffect(() => {
    if (!messengerRun || messengerRun.finishedAt) return;
    const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [messengerRun]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ALLEYCAT_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        city?: string;
        location?: string;
        difficulty?: string;
        style?: string;
        checkpointCount?: number;
        range?: number;
        unit?: "km" | "mi";
        manifestId?: string;
        manifest?: MessengerManifest | null;
        run?: MessengerRun | null;
        challenge?: AlleycatChallenge | null;
      };
      if (saved.city) setMessengerCity(saved.city);
      if (saved.location) setMessengerLocation(saved.location);
      if (saved.difficulty) setMessengerDifficulty(saved.difficulty);
      if (saved.style) setMessengerStyle(saved.style);
      if (typeof saved.checkpointCount === "number") setMessengerCheckpointCount(saved.checkpointCount);
      if (typeof saved.range === "number") setMessengerRange(saved.range);
      if (saved.unit === "km" || saved.unit === "mi") setMessengerUnit(saved.unit);
      if (saved.manifestId) setMessengerManifestId(saved.manifestId);
      if (saved.manifest) setMessengerManifest(saved.manifest);
      if (saved.run) setMessengerRun(saved.run);
      if (saved.challenge) {
        setChallenge(saved.challenge);
        setShareCode(saved.challenge.code);
      }
    } catch {
      localStorage.removeItem(ALLEYCAT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ALLEYCAT_STORAGE_KEY,
        JSON.stringify({
          city: messengerCity,
          location: messengerLocation,
          difficulty: messengerDifficulty,
          style: messengerStyle,
          checkpointCount: messengerCheckpointCount,
          range: messengerRange,
          unit: messengerUnit,
          manifestId: messengerManifestId,
          manifest: messengerManifest,
          run: messengerRun,
          challenge,
        })
      );
    } catch {
      // Ignore storage failures.
    }
  }, [messengerCity, messengerLocation, messengerDifficulty, messengerStyle, messengerCheckpointCount, messengerRange, messengerUnit, messengerManifestId, messengerManifest, messengerRun, challenge]);

  useEffect(() => {
    const nextConfig = JSON.stringify({
      city: messengerCity,
      location: messengerLocation,
      difficulty: messengerDifficulty,
      style: messengerStyle,
      checkpointCount: messengerCheckpointCount,
      range: messengerRange,
      unit: messengerUnit,
    });

    if (!messengerConfigRef.current) {
      messengerConfigRef.current = nextConfig;
      return;
    }

    if (messengerConfigRef.current === nextConfig) return;
    messengerConfigRef.current = nextConfig;

    if (!messengerManifest || messengerRun) return;
    setMessengerManifest(null);
    setMessengerManifestId("");
    setChallenge(null);
    setChallengeSummary(null);
    setLeaderboard([]);
    setShareCode("");
    setShareStatus("");
    setMessengerStatus("Settings changed. Build a fresh manifest.");
  }, [messengerCity, messengerLocation, messengerDifficulty, messengerStyle, messengerCheckpointCount, messengerRange, messengerUnit, messengerManifest, messengerRun]);

  useEffect(() => {
    if (messengerUnit === "km" && messengerRange <= 1 && messengerCheckpointCount > 2) {
      setMessengerCheckpointCount(2);
      setMessengerStatus("1 km test mode caps the list at 2 checkpoints.");
    }
  }, [messengerRange, messengerUnit, messengerCheckpointCount]);

  useEffect(() => {
    if (!user?.id || !messengerRun?.runId) return;
    let cancelled = false;
    setIsHydratingRun(true);
    (async () => {
      try {
        const data = await postJSON<{
          run: {
            id: string;
            status: string;
            started_at: string;
            finished_at: string | null;
            finish_seconds: number | null;
            completed_ids: string[];
          };
          manifest_id: string;
          manifest: MessengerManifest | null;
          challenge: AlleycatChallenge | null;
        }>("/api/messenger/run-state", { run_id: messengerRun.runId });
        if (cancelled) return;
        if (data.manifest) {
          setMessengerManifest(data.manifest);
          setMessengerManifestId(data.manifest_id);
        }
        if (data.challenge) {
          setChallenge(data.challenge);
          setShareCode(data.challenge.code);
        }
        setMessengerRun({
          runId: data.run.id,
          startedAt: data.run.started_at,
          completedIds: data.run.completed_ids,
          finishSeconds: data.run.finish_seconds,
          finishedAt: data.run.finished_at,
          status: data.run.status,
        });
      } catch {
        if (!cancelled) {
          setMessengerStatus((current) => current || "Could not reload the current alleycat run.");
        }
      } finally {
        if (!cancelled) setIsHydratingRun(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, messengerRun?.runId]);

  useEffect(() => {
    if (!user?.id || (!challenge?.id && !messengerManifestId)) {
      setLeaderboard([]);
      setChallengeSummary(null);
      return;
    }
    let cancelled = false;
    setIsLoadingLeaderboard(true);
    (async () => {
      try {
        const data = await postJSON<{
          challenge: AlleycatChallenge | null;
          leaderboard: AlleycatLeaderboardEntry[];
          summary?: AlleycatChallengeSummary | null;
        }>("/api/messenger/leaderboard", {
          challenge_id: challenge?.id || "",
          manifest_id: messengerManifestId || "",
        });
        if (cancelled) return;
        if (data.challenge) {
          setChallenge(data.challenge);
          setShareCode(data.challenge.code);
        }
        setLeaderboard(data.leaderboard || []);
        setChallengeSummary(data.summary || null);
      } catch {
        if (!cancelled) {
          setLeaderboard([]);
          setChallengeSummary(null);
        }
      } finally {
        if (!cancelled) setIsLoadingLeaderboard(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, challenge?.id, messengerManifestId, messengerRun?.finishSeconds, messengerRun?.completedIds.length]);

  useEffect(() => {
    if (pageView !== "wall") return;
    let cancelled = false;
    setIsLoadingWall(true);
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/wall${selectedWallCity ? `?city=${encodeURIComponent(selectedWallCity)}` : ""}`, { cache: "no-store" });
        const data = (await response.json()) as { posts: WallPost[] };
        if (!cancelled) setWallPosts(data.posts || []);
      } catch {
        if (!cancelled) setWallPosts([]);
      } finally {
        if (!cancelled) setIsLoadingWall(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageView, selectedWallCity]);

  useEffect(() => {
    if (pageView !== "leaderboard") return;
    let cancelled = false;
    setIsLoadingPublicLeaderboard(true);
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/leaderboard${selectedLeaderboardCity ? `?city=${encodeURIComponent(selectedLeaderboardCity)}` : ""}`, { cache: "no-store" });
        const data = (await response.json()) as { quarter?: { label?: string; leaders?: PublicLeaderboardEntry[] } };
        if (cancelled) return;
        setPublicQuarterLabel(data.quarter?.label || "");
        setPublicLeaderboard(data.quarter?.leaders || []);
      } catch {
        if (!cancelled) {
          setPublicQuarterLabel("");
          setPublicLeaderboard([]);
        }
      } finally {
        if (!cancelled) setIsLoadingPublicLeaderboard(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageView, selectedLeaderboardCity]);

  useEffect(() => {
    if (pageView !== "rider") return;
    const riderId = getRiderIdFromPath();
    if (!riderId) {
      setPublicRiderProfile(null);
      return;
    }
    let cancelled = false;
    setIsLoadingPublicRiderProfile(true);
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/rider-profile?user_id=${encodeURIComponent(riderId)}`, { cache: "no-store" });
        const data = (await response.json()) as PublicRiderProfile;
        if (!cancelled) setPublicRiderProfile(data);
      } catch {
        if (!cancelled) setPublicRiderProfile(null);
      } finally {
        if (!cancelled) setIsLoadingPublicRiderProfile(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageView]);

  useEffect(() => {
    if (!["home", "messenger"].includes(pageView)) return;
    let cancelled = false;
    setIsLoadingCityDemand(true);
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/city-demand`, { cache: "no-store" });
        const data = (await response.json()) as CityDemand;
        if (!cancelled) setCityDemand(data);
      } catch {
        if (!cancelled) setCityDemand(null);
      } finally {
        if (!cancelled) setIsLoadingCityDemand(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageView]);

  useEffect(() => {
    if (pageView !== "cities") return;
    let cancelled = false;
    setIsLoadingCityLanes(true);
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/city-lanes`, { cache: "no-store" });
        const data = (await response.json()) as { lanes?: CityLane[] };
        if (!cancelled) {
          setCityLanes(data.lanes || []);
        }
      } catch {
        if (!cancelled) {
          setCityLanes([]);
        }
      } finally {
        if (!cancelled) setIsLoadingCityLanes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageView]);

  useEffect(() => {
    if (!loopPoint || loopPoint.length < 3) {
      setSuggestions([]);
      return;
    }
    if (selectedCoords) return;
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

  const step1Done = step1Touched && loopPoint.trim().length > 3;
  const step2Done = step2Touched;
  const step3Done = step3Touched;
  const allLoopDone = step1Done && step2Done && step3Done;

  const hasUnlimitedCredits = Boolean(usage?.unlimited_credits || usage?.is_admin);
  const totalCredits = hasUnlimitedCredits ? 9999 : Math.max(0, (usage?.credits_remaining || 0) + (usage?.free_remaining || 0));
  const messengerCreditsOnly = hasUnlimitedCredits ? 9999 : Math.max(0, usage?.credits_remaining || 0);
  const riderHandle = (user?.email || "").split("@")[0] || "rider";
  const accountGreeting = hasUnlimitedCredits ? `Yo admin ${riderHandle}.` : `Yo ${riderHandle}.`;
  const currentElapsed = useMemo(() => {
    if (!messengerRun) return 0;
    if (messengerRun.finishSeconds) return messengerRun.finishSeconds;
    return Math.max(0, Math.round((clockNow - new Date(messengerRun.startedAt).getTime()) / 1000));
  }, [messengerRun, clockNow]);
  const ghostDelta =
    messengerManifest && messengerRun?.finishSeconds
      ? messengerRun.finishSeconds - messengerManifest.ghost_seconds
      : null;
  const proofCount = messengerRun?.proofs?.length || 0;
  const districtCoverage = useMemo(() => {
    if (!messengerManifest) return 0;
    return new Set(messengerManifest.checkpoints.map((checkpoint) => checkpoint.district).filter(Boolean)).size;
  }, [messengerManifest]);
  const runScore = useMemo(() => {
    if (!messengerManifest) return 0;
    const baseScore = messengerManifest.checkpoints.reduce((sum, checkpoint) => sum + (checkpoint.score_points || 0), 0);
    const proofBonus = proofCount * 25;
    const cleanSweepBonus = proofCount === messengerManifest.checkpoints.length && messengerManifest.checkpoints.length > 0 ? 60 : 0;
    const ghostBonus =
      ghostDelta === null ? 0 : ghostDelta <= 0 ? 120 : ghostDelta <= 60 ? 70 : ghostDelta <= 180 ? 30 : 0;
    return baseScore + proofBonus + cleanSweepBonus + ghostBonus;
  }, [messengerManifest, proofCount, ghostDelta]);
  const runGrade = useMemo(() => {
    if (ghostDelta === null) return "Open";
    if (ghostDelta <= -60) return "Smoked the ghost";
    if (ghostDelta <= 0) return "Beat the ghost";
    if (ghostDelta <= 60) return "Close chase";
    if (ghostDelta <= 180) return "Solid close";
    return "Needs another swing";
  }, [ghostDelta]);
  const challengeStatusLabel =
    challengeSummary?.status === "expired" ? "Expired" : challengeSummary?.status === "finished" ? "Finished" : "Open";
  const completedCount = messengerRun?.completedIds.length || 0;
  const totalCheckpoints = messengerManifest?.checkpoints.length || 0;
  const remainingCount = Math.max(0, totalCheckpoints - completedCount);
  const finishedRiders = leaderboard.filter((entry) => entry.status === "finished").length;
  const boardLeader = leaderboard.find((entry) => entry.best_seconds !== null) || null;
  const ownBoardEntry = leaderboard.find((entry) => entry.user_id === user?.id) || null;
  const fastestRival = leaderboard.find((entry) => entry.user_id !== user?.id && entry.best_seconds !== null) || null;
  const wallLeadCity = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of wallPosts) {
      if (!post.city_name) continue;
      counts.set(post.city_name, (counts.get(post.city_name) || 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || null;
  }, [wallPosts]);
  const wallFeaturedPost = wallPosts[0] || null;
  const rivalrySummary = useMemo(() => {
    if (!ownBoardEntry?.best_seconds) {
      if (challengeSummary?.winner_name) return `${challengeSummary.winner_name} is setting the pace. Jump in and make them sweat.`;
      return "No clean time from you yet. Load the list and put a number on the board.";
    }
    if (!fastestRival?.best_seconds) return "You have the only clean time so far. Run it back or wait for someone brave enough to answer.";
    const delta = ownBoardEntry.best_seconds - fastestRival.best_seconds;
    if (delta === 0) return `Dead heat with ${fastestRival.rider_name}. Somebody has to blink.`;
    if (delta < 0) return `You are ${formatDuration(Math.abs(delta))} up on ${fastestRival.rider_name}. Run it back and stretch the gap.`;
    return `${fastestRival.rider_name} has you by ${formatDuration(delta)}. Run it back and take it back.`;
  }, [challengeSummary?.winner_name, ownBoardEntry, fastestRival]);
  const finishBridgeLabel = useMemo(() => {
    if (!messengerManifest) return "";
    return `${messengerManifest.city} · ${districtCoverage || messengerManifest.district_count || 0} districts · ${proofCount}/${messengerManifest.checkpoints.length} proofs`;
  }, [messengerManifest, districtCoverage, proofCount]);
  const finishStory = useMemo(() => {
    if (!messengerManifest || !messengerRun?.finishedAt) return "";
    const proofLine =
      proofCount === messengerManifest.checkpoints.length
        ? "Every stop is backed up."
        : `${proofCount} of ${messengerManifest.checkpoints.length} stops are backed with proof.`;
    const ghostLine =
      ghostDelta === null
        ? "The clock is still open."
        : ghostDelta <= 0
          ? `You put the ghost away by ${formatDuration(Math.abs(ghostDelta))}.`
          : `The ghost stayed ahead by ${formatDuration(ghostDelta)}.`;
    return `${proofLine} ${ghostLine}`;
  }, [messengerManifest, messengerRun?.finishedAt, ghostDelta, proofCount]);

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

  const handleNavigate = (target: PageView) => {
    const path =
      target === "loop"
        ? "/loop"
        : target === "messenger"
          ? "/messenger"
          : target === "cities"
            ? "/cities"
          : target === "account"
            ? "/account"
            : target === "wall"
              ? "/wall"
              : target === "leaderboard"
                ? "/leaderboard"
              : target === "rider"
                ? "/rider"
              : "/";
    window.history.pushState({}, "", path);
    setPageView(target);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenRiderProfile = (userId?: string) => {
    if (!userId) return;
    window.history.pushState({}, "", `/rider/${encodeURIComponent(userId)}`);
    setPageView("rider");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenWallCity = (cityName?: string) => {
    if (!cityName) return handleNavigate("wall");
    const slug = toCitySlug(cityName);
    setSelectedWallCity(slug);
    window.history.pushState({}, "", "/wall");
    setPageView("wall");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenLeaderboardCity = (cityName?: string) => {
    if (!cityName) return handleNavigate("leaderboard");
    const slug = toCitySlug(cityName);
    setSelectedLeaderboardCity(slug);
    window.history.pushState({}, "", "/leaderboard");
    setPageView("leaderboard");
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenMessengerCity = (cityName?: string) => {
    if (cityName) setMessengerCity(getCityLabel(cityName));
    handleNavigate("messenger");
  };

  const openAuth = (mode: "login" | "signup" = "login", message = "") => {
    setAuthMode(mode);
    setAuthMessage(message);
    setShowLogin(true);
  };

  const handleSubmitCityRequest = async () => {
    if (!cityRequestName.trim() && !cityRequestLocation.trim()) {
      setCityRequestStatus("Drop a city or riding area first.");
      return;
    }
    setIsSendingCityRequest(true);
    setCityRequestStatus("");
    try {
      await postJSON("/api/city-request", {
        city: cityRequestName.trim(),
        location: cityRequestLocation.trim(),
        note: cityRequestNote.trim(),
        email: user?.email || "",
      });
      setCityRequestStatus("Request sent. It’s in the queue.");
      setCityRequestName("");
      setCityRequestLocation("");
      setCityRequestNote("");
      const response = await fetch(`${API_BASE}/api/city-demand`, { cache: "no-store" }).catch(() => null);
      if (response?.ok) {
        const data = (await response.json()) as CityDemand;
        setCityDemand(data);
      }
    } catch (error) {
      setCityRequestStatus(error instanceof Error ? error.message : "Could not send the request.");
    } finally {
      setIsSendingCityRequest(false);
    }
  };

  const buildCheckpointMapsUrl = (checkpoint: MessengerCheckpoint) => {
    const params = new URLSearchParams();
    params.set("api", "1");
    params.set("destination", `${checkpoint.lat},${checkpoint.lng}`);
    params.set("travelmode", "bicycling");
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  };

  const getCurrentPosition = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location is not available on this device."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error("Location access is blocked. Turn it on in browser settings, then try the checkpoint again."));
            return;
          }
          if (error.code === error.TIMEOUT) {
            reject(new Error("Location timed out. Pause in a clear spot and try again."));
            return;
          }
          reject(new Error("Could not lock your location. Check signal and try again."));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });

  const handleResetAlleycat = () => {
    setMessengerManifest(null);
    setMessengerManifestId("");
    setMessengerRun(null);
    setMessengerStatus("");
    setChallenge(null);
    setShareCode("");
    setShareInput("");
    setShareStatus("");
    setLeaderboard([]);
    setChallengeSummary(null);
    try {
      localStorage.removeItem(ALLEYCAT_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  };

  const handleAbandonMessenger = async () => {
    if (!messengerRun) return;
    try {
      const data = await postJSON<{ run: { status: string } }>("/api/messenger/abandon", {
        run_id: messengerRun.runId,
      });
      setMessengerRun((current) => (current ? { ...current, status: data.run?.status || "abandoned", finishedAt: new Date().toISOString() } : current));
      setMessengerStatus("Run abandoned. You can restart the manifest whenever you want.");
    } catch (error) {
      setMessengerStatus(error instanceof Error ? error.message : "Could not abandon the run.");
    }
  };

  const handleRestartMessenger = async () => {
    if (!messengerManifestId && !messengerRun?.runId) return;
    try {
      const data = await postJSON<{ run: { id: string; started_at: string; status: string } }>("/api/messenger/restart", {
        manifest_id: messengerManifestId,
        run_id: messengerRun?.runId || "",
      });
      setMessengerRun({
        runId: data.run.id,
        startedAt: data.run.started_at,
        completedIds: [],
        finishSeconds: null,
        finishedAt: null,
        status: data.run.status,
        proofs: [],
      });
      setProofFiles({});
      setProofStatus({});
      setMessengerStatus("Fresh run started on the same manifest.");
    } catch (error) {
      setMessengerStatus(error instanceof Error ? error.message : "Could not restart the run.");
    }
  };

  const handleCreateShareCode = async () => {
    if (!messengerManifestId) return;
    setIsSharingManifest(true);
    setShareStatus("");
    try {
      const data = await postJSON<{ code: string; challenge_id?: string }>("/api/messenger/share", {
        manifest_id: messengerManifestId,
      });
      setShareCode(data.code);
      if (data.challenge_id) {
        setChallenge({ id: data.challenge_id, code: data.code });
      }
      setShareStatus("Share code ready. Send it to a friend so they can load the same manifest.");
      try {
        await navigator.clipboard.writeText(data.code);
      } catch {
        // Ignore clipboard failures.
      }
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : "Could not create a share code.");
    } finally {
      setIsSharingManifest(false);
    }
  };

  const handleLoadShareCode = async () => {
    if (!shareInput.trim()) return;
    if (!user?.id) {
      requireLogin("Log in to join a shared Alleycat run.");
      return;
    }
    setIsLoadingSharedManifest(true);
    setShareStatus("");
    try {
      const data = await postJSON<{
        manifest_id: string;
        manifest: MessengerManifest;
        source_code: string;
        challenge_id?: string;
      }>("/api/messenger/share", {
        code: shareInput.trim().toUpperCase(),
      });
      setMessengerManifestId(data.manifest_id);
      setMessengerManifest(data.manifest);
      setMessengerRun(null);
      setShareCode(data.source_code);
      if (data.challenge_id) {
        setChallenge({ id: data.challenge_id, code: data.source_code });
      }
      setShareStatus(`Shared manifest loaded from code ${data.source_code}.`);
      setMessengerStatus("Shared manifest loaded. Start when you are ready.");
      setShowShareJoinModal(false);
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : "Could not load that share code.");
    } finally {
      setIsLoadingSharedManifest(false);
    }
  };

  const handleRematchChallenge = async () => {
    if (!messengerManifest) return;
    if (!messengerRun) {
      await handleStartMessenger();
      return;
    }
    await handleRestartMessenger();
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

  const handleCopy = async () => {
    const url = lastRouteUrl || buildMapsUrl("");
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy your Maps link", url);
    }
  };

  const handleUnitChange = (next: "km" | "mi") => {
    if (next === unit) return;
    const converted = next === "km" ? distance * 1.60934 : distance / 1.60934;
    setDistance(Number(converted.toFixed(1)));
    setUnit(next);
  };

  const distanceLabel = Number(distance.toFixed(1));
  const minDistance = unit === "km" ? 5 : 3;
  const maxDistance = unit === "km" ? 80 : 50;
  const rangePercent = ((distance - minDistance) / (maxDistance - minDistance)) * 100;
  const messengerRangeLabel = Number(messengerRange.toFixed(1));
  const messengerMinRange = messengerUnit === "km" ? 1 : 1;
  const messengerMaxRange = messengerUnit === "km" ? 20 : 12;
  const messengerRangePercent = ((messengerRange - messengerMinRange) / (messengerMaxRange - messengerMinRange)) * 100;

  const requireLogin = (message: string) => {
    openAuth("login", message);
  };

  const handleDonate = async () => {
    if (!user?.id) {
      requireLogin("Log in first so credits land on the right rider.");
      return;
    }
    setShowCredits(true);
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthMessage("Logged out.");
    setUsage(null);
    setAccountSummary(null);
    setPageView("home");
    window.history.pushState({}, "", "/");
  };

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthMessage("Add your email and password.");
      return;
    }
    setAuthLoading(true);
    setAuthMessage("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: loginEmail.trim(),
          password: loginPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });
        if (error) throw error;
        setAuthMessage(
          data.session
            ? "Account ready. You are logged in."
            : "Account created. Check your inbox if email confirmation is enabled."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });
        if (error) throw error;
        setAuthMessage("Logged in.");
      }
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      handleNavigate("account");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Could not complete auth.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!supabase || !accountPassword.trim()) {
      setAccountStatus("Add a new password first.");
      return;
    }
    setIsUpdatingPassword(true);
    setAccountStatus("");
    try {
      const { error } = await supabase.auth.updateUser({ password: accountPassword.trim() });
      if (error) throw error;
      setAccountPassword("");
      setAccountStatus("Password updated.");
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.id) {
      setAccountStatus("Log in first.");
      return;
    }
    setIsSavingProfile(true);
    setAccountStatus("");
    try {
      const data = await postJSON<{ ok: boolean; profile: AccountSummary["profile"] }>("/api/account/profile", {
        rider_name: accountRiderName,
        home_location: accountHomeLocation,
        bike_name: accountBikeName,
        bike_ratio: accountBikeRatio,
      });
      setAccountSummary((current) => (current ? { ...current, profile: data.profile } : current));
      setAccountStatus("Profile saved. Wall posts updated too.");
    } catch (error) {
      setAccountStatus(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!supabase || !loginEmail.trim()) {
      setAuthMessage("Add your email first.");
      return;
    }
    setIsSendingReset(true);
    setAuthMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail.trim(), {
        redirectTo: `${window.location.origin}/account`,
      });
      if (error) throw error;
      setAuthMessage("Password reset email sent.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Could not send reset email.");
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleProofUpload = async (checkpoint: MessengerCheckpoint) => {
    if (!supabase || !user?.id || !messengerRun?.runId) return;
    const file = proofFiles[checkpoint.id];
    if (!file) {
      setProofStatus((current) => ({ ...current, [checkpoint.id]: "Pick a photo first." }));
      return;
    }

    setIsUploadingProof((current) => ({ ...current, [checkpoint.id]: true }));
    setProofStatus((current) => ({ ...current, [checkpoint.id]: "" }));
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${user.id}/${messengerRun.runId}/${checkpoint.id}-${Date.now()}.${extension}`;
      const upload = await supabase.storage.from(PROOF_BUCKET).upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upload.error) throw upload.error;

      const { data: publicData } = supabase.storage.from(PROOF_BUCKET).getPublicUrl(storagePath);
      const proofResponse = await postJSON<{ proofs: MessengerProof[] }>("/api/messenger/proof", {
        run_id: messengerRun.runId,
        checkpoint_id: checkpoint.id,
        storage_path: storagePath,
        public_url: publicData.publicUrl,
        is_public: proofVisibility[checkpoint.id] !== false,
      });

      setMessengerRun((current) =>
        current
          ? {
            ...current,
            proofs: proofResponse.proofs || [],
          }
          : current
      );
      setProofFiles((current) => ({ ...current, [checkpoint.id]: null }));
      setProofStatus((current) => ({ ...current, [checkpoint.id]: "Proof posted to Wall of Fame." }));
    } catch (error) {
      setProofStatus((current) => ({
        ...current,
        [checkpoint.id]: error instanceof Error ? error.message : "Proof upload failed.",
      }));
    } finally {
      setIsUploadingProof((current) => ({ ...current, [checkpoint.id]: false }));
    }
  };

  const handleGenerateLoop = async () => {
    if (!user?.id) {
      requireLogin("Log in so we can keep the free runs fair.");
      return;
    }
    setIsGeneratingLoop(true);
    setStatusMessage("");
    try {
      const consumed = await postJSON<{
        allowed: boolean;
        donation_credits: number;
        free_used: number;
        credits_remaining: number;
      }>("/api/usage/consume", { device_id: deviceId, user_id: user.id });

      if (!consumed.allowed) {
        setStatusMessage("Free loops are spent. Add credits and keep moving.");
        setIsGeneratingLoop(false);
        return;
      }

      setUsage({
        free_used: consumed.free_used,
        donation_credits: consumed.donation_credits,
        free_remaining: Math.max(0, LOOP_FREE_LIMIT - consumed.free_used),
        credits_remaining: consumed.credits_remaining || 0,
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
        params.set("waypoints", [`${p1[1]},${p1[0]}`, `${p2[1]},${p2[0]}`, `${p3[1]},${p3[0]}`].join("|"));
      } else {
        const fallbackDistanceKm = Math.max(2, distanceKm * 0.4);
        const bearings = [40, 160, 260];
        const waypoints = bearings
          .map((bearing) => computeWaypointFromOrigin(origin, bearing, fallbackDistanceKm))
          .map((point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`);
        if (waypoints.length) params.set("waypoints", waypoints.join("|"));
      }

      const routeUrl = `https://www.google.com/maps/dir/?${params.toString()}`;
      setLastRouteUrl(routeUrl);
      try {
        await postJSON("/api/loop-history", {
          loop_point: loopPoint,
          distance_km: distanceKm,
          unit,
          terrain,
          surface,
          vibe,
          route_url: routeUrl,
        });
        const refreshed = await postJSON<AccountSummary>("/api/account/summary", {});
        setAccountSummary(refreshed);
      } catch {
        // Keep loop generation resilient even if history logging fails.
      }
      setStatusMessage("Loop built. Open it in Maps and ride your return.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Couldn’t build a loop. Try another point.");
    } finally {
      setIsGeneratingLoop(false);
    }
  };

  const handleGenerateMessenger = async () => {
    if (!user?.id) {
      requireLogin("Log in to unlock Alleycat Mode.");
      return;
    }
    if (!messengerLocation.trim()) {
      setMessengerStatus("Drop a start area first so the spread stays tied to your line.");
      return;
    }
    setIsGeneratingMessenger(true);
    setMessengerStatus("");
    try {
      let startPayload: Record<string, unknown> = {};
      if (messengerLocation.trim()) {
        const geocoded = await geocodeStartPoint(`${messengerLocation.trim()}, ${messengerCity.trim()}`);
        startPayload = {
          start_lat: geocoded.lat,
          start_lng: geocoded.lng,
          start_label: geocoded.label,
        };
      }
      const rangeKm = messengerUnit === "km" ? messengerRange : messengerRange * 1.60934;
      const data = await postJSON<{
        manifest_id: string;
        manifest: MessengerManifest;
        credits_remaining: number;
        is_admin?: boolean;
        unlimited_credits?: boolean;
      }>("/api/messenger/generate", {
        city: messengerCity,
        difficulty: messengerDifficulty,
        style: messengerStyle,
        checkpoint_count: messengerCheckpointCount,
        range_km: Number(rangeKm.toFixed(1)),
        ...startPayload,
      });
      setMessengerManifestId(data.manifest_id);
      setMessengerManifest(data.manifest);
      setMessengerRun(null);
      setMessengerStatus("Manifest loaded. Start when you are ready to clear the whole list.");
      setUsage((current) =>
        current
          ? {
            ...current,
            donation_credits: data.credits_remaining,
            credits_remaining: data.credits_remaining,
            is_admin: data.is_admin ?? current.is_admin,
            unlimited_credits: data.unlimited_credits ?? current.unlimited_credits,
          }
          : current
      );
    } catch (error) {
      setMessengerStatus(error instanceof Error ? error.message : "Couldn’t build the manifest.");
    } finally {
      setIsGeneratingMessenger(false);
    }
  };

  const handleStartMessenger = async () => {
    if (!messengerManifestId) return;
    try {
      const data = await postJSON<{ run_id: string; started_at: string; reused?: boolean }>("/api/messenger/start", {
        manifest_id: messengerManifestId,
      });
      setMessengerRun({
        runId: data.run_id,
        startedAt: data.started_at,
        completedIds: [],
        finishSeconds: null,
        finishedAt: null,
        status: data.reused ? "active" : "active",
      });
      setMessengerStatus(data.reused ? "Picked up your active run. Resume where you left it." : "Clock is live. Clear every checkpoint, then close the run.");
    } catch (error) {
      setMessengerStatus(error instanceof Error ? error.message : "Couldn’t start the run.");
    }
  };

  const handleCheckInMessenger = async (checkpointId: string) => {
    if (!messengerRun) return;
    try {
      setMessengerStatus("Checking your location…");
      const position = await getCurrentPosition();
      const data = await postJSON<{ completed_ids: string[]; already_checked_in?: boolean; message?: string; meters_to_move?: number; distance_meters?: number }>("/api/messenger/check-in", {
        run_id: messengerRun.runId,
        checkpoint_id: checkpointId,
        lat: position.lat,
        lng: position.lng,
      });
      setMessengerRun((current) => (current ? { ...current, completedIds: data.completed_ids } : current));
      setMessengerStatus(
        data.already_checked_in
          ? data.message || "Checkpoint already cleared."
          : "Checkpoint clear. Add proof or move to the next stop."
      );
    } catch (error) {
      setMessengerStatus(error instanceof Error ? error.message : "Check-in failed.");
    }
  };

  const handleFinishMessenger = async () => {
    if (!messengerRun) return;
    try {
      const data = await postJSON<{ finished_at: string; finish_seconds: number }>("/api/messenger/finish", {
        run_id: messengerRun.runId,
      });
      setMessengerRun((current) =>
        current
          ? {
            ...current,
            finishSeconds: data.finish_seconds,
            finishedAt: data.finished_at,
            status: "finished",
          }
          : current
      );
      setMessengerStatus("Run closed. Stack your time against the ghost and go again if needed.");
    } catch (error) {
      setMessengerStatus(error instanceof Error ? error.message : "Couldn’t finish the run.");
    }
  };

  const renderHeader = () => (
    <header className="site-header">
      <div className={`nav-container ${menuOpen ? "menu-open" : ""}`}>
        {/* Corner Accents */}
        <div className="nav-viewfinder">
          <div className="corner top-left" />
          <div className="corner top-right" />
          <div className="corner bottom-left" />
          <div className="corner bottom-right" />
        </div>

        <div className="nav-left">
          <div className="brand" onClick={() => handleNavigate('home')}>
            <div className="brand-mark" />
            <div className="brand-text">
              <div className="brand-title">Gimme<br />the<br />Loop</div>
            </div>
          </div>
          <nav className="header-nav">
            <button className={`nav-link ${pageView === 'home' ? 'active' : ''}`} onClick={() => handleNavigate('home')}>Home</button>
            <button className={`nav-link ${pageView === 'loop' ? 'active' : ''}`} onClick={() => handleNavigate('loop')}>Loop</button>
            <button className={`nav-link ${pageView === 'messenger' ? 'active' : ''}`} onClick={() => handleNavigate('messenger')}>Alleycat</button>
            <button className={`nav-link ${pageView === 'cities' ? 'active' : ''}`} onClick={() => handleNavigate('cities')}>Cities</button>
            <button className={`nav-link ${pageView === 'wall' ? 'active' : ''}`} onClick={() => handleNavigate('wall')}>Wall of Fame</button>
            <button className={`nav-link ${pageView === 'leaderboard' ? 'active' : ''}`} onClick={() => handleNavigate('leaderboard')}>Leaderboard</button>
          </nav>
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <button className="nav-link" onClick={() => handleNavigate('account')}>My Account</button>
              <button className="ghost-button small" onClick={handleDonate}>Add Credits</button>
              <button className="primary-button small" onClick={() => handleLogout()}>Sign Out</button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => openAuth("login")}>Log in</button>
              <button className="primary-button small" onClick={() => openAuth("signup")}>Get Started</button>
            </>
          )}
        </div>

        <button className="menu-toggle" type="button" onClick={() => setMenuOpen((prev) => !prev)} aria-expanded={menuOpen}>
          {menuOpen ? "Close" : "Menu"}
        </button>

        <div className={`mobile-nav-sheet ${menuOpen ? "open" : ""}`}>
          <div className="mobile-nav-links">
            <button className={`nav-link ${pageView === 'home' ? 'active' : ''}`} onClick={() => handleNavigate('home')}>Home</button>
            <button className={`nav-link ${pageView === 'loop' ? 'active' : ''}`} onClick={() => handleNavigate('loop')}>Loop</button>
            <button className={`nav-link ${pageView === 'messenger' ? 'active' : ''}`} onClick={() => handleNavigate('messenger')}>Alleycat</button>
            <button className={`nav-link ${pageView === 'cities' ? 'active' : ''}`} onClick={() => handleNavigate('cities')}>Cities</button>
            <button className={`nav-link ${pageView === 'wall' ? 'active' : ''}`} onClick={() => handleNavigate('wall')}>Wall of Fame</button>
            <button className={`nav-link ${pageView === 'leaderboard' ? 'active' : ''}`} onClick={() => handleNavigate('leaderboard')}>Leaderboard</button>
            {user && <button className={`nav-link ${pageView === 'account' ? 'active' : ''}`} onClick={() => handleNavigate('account')}>Account</button>}
          </div>
          <div className="mobile-nav-actions">
            {user ? (
              <>
                <button className="ghost-button small" onClick={handleDonate}>Credits</button>
                <button className="primary-button small" onClick={handleLogout}>Sign out</button>
              </>
            ) : (
              <>
                <button className="ghost-button small" onClick={() => openAuth("login")}>Log in</button>
                <button className="primary-button small" onClick={() => openAuth("signup")}>Get started</button>
              </>
            )}
          </div>
        </div>
      </div>
    </header >
  );

  const renderMobileDock = () => (
    <nav className="mobile-quickbar" aria-label="Quick navigation">
      <button className={`quickbar-link ${pageView === "home" ? "active" : ""}`} type="button" onClick={() => handleNavigate("home")}>
        <span>Home</span>
      </button>
      <button className={`quickbar-link quickbar-primary ${pageView === "messenger" ? "active" : ""}`} type="button" onClick={() => handleNavigate("messenger")}>
        <span>Alleycat</span>
      </button>
      <button className={`quickbar-link ${pageView === "loop" ? "active" : ""}`} type="button" onClick={() => handleNavigate("loop")}>
        <span>Loop</span>
      </button>
      <button className={`quickbar-link ${pageView === "wall" ? "active" : ""}`} type="button" onClick={() => handleNavigate("wall")}>
        <span>Wall</span>
      </button>
      <button
        className={`quickbar-link ${pageView === "account" ? "active" : ""}`}
        type="button"
        onClick={() => (user ? handleNavigate("account") : openAuth("login"))}
      >
        <span>{user ? "Me" : "Log in"}</span>
      </button>
    </nav>
  );

  const renderSectionHeader = (title: string, subtitle: string) => (
    <div className="technical-section-header">
      <div className="section-eyebrow">// {title}</div>
      <h2 className="section-title">{subtitle}</h2>
    </div>
  );

  const renderHome = () => (
    <div className="sequential-layout">
      <Hero
        onOpenAlleycat={() => handleNavigate("messenger")}
        onOpenLoop={() => handleNavigate("loop")}
        onOpenCities={() => handleNavigate("cities")}
      />

      <section className="modular-grid reveals">
        <div className="modular-cell modular-cell-featured">
          <div className="cell-eyebrow">Main move</div>
          <h3 className="cell-title">Alleycat Mode</h3>
          <p className="cell-body">Checkpoint pressure, proof, and your own route call. This is the thing.</p>
          <button className="primary-button small" onClick={() => handleNavigate('messenger')}>Open Alleycat</button>
        </div>
        <div className="modular-cell">
          <div className="cell-eyebrow">Quick way out</div>
          <h3 className="cell-title">Loop</h3>
          <p className="cell-body">Drop a point and get a clean way back fast.</p>
          <button className="ghost-button small" onClick={() => handleNavigate('loop')}>Open Loop</button>
        </div>
        <div className="modular-cell">
          <div className="cell-eyebrow">Proof lane</div>
          <h3 className="cell-title">Wall of Fame</h3>
          <p className="cell-body">See who posted, where they hit, and what bike they did it on.</p>
          <button className="ghost-button small" onClick={() => handleNavigate('wall')}>Open Wall</button>
        </div>
        <div className="modular-cell">
          <div className="cell-eyebrow">See the spread</div>
          <h3 className="cell-title">City Lanes</h3>
          <p className="cell-body">Live cities up now, next asks, and the lanes warming up.</p>
          {cityDemand && (
            <div className="mini-chip-row compact">
              <span className="mini-chip active">{cityDemand.open_requests} open</span>
              <span className="mini-chip">{cityDemand.top_cities[0]?.city || "Demand live"}</span>
            </div>
          )}
          <button className="ghost-button small" onClick={() => handleNavigate('cities')}>Open Cities</button>
        </div>
      </section>


    </div>
  );

  const renderModals = () => (
    <>
      {showLogin && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-title">{authMode === "signup" ? "Create account" : "Sign in"}</div>
            <div className="modal-subtitle">Quick in, quick out. Email and password.</div>
            <div className="auth-mode-switch">
              <button
                className={`pill ${authMode === "login" ? "active" : ""}`}
                type="button"
                onClick={() => setAuthMode("login")}
              >
                Sign in
              </button>
              <button
                className={`pill ${authMode === "signup" ? "active" : ""}`}
                type="button"
                onClick={() => setAuthMode("signup")}
              >
                Create account
              </button>
            </div>
            <form className="modal-form" onSubmit={handleAuthSubmit}>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="you@email.com"
                  autoFocus
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="next"
                />
              </label>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  enterKeyHint="go"
                />
              </label>
              {authMessage && <div className="status-message compact-status">{authMessage}</div>}
              <div className="modal-actions">
                <button className="ghost-button" type="button" onClick={() => setShowLogin(false)}>
                  Cancel
                </button>
                {authMode === "login" && (
                  <button className="ghost-button" type="button" onClick={handlePasswordReset} disabled={isSendingReset}>
                    {isSendingReset ? "Sending..." : "Reset password"}
                  </button>
                )}
                <button className="primary-button" type="submit" disabled={authLoading}>
                  {authLoading ? "Working..." : authMode === "signup" ? "Create account" : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCityRequest && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-title">Request your city</div>
            <div className="modal-subtitle">City first. Area if it matters. We’ll line it up for review.</div>
            {cityDemand && (
              <div className="mini-chip-row compact">
                <span className="mini-chip active">{cityDemand.open_requests} open</span>
                <span className="mini-chip">{cityDemand.queued_requests} queued</span>
                {cityDemand.top_cities.slice(0, 2).map((entry) => (
                  <button
                    key={entry.city}
                    className="mini-chip chip-button"
                    type="button"
                    onClick={() => setCityRequestName(entry.city)}
                  >
                    {entry.city}
                  </button>
                ))}
              </div>
            )}
            <label className="field">
              <span>City</span>
              <input value={cityRequestName} onChange={(event) => setCityRequestName(event.target.value)} placeholder="Berlin, Bogotá, NYC..." autoFocus enterKeyHint="next" />
            </label>
            <details className="field-disclosure">
              <summary>More detail if it helps</summary>
              <div className="field-disclosure-body">
                <div className="field-row">
                  <label className="field">
                    <span>Area <small className="field-hint">optional</small></span>
                    <input value={cityRequestLocation} onChange={(event) => setCityRequestLocation(event.target.value)} placeholder="Kreuzberg, Bushwick, Roma Norte..." enterKeyHint="next" />
                  </label>
                </div>
                <label className="field">
                  <span>Why here? <small className="field-hint">optional</small></span>
                  <textarea
                    value={cityRequestNote}
                    onChange={(event) => setCityRequestNote(event.target.value)}
                    placeholder="Quick note on the scene, blocks, or why it deserves a pack."
                    rows={3}
                  />
                </label>
              </div>
            </details>
            {cityRequestStatus && <div className="status-message compact-status">{cityRequestStatus}</div>}
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setShowCityRequest(false)}>
                Close
              </button>
              <button className="primary-button" type="button" onClick={handleSubmitCityRequest} disabled={isSendingCityRequest}>
                {isSendingCityRequest ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareJoinModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-title">Have a code?</div>
            <div className="modal-subtitle">Drop the code, pull the same list, and pay your own credits to join.</div>
            <label className="field">
              <span>Share code</span>
              <input
                type="text"
                value={shareInput}
                onChange={(event) => setShareInput(event.target.value.toUpperCase())}
                placeholder="Enter code"
              />
            </label>
            {shareStatus && <div className="status-message">{shareStatus}</div>}
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={() => setShowShareJoinModal(false)}>
                Close
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={handleLoadShareCode}
                disabled={isLoadingSharedManifest || !shareInput.trim()}
              >
                {isLoadingSharedManifest ? "Loading..." : "Load manifest"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCredits && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-title">Add credits</div>
            <div className="modal-subtitle">
              Top up and keep it moving.
            </div>
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
              <button className="ghost-button" type="button" onClick={() => setShowCredits(false)}>
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
    </>
  );

  const renderAccount = () => (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">Account</h1>
        <p className="sub-page-description">{user ? `${accountGreeting} Credits, bike setup, and your ride recap.` : "Your login, credits, and ride recap."}</p>
      </section>

      {!user && (
        <div className="builder-grid single">
          <div className="glass-card form-card account-guest-card">
            <div className="form-title">Sign in to open your dashboard</div>
            <div className="form-subtitle">One rider, one account, all your runs.</div>
            {authMessage && <div className="status-message compact-status">{authMessage}</div>}
            <div className="form-actions centered-actions">
              <button className="primary-button" type="button" onClick={() => openAuth("login")}>
                Sign in
              </button>
              <button className="ghost-button" type="button" onClick={() => openAuth("signup")}>
                Create account
              </button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="builder-grid account-grid">
          <div className="glass-card form-card account-summary-card">
            <div className="form-title">Profile & Security</div>
            <div className="form-subtitle">Set your rider tag and bike details once.</div>
            {authMessage && <div className="status-message compact-status">{authMessage}</div>}
            {accountStatus && <div className="status-message compact-status">{accountStatus}</div>}
            <div className="user-row">
              <div className="user-label">Email</div>
              <div className="user-value">{user.email || "No email"}</div>
            </div>

            <div className="profile-grid">
              <label className="field">
                <span>Rider name</span>
                <input
                  type="text"
                  value={accountRiderName}
                  onChange={(event) => setAccountRiderName(event.target.value)}
                  placeholder="Your name on the wall"
                  autoComplete="nickname"
                  enterKeyHint="next"
                />
              </label>
              <label className="field">
                <span>Home location</span>
                <input
                  type="text"
                  value={accountHomeLocation}
                  onChange={(event) => setAccountHomeLocation(event.target.value)}
                  placeholder="Berlin, Kreuzberg"
                  autoComplete="address-level2"
                  enterKeyHint="next"
                />
              </label>
              <label className="field">
                <span>Bike name</span>
                <input
                  type="text"
                  value={accountBikeName}
                  onChange={(event) => setAccountBikeName(event.target.value)}
                  placeholder="Black track build"
                  enterKeyHint="next"
                />
              </label>
              <label className="field">
                <span>Bike ratio</span>
                <input
                  type="text"
                  value={accountBikeRatio}
                  onChange={(event) => setAccountBikeRatio(event.target.value)}
                  placeholder="49x17"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="button" onClick={handleProfileSave} disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>

            <label className="field">
              <span>Change password</span>
              <input
                type="password"
                value={accountPassword}
                onChange={(event) => setAccountPassword(event.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                enterKeyHint="done"
              />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="button" onClick={handlePasswordUpdate} disabled={isUpdatingPassword}>
                {isUpdatingPassword ? "Saving..." : "Update password"}
              </button>
              <button className="ghost-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>

          <div className="glass-card form-card account-credits-card">
            <div className="form-title">Credits</div>
            <div className="form-subtitle">See what is left and load more.</div>

            <div className="result-grid result-grid-two account-credit-grid">
              <div>
                <span>Total credits</span>
                <strong>{hasUnlimitedCredits ? "Unlimited" : totalCredits}</strong>
              </div>
              <div>
                <span>Manifest cost</span>
                <strong>{hasUnlimitedCredits ? "Free" : `${MESSENGER_CREDIT_COST} each`}</strong>
              </div>
              <div>
                <span>Free loops left</span>
                <strong>{hasUnlimitedCredits ? "Unlimited" : usage?.free_remaining || 0}</strong>
              </div>
              <div>
                <span>Paid credits live</span>
                <strong>{hasUnlimitedCredits ? "Unlimited" : messengerCreditsOnly}</strong>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '16px' }}>
              <button className="primary-button" type="button" onClick={handleDonate}>
                Add credits
              </button>
            </div>
          </div>

          <div className="glass-card form-card account-stats-card">
            <div className="form-title">V1 activity</div>
            <div className="form-subtitle">Your numbers. Clean and simple.</div>
            <div className="result-grid result-grid-two">
              <div>
                <span>Manifests</span>
                <strong>{accountSummary?.alleycat?.manifests || 0}</strong>
              </div>
              <div>
                <span>Runs</span>
                <strong>{accountSummary?.alleycat?.runs || 0}</strong>
              </div>
              <div>
                <span>Finished</span>
                <strong>{accountSummary?.alleycat?.finished_runs || 0}</strong>
              </div>
              <div>
                <span>Challenges</span>
                <strong>{accountSummary?.alleycat?.challenges || 0}</strong>
              </div>
              <div>
                <span>Proofs</span>
                <strong>{accountSummary?.alleycat?.proofs || 0}</strong>
              </div>
              <div>
                <span>Public proofs</span>
                <strong>{accountSummary?.alleycat?.public_proofs || 0}</strong>
              </div>
            </div>
            <div className="account-note">
              {hasUnlimitedCredits
                ? "Admin account stays unlocked for testing."
                : `Alleycat costs ${MESSENGER_CREDIT_COST} credits a run. Loop still rides the normal meter.`}
            </div>
          </div>

          <div className="glass-card form-card account-quarter-card">
            <div className="form-title">Quarter board</div>
            <div className="form-subtitle">{accountSummary?.quarter?.label || "Current quarter"} scores proof first, finishes second.</div>
            <div className="result-grid result-grid-three">
              <div>
                <span>Rank</span>
                <strong>
                  {accountSummary?.quarter?.rank ? `#${accountSummary.quarter.rank}` : "--"}
                </strong>
              </div>
              <div>
                <span>Public proofs</span>
                <strong>{accountSummary?.quarter?.public_proofs || 0}</strong>
              </div>
              <div>
                <span>Quarter finishes</span>
                <strong>{accountSummary?.quarter?.finished_runs || 0}</strong>
              </div>
            </div>
            <div className="account-note">
              {accountSummary?.quarter?.total_ranked_riders
                ? `${accountSummary.quarter.total_ranked_riders} riders are on the board right now.`
                : "No ranked riders yet this quarter."}
            </div>
            {accountSummary?.badges?.length ? (
              <div className="badge-list">
                {accountSummary.badges.map((badge) => (
                  <div key={badge.id} className="badge-chip">
                    <strong>{badge.label}</strong>
                    <span>{badge.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-body">Post proof and close runs to unlock badges.</div>
              </div>
            )}
            {accountSummary?.quarter?.leaders?.length ? (
              <div className="leaderboard-list">
                {accountSummary.quarter.leaders.map((entry) => (
                  <div key={entry.user_id} className="leaderboard-row">
                    <div className="leaderboard-rank">#{entry.rank}</div>
                    <div className="leaderboard-main">
                      <strong>{entry.user_id === user?.id ? "You" : entry.rider_name}</strong>
                      <span>
                        {entry.public_proofs} proofs · {entry.finished_runs} finishes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="glass-card form-card account-purchases-card">
            <div className="form-title">Recent purchases</div>
            <div className="form-subtitle">Money in, credits up.</div>
            {!accountSummary?.purchases?.length && (
              <div className="empty-state">
                <div className="empty-state-body">No credit purchases yet.</div>
              </div>
            )}
            {accountSummary?.purchases?.length ? (
              <div className="purchase-list">
                {accountSummary.purchases.map((purchase) => (
                  <div key={purchase.session_id} className="purchase-row">
                    <div>
                      <strong>${(purchase.amount_cents / 100).toFixed(2)}</strong>
                      <span>{new Date(purchase.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <strong>{purchase.credits_to_grant} credits</strong>
                      <span>{purchase.status.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-title">Loop history</div>
            <div className="form-subtitle">Your last routes, one tap away.</div>
            {!accountSummary?.loop_history?.length ? (
              <div className="empty-state">
                <div className="empty-state-body">No loop history yet. Build one from the home page and it lands here.</div>
              </div>
            ) : (
              <div className="history-list">
                {accountSummary.loop_history.map((loop) => (
                  <div key={loop.id} className="history-row">
                    <div>
                      <strong>{loop.loop_point}</strong>
                      <span>
                        {Number(loop.distance_km).toFixed(1)} km · {loop.terrain} · {loop.surface} · {loop.vibe}
                      </span>
                    </div>
                    <div className="history-actions">
                      <span>{new Date(loop.created_at).toLocaleDateString()}</span>
                      <a className="ghost-button small" href={loop.route_url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-title">Alleycat runs</div>
            <div className="form-subtitle">Your Alleycat runs, times, and proof count.</div>
            {!accountSummary?.alleycat_history?.length ? (
              <div className="empty-state">
                <div className="empty-state-body">No Alleycat history yet.</div>
              </div>
            ) : (
              <div className="history-list">
                {accountSummary.alleycat_history.map((item) => (
                  <div key={item.id} className="history-row">
                    <div>
                      <strong>{item.city_name || "City"} · {item.manifest_title}</strong>
                      <span>
                        {item.difficulty} · {item.style} · {item.proof_count} proofs · {item.source_challenge_id ? "Shared" : "Solo"}
                      </span>
                    </div>
                    <div className="history-actions">
                      <span>
                        {item.best_seconds
                          ? `${formatDuration(item.best_seconds)}${item.ghost_delta !== null ? ` · ${item.ghost_delta <= 0 ? "-" : "+"}${formatDuration(Math.abs(item.ghost_delta))}` : ""}`
                          : item.status}
                      </span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-title">Challenge log</div>
            <div className="form-subtitle">Shared codes, race state, and who pulled up.</div>
            {!accountSummary?.challenge_history?.length ? (
              <div className="empty-state">
                <div className="empty-state-body">No shared challenge history yet.</div>
              </div>
            ) : (
              <div className="history-list">
                {accountSummary.challenge_history.map((item) => (
                  <div key={item.challenge_id} className="history-row">
                    <div>
                      <strong>Code {item.code}</strong>
                      <span>
                        {item.city_name || "City"} · {item.manifest_title || "Manifest"} · {item.rival_count} rivals
                      </span>
                    </div>
                    <div className="history-actions">
                      <span>{item.best_seconds ? formatDuration(item.best_seconds) : item.status}</span>
                      <span>{new Date(item.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card form-card account-history-card">
            <div className="form-title">Riders you raced with</div>
            <div className="form-subtitle">Only riders you have actually raced with.</div>
            {!accountSummary?.shared_riders?.length ? (
              <div className="empty-state">
                <div className="empty-state-body">No shared rider links yet.</div>
              </div>
            ) : (
              <div className="history-list">
                {accountSummary.shared_riders.map((rider) => (
                  <div key={rider.user_id} className="history-row">
                    <div>
                      <strong>{rider.rider_name}</strong>
                      <span>
                        {rider.shared_challenges} shared challenges · {rider.cities.join(", ") || "No city tags yet"}
                      </span>
                    </div>
                    <div className="history-actions">
                      <span>Last seen</span>
                      <span>{new Date(rider.last_joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderLoop = () => (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header loop-page-header">
        <h1 className="sub-page-title">Loop Builder</h1>
        <p className="sub-page-description">Set the point, shape the ride, dip out fast.</p>
        <div className="sub-page-image-shell loop-image-shell">
          <img src={heroImage} alt="Cyclist moving through a city loop" />
        </div>
      </section>

      <section className="modular-grid reveals">
        {loopSteps.map((step, index) => (
          <div key={step.number} className="module-card">
            <div className="module-header">
              <span className="module-index">0{step.number}</span>
              <h3 className="module-title">{step.title}</h3>
            </div>
            <p className="module-body">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="split-module reveals" id="loop-builder">
        <div className="module-content">
          <div className="glass-card form-card">
            <div className="form-header">
              <div>
                <h2 className="form-title">Dial The Loop</h2>
                <p className="form-subtitle">Set the point, tune the feel, send the line.</p>
              </div>
              {usage && (
                <div className="loops-left">
                  <span className="loops-left-line">{hasUnlimitedCredits ? "Unlimited" : `${totalCredits} credits`}</span>
                  <span className="loops-left-line">{hasUnlimitedCredits ? "Admin" : `${usage.free_remaining} free left`}</span>
                </div>
              )}
            </div>

              <div className="form-section section-block">
                <div className="section-block-head">
                <div className="section-block-title">Anchor</div>
                <div className="section-block-copy">The point you leave from and roll back into.</div>
              </div>
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
                  placeholder="Search neighborhood, station, or full address"
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
                <span className="field-hint">Choose where the ride should start and finish.</span>
              </label>
            </div>

            <div className="form-section section-block">
              <div className="section-block-head">
                <div className="section-block-title">Ride Dial</div>
                <div className="section-block-copy">Distance, surface, terrain, and the way it should hit.</div>
              </div>
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
                  style={{ ["--range-progress" as string]: `${rangePercent}%` }}
                />
                <div className="range-labels">
                  <span>
                    {minDistance} {unit}
                  </span>
                  <span>
                    {distanceLabel} {unit}
                  </span>
                </div>
              </label>

              <div className="field-row">
                <label className="field">
                  <span>Terrain</span>
                  <select
                    value={terrain}
                    onChange={(event) => {
                      setTerrain(event.target.value);
                      setStep3Touched(true);
                    }}
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
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="form-section section-block">
              <div className="section-block-head">
                <div className="section-block-title">Send It</div>
                <div className="section-block-copy">Build the route, then crack it open in Maps.</div>
              </div>
              <div className="form-actions">
                <button
                  className={`primary-button ${allLoopDone ? "ready" : ""}`}
                  onClick={handleGenerateLoop}
                  disabled={isGeneratingLoop || !allLoopDone}
                >
                  {isGeneratingLoop ? "Building..." : "Build loop"}
                </button>
              </div>
              {statusMessage && <div className="status-message">{statusMessage}</div>}
              {lastRouteUrl && (
                <div className="route-output">
                  <div className="route-actions">
                    <button className="ghost-button small" type="button" onClick={handleCopy}>
                      Copy link
                    </button>
                    <a className="primary-button small" href={lastRouteUrl} target="_blank" rel="noreferrer">
                      Open in Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderMessenger = () => (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header alleycat-page-header">
        <h1 className="sub-page-title">Alleycat</h1>
        <p className="sub-page-description">Pick the city. Read the list. Run your own line.</p>
        <div className="sub-page-image-shell alleycat-image-shell">
          <img src={alleycatImage} alt="Rider moving through an alleycat checkpoint run" />
        </div>
      </section>

      <section className="modular-grid reveals">
        {messengerFlow.map((step, index) => (
          <div key={step.number} className="module-card">
            <div className="module-header">
              <span className="module-index">0{step.number}</span>
              <h3 className="module-title">{step.title}</h3>
            </div>
            <p className="module-body">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="split-module reveals" id="messenger-builder">
        <div className="module-content">
          <div className={`builder-grid messenger-page-grid ${!messengerManifest ? "single-card-layout" : ""}`}>
            <div className="glass-card form-card premium-card active-premium">
              <div className="form-header">
                <div>
                  <div className="form-title premium-title">
                    Alleycat builder
                  </div>
                  <div className="form-subtitle">
                    Pull the list, set the heat, run your own line.
                  </div>
                  {cityDemand && (
                    <div className="mini-chip-row">
                      <span className="mini-chip active">{cityDemand.open_requests} city asks live</span>
                      <span className="mini-chip">{cityDemand.queued_requests} queued</span>
                      {cityDemand.top_cities[0] && (
                        <span className="mini-chip">Top ask: {cityDemand.top_cities[0].city}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="loops-left">
                  <span className="loops-left-line">{hasUnlimitedCredits ? "Credits Unlimited" : `Credits ${messengerCreditsOnly}`}</span>
                  <span className="loops-left-line">{MESSENGER_CREDIT_COST} per manifest</span>
                </div>
              </div>

              <div className="form-section section-block">
                <div className="section-block-head">
                  <div className="section-block-title">City Pull</div>
                  <div className="section-block-copy">Choose the pack and lock the area you want to hit.</div>
                </div>
                <label className="field">
                  <span>City or start area</span>
                  <input
                    type="text"
                    value={messengerCity}
                    onChange={(event) => setMessengerCity(event.target.value)}
                    placeholder="Berlin, London, or Tokyo"
                    autoComplete="address-level2"
                    enterKeyHint="next"
                  />
                  <div className="field-inline-actions">
                    <span className="field-hint">Start local and keep the spread tight.</span>
                    <button className="ghost-button small" type="button" onClick={() => setShowCityRequest(true)}>
                      {isLoadingCityDemand ? "Checking city queue..." : "Don’t see your city?"}
                    </button>
                  </div>
                </label>
                <div className="pill-group city-preset-group">
                  {ALLEYCAT_CITY_PRESETS.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className={`pill ${toCitySlug(messengerCity) === toCitySlug(city) ? "active" : ""}`}
                      onClick={() => setMessengerCity(city)}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                <label className="field">
                  <span>Start area</span>
                  <input
                    type="text"
                    value={messengerLocation}
                    onChange={(event) => setMessengerLocation(event.target.value)}
                    placeholder="Kreuzberg, Soho, Shibuya..."
                    autoComplete="street-address"
                    enterKeyHint="next"
                  />
                  <span className="field-hint">Required. This is the center point for your task spread.</span>
                </label>
              </div>

              <div className="form-section section-block">
                <div className="section-block-head">
                  <div className="section-block-title">Set The Heat</div>
                  <div className="section-block-copy">Choose the spread, stop count, and how rough you want it.</div>
                </div>
                <label className="field">
                  <span>Spread</span>
                  <div className="pill-group">
                    <button
                      type="button"
                      className={`pill ${messengerUnit === "km" ? "active" : ""}`}
                      onClick={() => {
                        if (messengerUnit === "km") return;
                        setMessengerUnit("km");
                        setMessengerRange((current) => Number((current * 1.60934).toFixed(1)));
                      }}
                    >
                      KM
                    </button>
                    <button
                      type="button"
                      className={`pill ${messengerUnit === "mi" ? "active" : ""}`}
                      onClick={() => {
                        if (messengerUnit === "mi") return;
                        setMessengerUnit("mi");
                        setMessengerRange((current) => Number((current / 1.60934).toFixed(1)));
                      }}
                    >
                      MI
                    </button>
                  </div>
                  <input
                    type="range"
                    min={messengerMinRange}
                    max={messengerMaxRange}
                    step="1"
                    value={messengerRange}
                    onChange={(event) => setMessengerRange(Number(event.target.value))}
                    style={{ ["--range-progress" as string]: `${messengerRangePercent}%` }}
                  />
                  <div className="range-labels">
                    <span>
                      {messengerMinRange} {messengerUnit}
                    </span>
                    <strong>
                      {messengerRangeLabel} {messengerUnit}
                    </strong>
                    <span>
                      {messengerMaxRange} {messengerUnit}
                    </span>
                  </div>
                </label>

                <label className="field">
                  <span>Difficulty</span>
                  <div className="pill-group">
                    {[
                      ["easy", "Easy"],
                      ["medium", "Medium"],
                      ["hard", "Hard"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`pill ${messengerDifficulty === value ? "active" : ""}`}
                        onClick={() => setMessengerDifficulty(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="field">
                  <span>Checkpoint count</span>
                  <div className="pill-group">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={`pill ${messengerCheckpointCount === count ? "active" : ""}`}
                        onClick={() => setMessengerCheckpointCount(count)}
                      >
                        {count} stops
                      </button>
                    ))}
                  </div>
                  <span className="field-hint">
                    Test mode is open right now. At 1 km spread, the list caps at 2 checkpoints.
                  </span>
                </label>

                <label className="field">
                  <span>Street tone</span>
                  <div className="pill-group">
                    {[
                      ["local", "Local"],
                      ["fast", "Fast"],
                      ["chaotic", "Chaotic"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={`pill ${messengerStyle === value ? "active" : ""}`}
                        onClick={() => setMessengerStyle(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="form-section section-block">
                <div className="section-block-head">
                  <div className="section-block-title">Run It</div>
                  <div className="section-block-copy">Build the list, reset the run, or pass the code.</div>
                </div>
                <div className="form-actions">
                  <button className="ghost-button" type="button" onClick={() => setShowShareJoinModal(true)}>
                    Have a code ?
                  </button>
                  <button
                    className="primary-button premium-button"
                    type="button"
                    onClick={handleGenerateMessenger}
                    disabled={isGeneratingMessenger || !messengerCity.trim() || !messengerLocation.trim()}
                  >
                    {isGeneratingMessenger ? "Building..." : "Build manifest"}
                  </button>
                  {(messengerManifest || messengerRun) && (
                    <button className="ghost-button" type="button" onClick={handleResetAlleycat}>
                      Reset alleycat
                    </button>
                  )}
                  {messengerManifestId && (
                    <button
                      className="share-manifest-button"
                      type="button"
                      onClick={handleCreateShareCode}
                      disabled={isSharingManifest}
                    >
                      {isSharingManifest ? "Making code..." : "Make share code"}
                    </button>
                  )}
                </div>
                {messengerStatus && <div className="status-message">{messengerStatus}</div>}
              </div>
            </div>

            {messengerManifest && (
              <div className="glass-card form-card sequential-card">
                <div className="form-title">Run panel</div>
                {isHydratingRun && <div className="status-message">Reloading your live run…</div>}
                <div className="messenger-output">
                  <div className="manifest-brief">
                    <div>
                      <div className="manifest-title">{messengerManifest.manifest_title}</div>
                      <div className="manifest-subtitle">
                        {messengerManifest.city} · {messengerManifest.checkpoint_count} stops ·{" "}
                        {messengerManifest.estimated_minutes} min est.
                        {messengerManifest.start_label ? ` · near ${messengerManifest.start_label}` : ""}
                      </div>
                    </div>
                    <div className="manifest-metrics">
                      <div>
                        <span>{messengerManifest.ghost_label || "Ghost"}</span>
                        <strong>{formatDuration(messengerManifest.ghost_seconds)}</strong>
                      </div>
                      <div>
                        <span>Format</span>
                        <strong>Any order</strong>
                      </div>
                    </div>
                  </div>

                  <div className="manifest-notes">
                    <div className="manifest-note-card">
                      <span>Route line</span>
                      <strong>{messengerManifest.route_note}</strong>
                    </div>
                    {messengerManifest.task_mix ? (
                      <div className="manifest-note-card">
                        <span>Task mix</span>
                        <strong>{messengerManifest.task_mix}</strong>
                      </div>
                    ) : null}
                    {messengerManifest.range_km ? (
                      <div className="manifest-note-card">
                        <span>Spread lock</span>
                        <strong>
                          Locked to {messengerManifest.range_km} km from your start area
                          {messengerManifest.effective_range_km
                            ? ` · tighter street-fit ${messengerManifest.effective_range_km} km`
                            : ""}
                          {messengerManifest.max_distance_km
                            ? ` · farthest stop ${messengerManifest.max_distance_km} km`
                            : ""}
                          .
                        </strong>
                      </div>
                    ) : null}
                    <div className="manifest-note-card">
                      <span>Finish call</span>
                      <strong>{messengerManifest.finish_label}</strong>
                    </div>
                    {messengerManifest.replay_hook ? (
                      <div className="manifest-note-card">
                        <span>Replay hook</span>
                        <strong>{messengerManifest.replay_hook}</strong>
                      </div>
                    ) : null}
                  </div>

                  <div className="manifest-actions">
                    <div className="run-progress">
                      <span>Progress</span>
                      <strong>
                        {completedCount}/{totalCheckpoints} cleared
                      </strong>
                      <em>{remainingCount} left</em>
                    </div>
                    {shareCode && (
                      <div className="run-progress share-code-box">
                        <span>Share code</span>
                        <strong>{shareCode}</strong>
                        <em>Same list. Head to head.</em>
                      </div>
                    )}
                    <div className="run-progress">
                      <span>Score line</span>
                      <strong>{messengerManifest.total_score || 0} pts max</strong>
                      <em>{districtCoverage || messengerManifest.district_count || 0} districts in play</em>
                    </div>
                    {!messengerRun ? (
                      <div className="manifest-action-buttons">
                        <button className="primary-button" type="button" onClick={handleStartMessenger}>
                          Start run
                        </button>
                        <button className="ghost-button" type="button" onClick={handleStartMessenger}>
                          Resume run
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="run-clock">
                          <span>Elapsed</span>
                          <strong>{formatDuration(currentElapsed)}</strong>
                        </div>
                        <div className="manifest-action-buttons">
                          <button
                            className="ghost-button"
                            type="button"
                            onClick={handleFinishMessenger}
                            disabled={
                              messengerRun.completedIds.length !== messengerManifest.checkpoints.length ||
                              Boolean(messengerRun.finishedAt) ||
                              messengerRun.status === "abandoned"
                            }
                          >
                            {messengerRun.finishedAt ? "Run finished" : "Finish run"}
                          </button>
                          {!messengerRun.finishedAt && messengerRun.status === "active" && (
                            <button className="ghost-button" type="button" onClick={handleAbandonMessenger}>
                              Bail run
                            </button>
                          )}
                          <button className="ghost-button" type="button" onClick={handleRestartMessenger}>
                            Restart
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="checkpoint-list">
                    {messengerManifest.checkpoints.map((checkpoint) => {
                      const done = messengerRun?.completedIds.includes(checkpoint.id) || false;
                      const proof = messengerRun?.proofs?.find((item) => item.checkpoint_id === checkpoint.id) || null;
                      return (
                        <div key={checkpoint.id} className={`checkpoint-card ${done ? "done" : ""}`}>
                          <div className="checkpoint-meta">
                            <span>CP {checkpoint.order}</span>
                            {done && <span className="checkpoint-done">✓ Clear</span>}
                          </div>
                          <div className="checkpoint-name">{checkpoint.name}</div>
                          <div className="mini-chip-row compact checkpoint-chip-row">
                            {checkpoint.task_type ? <div className="mini-chip">{checkpoint.task_type}</div> : null}
                            {checkpoint.task_pressure ? <div className="mini-chip">{checkpoint.task_pressure} pressure</div> : null}
                            {checkpoint.score_points ? <div className="mini-chip">{checkpoint.score_points} pts</div> : null}
                            {checkpoint.district ? <div className="mini-chip">{checkpoint.district}</div> : null}
                          </div>
                          <div className="checkpoint-task">{checkpoint.task}</div>
                          <div className="checkpoint-hint">{checkpoint.hint}</div>
                          <div className="checkpoint-actions">
                            <a
                              className="ghost-button small"
                              href={buildCheckpointMapsUrl(checkpoint)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open in Maps
                            </a>
                            {messengerRun && !messengerRun.finishedAt && (
                              <button
                                className={`ghost-button small ${done ? "is-complete" : ""}`}
                                type="button"
                                onClick={() => handleCheckInMessenger(checkpoint.id)}
                              >
                                {done ? "Checked in" : "Check in"}
                              </button>
                            )}
                          </div>
                          {done && (
                            <div className="proof-panel">
                              {!proof && (
                                <div className="proof-callout">
                                  <strong>Checkpoint cleared.</strong>
                                  <span>Add one photo if you want this stop on Wall of Fame.</span>
                                </div>
                              )}
                              {proof ? (
                                <div className="proof-preview">
                                  <img src={proof.public_url} alt={`${checkpoint.name} proof`} loading="lazy" decoding="async" />
                                  <div className="proof-meta">
                                    <span>Posted</span>
                                    <strong>{proof.location_label}</strong>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <label className="field compact-field">
                                    <span>Add photo proof</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp"
                                      onChange={(event) =>
                                        setProofFiles((current) => ({
                                          ...current,
                                          [checkpoint.id]: event.target.files?.[0] || null,
                                        }))
                                      }
                                    />
                                  </label>
                                  <label className="proof-toggle">
                                    <input
                                      type="checkbox"
                                      checked={proofVisibility[checkpoint.id] !== false}
                                      onChange={(event) =>
                                        setProofVisibility((current) => ({
                                          ...current,
                                          [checkpoint.id]: event.target.checked,
                                        }))
                                      }
                                    />
                                    <span>Post to Wall of Fame</span>
                                  </label>
                                  <div className="checkpoint-actions">
                                    <button
                                      className="primary-button small"
                                      type="button"
                                      disabled={Boolean(isUploadingProof[checkpoint.id])}
                                      onClick={() => handleProofUpload(checkpoint)}
                                    >
                                      {isUploadingProof[checkpoint.id] ? "Posting..." : "Post proof"}
                                    </button>
                                  </div>
                                  {proofStatus[checkpoint.id] && <div className="status-message compact-status">{proofStatus[checkpoint.id]}</div>}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {messengerRun?.finishedAt && (
                    <div className="result-card">
                      <div className="result-title">Run closed</div>
                      <div className="result-card-copy">{finishStory}</div>
                      <div className="result-grid result-grid-three">
                        <div>
                          <span>Your time</span>
                          <strong>{formatDuration(messengerRun.finishSeconds || 0)}</strong>
                        </div>
                        <div>
                          <span>Ghost</span>
                          <strong>{formatDuration(messengerManifest.ghost_seconds)}</strong>
                        </div>
                        <div>
                          <span>Difference</span>
                          <strong className={ghostDelta !== null && ghostDelta <= 0 ? "good-time" : "slow-time"}>
                            {ghostDelta !== null
                              ? `${ghostDelta <= 0 ? "-" : "+"}${formatDuration(Math.abs(ghostDelta))}`
                              : "--:--"}
                          </strong>
                        </div>
                      </div>
                      <div className="result-grid result-grid-three">
                        <div>
                          <span>Run grade</span>
                          <strong>{runGrade}</strong>
                        </div>
                        <div>
                          <span>Proofs</span>
                          <strong>
                            {proofCount}/{messengerManifest.checkpoints.length}
                          </strong>
                        </div>
                        <div>
                          <span>Score</span>
                          <strong>{runScore}</strong>
                        </div>
                      </div>
                      {messengerRun.proofs && messengerRun.proofs.length > 0 && (
                        <div className="manifest-note-card">
                          <span>Proof summary</span>
                          <strong>
                            {messengerRun.proofs
                              .map((proof) => proof.checkpoint_name)
                              .slice(0, 4)
                              .join(" · ")}
                            {messengerRun.proofs.length > 4 ? ` · +${messengerRun.proofs.length - 4} more` : ""}
                          </strong>
                        </div>
                      )}
                      <div className="challenge-rivalry-card result-bridge-card">
                        <span>Run recap</span>
                        <strong>{finishBridgeLabel}</strong>
                        <em>{messengerManifest.replay_hook || "Run it back or push the cleanest proof to the wall."}</em>
                        <div className="challenge-rivalry-actions">
                          <button className="ghost-button small" type="button" onClick={() => handleOpenWallCity(messengerManifest.city)}>
                            {messengerManifest.city} wall
                          </button>
                          <button className="ghost-button small" type="button" onClick={() => handleOpenLeaderboardCity(messengerManifest.city)}>
                            {messengerManifest.city} board
                          </button>
                          {user?.id && (
                            <button className="ghost-button small" type="button" onClick={() => handleOpenRiderProfile(user.id)}>
                              Your rider page
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {(challenge || leaderboard.length > 0 || isLoadingLeaderboard) && (
                    <section className="challenge-board-shell" id="challenge-board">
                      <div className="challenge-board-header">
                        <div>
                          <div className="section-label">Challenge board</div>
                          <div className="result-title">Shared standings</div>
                        </div>
                        {challenge && (
                          <div className="challenge-board-code">
                            <span>Code {challenge.code}</span>
                            <span className={`status-chip ${challengeSummary?.status || "open"}`}>{challengeStatusLabel}</span>
                          </div>
                        )}
                      </div>

                      <div className="challenge-board-grid">
                        <div className="challenge-overview-card">
                          <div className="challenge-summary-copy">
                            <strong>
                              {challengeSummary?.winner_name
                                ? `${challengeSummary.winner_name} is up right now.`
                                : "No winner yet."}
                            </strong>
                            <span>{challengeSummary?.rivalry || "Share the code and let a few riders throw down."}</span>
                            {challengeSummary?.expires_at && challengeSummary.status === "open" && (
                              <span>Code stays live until {new Date(challengeSummary.expires_at).toLocaleDateString()}.</span>
                            )}
                          </div>

                          <div className="challenge-stats-grid">
                            <div className="challenge-stat">
                              <span>Status</span>
                              <strong>{challengeStatusLabel}</strong>
                            </div>
                            <div className="challenge-stat">
                              <span>Riders</span>
                              <strong>{leaderboard.length || 0}</strong>
                            </div>
                            <div className="challenge-stat">
                              <span>Finished</span>
                              <strong>{finishedRiders}</strong>
                            </div>
                            <div className="challenge-stat">
                              <span>Best time</span>
                              <strong>{boardLeader?.best_seconds !== null && boardLeader?.best_seconds !== undefined ? formatDuration(boardLeader.best_seconds) : "--:--"}</strong>
                            </div>
                          </div>

                          <div className="challenge-rivalry-card">
                            <span>Head to head</span>
                            <em>{challengeSummary?.result_label || "Open board"}</em>
                            <strong>{rivalrySummary}</strong>
                            {ownBoardEntry?.best_seconds !== null && ownBoardEntry?.best_seconds !== undefined && (
                              <em>Your best: {formatDuration(ownBoardEntry.best_seconds)}</em>
                            )}
                            <div className="challenge-rivalry-actions">
                              <button className="ghost-button small" type="button" onClick={handleRematchChallenge}>
                                {challengeSummary?.rematch_label || "Run it back"}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="challenge-leaderboard-card">
                          <div className="challenge-card-head">
                            <div>
                              <div className="manifest-subtitle">Leaderboard</div>
                              <div className="challenge-card-copy">Fastest clean finish sits on top.</div>
                            </div>
                          </div>
                          {isLoadingLeaderboard && <div className="status-message compact-status">Refreshing leaderboard…</div>}
                          {!isLoadingLeaderboard && leaderboard.length === 0 && (
                            <div className="empty-state">
                              <div className="empty-state-body">
                                {challengeSummary?.status === "expired"
                                  ? "Code expired before anyone closed it."
                                  : "No times yet. Share the code and get it moving."}
                              </div>
                            </div>
                          )}
                          {leaderboard.length > 0 && (
                            <div className="leaderboard-list">
                              {leaderboard.map((entry, index) => (
                                <div key={`${entry.user_id}-${entry.manifest_id}`} className="leaderboard-row">
                                  <div className="leaderboard-rank">#{index + 1}</div>
                                  <div className="leaderboard-main">
                                    <strong>
                                      {entry.user_id === user?.id
                                        ? entry.is_creator
                                          ? "You / creator"
                                          : "You"
                                        : entry.is_creator
                                          ? `${entry.rider_name} / creator`
                                          : entry.rider_name}
                                    </strong>
                                    <span>
                                      {entry.status === "finished"
                                        ? challengeSummary?.winner_user_id === entry.user_id
                                          ? "Fastest finished time"
                                          : "Finished"
                                        : challengeSummary?.status === "expired"
                                          ? "Expired open run"
                                          : "Open run"}
                                    </span>
                                  </div>
                                  <div className="leaderboard-time">
                                    {entry.best_seconds !== null ? formatDuration(entry.best_seconds) : "--:--"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  const renderCurrentPage = () =>
    pageView === "messenger"
      ? renderMessenger()
      : pageView === "loop"
        ? renderLoop()
        : pageView === "account"
          ? renderAccount()
            : pageView === "wall"
            ? (
              <Suspense fallback={<div className="status-message page-loader">Loading Wall of Fame…</div>}>
                <WallPage
                  publicQuarterLabel={publicQuarterLabel}
                  selectedWallCity={selectedWallCity}
                  setSelectedWallCity={setSelectedWallCity}
                  cityPresets={ALLEYCAT_CITY_PRESETS}
                  toCitySlug={toCitySlug}
                  getCityLabel={getCityLabel}
                  isLoadingWall={isLoadingWall}
                  wallPosts={wallPosts}
                  wallFeaturedPost={wallFeaturedPost}
                  wallLeadCity={wallLeadCity}
                  onOpenRiderProfile={handleOpenRiderProfile}
                  onOpenWallCity={handleOpenWallCity}
                  onOpenLeaderboardCity={handleOpenLeaderboardCity}
                />
              </Suspense>
            )
            : pageView === "cities"
              ? (
                <Suspense fallback={<div className="status-message page-loader">Loading city lanes…</div>}>
                  <CitiesPage
                    cityLanes={cityLanes}
                    isLoadingCityLanes={isLoadingCityLanes}
                    onOpenMessengerCity={handleOpenMessengerCity}
                    onOpenWallCity={handleOpenWallCity}
                    onOpenLeaderboardCity={handleOpenLeaderboardCity}
                    onOpenCityRequest={(cityName) => {
                      if (cityName) setCityRequestName(cityName);
                      setShowCityRequest(true);
                    }}
                  />
                </Suspense>
              )
            : pageView === "leaderboard"
              ? (
                <Suspense fallback={<div className="status-message page-loader">Loading leaderboard…</div>}>
                  <LeaderboardPage
                    publicQuarterLabel={publicQuarterLabel}
                    selectedLeaderboardCity={selectedLeaderboardCity}
                    setSelectedLeaderboardCity={setSelectedLeaderboardCity}
                    cityPresets={ALLEYCAT_CITY_PRESETS}
                    toCitySlug={toCitySlug}
                    getCityLabel={getCityLabel}
                    isLoadingPublicLeaderboard={isLoadingPublicLeaderboard}
                    publicLeaderboard={publicLeaderboard}
                    onOpenRiderProfile={handleOpenRiderProfile}
                  />
                </Suspense>
              )
              : pageView === "rider"
                ? (
                  <Suspense fallback={<div className="status-message page-loader">Loading rider profile…</div>}>
                    <RiderProfilePage
                      isLoadingPublicRiderProfile={isLoadingPublicRiderProfile}
                      publicRiderProfile={publicRiderProfile}
                      onOpenWallCity={handleOpenWallCity}
                      onOpenLeaderboardCity={handleOpenLeaderboardCity}
                      onOpenRiderProfile={handleOpenRiderProfile}
                    />
                  </Suspense>
                )
            : renderHome();

  return (
    <div
      className={`page ${pageView === "messenger" ? "page-messenger" : "page-home"}`}
    >
      {renderHeader()}
      {renderModals()}
      <main key={pageView} className="page-stage page-stage-enter">
        {renderCurrentPage()}
      </main>
      {renderMobileDock()}
      <footer className="site-footer">
        <div className="nav-container">
          <div className="nav-viewfinder">
            <div className="corner top-left"></div>
            <div className="corner top-right"></div>
            <div className="corner bottom-left"></div>
            <div className="corner bottom-right"></div>
          </div>

          <div className="nav-left">
            <div className="footer-title">LOOP_V1.0.4</div>
          </div>

          <div className="footer-links">
            <a className="ghost-link" href="/leaderboard">Leaderboard</a>
            <a className="ghost-link" href="/cities">Cities</a>
            <a className="ghost-link" href="/privacy.html">Privacy</a>
            <a className="ghost-link" href="/terms.html">Terms</a>
            <a className="ghost-link" href="/how.html">How</a>
            <a className="ghost-link" href="https://buymeacoffee.com/js4mhwqrdjd">Coffee</a>
            <a className="ghost-link admin-link" href="/admin.html">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
