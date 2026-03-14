import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

type PublicLeaderboardEntry = {
  user_id: string;
  rider_name: string;
  public_proofs: number;
  finished_runs: number;
  rank: number;
};

type LeaderboardPageProps = {
  publicQuarterLabel: string;
  selectedLeaderboardCity: string;
  setSelectedLeaderboardCity: (value: string) => void;
  cityPresets: string[];
  toCitySlug: (value?: string) => string;
  getCityLabel: (value?: string) => string;
  isLoadingPublicLeaderboard: boolean;
  publicLeaderboard: PublicLeaderboardEntry[];
  onOpenRiderProfile: (userId?: string) => void;
};

export default function LeaderboardPage({
  publicQuarterLabel,
  selectedLeaderboardCity,
  setSelectedLeaderboardCity,
  cityPresets,
  toCitySlug,
  getCityLabel,
  isLoadingPublicLeaderboard,
  publicLeaderboard,
  onOpenRiderProfile,
}: LeaderboardPageProps) {
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cityGroups = useMemo(() => [
    {
      label: "Americas",
      cities: cityPresets
        .filter((city) => ["Bogota", "Buenos Aires", "Chicago", "Los Angeles", "Mexico City", "New York", "Philadelphia", "San Francisco", "Santos", "Sao Paulo", "Seattle"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "leaderboard-city-group-americas",
    },
    {
      label: "Europe",
      cities: cityPresets
        .filter((city) => ["Amsterdam", "Barcelona", "Berlin", "Krakow", "London", "Milan", "Paris", "Vienna", "Warsaw"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "leaderboard-city-group-europe",
    },
    {
      label: "Asia",
      cities: cityPresets
        .filter((city) => ["Bangkok", "Seoul", "Taipei", "Tokyo"].includes(city))
        .sort((a, b) => a.localeCompare(b)),
      anchor: "leaderboard-city-group-asia",
    },
  ].filter((group) => group.cities.length > 0), [cityPresets]);

  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">Leaderboard</h1>
      </section>

      <section className="builder-grid single reveals">
        <div className="glass-card form-card">
          <div className="leaderboard-public-head" id="leaderboard-filter">
            <div className="form-title">{publicQuarterLabel || "Current quarter"}</div>
            <button type="button" className="inline-link-button wall-filter-link" onClick={() => setShowCityPicker(true)}>
              {selectedLeaderboardCity ? getCityLabel(selectedLeaderboardCity) : "All Cities"}
            </button>
          </div>
          {isLoadingPublicLeaderboard && <div className="status-message">Loading leaderboard…</div>}
          {!isLoadingPublicLeaderboard && publicLeaderboard.length === 0 && <div className="empty-state" />}
          {publicLeaderboard.length > 0 && (
            <div className="result-grid result-grid-three leaderboard-summary-grid">
              <div>
                <span>Ranked riders</span>
                <strong>{publicLeaderboard.length}</strong>
              </div>
              <div>
                <span>Total proofs</span>
                <strong>{publicLeaderboard.reduce((sum, entry) => sum + entry.public_proofs, 0)}</strong>
              </div>
              <div>
                <span>Total finishes</span>
                <strong>{publicLeaderboard.reduce((sum, entry) => sum + entry.finished_runs, 0)}</strong>
              </div>
            </div>
          )}
          {publicLeaderboard.length > 0 && (
            <div className="winner-callout">
              <span className="winner-label">Quarter leader</span>
              <strong>{publicLeaderboard[0].rider_name}</strong>
              <span>{publicLeaderboard[0].public_proofs} proofs · {publicLeaderboard[0].finished_runs} finishes</span>
            </div>
          )}
          {publicLeaderboard.length > 0 && (
            <div className="result-grid result-grid-three leaderboard-glance-grid">
              <div>
                <span>Current filter</span>
                <strong>{selectedLeaderboardCity ? getCityLabel(selectedLeaderboardCity) : "All cities"}</strong>
              </div>
              <div>
                <span>Leader share</span>
                <strong>
                  {Math.max(
                    1,
                    Math.round(
                      (publicLeaderboard[0].public_proofs /
                        Math.max(
                          1,
                          publicLeaderboard.reduce((sum, entry) => sum + entry.public_proofs, 0)
                        )) *
                        100
                    )
                  )}
                  %
                </strong>
              </div>
              <div>
                <span>Avg proofs</span>
                <strong>
                  {(
                    publicLeaderboard.reduce((sum, entry) => sum + entry.public_proofs, 0) /
                    Math.max(1, publicLeaderboard.length)
                  ).toFixed(1)}
                </strong>
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
                  <span className="winner-label">Top {entry.rank}</span>
                  <strong>{entry.rider_name}</strong>
                  <span>{entry.public_proofs} proofs · {entry.finished_runs} finishes</span>
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
                    <span>{entry.public_proofs} proofs · {entry.finished_runs} finishes</span>
                    <div className="leaderboard-meta-chips">
                      <span className="mini-chip active">Top {entry.rank}</span>
                      {entry.finished_runs > 0 && <span className="mini-chip">{entry.finished_runs} closed</span>}
                      {entry.public_proofs > 0 && <span className="mini-chip">{entry.public_proofs} posted</span>}
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
                className={`ghost-button ${selectedLeaderboardCity === "" ? "active-filter-button" : ""}`}
                type="button"
                onClick={() => {
                  setSelectedLeaderboardCity("");
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
                        className={`ghost-button ${selectedLeaderboardCity === toCitySlug(city) ? "active-filter-button" : ""}`}
                        type="button"
                        onClick={() => {
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
