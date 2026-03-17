import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../i18n";

type PublicLeaderboardEntry = {
  user_id: string;
  rider_name: string;
  public_proofs: number;
  finished_runs: number;
  rank: number;
  is_community_member?: boolean;
};

type LeaderboardPageProps = {
  publicQuarterLabel: string;
  selectedLeaderboardCountry: string;
  setSelectedLeaderboardCountry: (value: string) => void;
  selectedLeaderboardCity: string;
  setSelectedLeaderboardCity: (value: string) => void;
  cityPresets: string[];
  toCitySlug: (value?: string) => string;
  getCityLabel: (value?: string) => string;
  isLoadingPublicLeaderboard: boolean;
  publicLeaderboard: PublicLeaderboardEntry[];
  onOpenRiderProfile: (userId?: string) => void;
};

const CITY_COUNTRY_MAP: Record<string, string> = {
  amsterdam: "Netherlands",
  bangkok: "Thailand",
  barcelona: "Spain",
  berlin: "Germany",
  bogota: "Colombia",
  buenosaires: "Argentina",
  chicago: "United States",
  krakow: "Poland",
  london: "United Kingdom",
  losangeles: "United States",
  mexico: "Mexico",
  mexicocity: "Mexico",
  milan: "Italy",
  newyork: "United States",
  paris: "France",
  philadelphia: "United States",
  sanfrancisco: "United States",
  santos: "Brazil",
  saopaulo: "Brazil",
  seattle: "United States",
  seoul: "South Korea",
  taipei: "Taiwan",
  tokyo: "Japan",
  vienna: "Austria",
  warsaw: "Poland",
};

export default function LeaderboardPage({
  publicQuarterLabel,
  selectedLeaderboardCountry,
  setSelectedLeaderboardCountry,
  selectedLeaderboardCity,
  setSelectedLeaderboardCity,
  cityPresets,
  toCitySlug,
  getCityLabel,
  isLoadingPublicLeaderboard,
  publicLeaderboard,
  onOpenRiderProfile,
}: LeaderboardPageProps) {
  const { t } = useI18n();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const countryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          cityPresets
            .map((city) => CITY_COUNTRY_MAP[toCitySlug(city)] || "")
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [cityPresets, toCitySlug]
  );
  const filteredCityPresets = useMemo(
    () =>
      selectedLeaderboardCountry
        ? cityPresets.filter((city) => CITY_COUNTRY_MAP[toCitySlug(city)] === selectedLeaderboardCountry)
        : cityPresets,
    [cityPresets, selectedLeaderboardCountry, toCitySlug]
  );
  const cityGroups = useMemo(() => [
    {
      label: t("continent.americas"),
      cities: filteredCityPresets
        .filter((city) => ["Bogota", "Buenos Aires", "Chicago", "Los Angeles", "Mexico City", "New York", "Philadelphia", "San Francisco", "Santos", "Sao Paulo", "Seattle"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "leaderboard-city-group-americas",
    },
    {
      label: t("continent.europe"),
      cities: filteredCityPresets
        .filter((city) => ["Amsterdam", "Barcelona", "Berlin", "Krakow", "London", "Milan", "Paris", "Vienna", "Warsaw"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "leaderboard-city-group-europe",
    },
    {
      label: t("continent.asia"),
      cities: filteredCityPresets
        .filter((city) => ["Bangkok", "Seoul", "Taipei", "Tokyo"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "leaderboard-city-group-asia",
    },
  ].filter((group) => group.cities.length > 0), [filteredCityPresets, t]);
  const leaderboardProofs = publicLeaderboard.reduce((sum, entry) => sum + entry.public_proofs, 0);
  const leaderboardFinishes = publicLeaderboard.reduce((sum, entry) => sum + entry.finished_runs, 0);
  const activeScopeLabel = selectedLeaderboardCity
    ? getCityLabel(selectedLeaderboardCity)
    : selectedLeaderboardCountry || t("leaderboard.allCitiesLower");

  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">{t("leaderboard.title")}</h1>
      </section>

      <section className="builder-grid single reveals">
        <div className="glass-card form-card leaderboard-shell">
          <div className="leaderboard-public-head" id="leaderboard-filter">
            <div className="leaderboard-head-copy">
              <div className="form-title">{publicQuarterLabel || t("leaderboard.currentQuarter")}</div>
              <div className="leaderboard-head-scope">
                <span>{t("leaderboard.currentFilter")}</span>
                <strong>{activeScopeLabel}</strong>
              </div>
            </div>
            <button type="button" className="inline-link-button wall-filter-link" onClick={() => setShowCityPicker(true)}>
              {selectedLeaderboardCity ? getCityLabel(selectedLeaderboardCity) : t("leaderboard.allCities")}
            </button>
          </div>
          <div className="leaderboard-country-strip">
            <button
              type="button"
              className={`mini-chip ${selectedLeaderboardCountry === "" ? "active" : ""}`}
              onClick={() => {
                setSelectedLeaderboardCountry("");
                setSelectedLeaderboardCity("");
              }}
            >
              {t("leaderboard.allCountries")}
            </button>
            {countryOptions.map((country) => (
              <button
                key={country}
                type="button"
                className={`mini-chip ${selectedLeaderboardCountry === country ? "active" : ""}`}
                onClick={() => {
                  setSelectedLeaderboardCountry(country);
                  setSelectedLeaderboardCity("");
                }}
              >
                {country}
              </button>
            ))}
          </div>
          {isLoadingPublicLeaderboard && <div className="status-message">{t("leaderboard.loading")}</div>}
          {!isLoadingPublicLeaderboard && publicLeaderboard.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🏁</div>
              <div className="empty-state-text">{t("leaderboard.empty")}</div>
            </div>
          )}
          {publicLeaderboard.length > 0 && (
            <div className="result-grid result-grid-three leaderboard-summary-grid">
              <div className="leaderboard-stat-card">
                <span>{t("leaderboard.rankedRiders")}</span>
                <strong>{publicLeaderboard.length}</strong>
              </div>
              <div className="leaderboard-stat-card leaderboard-stat-card-accent">
                <span>{t("leaderboard.totalProofs")}</span>
                <strong>{leaderboardProofs}</strong>
              </div>
              <div className="leaderboard-stat-card">
                <span>{t("leaderboard.totalFinishes")}</span>
                <strong>{leaderboardFinishes}</strong>
              </div>
            </div>
          )}
          <div className="leaderboard-community-note">{t("leaderboard.communityNote")}</div>
          {publicLeaderboard.length > 0 && (
            <div className="winner-callout leaderboard-hero">
              <div className="leaderboard-hero-copy">
                <span className="winner-label">{t("leaderboard.quarterLeader")}</span>
                <div className="leaderboard-hero-name">
                  <strong>{publicLeaderboard[0].rider_name}</strong>
                  <div className="achievement-badge gold">
                    <span>🥇 {t("leaderboard.loopLeader")}</span>
                  </div>
                </div>
                <span>{t("leaderboard.proofsFinishes", { proofs: publicLeaderboard[0].public_proofs, finishes: publicLeaderboard[0].finished_runs })}</span>
              </div>
              <div className="leaderboard-hero-stats">
                <div className="leaderboard-hero-chip">
                  <span>{t("leaderboard.leaderShare")}</span>
                  <strong>
                    {Math.max(1, Math.round((publicLeaderboard[0].public_proofs / Math.max(1, leaderboardProofs)) * 100))}%
                  </strong>
                </div>
                <div className="leaderboard-hero-chip">
                  <span>{t("leaderboard.avgProofs")}</span>
                  <strong>{(leaderboardProofs / Math.max(1, publicLeaderboard.length)).toFixed(1)}</strong>
                </div>
              </div>
            </div>
          )}
          {publicLeaderboard.length > 1 && (
            <div className="leaderboard-podium" id="leaderboard-podium">
              {publicLeaderboard.slice(0, 3).map((entry) => (
                <button
                  key={entry.user_id}
                  type="button"
                  className={`podium-card podium-${entry.rank}`}
                  onClick={() => onOpenRiderProfile(entry.user_id)}
                >
                  <span className="winner-label">{t("leaderboard.top", { rank: entry.rank })}</span>
                  <strong>{entry.rider_name}</strong>
                  <span>{t("leaderboard.proofsFinishes", { proofs: entry.public_proofs, finishes: entry.finished_runs })}</span>
                </button>
              ))}
            </div>
          )}
          {publicLeaderboard.length > 0 && (
            <div className="leaderboard-list public-board" id="leaderboard-list">
              {publicLeaderboard.map((entry) => (
                <div key={entry.user_id} className="leaderboard-row">
                  <div className="leaderboard-rank">#{entry.rank}</div>
                  <div className="leaderboard-main">
                    <strong>
                      <button className="inline-link-button" type="button" onClick={() => onOpenRiderProfile(entry.user_id)}>
                        {entry.rider_name}
                      </button>
                    </strong>
                    <span>{t("leaderboard.proofsFinishes", { proofs: entry.public_proofs, finishes: entry.finished_runs })}</span>
                    <div className="leaderboard-meta-chips">
                      {entry.rank === 1 && (
                        <span className="achievement-badge gold">
                          🥇 {t("leaderboard.loopLeader")}
                        </span>
                      )}
                      {entry.finished_runs > 0 && (
                        <span className="achievement-badge silver">
                          🏁 {t("leaderboard.alleycatWinner")}
                        </span>
                      )}
                      {entry.is_community_member && (
                        <span className="achievement-badge community">
                          ⛓️ {t("leaderboard.hardChainCrew")}
                        </span>
                      )}
                      <span className="mini-chip active">{t("leaderboard.top", { rank: entry.rank })}</span>
                      {entry.finished_runs > 0 && <span className="mini-chip">{t("leaderboard.closed", { count: entry.finished_runs })}</span>}
                      {entry.public_proofs > 0 && <span className="mini-chip">{t("leaderboard.posted", { count: entry.public_proofs })}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showCityPicker && createPortal(
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">{t("leaderboard.chooseCity")}</div>
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
                className={`ghost-button ${selectedLeaderboardCity === "" ? "active-filter-button" : ""}`}
                type="button"
                onClick={() => {
                  setSelectedLeaderboardCity("");
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
                        className={`ghost-button ${selectedLeaderboardCity === toCitySlug(city) ? "active-filter-button" : ""}`}
                        type="button"
                        onClick={() => {
                          const country = CITY_COUNTRY_MAP[toCitySlug(city)] || "";
                          setSelectedLeaderboardCountry(country);
                          setSelectedLeaderboardCity(toCitySlug(city));
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
