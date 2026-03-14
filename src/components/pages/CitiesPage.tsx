import { useI18n } from "../../i18n";

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
  const { t } = useI18n();
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
    if (lane.status === "requested") return t("cities.fallback.requested");
    if (lane.status === "ready") return t("cities.fallback.ready");
    if (lane.status === "review") return t("cities.fallback.review");
    return t("cities.fallback.default");
  };

  return (
    <div className="sequential-layout sub-page">
      <section className="sub-page-header">
        <h1 className="sub-page-title">{t("cities.title")}</h1>
        <p className="sub-page-description">{t("cities.subtitle")}</p>
        <div className="surface-story-strip">
          <div className="mini-chip active">{t("cities.live", { count: liveCities.length })}</div>
          <div className="mini-chip">{t("cities.nextUp", { count: nextCities.length })}</div>
          <div className="mini-chip">{hottestAsk ? t("cities.hotAsk", { city: hottestAsk.city_name }) : t("cities.demandLive")}</div>
        </div>
      </section>

      {isLoadingCityLanes && (
        <section className="builder-grid single reveals">
          <div className="glass-card form-card">
            <div className="status-message">{t("cities.loading")}</div>
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
                    <span className="winner-label">{t("cities.leadLane")}</span>
                    <strong>{leadLane.city_name}</strong>
                    <span>{getLaneLine(leadLane)}</span>
                    <div className="mini-chip-row compact">
                      <div className="mini-chip active">{t("cities.liveSpots", { count: leadLane.active_checkpoint_count })}</div>
                      <div className="mini-chip">{t("cities.districts")}: {leadLane.district_count}</div>
                    </div>
                    <div className="city-lane-actions" id="cities-request">
                      <button className="primary-button small" type="button" onClick={() => onOpenMessengerCity(leadLane.city_name)}>
                        {t("cities.rideCity", { city: leadLane.city_name })}
                      </button>
                      <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(leadLane.city_name)}>
                        {t("common.wall")}
                      </button>
                      <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(leadLane.city_name)}>
                        {t("common.board")}
                      </button>
                    </div>
                  </div>
                )}
                {hottestAsk && (
                  <div className="wall-editorial-card city-editorial-card">
                    <span className="winner-label">{t("cities.hotAskTitle")}</span>
                    <strong>{hottestAsk.city_name}</strong>
                    <span>{t("cities.openAsks", { count: hottestAsk.open_request_count })}</span>
                    <div className="mini-chip-row compact">
                      <div className="mini-chip">{t("cities.totalAsks", { count: hottestAsk.demand_count })}</div>
                      <div className="mini-chip">{hottestAsk.status}</div>
                    </div>
                    <div className="city-lane-actions">
                      <button className="ghost-button small" type="button" onClick={() => onOpenCityRequest(hottestAsk.city_name)}>
                        {t("cities.pushCity", { city: hottestAsk.city_name })}
                      </button>
                      {hottestAsk.status !== "requested" && (
                        <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(hottestAsk.city_name)}>
                          {t("cities.openBoard")}
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
              <div className="form-title">{t("cities.liveNow")}</div>
              <div className="form-subtitle">{t("cities.pickLane")}</div>
              {liveCities.length === 0 && <div className="empty-state" />}
              {liveCities.length > 0 && (
                <div className="city-lane-grid">
                  {liveCities.map((lane) => (
                    <div key={lane.city_slug} className="glass-card city-lane-card">
                      <div className="city-lane-head">
                        <div>
                          <span className="winner-label">{t("cities.statusLive")}</span>
                          <strong>{lane.city_name}</strong>
                        </div>
                        <div className="mini-chip active">{t("cities.liveSpots", { count: lane.active_checkpoint_count })}</div>
                      </div>
                      <p className="city-lane-copy">{getLaneLine(lane)}</p>
                      <div className="result-grid result-grid-three city-lane-stats">
                        <div>
                          <span>{t("cities.districts")}</span>
                          <strong>{lane.district_count}</strong>
                        </div>
                        <div>
                          <span>{t("cities.demand")}</span>
                          <strong>{lane.demand_count}</strong>
                        </div>
                        <div>
                          <span>{t("cities.status")}</span>
                          <strong>{t("cities.statusLive")}</strong>
                        </div>
                      </div>
                      <div className="mini-chip-row compact">
                        <div className="mini-chip">{t("cities.runLane")}</div>
                        <div className="mini-chip">{t("cities.wallLane")}</div>
                        <div className="mini-chip">{t("cities.boardLane")}</div>
                      </div>
                      <div className="city-lane-actions">
                        <button className="primary-button small" type="button" onClick={() => onOpenMessengerCity(lane.city_name)}>
                          {t("cities.rideCity", { city: lane.city_name })}
                        </button>
                        <button className="ghost-button small" type="button" onClick={() => onOpenWallCity(lane.city_name)}>
                          {t("common.wall")}
                        </button>
                        <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(lane.city_name)}>
                          {t("common.board")}
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
              <div className="form-title">{t("cities.nextTitle")}</div>
              <div className="form-subtitle">{t("cities.nextSubtitle")}</div>
              {nextCities.length === 0 && <div className="empty-state" />}
              {nextCities.length > 0 && (
                <div className="city-lane-grid compact-grid">
                  {nextCities.map((lane) => (
                    <div key={lane.city_slug} className="glass-card city-lane-card pending">
                      <div className="city-lane-head">
                        <div>
                          <span className="winner-label">{lane.status === "requested" ? t("cities.requested") : lane.status === "ready" ? t("cities.ready") : lane.status === "review" ? t("cities.review") : t("cities.draft")}</span>
                          <strong>{lane.city_name}</strong>
                        </div>
                        <div className="mini-chip">{t("cities.asks", { count: lane.demand_count })}</div>
                      </div>
                      <p className="city-lane-copy">{getLaneLine(lane)}</p>
                      <div className="result-grid result-grid-three city-lane-stats">
                        <div>
                          <span>{t("cities.liveSpotsLabel")}</span>
                          <strong>{lane.active_checkpoint_count}</strong>
                        </div>
                        <div>
                          <span>{t("cities.districts")}</span>
                          <strong>{lane.district_count}</strong>
                        </div>
                        <div>
                          <span>{t("cities.openAsksLabel")}</span>
                          <strong>{lane.open_request_count}</strong>
                        </div>
                      </div>
                      <div className="mini-chip-row compact">
                        <div className="mini-chip">{t("cities.laneStatus", { status: lane.status })}</div>
                        <div className="mini-chip">{t("cities.queue")}</div>
                      </div>
                      <div className="city-lane-actions">
                        <button className="ghost-button small" type="button" onClick={() => onOpenCityRequest(lane.city_name)}>
                          {t("cities.pushCity", { city: lane.city_name })}
                        </button>
                        {lane.status !== "requested" && (
                          <button className="ghost-button small" type="button" onClick={() => onOpenLeaderboardCity(lane.city_name)}>
                            {t("cities.openBoard")}
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
