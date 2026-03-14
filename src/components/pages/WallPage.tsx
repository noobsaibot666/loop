import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

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
  publicQuarterLabel: string;
  selectedWallCity: string;
  setSelectedWallCity: (value: string) => void;
  cityPresets: string[];
  toCitySlug: (value?: string) => string;
  getCityLabel: (value?: string) => string;
  isLoadingWall: boolean;
  wallPosts: WallPost[];
  onOpenRiderProfile: (userId?: string) => void;
  onOpenWallCity: (cityName?: string) => void;
  onOpenLeaderboardCity: (cityName?: string) => void;
};

export default function WallPage({
  publicQuarterLabel,
  selectedWallCity,
  setSelectedWallCity,
  cityPresets,
  toCitySlug,
  getCityLabel,
  isLoadingWall,
  wallPosts,
  onOpenRiderProfile,
  onOpenWallCity,
  onOpenLeaderboardCity,
}: WallPageProps) {
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cityGroups = useMemo(() => [
    {
      label: "Americas",
      cities: cityPresets
        .filter((city) => ["Bogota", "Buenos Aires", "Chicago", "Los Angeles", "Mexico City", "New York", "Philadelphia", "San Francisco", "Santos", "Sao Paulo", "Seattle"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "wall-city-group-americas",
    },
    {
      label: "Europe",
      cities: cityPresets
        .filter((city) => ["Amsterdam", "Barcelona", "Berlin", "Krakow", "London", "Milan", "Paris", "Vienna", "Warsaw"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "wall-city-group-europe",
    },
    {
      label: "Asia",
      cities: cityPresets
        .filter((city) => ["Bangkok", "Seoul", "Taipei", "Tokyo"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "wall-city-group-asia",
    },
  ].filter((group) => group.cities.length > 0), [cityPresets]);

  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">Wall of Fame</h1>
      </section>

      <section className="wall-section reveals" id="wall-feed">
        <div className="filter-strip" id="wall-filter">
          <button type="button" className="inline-link-button wall-filter-link" onClick={() => setShowCityPicker(true)}>
            {selectedWallCity ? getCityLabel(selectedWallCity) : "All Cities"}
          </button>
        </div>
        {isLoadingWall && <div className="status-message">Loading Wall of Fame…</div>}
        {wallPosts.length > 0 && (
          <div className="wall-grid">
            {wallPosts.map((post) => (
              <div key={post.id} className="glass-card wall-card">
                <img src={post.public_url} alt={`${post.checkpoint_name} by ${post.rider_name}`} className="wall-image" loading="lazy" decoding="async" />
                <div className="wall-meta">
                  <div className="wall-detail-grid">
                    <div>
                      <span>Type</span>
                      <strong>Alleycat</strong>
                    </div>
                    <div>
                      <span>Rider</span>
                      <strong>
                        <button className="inline-link-button checkpoint-name" type="button" onClick={() => onOpenRiderProfile(post.user_id)}>
                          {post.rider_name}
                        </button>
                      </strong>
                    </div>
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
                      <strong>{post.bike_name || "Bike"}</strong>
                    </div>
                    <div>
                      <span>Ratio</span>
                      <strong>{post.bike_ratio || "Ratio"}</strong>
                    </div>
                  </div>
                  <div className="wall-city-actions">
                    <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(post.city_name)}>
                      Wall
                    </button>
                    <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(post.city_name)}>
                      Board
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showCityPicker && createPortal(
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Choose a city</div>
              <button className="modal-close" type="button" aria-label="Close city picker" onClick={() => setShowCityPicker(false)}>
                ×
              </button>
            </div>
            <div className="modal-actions city-picker-nav">
              {cityGroups.map((group) => (
                <a key={group.anchor} className="inline-link-button city-picker-anchor" href={`#${group.anchor}`}>
                  {group.label}
                </a>
              ))}
            </div>
            <div className="modal-actions city-picker-actions">
              <button
                className={`ghost-button ${selectedWallCity === "" ? "active-filter-button" : ""}`}
                type="button"
                onClick={() => {
                  setSelectedWallCity("");
                  setShowCityPicker(false);
                }}
              >
                All
              </button>
              {cityGroups.map((group) => (
                <div key={group.anchor} className="city-picker-group" id={group.anchor}>
                  <div className="city-picker-group-title">{group.label}</div>
                  <div className="city-picker-group-grid">
                    {group.cities.map((city) => (
                      <button
                        key={city}
                        className={`ghost-button ${selectedWallCity === toCitySlug(city) ? "active-filter-button" : ""}`}
                        type="button"
                        onClick={() => {
                          setSelectedWallCity(toCitySlug(city));
                          setShowCityPicker(false);
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button className="primary-button" type="button" onClick={() => setShowCityPicker(false)}>
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
