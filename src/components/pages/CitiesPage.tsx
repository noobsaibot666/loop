import { useI18n } from "../../i18n";
import Hero from "../Hero";
import { MapPin, Zap, LayoutGrid, Trophy, ArrowRight, MessageSquare, Plus } from "lucide-react";

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
  heroImage?: string;
};

export default function CitiesPage({
  cityLanes,
  isLoadingCityLanes,
  onOpenWallCity,
  onOpenLeaderboardCity,
  onOpenCityRequest,
  heroImage,
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

  const getStatusLabel = (status: CityLane["status"]) =>
    status === "requested"
      ? t("cities.requested")
      : status === "ready"
        ? t("cities.ready")
        : status === "review"
          ? t("cities.review")
          : t("cities.draft");

  return (
    <div className="sequential-layout sub-page page-cities page-stage-enter">
      <Hero 
        title={t("cities.title")}
        subtitle={t("cities.subtitle")}
        image={heroImage || ""}
      />

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
              <div className="glass-card form-card city-editorial-section">
                <div className="wall-editorial-grid city-editorial-grid">
                  <div className="wall-editorial-card city-editorial-card editorial-growth">
                    <div className="editorial-eyebrow">
                      <Zap size={14} className="text-accent" />
                      <span className="winner-label">{t("cities.growthReport")}</span>
                    </div>
                    <div className="growth-list">
                      <div className="growth-item">
                        <strong>Guarulhos</strong>
                        <span className="mini-chip active">{t("cities.newCity")}</span>
                      </div>
                      <div className="growth-item">
                        <strong>São Paulo</strong>
                        <span className="mini-chip">{t("cities.expanded")}</span>
                      </div>
                    </div>
                  </div>
                  {leadLane && (
                    <div className="wall-editorial-card city-editorial-card editorial-hub">
                      <div className="editorial-eyebrow">
                        <Trophy size={14} className="text-accent" />
                        <span className="winner-label">{t("cities.operationalHub")}</span>
                      </div>
                      <strong>{leadLane.city_name}</strong>
                      <div className="mini-chip-row compact city-editorial-stats">
                        <div className="mini-chip active">
                          <Zap size={12} />
                          {leadLane.active_checkpoint_count}
                        </div>
                        <div className="mini-chip">
                          <MapPin size={12} />
                          {leadLane.district_count}
                        </div>
                      </div>
                      <div className="city-lane-actions city-lane-actions-compact">
                        <button className="ghost-button small city-action-secondary" type="button" onClick={() => onOpenWallCity(leadLane.city_name)}>
                          <LayoutGrid size={14} />
                          <span>{t("common.wall")}</span>
                        </button>
                        <button className="ghost-button small city-action-secondary" type="button" onClick={() => onOpenLeaderboardCity(leadLane.city_name)}>
                          <Trophy size={14} />
                          <span>{t("common.board")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {hottestAsk && (
                    <div className="wall-editorial-card city-editorial-card editorial-priority">
                      <div className="editorial-eyebrow">
                        <span className="winner-label">{t("cities.expansionPriority")}</span>
                      </div>
                      <strong>{hottestAsk.city_name}</strong>
                      <div className="mini-chip-row compact city-editorial-stats">
                        <div className="mini-chip active">
                          <span className="clue-tag">{t("cities.clueDemand")}</span>
                          {hottestAsk.demand_count}
                        </div>
                        <div className="mini-chip">
                          <span className="clue-tag">{t("cities.openAsksLabel")}</span>
                          {hottestAsk.open_request_count}
                        </div>
                      </div>
                      <div className="city-lane-actions city-lane-actions-compact">
                        <button className="primary-button small city-action-accent" type="button" onClick={() => onOpenCityRequest(hottestAsk.city_name)}>
                          {t("cities.pushCity", { city: hottestAsk.city_name })}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="builder-grid single reveals" id="cities-live">
            <div className="glass-card form-card">
              <div className="form-title">{t("cities.liveNow")}</div>
              {liveCities.length === 0 && <div className="empty-state" />}
              {liveCities.length > 0 && (
                <div className="city-lane-grid">
                  {liveCities.map((lane) => (
                    <div key={lane.city_slug} className="glass-card city-lane-card">
                      <div className="city-lane-header-premium">
                        <div className="lane-status-indicator">
                          <span className="status-dot status-dot-live" />
                          <Zap size={14} className="text-accent" />
                          <span className="lane-count">{lane.active_checkpoint_count}</span>
                        </div>
                        <strong>{lane.city_name}</strong>
                      </div>
                      
                      <div className="city-lane-meta">
                        <div className="city-lane-stats-box">
                          <div className="city-lane-stat-item">
                            <MapPin size={12} />
                            <span>{t("cities.districts")}</span>
                            <strong>{lane.district_count}</strong>
                          </div>
                          <div className="city-lane-stat-item">
                            <Plus size={12} />
                            <span>{t("cities.demandLabel")}</span>
                            <strong>{lane.demand_count}</strong>
                          </div>
                        </div>
                        <div className="city-lane-actions city-lane-actions-compact">
                          <button className="ghost-button small city-action-secondary" type="button" onClick={() => onOpenWallCity(lane.city_name)}>
                            {t("common.wall")}
                          </button>
                          <button className="ghost-button small city-action-secondary" type="button" onClick={() => onOpenLeaderboardCity(lane.city_name)}>
                            {t("common.board")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="builder-grid single reveals" id="cities-next">
            <div className="glass-card form-card">
              <section className="section-head">
                <div className="form-title">{t("cities.nextTitle")}</div>
                <div className="form-subtitle">{t("cities.nextSubtitle")}</div>
              </section>
              {nextCities.length === 0 && <div className="empty-state" />}
              {nextCities.length > 0 && (
                <div className="city-lane-grid compact-grid">
                  {nextCities.map((lane) => (
                    <div key={lane.city_slug} className="glass-card city-lane-card pending">
                      <div className="city-lane-header-premium">
                        <div className="lane-status-indicator">
                          <span className="winner-label">{getStatusLabel(lane.status)}</span>
                        </div>
                        <strong>{lane.city_name}</strong>
                      </div>

                      <div className="city-lane-meta">
                        <div className="city-lane-stats-box">
                          <div className="city-lane-stat-item">
                            <span>{t("cities.districts")}</span>
                            <strong>{lane.district_count}</strong>
                          </div>
                          <div className="city-lane-stat-item">
                            <span>{t("cities.clueDemand")}</span>
                            <strong>{lane.demand_count}</strong>
                          </div>
                        </div>
                        <div className="city-lane-actions">
                          <button className="primary-button small city-action-accent" type="button" onClick={() => onOpenCityRequest(lane.city_name)}>
                            {t("cities.pushCity", { city: lane.city_name })}
                          </button>
                          {lane.status !== "requested" && (
                            <button className="ghost-button small city-action-secondary" type="button" onClick={() => onOpenLeaderboardCity(lane.city_name)}>
                              {t("cities.openBoard")}
                            </button>
                          )}
                        </div>
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
