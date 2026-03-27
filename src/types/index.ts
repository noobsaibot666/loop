export type PageView = "home" | "loop" | "messenger" | "night" | "cities" | "account" | "wall" | "leaderboard" | "rider";

export type Usage = {
  free_used: number;
  donation_credits: number;
  free_remaining: number;
  credits_remaining: number;
  is_admin?: boolean;
  unlimited_credits?: boolean;
};

export type Suggestion = {
  label: string;
  lat: number;
  lng: number;
};

export type MessengerCheckpoint = {
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

export type MessengerManifest = {
  id: string;
  city: string;
  city_slug: string;
  difficulty: string | null;
  ghost_enabled?: boolean;
  style: string;
  manifest_title: string;
  estimated_minutes: number;
  ghost_seconds: number | null;
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

export type MessengerRun = {
  runId: string;
  startedAt: string;
  completedIds: string[];
  finishSeconds: number | null;
  finishedAt: string | null;
  status?: string;
  proofs?: MessengerProof[];
};

export type MessengerProof = {
  id: string;
  run_id?: string;
  checkpoint_id: string;
  checkpoint_name: string;
  public_url: string;
  location_label: string;
  is_public: boolean;
  created_at: string;
};

export type ProofDraft = {
  runId: string;
  checkpointId: string;
  storagePath: string;
  publicUrl: string;
  isPublic: boolean;
  fileName: string;
};

export type AlleycatChallenge = {
  id: string;
  code: string;
  created_at?: string;
  status?: string;
};

export type AlleycatLeaderboardEntry = {
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

export type AlleycatChallengeSummary = {
  status: string;
  expires_at: string | null;
  winner_user_id: string | null;
  winner_name: string | null;
  best_seconds: number | null;
  rivalry: string;
  result_label?: string;
  rematch_label?: string;
};

export type AccountSummary = {
  is_admin?: boolean;
  unlimited_credits?: boolean;
  community_membership?: {
    user_id: string;
    plan_code: string;
    status: string;
    price_cents: number;
    currency: string;
    interval: string;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean;
    access_state?: string;
    access_active?: boolean;
    has_invite?: boolean;
  } | null;
  profile: {
    user_id: string;
    rider_name: string;
    home_location: string;
    bike_name: string;
    bike_ratio: string;
    collaboration_note?: string;
    collaboration_status?: string;
    collaboration_requested_at?: string | null;
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
    difficulty: string | null;
    style: string;
    created_at: string;
    status: string;
    best_seconds: number | null;
    ghost_seconds: number | null;
    ghost_delta: number | null;
    proof_count: number;
    source_challenge_id: string | null;
    proofs?: MessengerProof[];
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

export type WallPost = {
  id: string;
  run_id?: string;
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

export type NightRideFeedPost = {
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

export type NightRideAccountSession = {
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

export type PublicLeaderboardEntry = {
  user_id: string;
  rider_name: string;
  public_proofs: number;
  finished_runs: number;
  rank: number;
};

export type PublicRiderProfile = {
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

export type CityDemand = {
  total_requests: number;
  open_requests: number;
  queued_requests: number;
  top_cities: {
    city: string;
    count: number;
  }[];
};

export type CityLane = {
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
