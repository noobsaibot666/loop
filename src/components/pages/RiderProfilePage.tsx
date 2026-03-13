import { formatDuration } from "../../utils/routeUtils";

type WallPost = {
  id: string;
  rider_name: string;
  city_name: string;
  checkpoint_name: string;
  location_label: string;
  bike_name?: string | null;
  bike_ratio?: string | null;
  public_url: string;
  created_at: string;
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
  recent_runs: {
    id: string;
    city_name: string;
    manifest_title: string;
    finished_at: string;
    finish_seconds: number;
    ghost_delta: number | null;
  }[];
  recent_rivals: {
    user_id: string;
    rider_name: string;
    shared_challenges: number;
    cities: string[];
  }[];
  city_breakdown: {
    city_name: string;
    proof_count: number;
  }[];
  city_clusters: {
    city_name: string;
    proof_count: number;
    posts: WallPost[];
  }[];
  city_context: {
    city_name: string;
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

type RiderProfilePageProps = {
  isLoadingPublicRiderProfile: boolean;
  publicRiderProfile: PublicRiderProfile | null;
  onOpenWallCity: (cityName?: string) => void;
  onOpenLeaderboardCity: (cityName?: string) => void;
  onOpenRiderProfile: (userId?: string) => void;
};

export default function RiderProfilePage({
  isLoadingPublicRiderProfile,
  publicRiderProfile,
  onOpenWallCity,
  onOpenLeaderboardCity,
  onOpenRiderProfile,
}: RiderProfilePageProps) {
  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">{publicRiderProfile?.profile?.rider_name || "Rider profile"}</h1>
        <p className="sub-page-description">Proof, heat, bike.</p>
        {publicRiderProfile && (
          <div className="section-jump-strip">
            <a className="mini-chip active" href="#rider-stats">Stats</a>
            <a className="mini-chip" href="#rider-cities">Cities</a>
            <a className="mini-chip" href="#rider-standing">Standing</a>
            <a className="mini-chip" href="#rider-ledger">Ledger</a>
            <a className="mini-chip" href="#rider-proof">Proof</a>
          </div>
        )}
      </section>

      <section className="builder-grid single reveals">
        <div className="glass-card form-card rider-profile-card">
          {isLoadingPublicRiderProfile && <div className="status-message">Loading rider profile…</div>}
          {!isLoadingPublicRiderProfile && !publicRiderProfile && (
            <div className="empty-state">
              <div className="empty-state-title">Rider not found</div>
              <div className="empty-state-body">Profile is private or the link is dead.</div>
            </div>
          )}
          {publicRiderProfile && (
            <>
              <div className="rider-profile-hero">
                <div className="rider-profile-head">
                  <div>
                    <div className="form-title">{publicRiderProfile.profile.rider_name}</div>
                    <div className="form-subtitle">
                      {publicRiderProfile.profile.home_location || publicRiderProfile.stats.top_city || "No city tag yet"}
                    </div>
                  </div>
                  <div className="rider-bike-tag">
                    <span>{publicRiderProfile.profile.bike_name || "Bike not set"}</span>
                    <strong>{publicRiderProfile.profile.bike_ratio || "Ratio not set"}</strong>
                  </div>
                </div>

                {publicRiderProfile.recent_proofs?.[0] && (
                  <div className="rider-feature-card">
                    <img
                      src={publicRiderProfile.recent_proofs[0].public_url}
                      alt={`${publicRiderProfile.recent_proofs[0].checkpoint_name} by ${publicRiderProfile.profile.rider_name}`}
                      className="rider-feature-image"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="rider-feature-meta">
                      <span>Latest wall hit</span>
                      <strong>{publicRiderProfile.recent_proofs[0].checkpoint_name}</strong>
                      <em>{publicRiderProfile.recent_proofs[0].city_name} · {new Date(publicRiderProfile.recent_proofs[0].created_at).toLocaleDateString()}</em>
                    </div>
                  </div>
                )}
              </div>

              <div className="result-grid result-grid-four rider-stat-grid" id="rider-stats">
                <div>
                  <span>Public proofs</span>
                  <strong>{publicRiderProfile.stats.public_proofs}</strong>
                </div>
                <div>
                  <span>Finished runs</span>
                  <strong>{publicRiderProfile.stats.finished_runs}</strong>
                </div>
                <div>
                  <span>Quarter rank</span>
                  <strong>{publicRiderProfile.stats.quarter_rank ? `#${publicRiderProfile.stats.quarter_rank}` : "--"}</strong>
                </div>
                <div>
                  <span>Best finish</span>
                  <strong>{publicRiderProfile.stats.best_finish_seconds ? formatDuration(publicRiderProfile.stats.best_finish_seconds) : "--:--"}</strong>
                </div>
              </div>

              <div className="result-grid result-grid-three rider-stat-grid rider-stat-grid-secondary">
                <div>
                  <span>Cities hit</span>
                  <strong>{publicRiderProfile.stats.cities}</strong>
                </div>
                <div>
                  <span>Top city</span>
                  <strong>{publicRiderProfile.stats.top_city || "--"}</strong>
                </div>
                <div>
                  <span>Quarter proofs</span>
                  <strong>{publicRiderProfile.stats.quarter_public_proofs}</strong>
                </div>
                <div>
                  <span>Shared codes</span>
                  <strong>{publicRiderProfile.stats.shared_challenges}</strong>
                </div>
                <div>
                  <span>Rivals met</span>
                  <strong>{publicRiderProfile.stats.rivals}</strong>
                </div>
              </div>

              <div className="rider-story-strip">
                <div className="mini-chip active">
                  {publicRiderProfile.stats.quarter_rank
                    ? `Quarter heat: #${publicRiderProfile.stats.quarter_rank}`
                    : "Quarter heat: building"}
                </div>
                <div className="mini-chip">
                  {publicRiderProfile.stats.last_active_at
                    ? `Last active ${new Date(publicRiderProfile.stats.last_active_at).toLocaleDateString()}`
                    : "No recent run date yet"}
                </div>
                <div className="mini-chip">
                  {publicRiderProfile.stats.top_city
                    ? `${publicRiderProfile.stats.top_city} is the main lane`
                    : "City story still loading"}
                </div>
                <div className="mini-chip">
                  {publicRiderProfile.stats.proof_streak_days > 1
                    ? `${publicRiderProfile.stats.proof_streak_days}-day proof streak`
                    : publicRiderProfile.stats.public_proofs > 0
                      ? "Fresh proof line live"
                      : "No streak yet"}
                </div>
              </div>

              {!!publicRiderProfile.city_breakdown?.length && (
                <>
                  <div className="rider-profile-proof-head" id="rider-cities">
                    <div className="form-title">City lanes</div>
                    <div className="form-subtitle">Where they hit.</div>
                  </div>
                  <div className="rider-city-grid">
                    {publicRiderProfile.city_breakdown.map((city) => (
                      <div key={city.city_name} className="rider-city-card">
                        <span className="winner-label">{city.proof_count} proof{city.proof_count === 1 ? "" : "s"}</span>
                        <strong>{city.city_name}</strong>
                        <div className="rider-city-actions">
                          <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(city.city_name)}>
                            Open wall
                          </button>
                          <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(city.city_name)}>
                            City board
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!!publicRiderProfile.city_clusters?.length && (
                <>
                  <div className="rider-profile-proof-head">
                    <div className="form-title">Proof clusters</div>
                    <div className="form-subtitle">Where they post.</div>
                  </div>
                  <div className="rider-cluster-grid">
                    {publicRiderProfile.city_clusters.map((cluster) => (
                      <div key={cluster.city_name} className="rider-cluster-card">
                        <div className="rider-cluster-head">
                          <div>
                            <span className="winner-label">{cluster.proof_count} proof{cluster.proof_count === 1 ? "" : "s"}</span>
                            <strong>{cluster.city_name}</strong>
                          </div>
                          <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(cluster.city_name)}>
                            Open wall
                          </button>
                        </div>
                        <div className="rider-cluster-images">
                          {cluster.posts.map((post) => (
                            <img key={post.id} src={post.public_url} alt={`${post.checkpoint_name} in ${cluster.city_name}`} loading="lazy" decoding="async" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {publicRiderProfile.city_context && (
                <>
                  <div className="rider-profile-proof-head" id="rider-standing">
                    <div className="form-title">City standing</div>
                    <div className="form-subtitle">How they stack.</div>
                  </div>
                  <div className="rider-city-standing-card">
                    <div className="result-grid result-grid-three">
                      <div>
                        <span>Lane</span>
                        <strong>{publicRiderProfile.city_context.city_name}</strong>
                      </div>
                      <div>
                        <span>Quarter rank</span>
                        <strong>{publicRiderProfile.city_context.rank ? `#${publicRiderProfile.city_context.rank}` : "--"}</strong>
                      </div>
                      <div>
                        <span>Posted / closed</span>
                        <strong>{publicRiderProfile.city_context.proof_count} / {publicRiderProfile.city_context.finish_count}</strong>
                      </div>
                    </div>
                    {!!publicRiderProfile.city_context.leaders?.length && (
                      <div className="rider-city-leaders">
                        {publicRiderProfile.city_context.leaders.map((entry) => (
                          <button
                            key={entry.user_id}
                            type="button"
                            className="rider-city-leader"
                            onClick={() => onOpenRiderProfile(entry.user_id)}
                          >
                            <span className="winner-label">Top {entry.rank}</span>
                            <strong>{entry.rider_name}</strong>
                            <span>{entry.public_proofs} proofs · {entry.finished_runs} finishes</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="rider-city-actions">
                      <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(publicRiderProfile.city_context?.city_name)}>
                        Open city wall
                      </button>
                      <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(publicRiderProfile.city_context?.city_name)}>
                        Open city board
                      </button>
                    </div>
                  </div>
                </>
              )}

              {publicRiderProfile.badges?.length > 0 && (
                <div className="badge-list">
                  {publicRiderProfile.badges.map((badge) => (
                    <div key={badge.id} className="badge-chip">
                      <strong>{badge.label}</strong>
                      <span>{badge.description}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="rider-profile-proof-head" id="rider-ledger">
                <div className="form-title">Run ledger</div>
                <div className="form-subtitle">Closed runs and ghost gaps.</div>
              </div>
              {!publicRiderProfile.recent_runs?.length ? (
                <div className="empty-state">
                  <div className="empty-state-body">No finished runs yet.</div>
                </div>
              ) : (
                <div className="history-list rider-run-list">
                  {publicRiderProfile.recent_runs.map((run) => (
                    <div key={run.id} className="history-row rider-run-row">
                      <div>
                        <strong>{run.city_name || "City"} · {run.manifest_title}</strong>
                        <span>{new Date(run.finished_at).toLocaleDateString()}</span>
                      </div>
                      <div className="history-actions">
                        <strong>{formatDuration(run.finish_seconds)}</strong>
                        <span className={run.ghost_delta !== null && run.ghost_delta <= 0 ? "good-time" : "slow-time"}>
                          {run.ghost_delta !== null
                            ? `${run.ghost_delta <= 0 ? "-" : "+"}${formatDuration(Math.abs(run.ghost_delta))} vs ghost`
                            : "No ghost split"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="rider-profile-proof-head">
                <div className="form-title">Rider circle</div>
                <div className="form-subtitle">Shared codes only.</div>
              </div>
              {!publicRiderProfile.recent_rivals?.length ? (
                <div className="empty-state">
                  <div className="empty-state-body">No shared crew yet.</div>
                </div>
              ) : (
                <div className="rider-rival-grid">
                  {publicRiderProfile.recent_rivals.map((rival) => (
                    <button
                      key={rival.user_id}
                      type="button"
                      className="rider-rival-card"
                      onClick={() => onOpenRiderProfile(rival.user_id)}
                    >
                      <span className="winner-label">Shared codes</span>
                      <strong>{rival.rider_name}</strong>
                      <em>{rival.shared_challenges} runs together</em>
                      <span>{rival.cities.join(" · ") || "No city tags yet"}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="rider-profile-proof-head" id="rider-proof">
                <div className="form-title">Recent proof</div>
                <div className="form-subtitle">Latest hits.</div>
              </div>
              {!publicRiderProfile.recent_proofs?.length ? (
                <div className="empty-state">
                  <div className="empty-state-body">No public proof yet.</div>
                </div>
              ) : (
                <div className="wall-grid rider-proof-grid">
                  {publicRiderProfile.recent_proofs.map((post) => (
                    <div key={post.id} className="glass-card wall-card">
                      <img src={post.public_url} alt={`${post.checkpoint_name} by ${post.rider_name}`} className="wall-image" loading="lazy" decoding="async" />
                      <div className="wall-meta">
                        <div className="checkpoint-meta">
                          <span>Alleycat</span>
                          <span>{post.city_name}</span>
                        </div>
                        <div className="checkpoint-name">{post.rider_name}</div>
                        <div className="wall-detail-grid">
                          <div>
                            <span>Location</span>
                            <strong>{post.location_label || post.city_name}</strong>
                          </div>
                          <div>
                            <span>Date</span>
                            <strong>{new Date(post.created_at).toLocaleDateString()}</strong>
                          </div>
                          <div>
                            <span>Bike</span>
                            <strong>{post.bike_name || publicRiderProfile.profile.bike_name || "Bike not set"}</strong>
                          </div>
                          <div>
                            <span>Ratio</span>
                            <strong>{post.bike_ratio || publicRiderProfile.profile.bike_ratio || "Ratio not set"}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
