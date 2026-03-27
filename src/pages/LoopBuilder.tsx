import React, { useMemo, useEffect, useRef } from "react";
import loopHero from "../images/hero_9.png";
import Hero from "../components/Hero";
import { useI18n } from "../i18n";
import { useLoopStore } from "../store/useLoopStore";
import { useAuthStore } from "../store/useAuthStore";
import { useUIStore } from "../store/useUIStore";
import { useCreditStore } from "../store/useCreditStore";

const LoopBuilder: React.FC = () => {
  const { t } = useI18n();
  const {
    loopPoint, setLoopPoint,
    distance, setDistance,
    terrain, setTerrain,
    surface, setSurface,
    vibe, setVibe,
    unit, setUnit,
    selectedCoords, setSelectedCoords,
    lastRouteUrl, statusMessage,
    isGenerating, isSuggesting,
    suggestions, fetchSuggestions,
    generateLoop
  } = useLoopStore();

  const { user } = useAuthStore();
  const { deviceId } = useUIStore();
  const { usage, updateUsage } = useCreditStore();
  const suggestionShellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loopPoint.length >= 3 && !selectedCoords) {
        fetchSuggestions(loopPoint);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [loopPoint, selectedCoords, fetchSuggestions]);

  useEffect(() => {
    if (!suggestions.length) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!suggestionShellRef.current?.contains(event.target as Node)) {
        fetchSuggestions("");
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") fetchSuggestions("");
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestions.length, fetchSuggestions]);

  const handleGenerate = () => {
    if (!user) {
      useUIStore.getState().setAuthMode("signin");
      useUIStore.getState().setAuthModalOpen(true);
      return;
    }
    generateLoop(user.id, deviceId, usage || { free_remaining: 0, credits_remaining: 0, unlimited_credits: false }, updateUsage);
  };

  const handleCopy = async () => {
    if (!lastRouteUrl) return;
    try {
      await navigator.clipboard.writeText(lastRouteUrl);
    } catch {
      // no-op, parity fallback stays the open link action
    }
  };

  const minDistance = unit === "km" ? 5 : 3;
  const maxDistance = unit === "km" ? 80 : 50;
  const rangePercent = ((distance - minDistance) / (maxDistance - minDistance)) * 100;

  const handleUnitChange = (next: "km" | "mi") => {
    if (next === unit) return;
    const converted = next === "km" ? distance * 1.60934 : distance / 1.60934;
    setDistance(Number(converted.toFixed(1)));
    setUnit(next);
  };

  const loopSteps = useMemo(() => [
    { number: "01", title: t("loop.step1.title"), body: t("loop.step1.body") },
    { number: "02", title: t("loop.step2.title"), body: t("loop.step2.body") },
    { number: "03", title: t("loop.step3.title"), body: t("loop.step3.body") },
    { number: "04", title: t("loop.step4.title"), body: t("loop.step4.body") },
  ], [t]);
  const totalCredits = usage?.credits_remaining ?? 0;
  const hasUnlimitedCredits = Boolean(usage?.unlimited_credits);
  const canBuildLoop = Boolean(loopPoint.trim());

  return (
    <div className="sequential-layout sub-page page-loop page-stage-enter">
      <Hero
        title={t("loop.title")}
        subtitle={t("loop.subtitle")}
        image={loopHero}
        actions={
          <div className="hero-actions-group">
            <button 
              className="accent-text-button" 
              onClick={() => document.getElementById('loop-builder')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <span>{t("loop.heroAction")}</span>
            </button>
          </div>
        }
      />

      <section className="modular-grid flow-grid flow-grid-four reveals route-steps-shell route-steps-shell-wide">
        {loopSteps.map((step) => (
          <div key={step.number} className="module-card route-step-card">
            <div className="module-header route-step-header">
              <span className="module-number route-step-number">{step.number}</span>
              <h3 className="module-title route-step-title">{step.title}</h3>
            </div>
            <p className="module-body route-step-body">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="split-module reveals route-builder-section" id="loop-builder">
        <div className="module-content">
          <div className="glass-card form-card loop-builder-shell">
            <div className="form-header">
              <div>
                <h2 className="form-title">{t("loop.builderTitle")}</h2>
                <p className="form-subtitle">{t("loop.builderSubtitle")}</p>
              </div>
              {usage && (
                <div className="loops-left">
                  <span className="loops-left-line">
                    {hasUnlimitedCredits ? t("credits.unlimited") : t("credits.balance", { count: totalCredits })}
                  </span>
                  <span className="loops-left-line">
                    {hasUnlimitedCredits ? t("credits.admin") : t("credits.freeLeft", { count: usage.free_remaining })}
                  </span>
                </div>
              )}
            </div>

            <div className="form-body">
              <div className="form-section section-block-clean">
                <label className="field">
                  <span>{t("loop.startPoint")}</span>
                  <div className="search-input-wrapper" ref={suggestionShellRef}>
                    <input
                      type="text"
                      value={loopPoint}
                      onChange={(e) => {
                        setLoopPoint(e.target.value);
                        setSelectedCoords(null);
                      }}
                      placeholder={t("loop.startPlaceholder")}
                    />
                    {isSuggesting && <div className="field-hint">{t("common.searching")}</div>}
                    {suggestions.length > 0 && !selectedCoords && (
                      <div className="suggestions glass-card">
                        {suggestions.map((item: any) => (
                          <button
                            key={`${item.lat},${item.lng}`}
                            type="button"
                            className="suggestion-item"
                            onClick={() => {
                              setLoopPoint(item.label);
                              setSelectedCoords({ lat: item.lat, lng: item.lng });
                              fetchSuggestions("");
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
                  <span>{t("loop.distance")}</span>
                  <div className="pill-group range-unit-toggle builder-option-grid builder-option-grid-2 loop-unit-toggle">
                    <button 
                      type="button" 
                      className={`pill ${unit === "km" ? "active" : ""}`} 
                      onClick={() => handleUnitChange("km")}
                    >
                      {t("common.km")}
                    </button>
                    <button 
                      type="button" 
                      className={`pill ${unit === "mi" ? "active" : ""}`} 
                      onClick={() => handleUnitChange("mi")}
                    >
                      {t("common.miles")}
                    </button>
                  </div>
                  <input
                    type="range" min={minDistance} max={maxDistance} step="1" value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    style={{ ["--range-progress" as any]: `${rangePercent}%` }}
                  />
                  <div className="range-labels">
                    <span>{minDistance} {unit}</span>
                    <div className="range-focus-card"><strong>{distance} {unit}</strong></div>
                    <span>{maxDistance} {unit}</span>
                  </div>
                </label>
              </div>

              <div className="form-section section-block">
                <label className="field">
                  <span>{t("loop.terrain")}</span>
                  <div className="pill-group checkpoint-count-grid builder-option-grid builder-option-grid-4">
                    {[
                      ["mix", t("loop.terrain.mix")], 
                      ["road", t("loop.terrain.road")], 
                      ["climb", t("loop.terrain.climb")], 
                      ["coast", t("loop.terrain.coast")]
                    ].map(([val, lbl]) => (
                      <button 
                        key={val} 
                        type="button" 
                        className={`pill ${terrain === val ? "active" : ""}`} 
                        onClick={() => setTerrain(val)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="field">
                  <span>{t("loop.surface")}</span>
                  <div className="pill-group street-tone-group builder-option-grid builder-option-grid-3">
                    {[
                      ["paved", t("loop.surface.paved")], 
                      ["mixed", t("loop.surface.mixed")], 
                      ["gravel", t("loop.surface.gravel")]
                    ].map(([val, lbl]) => (
                      <button 
                        key={val} 
                        type="button" 
                        className={`pill ${surface === val ? "active" : ""}`} 
                        onClick={() => setSurface(val)}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="field">
                  <span>{t("loop.vibe")}</span>
                  <div className="pill-group checkpoint-count-grid builder-option-grid builder-option-grid-4">
                    {["Elegant", "Energy", "Scenic", "Climb"].map(v => (
                      <button 
                        key={v} 
                        type="button" 
                        className={`pill ${vibe === v ? "active" : ""}`} 
                        onClick={() => setVibe(v)}
                      >
                        {t(`loop.vibe.${v.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="form-actions">
                <button className={`primary-button manifest-build-button ${canBuildLoop ? "ready" : ""}`} onClick={handleGenerate} disabled={isGenerating || !canBuildLoop}>
                  {isGenerating ? t("common.building") : t("loop.build")}
                </button>
              </div>
            </div>

            {statusMessage && <div className="status-message">{t(statusMessage)}</div>}

            {lastRouteUrl && (
              <div className="route-output">
                <div className="manifest-brief">
                  <div>
                    <div className="manifest-title">{t("loop.result.title")}</div>
                    <div className="manifest-subtitle">{t("loop.result.body")}</div>
                  </div>
                </div>
                <div className="route-actions">
                  <button className="ghost-button small" type="button" onClick={handleCopy}>
                    {t("loop.copyLink")}
                  </button>
                  <a href={lastRouteUrl} target="_blank" rel="noopener noreferrer" className="primary-button small">
                    {t("loop.openMaps")}
                  </a>
                </div>
                <div className="loop-community-card">
                  <strong>{t("loop.result.communityTitle")}</strong>
                  <span>{t("loop.result.communityBody")}</span>
                  <a className="ghost-button small" href="https://discord.gg/hardchain" target="_blank" rel="noreferrer">
                    {t("loop.result.communityAction")}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LoopBuilder;
