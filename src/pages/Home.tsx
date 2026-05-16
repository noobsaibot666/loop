import React from "react";
import homeHero from "../images/dsktop_02.png";
import alleycatCardHero from "../images/hero_21.png";
import loopCardHero from "../images/hero_7.png";
import nightRideCardHero from "../images/hero_24.png";
import discordLogo from "../logos/Discord-Logo-Light-Blurple.png";
import stravaLogo from "../logos/Strava_idOGsGeeO9_0.svg";
import Hero from "../components/Hero";
import { useI18n } from "../i18n";
import { useLocation, useNavigate } from "react-router-dom";
import { CSSProperties } from "react";
import { X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useCreditStore } from "../store/useCreditStore";
import { useUIStore } from "../store/useUIStore";
import { postJSON } from "../utils/routeUtils";

const COMMUNITY_PRICE_CENTS = 500;
const COMMUNITY_CURRENCY = "usd";

const Home: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken } = useAuthStore();
  const { accountSummary, fetchAccountSummary } = useCreditStore();
  const { setAuthModalOpen, setAuthMode } = useUIStore();
  const [communityModalOpen, setCommunityModalOpen] = React.useState(false);
  const [communityBusy, setCommunityBusy] = React.useState<"checkout" | "invite" | "connect" | "portal" | null>(null);
  const [communityError, setCommunityError] = React.useState("");
  const activateCard = (path: string) => ({
    onClick: () => navigate(path),
    onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        navigate(path);
      }
    },
    role: "link" as const,
    tabIndex: 0,
  });
  const [badgeCities, setBadgeCities] = React.useState<string[]>(["Curitiba/BR", "Munich/DE", "Guarulhos/BR"]);
  const [currentBadgeIndex, setCurrentBadgeIndex] = React.useState(0);
  const [leavingBadgeIndex, setLeavingBadgeIndex] = React.useState<number | null>(null);
  const [badgeVisible, setBadgeVisible] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/notifications/announcements")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { cities?: Array<{ label: string; slug: string }> } | null) => {
        const nextCities = Array.isArray(data?.cities)
          ? data.cities.map((c) => c.label).filter(Boolean)
          : [];
        if (nextCities.length > 0) {
          setBadgeCities(nextCities);
          setCurrentBadgeIndex(0);
          setLeavingBadgeIndex(null);
          setBadgeVisible(true);
        }
      })
      .catch(() => null);
  }, []);
  const badgeSlideDurationMs = 420;
  const badgeHoldDurationMs = 1600;
  const badgeExitDelayMs = 180;
  const badgeHideDurationMs = 360;
  const badgeTotalDurationMs =
    badgeHoldDurationMs * badgeCities.length +
    badgeExitDelayMs +
    badgeHideDurationMs;

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
    const hideTimer = window.setTimeout(() => setBadgeVisible(false), badgeHoldDurationMs * badgeCities.length + badgeExitDelayMs);
    return () => window.clearTimeout(hideTimer);
  }, [badgeCities, badgeExitDelayMs, badgeHoldDurationMs]);

  React.useEffect(() => {
    if (leavingBadgeIndex === null) return;
    const clearTimer = window.setTimeout(() => setLeavingBadgeIndex(null), badgeSlideDurationMs);
    return () => window.clearTimeout(clearTimer);
  }, [leavingBadgeIndex, badgeSlideDurationMs]);

  React.useEffect(() => {
    if (!communityModalOpen || !accessToken || accountSummary) return;
    void fetchAccountSummary(accessToken);
  }, [communityModalOpen, accessToken, accountSummary, fetchAccountSummary]);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("community") !== "active") return;
    setCommunityModalOpen(true);
    navigate("/", { replace: true });
  }, [location.search, navigate]);

  React.useEffect(() => {
    if (!communityModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCommunityModalOpen(false);
    };
    document.body.classList.add("menu-open-lock");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("menu-open-lock");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [communityModalOpen]);

  const membership = accountSummary?.community_membership || null;
  const communityActive = Boolean(membership?.access_active);
  const discordReady = Boolean(
    membership?.discord_linked &&
      (!membership?.discord_role_status || membership?.discord_role_status === "granted")
  );

  const formatMoney = React.useCallback((amountCents: number, currency = "usd") => {
    const normalized = (currency || "usd").toUpperCase();
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: normalized,
        minimumFractionDigits: 0,
      }).format((amountCents || 0) / 100);
    } catch {
      return `${((amountCents || 0) / 100).toFixed(0)} ${normalized}`;
    }
  }, []);

  const communityPrice = formatMoney(
    membership?.price_cents ?? COMMUNITY_PRICE_CENTS,
    membership?.currency ?? COMMUNITY_CURRENCY
  );

  const handleCommunityAction = async () => {
    if (!user) {
      setCommunityModalOpen(false);
      setAuthMode("signin");
      setAuthModalOpen(true);
      return;
    }

    try {
      setCommunityError("");
      if (communityActive) {
        if (discordReady) {
          setCommunityBusy("invite");
          const { url } = await postJSON<{ url: string }>("/api/community-membership/access", {});
          window.location.href = url;
        } else {
          setCommunityBusy("connect");
          const { url } = await postJSON<{ url: string }>("/api/community-membership/discord-start", {});
          window.location.href = url;
        }
        return;
      }

      setCommunityBusy("checkout");
      const { url } = await postJSON<{ url: string }>("/api/create-membership-session", {});
      window.location.href = url;
    } catch (error: any) {
      setCommunityError(error?.message || t("common.requestFailed"));
    } finally {
      setCommunityBusy(null);
    }
  };

  const handleCommunityBilling = async () => {
    try {
      setCommunityError("");
      setCommunityBusy("portal");
      const { url } = await postJSON<{ url: string }>("/api/stripe/portal", {});
      window.location.href = url;
    } catch (error: any) {
      setCommunityError(error?.message || t("common.requestFailed"));
    } finally {
      setCommunityBusy(null);
    }
  };

  return (
    <div className="sequential-layout page-home page-stage-enter">
      <Hero
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        image={homeHero}
        actions={null}
        badgeDurationMs={badgeTotalDurationMs}
        badge={
          <div className={`hero-badge-pill ${badgeVisible ? "pill-appear" : "pill-hide"}`}>
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
          className="modular-cell home-mode-card"
          style={{ "--home-card-image": `url(${loopCardHero})` } as CSSProperties}
          {...activateCard("/loop")}
        >
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.loop.title")}</h3>
            <span className="home-card-pill">{t("home.modePill")}</span>
          </div>
          <p className="cell-body">{t("home.loop.body")}</p>
          <span className="ghost-button small home-card-button">{t("home.loop.action")}</span>
        </div>
        <div
          className="modular-cell modular-cell-featured home-mode-card"
          style={{ "--home-card-image": `url(${alleycatCardHero})` } as CSSProperties}
          {...activateCard("/messenger")}
        >
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.alleycat.title")}</h3>
            <span className="home-card-pill">{t("home.modePill")}</span>
          </div>
          <p className="cell-body">{t("home.alleycat.body")}</p>
          <span className="primary-button primary-button-flat small home-card-button">
            {t("home.alleycat.action")}
          </span>
        </div>
        <div
          className="modular-cell modular-cell-night home-mode-card"
          style={{ "--home-card-image": `url(${nightRideCardHero})` } as CSSProperties}
          {...activateCard("/night")}
        >
          <div className="home-card-title-row">
            <h3 className="cell-title">{t("home.night.title")}</h3>
            <span className="home-card-pill">{t("home.modePill")}</span>
          </div>
          <p className="cell-body">{t("home.night.body")}</p>
          <span className="primary-button primary-button-flat small home-card-button">
            {t("home.night.action")}
          </span>
        </div>
      </section>

      <section className="modular-grid reveals home-lower-grid">
        <div className="modular-cell home-community-card home-community-card-discord">
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
          <button
            type="button"
            className="ghost-button small home-card-button home-community-action"
            onClick={() => setCommunityModalOpen(true)}
          >
            <span>{t("home.community.action")}</span>
          </button>
          <button
            type="button"
            className="text-link-button home-community-about"
            onClick={() => navigate("/community")}
          >
            <span>{t("home.community.aboutAction")}</span>
          </button>
          <div className="home-community-brand-footer" aria-hidden="true">
            <img className="home-community-brand-mark home-community-brand-mark-large" src={discordLogo} alt="" />
          </div>
        </div>

        <div className="modular-cell modular-cell-community home-community-card home-community-card-strava">
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

      {communityModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setCommunityModalOpen(false)}>
          <div className="modal-card community-membership-modal animation-slide-up" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">{t("account.community.heroTitle")}</div>
                <div className="modal-subtitle">{t("account.community.heroSubtitle")}</div>
              </div>
              <button type="button" className="ghost-button small" onClick={() => setCommunityModalOpen(false)} aria-label={t("common.close")}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="community-membership-price-card">
                <span>{t("account.community.planName")}</span>
                <strong>{communityPrice}</strong>
              </div>
              <div className="community-membership-perks">
                <span>• {t("home.community.line1")}</span>
                <span>• {t("home.community.line2")}</span>
                <span>• {t("home.community.line3")}</span>
              </div>
              <div className="account-note community-membership-note">{t("account.community.modalNote")}</div>
              {communityError ? <div className="status-line error">{communityError}</div> : null}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="primary-button"
                  disabled={communityBusy !== null}
                  onClick={handleCommunityAction}
                >
                  {!user
                    ? t("nav.logIn")
                    : communityActive
                      ? discordReady
                        ? communityBusy === "invite"
                          ? t("account.community.openingInvite")
                          : t("account.community.openInvite")
                        : communityBusy === "connect"
                          ? t("account.community.connectingDiscord")
                          : t("account.community.connectDiscord")
                        : communityBusy === "checkout"
                        ? t("account.community.loading")
                        : t("account.community.action")}
                </button>
                {user && communityActive ? (
                  <button
                    type="button"
                    className="ghost-button community-membership-secondary-action"
                    disabled={communityBusy !== null}
                    onClick={handleCommunityBilling}
                  >
                    {communityBusy === "portal" ? t("common.working") : t("account.community.manageBilling")}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Home;
