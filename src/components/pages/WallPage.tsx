import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../i18n";

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
  const { t, formatDate } = useI18n();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cityGroups = useMemo(() => [
    {
      label: t("continent.americas"),
      cities: cityPresets
        .filter((city) => ["Bogota", "Buenos Aires", "Chicago", "Los Angeles", "Mexico City", "New York", "Philadelphia", "San Francisco", "Santos", "Sao Paulo", "Seattle"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "wall-city-group-americas",
    },
    {
      label: t("continent.europe"),
      cities: cityPresets
        .filter((city) => ["Amsterdam", "Barcelona", "Berlin", "Krakow", "London", "Milan", "Paris", "Vienna", "Warsaw"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "wall-city-group-europe",
    },
    {
      label: t("continent.asia"),
      cities: cityPresets
        .filter((city) => ["Bangkok", "Seoul", "Taipei", "Tokyo"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "wall-city-group-asia",
    },
  ].filter((group) => group.cities.length > 0), [cityPresets]);

  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">{t("wall.title")}</h1>
      </section>

      <section className="wall-section reveals" id="wall-feed">
        <div className="filter-strip" id="wall-filter">
          <button type="button" className="inline-link-button wall-filter-link" onClick={() => setShowCityPicker(true)}>
            {selectedWallCity ? getCityLabel(selectedWallCity) : t("wall.allCities")}
          </button>
        </div>
        {isLoadingWall && <div className="status-message">{t("wall.loading")}</div>}
        {wallPosts.length > 0 && (
          <div className="wall-grid">
            {wallPosts.map((post) => (
              <div key={post.id} className="glass-card wall-card">
                <img src={post.public_url} alt={`${post.checkpoint_name} by ${post.rider_name}`} className="wall-image" loading="lazy" decoding="async" />
                <div className="wall-meta">
                  <div className="wall-detail-grid">
                    <div>
                      <span>{t("wall.type")}</span>
                      <strong>{t("wall.typeAlleycat")}</strong>
                    </div>
                    <div>
                      <span>{t("wall.rider")}</span>
                      <strong>
                        <button className="inline-link-button checkpoint-name" type="button" onClick={() => onOpenRiderProfile(post.user_id)}>
                          {post.rider_name}
                        </button>
                      </strong>
                    </div>
                    <div>
                      <span>{t("wall.location")}</span>
                      <strong>{post.location_label || post.city_name}</strong>
                    </div>
                    <div>
                      <span>{t("wall.date")}</span>
                      <strong>{formatDate(post.created_at)}</strong>
                    </div>
                    <div>
                      <span>{t("wall.bike")}</span>
                      <strong>{post.bike_name || t("wall.bikeFallback")}</strong>
                    </div>
                    <div>
                      <span>{t("wall.ratio")}</span>
                      <strong>{post.bike_ratio || t("wall.ratioFallback")}</strong>
                    </div>
                  </div>
                  <div className="wall-city-actions">
                    <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(post.city_name)}>
                      {t("wall.buttonWall")}
                    </button>
                    <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(post.city_name)}>
                      {t("wall.buttonBoard")}
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
              <div className="modal-title">{t("wall.chooseCity")}</div>
              <button className="modal-close" type="button" aria-label={t("common.close")} onClick={() => setShowCityPicker(false)}>
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
                {t("common.all")}
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
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
