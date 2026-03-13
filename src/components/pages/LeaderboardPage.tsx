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
  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">Leaderboard</h1>
        <p className="sub-page-description">Quarter board. Proof first.</p>
        <div className="section-jump-strip">
          <a className="mini-chip active" href="#leaderboard-filter">Filter</a>
          <a className="mini-chip" href="#leaderboard-podium">Top</a>
          <a className="mini-chip" href="#leaderboard-list">Board</a>
        </div>
        <div className="surface-story-strip">
          <div className="mini-chip active">{publicQuarterLabel || "Current quarter"}</div>
          <div className="mini-chip">{selectedLeaderboardCity ? `${getCityLabel(selectedLeaderboardCity)} board` : "All cities board"}</div>
          <div className="mini-chip">Proof leads, closes settle ties</div>
        </div>
      </section>

      <section className="builder-grid single reveals">
        <div className="glass-card form-card">
          <div className="leaderboard-public-head" id="leaderboard-filter">
            <div>
              <div className="form-title">{publicQuarterLabel || "Current quarter"}</div>
              <div className="form-subtitle">Pick a city.</div>
            </div>
            <div className="pill-group">
              <button type="button" className={`pill ${selectedLeaderboardCity === "" ? "active" : ""}`} onClick={() => setSelectedLeaderboardCity("")}>All cities</button>
              {cityPresets.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`pill ${selectedLeaderboardCity === toCitySlug(city) ? "active" : ""}`}
                  onClick={() => setSelectedLeaderboardCity(toCitySlug(city))}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          {isLoadingPublicLeaderboard && <div className="status-message">Loading leaderboard…</div>}
          {!isLoadingPublicLeaderboard && publicLeaderboard.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-title">No board yet</div>
              <div className="empty-state-body">Post proof. Wake it up.</div>
            </div>
          )}
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
    </div>
  );
}
