import React, { useMemo, useEffect, useRef, useState } from "react";
import messengerHero from "../images/hero_26.png";
import Hero from "../components/Hero";
import { useI18n } from "../i18n";
import { useCreditStore } from "../store/useCreditStore";
import { useUIStore } from "../store/useUIStore";
import { useAlleycatStore } from "../store/useAlleycatStore";
import { useAuthStore } from "../store/useAuthStore";
import { ALLEYCAT_CITY_PRESETS, MESSENGER_CREDIT_COST } from "../config";
import { Link, useSearchParams } from "react-router-dom";

const AlleycatMode: React.FC = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const cityMenuRef = useRef<HTMLDivElement | null>(null);
  const {
    config, setConfig,
    manifest,
    status,
    run,
    challenge,
    challengeSummary,
    leaderboard,
    shareCode,
    shareCodeInput,
    isGenerating,
    isSharing,
    isLoadingShare,
    isSuggesting,
    suggestions,
    fetchSuggestions,
    generateManifest,
    setShareCodeInput,
    resetState,
    createShareCode,
    loadShareCode,
    fetchLeaderboard,
  } = useAlleycatStore();

  const { user } = useAuthStore();
  const { deviceId } = useUIStore();
  const { usage, fetchUsage } = useCreditStore();

  useEffect(() => {
    if (user && deviceId) fetchUsage(user.id, deviceId);
  }, [user, deviceId, fetchUsage]);

  useEffect(() => {
    if (user && (manifest || challenge)) {
      fetchLeaderboard(user.id);
    }
  }, [user, manifest?.id, challenge?.id, fetchLeaderboard]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (config.location.length >= 3 && !config.selectedCoords) {
        fetchSuggestions(config.location);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [config.location, config.selectedCoords, fetchSuggestions]);

  useEffect(() => {
    if (!showCityMenu) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!cityMenuRef.current?.contains(event.target as Node)) {
        setShowCityMenu(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showCityMenu]);

  useEffect(() => {
    const requestedCity = searchParams.get("city")?.trim();
    if (!requestedCity) return;
    const matchedCity = ALLEYCAT_CITY_PRESETS.find(
      (city) => city.toLowerCase() === requestedCity.toLowerCase()
    );
    if (!matchedCity || matchedCity === config.city) return;
    setConfig({ city: matchedCity });
  }, [searchParams, config.city, setConfig]);

  useEffect(() => {
    if (!showCodeModal) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCodeModal(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCodeModal]);

  const handleGenerate = () => {
    if (!user) {
      useUIStore.getState().setAuthMode("signin");
      useUIStore.getState().setAuthModalOpen(true);
      return;
    }
    generateManifest(user.id);
  };

  const handleReset = () => {
    resetState();
  };

  const handleOpenCodeModal = () => {
    if (!user) {
      useUIStore.getState().setAuthMode("signin");
      useUIStore.getState().setAuthModalOpen(true);
      return;
    }
    setShowCodeModal(true);
  };

  const minDistance = config.unit === "km" ? 5 : 3;
  const maxDistance = config.unit === "km" ? 80 : 50;
  const rangePercent = ((config.range - minDistance) / (maxDistance - minDistance)) * 100;

  const handleUnitChange = (next: "km" | "mi") => {
    if (next === config.unit) return;
    const converted = next === "km" ? config.range * 1.60934 : config.range / 1.60934;
    setConfig({ range: Number(converted.toFixed(1)), unit: next });
  };

  const steps = useMemo(() => [
    { number: "01", title: t("alleycat.step1.title"), body: t("alleycat.step1.body") },
    { number: "02", title: t("alleycat.step2.title"), body: t("alleycat.step2.body") },
    { number: "03", title: t("alleycat.step3.title"), body: t("alleycat.step3.body") },
    { number: "04", title: t("alleycat.step4.title"), body: t("alleycat.step4.body") },
  ], [t]);
  const hasUnlimitedCredits = Boolean(usage?.unlimited_credits);
  const messengerCreditsOnly = usage?.credits_remaining ?? 0;
  const canBuildManifest = Boolean(config.city && config.location.trim());
  const boardLeader = leaderboard[0] || null;
  const finishedRiders = leaderboard.filter((entry) => entry.best_seconds !== null).length;

  return (
    <div className="sequential-layout sub-page page-messenger page-stage-enter">
      <Hero
        title={t("alleycat.title")}
        subtitle={t("alleycat.subtitle")}
        image={messengerHero}
        actions={
          <div className="hero-actions-group">
            <button 
              className="accent-text-button" 
              onClick={() => document.getElementById('manifest-killer')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>{t("home.alleycat.action")}</span>
            </button>
          </div>
        }
      />

      <section className="modular-grid flow-grid flow-grid-four reveals route-steps-shell route-steps-shell-wide">
        {steps.map((step) => (
          <div key={step.number} className="module-card route-step-card">
            <div className="module-header route-step-header">
              <span className="module-number route-step-number">{step.number}</span>
              <h3 className="module-title route-step-title">{step.title}</h3>
            </div>
            <p className="module-body route-step-body">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="split-module reveals route-builder-section" id="manifest-killer">
        <div className="module-content">
          <div className="glass-card form-card premium-card active-premium manifest-killer-shell">
            <div className="form-header">
              <div>
                <h2 className="form-title">{t("alleycat.builderTitle")}</h2>
                <p className="form-subtitle">{t("alleycat.builderSubtitle")}</p>
              </div>
              <div className="loops-left">
                <span className="loops-left-line">
                  {hasUnlimitedCredits ? t("alleycat.creditsUnlimited") : t("credits.balance", { count: messengerCreditsOnly })}
                </span>
                <span className="loops-left-line">{t("alleycat.perManifest", { count: MESSENGER_CREDIT_COST })}</span>
              </div>
            </div>

            <div className="form-body">
              <div className="form-section section-block-clean messenger-stack-section">
                <label className="field">
                  <span>{t("alleycat.city")}</span>
                  <div className="custom-select-shell" ref={cityMenuRef}>
                    <button
                      type="button"
                      className={`custom-select-trigger ${showCityMenu ? "open" : ""}`}
                      onClick={() => setShowCityMenu((open) => !open)}
                      aria-haspopup="listbox"
                      aria-expanded={showCityMenu}
                    >
                      <span>{config.city || t("alleycat.chooseCity")}</span>
                    </button>
                    {showCityMenu && (
                      <div className="custom-select-menu glass-card" role="listbox">
                        {ALLEYCAT_CITY_PRESETS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`custom-select-option ${config.city === c ? "active" : ""}`}
                            onClick={() => {
                              setConfig({ city: c });
                              setShowCityMenu(false);
                            }}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
                <div className="field-inline-actions messenger-inline-link">
                  <Link className="text-link-button" to="/cities">
                    {t("alleycat.requestCity")}
                  </Link>
                </div>
                <label className="field">
                  <span>{t("alleycat.startArea")}</span>
                  <div className="search-input-wrapper">
                    <input 
                      value={config.location} 
                      onChange={(e) => setConfig({ location: e.target.value, selectedCoords: null })} 
                      placeholder={t("alleycat.startPlaceholder")} 
                    />
                    {isSuggesting && <div className="field-hint">{t("common.searching")}</div>}
                    {suggestions.length > 0 && !config.selectedCoords && (
                      <div className="suggestions glass-card">
                        {suggestions.map((item) => (
                          <button
                            key={`${item.lat},${item.lng}`}
                            type="button"
                            className="suggestion-item"
                            onClick={() => {
                              setConfig({
                                location: item.label,
                                selectedCoords: { lat: item.lat, lng: item.lng },
                              });
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="form-section section-block">
                <label className="field range-field">
                  <span>{t("alleycat.rideZone")}</span>
                  <div className="pill-group range-unit-toggle builder-option-grid builder-option-grid-2 messenger-unit-toggle">
                    <button 
                      type="button" 
                      className={`pill ${config.unit === "km" ? "active" : ""}`} 
                      onClick={() => handleUnitChange("km")}
                    >
                      {t("common.km")}
                    </button>
                    <button 
                      type="button" 
                      className={`pill ${config.unit === "mi" ? "active" : ""}`} 
                      onClick={() => handleUnitChange("mi")}
                    >
                      {t("common.miles")}
                    </button>
                  </div>
                  <input
                    type="range" min={minDistance} max={maxDistance} step="1" value={config.range}
                    onChange={(e) => setConfig({ range: Number(e.target.value) })}
                    style={{ ["--range-progress" as any]: `${rangePercent}%` }}
                  />
                  <div className="range-labels">
                    <span>{minDistance} {config.unit}</span>
                    <div className="range-focus-card"><strong>{config.range} {config.unit}</strong></div>
                    <span>{maxDistance} {config.unit}</span>
                  </div>
                </label>
              </div>

              <div className="form-section section-block">
                <label className="field">
                  <span>{t("alleycat.ghostRider")}</span>
                  <div className="field-hint">{t("alleycat.ghostRiderHint")}</div>
                  <div className="pill-group builder-option-grid builder-option-grid-2 messenger-ghost-toggle">
                    {[
                      { key: "off", value: false, label: t("common.off") },
                      { key: "on", value: true, label: t("common.on") },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={`pill ${config.useGhost === option.value ? "active" : ""}`}
                        onClick={() => setConfig({ useGhost: option.value })}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </label>
                <div
                  className={`ghost-pressure-shell ${config.useGhost ? "open" : ""}`}
                  aria-hidden={!config.useGhost}
                >
                  <div className="ghost-pressure-shell-inner">
                    <label className="field">
                      <span>{t("alleycat.pressure")}</span>
                      <div className="pill-group street-tone-group builder-option-grid builder-option-grid-3">
                        {["easy", "medium", "hard"].map((diff) => (
                          <button 
                            key={diff} 
                            type="button" 
                            className={`pill ${config.difficulty === diff ? "active" : ""}`} 
                            onClick={() => setConfig({ difficulty: diff })}
                          >
                            {t(`difficulty.${diff}`)}
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-section section-block">
                <label className="field">
                  <span>{t("alleycat.checkpoints")}</span>
                  <div className="pill-group checkpoint-count-grid builder-option-grid builder-option-grid-2 messenger-checkpoint-grid">
                    {[3, 4, 5, 6, 8, 10].map((num) => (
                      <button 
                        key={num} 
                        type="button" 
                        className={`pill ${config.checkpointCount === num ? "active" : ""}`} 
                        onClick={() => setConfig({ checkpointCount: num })}
                      >
                        {t("alleycat.stops", { count: num })}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="field">
                  <span>{t("alleycat.streetTone")}</span>
                  <div className="pill-group checkpoint-count-grid builder-option-grid builder-option-grid-3">
                    {["local", "fast", "chaotic"].map((mode) => (
                      <button 
                        key={mode} 
                        type="button" 
                        className={`pill ${config.style === mode ? "active" : ""}`} 
                        onClick={() => setConfig({ style: mode })}
                      >
                        {t(`alleycat.style.${mode}`)}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  className={`primary-button premium-button manifest-build-button ${canBuildManifest ? "ready" : ""}`}
                  onClick={handleGenerate} 
                  disabled={isGenerating || !canBuildManifest}
                >
                  {isGenerating ? t("common.building") : t("alleycat.build")}
                </button>
                {(manifest || run) && (
                  <button className="ghost-button" type="button" onClick={handleReset}>
                    {t("alleycat.reset")}
                  </button>
                )}
                {manifest && (
                  <button
                    className="share-manifest-button"
                    type="button"
                    onClick={createShareCode}
                    disabled={isSharing}
                  >
                    {isSharing ? t("alleycat.sharing") : t("alleycat.share")}
                  </button>
                )}
              </div>
              <div className="form-actions compact-actions messenger-code-entry">
                <button
                  className="text-link-button"
                  type="button"
                  onClick={handleOpenCodeModal}
                >
                  {t("share.title")}
                </button>
              </div>
            </div>

            {status && <div className="status-message">{t(status)}</div>}

            {manifest && (
              <div className="manifest-result-overlay glass-card animation-slide-up">
                <div className="messenger-output">
                  <div className="manifest-brief">
                    <div>
                      <div className="manifest-title">{manifest.manifest_title}</div>
                      <div className="manifest-subtitle">
                        {manifest.city} · {manifest.checkpoint_count} stops · {manifest.estimated_minutes} min est.
                        {manifest.start_label ? ` · near ${manifest.start_label}` : ""}
                      </div>
                    </div>
                    <div className="manifest-metrics">
                      {typeof manifest.ghost_seconds === "number" ? (
                        <div>
                          <span>{t("alleycat.run.ghost")}</span>
                          <strong>{Math.floor(manifest.ghost_seconds / 60)}m</strong>
                        </div>
                      ) : null}
                      <div>
                        <span>{t("alleycat.run.format")}</span>
                        <strong>{t("alleycat.run.formatAny")}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="manifest-notes">
                    <div className="manifest-note-card">
                      <span>{t("alleycat.run.routeLine")}</span>
                      <strong>{manifest.route_note}</strong>
                    </div>
                    {manifest.task_mix ? (
                      <div className="manifest-note-card">
                        <span>{t("alleycat.run.taskMix")}</span>
                        <strong>{manifest.task_mix}</strong>
                      </div>
                    ) : null}
                    <div className="manifest-note-card">
                      <span>{t("alleycat.run.finishCall")}</span>
                      <strong>{manifest.finish_label}</strong>
                    </div>
                    {manifest.replay_hook ? (
                      <div className="manifest-note-card">
                        <span>{t("alleycat.run.replayHook")}</span>
                        <strong>{manifest.replay_hook}</strong>
                      </div>
                    ) : null}
                  </div>

                  <div className="route-actions">
                    <Link to={`/messenger/manifest/${manifest.id}`} className="primary-button">
                      {t("alleycat.result.view")}
                    </Link>
                    <button className="ghost-button small" onClick={handleReset}>
                      {t("alleycat.result.reset")}
                    </button>
                  </div>

                  {(shareCode || challenge) && (
                    <div className="challenge-rivalry-card result-bridge-card">
                      <span>{t("alleycat.run.shareCode")}</span>
                      <strong>{shareCode || challenge?.code}</strong>
                      <em>{t("share.ready")}</em>
                    </div>
                  )}

                  {challenge && (
                    <section className="challenge-board-shell" id="challenge-board">
                      <div className="challenge-board-header">
                        <div>
                          <div className="section-label">{t("alleycat.run.challengeBoard")}</div>
                          <div className="result-title">{t("alleycat.run.sharedStandings")}</div>
                        </div>
                        <div className="challenge-board-code">
                          <span>{t("alleycat.run.code", { code: challenge.code })}</span>
                          {challengeSummary?.status ? (
                            <span className={`status-chip ${challengeSummary.status}`}>{challengeSummary.status}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="challenge-board-grid">
                        <div className="challenge-overview-card">
                          <div className="challenge-summary-copy">
                            <strong>
                              {challengeSummary?.winner_name
                                ? t("alleycat.board.winnerNow", { name: challengeSummary.winner_name })
                                : t("alleycat.board.noWinner")}
                            </strong>
                            <span>{challengeSummary?.rivalry || t("share.subtitle")}</span>
                          </div>

                          <div className="challenge-stats-grid">
                            <div className="challenge-stat">
                              <span>{t("alleycat.board.status")}</span>
                              <strong>{challengeSummary?.status || challenge.status || "open"}</strong>
                            </div>
                            <div className="challenge-stat">
                              <span>{t("alleycat.board.riders")}</span>
                              <strong>{leaderboard.length}</strong>
                            </div>
                            <div className="challenge-stat">
                              <span>{t("alleycat.board.finished")}</span>
                              <strong>{finishedRiders}</strong>
                            </div>
                            <div className="challenge-stat">
                              <span>{t("alleycat.board.bestTime")}</span>
                              <strong>
                                {boardLeader?.best_seconds !== null && boardLeader?.best_seconds !== undefined
                                  ? `${Math.floor(boardLeader.best_seconds / 60)}m`
                                  : "--:--"}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="challenge-leaderboard-card">
                          <div className="challenge-card-head">
                            <div>
                              <div className="manifest-subtitle">{t("alleycat.board.title")}</div>
                              <div className="challenge-card-copy">{t("alleycat.board.subtitle")}</div>
                            </div>
                          </div>
                          {!leaderboard.length ? (
                            <div className="empty-state">
                              <div className="empty-state-body">{t("share.ready")}</div>
                            </div>
                          ) : (
                            <div className="leaderboard-list compact-leaderboard-list">
                              {leaderboard.slice(0, 5).map((entry, index) => (
                                <div key={entry.user_id} className="leaderboard-row">
                                  <div className="leaderboard-rank">{index + 1}</div>
                                  <div className="leaderboard-meta">
                                    <strong>{entry.rider_name}</strong>
                                    <span>{entry.city_name || manifest.city}</span>
                                  </div>
                                  <div className="leaderboard-score">
                                    <strong>
                                      {entry.best_seconds !== null && entry.best_seconds !== undefined
                                        ? `${Math.floor(entry.best_seconds / 60)}m`
                                        : "--:--"}
                                    </strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {showCodeModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-code-modal-title"
          onClick={() => setShowCodeModal(false)}
        >
          <div
            className="modal-card messenger-code-modal animation-slide-up"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" id="share-code-modal-title">{t("share.title")}</div>
            </div>
            <div className="modal-body">
              <div className="form-section section-block-clean">
                <label className="field compact-field share-code-field">
                  <span>{t("share.code")}</span>
                  <input
                    type="text"
                    value={shareCodeInput}
                    onChange={(event) => setShareCodeInput(event.target.value)}
                    placeholder={t("share.placeholder")}
                    autoCapitalize="characters"
                    autoFocus
                  />
                </label>
              </div>
              <div className="form-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={async () => {
                    const loaded = await loadShareCode();
                    if (loaded) setShowCodeModal(false);
                  }}
                  disabled={isLoadingShare || !shareCodeInput.trim()}
                >
                  {isLoadingShare ? t("common.loading") : t("share.loadManifest")}
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => setShowCodeModal(false)}
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlleycatMode;
