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

type CitiesPageProps = {
  cityLanes: CityLane[];
  isLoadingCityLanes: boolean;
  onOpenMessengerCity: (cityName?: string) => void;
  onOpenWallCity: (cityName?: string) => void;
  onOpenLeaderboardCity: (cityName?: string) => void;
  onOpenCityRequest: (cityName?: string) => void;
};

export default function CitiesPage({
  cityLanes,
  isLoadingCityLanes,
  onOpenMessengerCity,
  onOpenWallCity,
  onOpenLeaderboardCity,
  onOpenCityRequest,
}: CitiesPageProps) {
  const liveCities = cityLanes.filter((lane) => lane.status === "live");
  const nextCities = cityLanes.filter((lane) => lane.status !== "live");
  const leadLane = [...liveCities].sort((left, right) => {
    return (right.active_checkpoint_count + right.district_count) - (left.active_checkpoint_count + left.district_count);
  })[0];
  const hottestAsk = [...cityLanes]
    .filter((lane) => lane.demand_count > 0)
    .sort((left, right) => right.demand_count - left.demand_count)[0];

  const getLaneLine = (lane: CityLane) => {
    if (lane.route_note) return lane.route_note;
    if (lane.status === "requested") return "Riders are calling this lane up. Push it and move it into review.";
    if (lane.status === "ready") return "Draft is tight enough to ship. One clean publish move and it goes live.";
    if (lane.status === "review") return "The lane is rough-cut and waiting on a sharper review pass.";
    return "Built to stay tight, local, and sharp.";
  };

  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">City Lanes</h1>
        <p className="sub-page-description">Live lanes. Next lanes.</p>
        <div className="surface-story-strip">
          <div className="mini-chip active">{liveCities.length} live</div>
          <div className="mini-chip">{nextCities.length} next up</div>
          <div className="mini-chip">{hottestAsk ? `${hottestAsk.city_name} is the hot ask` : "Demand is live"}</div>
        </div>
      </section>

      {isLoadingCityLanes && (
        <section className="builder-grid single reveals">
          <div className="glass-card form-card">
            <div className="status-message">Loading city lanes…</div>
          </div>
        </section>
      )}

      {!isLoadingCityLanes && (
        <>
          {(leadLane || hottestAsk) && (
            <section className="builder-grid single reveals">
              <div className="wall-editorial-grid city-editorial-grid">
                {leadLane && (
                  <div className="wall-editorial-card city-editorial-card">
                    <span className="winner-label">Lead lane</span>
                    <strong>{leadLane.city_name}</strong>
                    <span>{getLaneLine(leadLane)}</span>
                    <div className="mini-chip-row compact">
                      <div className="mini-chip active">{leadLane.active_checkpoint_count} live spots</div>
                      <div className="mini-chip">{leadLane.district_count} districts</div>
                    </div>
                    <div className="city-lane-actions" id="cities-request">
                      <button className="primary-button small" type="button" onClick={() => onOpenMessengerCity(leadLane.city_name)}>
                        Ride {leadLane.city_name}
                      </button>
                      <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(leadLane.city_name)}>
                        Wall
                      </button>
                      <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(leadLane.city_name)}>
                        Board
                      </button>
                    </div>
                  </div>
                )}
                {hottestAsk && (
                  <div className="wall-editorial-card city-editorial-card">
                    <span className="winner-label">Hot ask</span>
                    <strong>{hottestAsk.city_name}</strong>
                    <span>{hottestAsk.open_request_count} open asks are pushing this lane up the stack.</span>
                    <div className="mini-chip-row compact">
                      <div className="mini-chip">{hottestAsk.demand_count} total asks</div>
                      <div className="mini-chip">{hottestAsk.status}</div>
                    </div>
                    <div className="city-lane-actions">
                      <button className="ghost-button small" type="button" onClick={() => onOpenCityRequest(hottestAsk.city_name)}>
                        Push {hottestAsk.city_name}
                      </button>
                      {hottestAsk.status !== "requested" && (
                        <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(hottestAsk.city_name)}>
                          Open city board
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="builder-grid single reveals" id="cities-live">
            <div className="glass-card form-card">
              <div className="form-title">Live now</div>
              <div className="form-subtitle">Pick a lane.</div>
              {liveCities.length === 0 && <div className="empty-state" />}
              {liveCities.length > 0 && (
                <div className="city-lane-grid">
                  {liveCities.map((lane) => (
                    <div key={lane.city_slug} className="glass-card city-lane-card">
                      <div className="city-lane-head">
                        <div>
                          <span className="winner-label">Live</span>
                          <strong>{lane.city_name}</strong>
                        </div>
                        <div className="mini-chip active">{lane.active_checkpoint_count} live spots</div>
                      </div>
                      <p className="city-lane-copy">{getLaneLine(lane)}</p>
                      <div className="result-grid result-grid-three city-lane-stats">
                        <div>
                          <span>Districts</span>
                          <strong>{lane.district_count}</strong>
                        </div>
                        <div>
                          <span>Demand</span>
                          <strong>{lane.demand_count}</strong>
                        </div>
                        <div>
                          <span>Status</span>
                          <strong>Live</strong>
                        </div>
                      </div>
                      <div className="mini-chip-row compact">
                        <div className="mini-chip">Run lane</div>
                        <div className="mini-chip">Wall lane</div>
                        <div className="mini-chip">Board lane</div>
                      </div>
                      <div className="city-lane-actions">
                        <button className="primary-button small" type="button" onClick={() => onOpenMessengerCity(lane.city_name)}>
                          Ride {lane.city_name}
                        </button>
                        <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(lane.city_name)}>
                          Wall
                        </button>
                        <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(lane.city_name)}>
                          Board
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="builder-grid single reveals" id="cities-next">
            <div className="glass-card form-card">
              <div className="form-title">Next up</div>
              <div className="form-subtitle">Demand and drafts.</div>
              {nextCities.length === 0 && <div className="empty-state" />}
              {nextCities.length > 0 && (
                <div className="city-lane-grid compact-grid">
                  {nextCities.map((lane) => (
                    <div key={lane.city_slug} className="glass-card city-lane-card pending">
                      <div className="city-lane-head">
                        <div>
                          <span className="winner-label">{lane.status === "requested" ? "Requested" : lane.status === "ready" ? "Ready" : lane.status === "review" ? "Review" : "Draft"}</span>
                          <strong>{lane.city_name}</strong>
                        </div>
                        <div className="mini-chip">{lane.demand_count} asks</div>
                      </div>
                      <p className="city-lane-copy">{getLaneLine(lane)}</p>
                      <div className="result-grid result-grid-three city-lane-stats">
                        <div>
                          <span>Live spots</span>
                          <strong>{lane.active_checkpoint_count}</strong>
                        </div>
                        <div>
                          <span>Districts</span>
                          <strong>{lane.district_count}</strong>
                        </div>
                        <div>
                          <span>Open asks</span>
                          <strong>{lane.open_request_count}</strong>
                        </div>
                      </div>
                      <div className="mini-chip-row compact">
                        <div className="mini-chip">{lane.status} lane</div>
                        <div className="mini-chip">Queue</div>
                      </div>
                      <div className="city-lane-actions">
                        <button className="ghost-button small" type="button" onClick={() => onOpenCityRequest(lane.city_name)}>
                          Push {lane.city_name}
                        </button>
                        {lane.status !== "requested" && (
                          <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(lane.city_name)}>
                            Open board
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
