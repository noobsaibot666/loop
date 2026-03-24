import React from "react";
import homeHero from "../images/hero_27.png";
import alleycatCardHero from "../images/hero_21.png";
import loopCardHero from "../images/hero_7.png";
import nightRideCardHero from "../images/hero_24.png";
import discordLogo from "../logos/Discord-Logo-Light-Blurple.png";
import stravaLogo from "../logos/Strava_idOGsGeeO9_0.svg";
import Hero from "../components/Hero";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";
import { CSSProperties } from "react";

const Home: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const badgeCities = React.useMemo(() => ["Curitiba/BR", "Munich/DE", "Guarulhos/BR"], []);
  const [currentBadgeIndex, setCurrentBadgeIndex] = React.useState(0);
  const [leavingBadgeIndex, setLeavingBadgeIndex] = React.useState<number | null>(null);
  const badgeSlideDurationMs = 520;
  const badgeHoldDurationMs = 2200;
  const badgeTotalDurationMs = badgeHoldDurationMs * badgeCities.length + 200;

  React.useEffect(() => {
    if (badgeCities.length <= 1) return;
    const timers: number[] = [];

    badgeCities.slice(1).forEach((_, nextOffset) => {
      const nextIndex = nextOffset + 1;
      timers.push(
        window.setTimeout(() => {
          setLeavingBadgeIndex(nextIndex - 1);
          setCurrentBadgeIndex(nextIndex);
        }, badgeHoldDurationMs * nextIndex)
      );
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [badgeCities, badgeHoldDurationMs]);

  React.useEffect(() => {
    if (leavingBadgeIndex === null) return;
    const clearTimer = window.setTimeout(() => setLeavingBadgeIndex(null), badgeSlideDurationMs);
    return () => window.clearTimeout(clearTimer);
  }, [leavingBadgeIndex, badgeSlideDurationMs]);

  return (
    <div className="sequential-layout page-home page-stage-enter">
      <Hero
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        image={homeHero}
        actions={null}
        badgeDurationMs={badgeTotalDurationMs}
        badge={
          <div className="hero-badge-pill">
            <span className="badge-tag">{t("cities.newCity")}</span>
            <span className="badge-label-viewport" aria-live="polite">
              {leavingBadgeIndex !== null ? (
                <span className="badge-label badge-label-leaving badge-label-out">{badgeCities[leavingBadgeIndex]}</span>
              ) : null}
              <span className={`badge-label badge-label-current ${leavingBadgeIndex !== null ? "badge-label-in" : ""}`}>
                {badgeCities[currentBadgeIndex]}
              </span>
            </span>
          </div>
        }
      />

      <section className="modular-grid home-modular-grid reveals">
        <div
          className="modular-cell modular-cell-featured home-mode-card"
          style={{ "--home-card-image": `url(${alleycatCardHero})` } as CSSProperties}
        >
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.alleycat.title")}</h3>
            <span className="home-card-pill">{t("home.modePill")}</span>
          </div>
          <p className="cell-body">{t("home.alleycat.body")}</p>
          <button className="primary-button primary-button-flat small home-card-button" onClick={() => navigate('/messenger')}>
            {t("home.alleycat.action")}
          </button>
        </div>
        <div
          className="modular-cell home-mode-card"
          style={{ "--home-card-image": `url(${loopCardHero})` } as CSSProperties}
        >
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.loop.title")}</h3>
            <span className="home-card-pill">{t("home.modePill")}</span>
          </div>
          <p className="cell-body">{t("home.loop.body")}</p>
          <button className="ghost-button small home-card-button" onClick={() => navigate('/loop')}>{t("home.loop.action")}</button>
        </div>
        <div
          className="modular-cell modular-cell-night home-mode-card"
          style={{ "--home-card-image": `url(${nightRideCardHero})` } as CSSProperties}
        >
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.night.title")}</h3>
            <span className="home-card-pill">{t("home.modePill")}</span>
          </div>
          <p className="cell-body">{t("home.night.body")}</p>
          <button className="primary-button primary-button-flat small home-card-button" onClick={() => navigate('/night')}>
            {t("home.night.action")}
          </button>
        </div>
      </section>

      <section className="modular-grid reveals home-lower-grid">
        <div className="modular-cell home-community-card">
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.community.title")}</h3>
            <span className="home-card-pill">{t("home.community.pill")}</span>
          </div>
          <p className="cell-body">{t("home.community.header")}</p>
          <div className="home-community-list">
            <span>• {t("home.community.line1")}</span>
            <span>• {t("home.community.line2")}</span>
            <span>• {t("home.community.line3")}</span>
          </div>
          <a
            className="ghost-button small home-card-button home-community-action"
            href="https://discord.gg/hardchain"
            target="_blank"
            rel="noreferrer"
          >
            {t("home.community.action")}
          </a>
          <div className="home-community-brand-footer" aria-hidden="true">
            <img className="home-community-brand-mark home-community-brand-mark-large" src={discordLogo} alt="" />
          </div>
        </div>

        <div className="modular-cell modular-cell-community home-community-card">
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.community.strava.title")}</h3>
            <span className="home-card-pill">{t("home.community.strava.pill")}</span>
          </div>
          <p className="cell-body home-community-strava-body">{t("home.community.strava.body")}</p>
          <a
            className="home-community-ride-link"
            href="https://strava.app.link/uDsyfRxxI1b"
            target="_blank"
            rel="noreferrer"
          >
            <span className="home-community-ride-dot" aria-hidden="true" />
            <span>{t("home.community.strava.ride")}</span>
          </a>
          <a
            className="ghost-button small home-card-button home-card-button-inline home-community-action"
            href="https://strava.app.link/Zw7TiN8vI1b"
            target="_blank"
            rel="noreferrer"
          >
            <span>{t("home.community.strava.action")}</span>
          </a>
          <div className="home-community-brand-footer" aria-hidden="true">
            <img className="home-community-brand-mark home-community-brand-mark-large" src={stravaLogo} alt="" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
