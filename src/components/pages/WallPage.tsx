import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../i18n";
import Hero from "../Hero";
import { 
  Filter, Image as ImageIcon, MapPin, User, Bike, 
  Calendar, Zap, History, LayoutGrid, Trophy, X, ArrowRight
} from "lucide-react";

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

type NightRidePost = {
  id: string;
  rider_name: string;
  crew_name?: string | null;
  city_name?: string | null;
  route_title?: string | null;
  distance_km?: number | null;
  image_url: string;
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
  nightRidePosts: NightRidePost[];
  onOpenRiderProfile: (userId?: string) => void;
  onOpenWallCity: (cityName?: string) => void;
  onOpenLeaderboardCity: (cityName?: string) => void;
  heroImage?: string;
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
  nightRidePosts,
  onOpenRiderProfile,
  onOpenWallCity,
  onOpenLeaderboardCity,
  heroImage,
}: WallPageProps) {
  const { t, formatDate } = useI18n();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [activeFeed, setActiveFeed] = useState<"wall" | "night">("wall");
  const [expandedWallCards, setExpandedWallCards] = useState<Record<string, boolean>>({});
  const cityGroups = useMemo(() => [
    {
      label: t("continent.americas"),
      cities: cityPresets
        .filter((city) => ["Bogota", "Buenos Aires", "Chicago", "Curitiba", "Guarulhos", "Los Angeles", "Mexico City", "New York", "Philadelphia", "San Francisco", "Santos", "Sao Paulo", "Seattle"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "wall-city-group-americas",
    },
    {
      label: t("continent.europe"),
      cities: cityPresets
        .filter((city) => ["Amsterdam", "Barcelona", "Berlin", "Krakow", "London", "Milan", "Munich", "Paris", "Vienna", "Warsaw"].includes(city))
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

  useEffect(() => {
    if (!showCityPicker) return;

    document.body.classList.add("menu-open-lock");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCityPicker(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("menu-open-lock");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCityPicker]);

  const toggleWallCard = (postId: string) => {
    setExpandedWallCards((current) => ({
      ...current,
      [postId]: !current[postId],
    }));
  };

  return (
    <div className="sequential-layout sub-page page-wall page-stage-enter">
      <Hero 
        title={t("wall.title")}
        subtitle={selectedWallCity ? getCityLabel(selectedWallCity) : t("wall.allCities")}
        image={heroImage || ""}
      />

      <section className="wall-section reveals" id="wall-feed">
        <div className="wall-feed-toggle">
          <button
            type="button"
            className={`ghost-button small ${activeFeed === "wall" ? "active-filter-button" : ""}`}
            onClick={() => setActiveFeed("wall")}
          >
            {t("wall.title")}
          </button>
          <button
            type="button"
            className={`ghost-button small ${activeFeed === "night" ? "active-filter-button" : ""}`}
            onClick={() => setActiveFeed("night")}
          >
            {t("wall.nightTitle")}
          </button>
        </div>
        <div className="filter-strip wall-filter-strip" id="wall-filter">
          <button type="button" className="ghost-button small wall-filter-button" onClick={() => setShowCityPicker(true)}>
            <Filter size={14} />
            <span>{selectedWallCity ? getCityLabel(selectedWallCity) : t("wall.allCities")}</span>
          </button>
        </div>
        {isLoadingWall && <div className="status-message">{t("wall.loading")}</div>}
        {activeFeed === "wall" && (
          <div className="wall-subsection-head">
            <div className="wall-subsection-title">{t("wall.title")}</div>
            <div className="wall-subsection-copy">{t("wall.subtitle")}</div>
          </div>
        )}
        {activeFeed === "wall" && wallPosts.length > 0 && (
          <div className="wall-grid">
            {wallPosts.map((post) => (
              <div key={post.id} className="glass-card wall-card">
                <img src={post.public_url} alt={`${post.checkpoint_name} by ${post.rider_name}`} className="wall-image" loading="lazy" decoding="async" />
                <button
                  type="button"
                  className="wall-meta-toggle"
                  aria-expanded={expandedWallCards[post.id] ? "true" : "false"}
                  onClick={() => toggleWallCard(post.id)}
                >
                  {expandedWallCards[post.id] ? t("common.hide") : t("common.show")}
                </button>
                <div className={`wall-meta ${expandedWallCards[post.id] ? "is-expanded" : ""}`}>
                  <div className="wall-detail-grid">
                    <div className="wall-detail-item">
                      <Zap size={14} className="text-accent" />
                      <strong>{t("wall.typeAlleycat")}</strong>
                    </div>
                    <div className="wall-detail-item">
                      <User size={14} />
                      <strong>
                        <button className="inline-link-button checkpoint-name" type="button" onClick={() => onOpenRiderProfile(post.user_id)}>
                          {post.rider_name}
                        </button>
                      </strong>
                    </div>
                    <div className="wall-detail-item">
                      <MapPin size={14} />
                      <strong>{post.location_label || post.city_name}</strong>
                    </div>
                    <div className="wall-detail-item">
                      <Calendar size={14} />
                      <strong>{formatDate(post.created_at)}</strong>
                    </div>
                    <div className="wall-detail-item">
                      <Bike size={14} />
                      <strong>{post.bike_name || t("wall.bikeFallback")} ({post.bike_ratio || "N/A"})</strong>
                    </div>
                  </div>
                  <div className="wall-city-actions">
                    <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(post.city_name)}>
                      <LayoutGrid size={14} />
                      <span>{t("wall.buttonWall")}</span>
                    </button>
                    <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(post.city_name)}>
                      <Trophy size={14} />
                      <span>{t("wall.buttonBoard")}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeFeed === "wall" && !isLoadingWall && wallPosts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><ImageIcon size={32} className="text-muted" /></div>
            <div className="empty-state-text">{t("wall.empty")}</div>
          </div>
        )}
        {activeFeed === "night" && (
          <div className="filter-strip wall-subsection-head">
            <div className="wall-subsection-title">{t("wall.nightTitle")}</div>
            <div className="wall-subsection-copy">{t("wall.nightSubtitle")}</div>
          </div>
        )}
        {activeFeed === "night" && nightRidePosts.length > 0 && (
          <div className="night-wall-grid">
            {nightRidePosts.map((post) => (
              <article key={post.id} className="glass-card night-wall-card">
                <img src={post.image_url} alt={post.route_title || post.crew_name || post.rider_name} className="night-wall-image" loading="lazy" decoding="async" />
                <div className="night-wall-meta">
                  <strong>{post.crew_name || post.rider_name}</strong>
                  <span>{post.route_title || t("wall.nightRouteFallback")}</span>
                  <span>
                    {post.city_name || t("wall.nightCityFallback")}
                    {post.distance_km ? ` · ${Number(post.distance_km).toFixed(1)} km` : ""}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
        {activeFeed === "night" && !isLoadingWall && nightRidePosts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon"><Zap size={32} className="text-muted" /></div>
            <div className="empty-state-text">{t("wall.nightEmpty")}</div>
          </div>
        )}
      </section>

      {showCityPicker && createPortal(
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wall-city-picker-title" onClick={() => setShowCityPicker(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" id="wall-city-picker-title">{t("wall.chooseCity")}</div>
              <button className="modal-close" type="button" aria-label={t("common.close")} onClick={() => setShowCityPicker(false)}>
                <X size={20} />
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
