type WallPost = {
  id: string;
  user_id?: string;
  rider_name: string;
  city_name: string;
  checkpoint_name: string;
  location_label: string;
  bike_name?: string | null;
  bike_ratio?: string | null;
  public_url: string;
  created_at: string;
};

type WallPageProps = {
  selectedWallCity: string;
  setSelectedWallCity: (value: string) => void;
  cityPresets: string[];
  toCitySlug: (value?: string) => string;
  getCityLabel: (value?: string) => string;
  isLoadingWall: boolean;
  wallPosts: WallPost[];
  wallFeaturedPost: WallPost | null;
  wallLeadCity: [string, number] | null;
  onOpenRiderProfile: (userId?: string) => void;
  onOpenWallCity: (cityName?: string) => void;
  onOpenLeaderboardCity: (cityName?: string) => void;
};

export default function WallPage({
  selectedWallCity,
  setSelectedWallCity,
  cityPresets,
  toCitySlug,
  getCityLabel,
  isLoadingWall,
  wallPosts,
  wallFeaturedPost,
  wallLeadCity,
  onOpenRiderProfile,
  onOpenWallCity,
  onOpenLeaderboardCity,
}: WallPageProps) {
  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">Wall of Fame</h1>
        <p className="sub-page-description">Proof hits from real runs. Names, cities, no fluff.</p>
      </section>

      <section className="wall-section reveals" id="wall-feed">
        <div className="filter-strip">
          <span className="filter-label">City filter</span>
          <div className="pill-group">
            <button type="button" className={`pill ${selectedWallCity === "" ? "active" : ""}`} onClick={() => setSelectedWallCity("")}>All cities</button>
            {cityPresets.map((city) => (
              <button
                key={city}
                type="button"
                className={`pill ${selectedWallCity === toCitySlug(city) ? "active" : ""}`}
                onClick={() => setSelectedWallCity(toCitySlug(city))}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
        {!isLoadingWall && wallPosts.length > 0 && (
          <>
            <div className="result-grid result-grid-three wall-story-grid">
              <div>
                <span>Posts up</span>
                <strong>{wallPosts.length}</strong>
              </div>
              <div>
                <span>Riders up</span>
                <strong>{new Set(wallPosts.map((post) => post.user_id || post.rider_name)).size}</strong>
              </div>
              <div>
                <span>City lane</span>
                <strong>{selectedWallCity ? getCityLabel(selectedWallCity) : "All cities"}</strong>
              </div>
            </div>
            <div className="wall-editorial-grid">
              {wallFeaturedPost && (
                <div className="wall-editorial-card wall-editorial-feature">
                  <span className="winner-label">Latest drop</span>
                  <strong>{wallFeaturedPost.rider_name} · {wallFeaturedPost.checkpoint_name}</strong>
                  <span>{wallFeaturedPost.city_name} · {new Date(wallFeaturedPost.created_at).toLocaleDateString()}</span>
                  <div className="wall-city-actions">
                    <button className="ghost-button small" type="button" onClick={() => onOpenRiderProfile(wallFeaturedPost.user_id)}>
                      Open rider
                    </button>
                    <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(wallFeaturedPost.city_name)}>
                      City lane
                    </button>
                  </div>
                </div>
              )}
              {wallLeadCity && (
                <div className="wall-editorial-card">
                  <span className="winner-label">City spotlight</span>
                  <strong>{wallLeadCity[0]}</strong>
                  <span>{wallLeadCity[1]} wall hits in this lane right now.</span>
                  <div className="wall-city-actions">
                    <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(wallLeadCity[0])}>
                      Open wall
                    </button>
                    <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(wallLeadCity[0])}>
                      City board
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {isLoadingWall && <div className="status-message">Loading Wall of Fame…</div>}
        {!isLoadingWall && wallPosts.length === 0 && (
          <div className="builder-grid single">
            <div className="glass-card form-card">
              <div className="empty-state">
                <div className="empty-state-title">Wall of Fame is quiet right now</div>
                <div className="empty-state-body">Once riders post proof, it lands here.</div>
              </div>
            </div>
          </div>
        )}
        {wallPosts.length > 0 && (
          <div className="wall-grid">
            {wallPosts.map((post) => (
              <div key={post.id} className="glass-card wall-card">
                <img src={post.public_url} alt={`${post.checkpoint_name} by ${post.rider_name}`} className="wall-image" loading="lazy" decoding="async" />
                <div className="wall-meta">
                  <div className="checkpoint-meta">
                    <span>Alleycat</span>
                    <button className="inline-link-button checkpoint-inline-link" type="button" onClick={() => onOpenWallCity(post.city_name)}>
                      {post.city_name}
                    </button>
                  </div>
                  <div className="checkpoint-name">
                    <button className="inline-link-button" type="button" onClick={() => onOpenRiderProfile(post.user_id)}>
                      {post.rider_name}
                    </button>
                  </div>
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
                      <strong>{post.bike_name || "Bike not set"}</strong>
                    </div>
                    <div>
                      <span>Ratio</span>
                      <strong>{post.bike_ratio || "Ratio not set"}</strong>
                    </div>
                  </div>
                  <div className="wall-city-actions">
                    <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(post.city_name)}>
                      More from {post.city_name}
                    </button>
                    <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(post.city_name)}>
                      City board
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
