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
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Ghost, ImagePlus, LocateFixed } from "lucide-react";

const CHECKPOINT_HELP_RADIUS_METERS = 250;

const formatMinutes = (seconds: number | null | undefined) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "--";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.max(0, Math.round(seconds % 60));
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
};

const distanceBetweenMeters = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const dLat = toRadians(end.lat - start.lat);
  const dLng = toRadians(end.lng - start.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const AlleycatMode: React.FC = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [showGhostPanel, setShowGhostPanel] = useState(false);
  const [comparisonNow, setComparisonNow] = useState(() => Date.now());
  const [checkpointOrder, setCheckpointOrder] = useState<string[]>([]);
  const [proofFiles, setProofFiles] = useState<Record<string, File | null>>({});
  const [hintUnlocked, setHintUnlocked] = useState<Record<string, boolean>>({});
  const [nearCheckpointId, setNearCheckpointId] = useState<string | null>(null);
  const cityMenuRef = useRef<HTMLDivElement | null>(null);
  const suggestionShellRef = useRef<HTMLDivElement | null>(null);
  const codeModalCardRef = useRef<HTMLDivElement | null>(null);
  const manifestResultRef = useRef<HTMLDivElement | null>(null);
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
    startRun,
    checkIn,
    setStatus,
    finishRun,
    abandonRun,
    restartRun,
    uploadProof,
    isUploading,
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

  useEffect(() => {
    if (!showCityMenu) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!cityMenuRef.current?.contains(event.target as Node)) {
        setShowCityMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCityMenu(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    const scrollTimer = window.setTimeout(() => {
      codeModalCardRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(scrollTimer);
    };
  }, [showCodeModal]);

  useEffect(() => {
    if (!manifest?.id) return;
    window.setTimeout(() => {
      manifestResultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [manifest?.id]);

  useEffect(() => {
    if (!manifest?.checkpoints?.length) {
      setCheckpointOrder([]);
      setProofFiles({});
      setHintUnlocked({});
      setNearCheckpointId(null);
      setShowGhostPanel(false);
      return;
    }
    setCheckpointOrder(manifest.checkpoints.map((checkpoint) => checkpoint.id));
    setProofFiles({});
    setHintUnlocked({});
    setNearCheckpointId(null);
    setShowGhostPanel(false);
  }, [manifest?.id, manifest?.checkpoints]);

  useEffect(() => {
    if (run?.status !== "active") return;
    const timer = window.setInterval(() => setComparisonNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [run?.status]);

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

  const moveCheckpoint = (checkpointId: string, direction: "up" | "down") => {
    setCheckpointOrder((current) => {
      const index = current.indexOf(checkpointId);
      if (index < 0) return current;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
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
  const manifestCheckpoints = manifest?.checkpoints || [];
  const orderedCheckpoints = useMemo(() => {
    if (!manifestCheckpoints.length) return [];
    const checkpointMap = new Map(manifestCheckpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
    const ordered = checkpointOrder
      .map((checkpointId) => checkpointMap.get(checkpointId))
      .filter((checkpoint): checkpoint is NonNullable<typeof checkpoint> => Boolean(checkpoint));
    const missing = manifestCheckpoints.filter((checkpoint) => !checkpointOrder.includes(checkpoint.id));
    return [...ordered, ...missing];
  }, [checkpointOrder, manifestCheckpoints]);
  const completedCheckpointIds = run?.completedIds || [];
  const checkinMap = run?.checkins || {};
  const completedCount = orderedCheckpoints.filter((checkpoint) => completedCheckpointIds.includes(checkpoint.id)).length;
  const totalCheckpoints = orderedCheckpoints.length;
  const hasActiveRun = run?.status === "active";
  const checkpointProofs = run?.proofs || [];
  const ghostTotalSeconds = manifest?.ghost_seconds ?? null;
  const riderElapsedSeconds = run
    ? run.finishSeconds ?? Math.max(0, Math.floor((comparisonNow - new Date(run.startedAt).getTime()) / 1000))
    : null;
  const ghostSplitSeconds = useMemo(() => {
    if (!orderedCheckpoints.length) return [] as number[];
    const totalSeconds = ghostTotalSeconds ?? Math.max(60, (manifest?.estimated_minutes || 1) * 60);
    return orderedCheckpoints.map((_, index) => Math.round((totalSeconds * (index + 1)) / (orderedCheckpoints.length + 1)));
  }, [ghostTotalSeconds, manifest?.estimated_minutes, orderedCheckpoints]);
  const completedCheckpointSequence = useMemo(
    () =>
      Object.entries(checkinMap)
        .sort((left, right) => new Date(left[1]).getTime() - new Date(right[1]).getTime())
        .map(([checkpointId]) => checkpointId),
    [checkinMap]
  );
  const completionOrderMap = useMemo(
    () =>
      completedCheckpointSequence.reduce<Record<string, number>>((acc, checkpointId, index) => {
        acc[checkpointId] = index;
        return acc;
      }, {}),
    [completedCheckpointSequence]
  );
  const riderCheckpointSeconds = (checkpointId: string) => {
    if (!run?.startedAt || !checkinMap[checkpointId]) return null;
    return Math.max(1, Math.round((new Date(checkinMap[checkpointId]).getTime() - new Date(run.startedAt).getTime()) / 1000));
  };
  const riderProgress = totalCheckpoints ? (completedCount / totalCheckpoints) * 100 : 0;
  const ghostProgress = totalCheckpoints && ghostSplitSeconds.length && riderElapsedSeconds !== null
    ? Math.min(100, (riderElapsedSeconds / (ghostTotalSeconds ?? ((manifest?.estimated_minutes || 1) * 60))) * 100)
    : 0;
  const latestCompletedCheckpointId = completedCheckpointSequence[completedCheckpointSequence.length - 1] || null;
  const latestCompletedOrder = latestCompletedCheckpointId ? completionOrderMap[latestCompletedCheckpointId] ?? null : null;
  const latestCheckpointActualSeconds = latestCompletedCheckpointId ? riderCheckpointSeconds(latestCompletedCheckpointId) : null;
  const riderCheckpointTarget = latestCompletedOrder !== null ? ghostSplitSeconds[latestCompletedOrder] : null;
  const riderDeltaSeconds = latestCheckpointActualSeconds !== null && riderCheckpointTarget !== null
    ? latestCheckpointActualSeconds - riderCheckpointTarget
    : null;
  const ghostStyleLabel = t(`alleycat.style.${manifest?.style || config.style}`);
  const ghostPressureLabel = t(`difficulty.${manifest?.difficulty || config.difficulty}`);
  const allCheckpointsCleared = totalCheckpoints > 0 && completedCount >= totalCheckpoints;
  const nextGhostSplitSeconds = completedCount < ghostSplitSeconds.length ? ghostSplitSeconds[completedCount] : null;
  const activeCheckpoint = hasActiveRun
    ? orderedCheckpoints.find((checkpoint) => !completedCheckpointIds.includes(checkpoint.id)) || null
    : null;
  const manifestRangeLabel = manifest?.range_km
    ? `${manifest.range_km.toFixed(1)} km`
    : `${manifest?.estimated_minutes || 0} min`;
  const manifestStartLabel = manifest?.start_label || manifest?.city || config.city;
  const manifestDistrictCount = manifest?.district_count || manifest?.checkpoint_count || 0;
  const resolvedShareCode = String(shareCode || challenge?.code || "").trim().toUpperCase();
  const manifestInsightCards = manifest
    ? [
        {
          label: t("alleycat.run.routeLine"),
          title: manifest.route_note,
          body: t("alleycat.result.routeLineBody", {
            start: manifestStartLabel,
            districts: manifestDistrictCount,
            range: manifestRangeLabel,
          }),
        },
        {
          label: t("alleycat.run.taskMix"),
          title: manifest.task_mix || t("alleycat.run.formatAny"),
          body: t("alleycat.result.taskMixBody", {
            taskMix: manifest.task_mix || t("alleycat.run.formatAny"),
            pressure: ghostPressureLabel,
          }),
        },
        {
          label: t("alleycat.run.finishCall"),
          title: manifest.finish_label,
          body: t("alleycat.result.finishCallBody", {
            finish: manifest.finish_label,
          }),
        },
        {
          label: t("alleycat.run.replayHook"),
          title: manifest.replay_hook || manifest.manifest_title,
          body: t("alleycat.result.replayHookBody", {
            count: manifest.checkpoint_count,
            city: manifest.city,
          }),
        },
      ]
    : [];

  useEffect(() => {
    if (!hasActiveRun || !activeCheckpoint || typeof navigator === "undefined" || !navigator.geolocation) {
      setNearCheckpointId(null);
      return;
    }
    let cancelled = false;
    const updateProximity = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          const meters = distanceBetweenMeters(
            { lat: position.coords.latitude, lng: position.coords.longitude },
            { lat: activeCheckpoint.lat, lng: activeCheckpoint.lng }
          );
          setNearCheckpointId(meters <= CHECKPOINT_HELP_RADIUS_METERS ? activeCheckpoint.id : null);
        },
        () => {
          if (!cancelled) setNearCheckpointId(null);
        },
        { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
      );
    };
    updateProximity();
    const timer = window.setInterval(updateProximity, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [hasActiveRun, activeCheckpoint?.id, activeCheckpoint?.lat, activeCheckpoint?.lng]);

  const unlockCheckpointHint = async (checkpoint: NonNullable<typeof orderedCheckpoints[number]>) => {
    setStatus("alleycat.status.checkingLocation");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("alleycat.status.hintFar");
      return;
    }
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 10000,
        })
      );
      const meters = distanceBetweenMeters(
        { lat: position.coords.latitude, lng: position.coords.longitude },
        { lat: checkpoint.lat, lng: checkpoint.lng }
      );
      const isNearby = meters <= CHECKPOINT_HELP_RADIUS_METERS;
      setNearCheckpointId(isNearby ? checkpoint.id : null);
      if (!isNearby) {
        setStatus("alleycat.status.hintFar");
        return;
      }
      setHintUnlocked((current) => ({ ...current, [checkpoint.id]: true }));
      setStatus("alleycat.status.hintReady");
    } catch {
      setStatus("alleycat.status.hintFar");
    }
  };

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
              <span>{t("alleycat.heroAction")}</span>
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
                              if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
                  <div className="search-input-wrapper" ref={suggestionShellRef}>
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
                              fetchSuggestions("");
                              if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
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
                  <div className="field-kicker field-kicker-ghost">{t("alleycat.ghostRiderIntro")}</div>
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
                      <div className="field-hint">{t("alleycat.ghostRiderHint")}</div>
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
                    {[4, 6, 8, 10, 12, 16].map((num) => (
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
                  {t("alleycat.haveCode")}
                </button>
              </div>
            </div>

            {status && <div className="status-message">{t(status)}</div>}

          </div>
        </div>
      </section>

      {manifest && (
        <section className="split-module reveals route-builder-section">
          <div className="module-content">
            <div ref={manifestResultRef} className="glass-card animation-slide-up manifest-result-panel" id="manifest-killer-result">
              <div className="manifest-result-header">
                <div className="messenger-output">
                  <div className="manifest-brief">
                    <div>
                      <div className="manifest-title">{manifest.manifest_title}</div>
                      <div className="manifest-subtitle">
                        {manifest.start_label
                          ? t("alleycat.result.summaryWithStart", {
                              city: manifest.city,
                              count: manifest.checkpoint_count,
                              minutes: manifest.estimated_minutes,
                              start: manifest.start_label,
                            })
                          : t("alleycat.result.summary", {
                              city: manifest.city,
                              count: manifest.checkpoint_count,
                              minutes: manifest.estimated_minutes,
                            })}
                      </div>
                      <div className="manifest-summary-strip">
                        <div className="manifest-summary-card">
                          <span>{t("alleycat.rideZone")}</span>
                          <strong>{manifestRangeLabel}</strong>
                        </div>
                        <div className="manifest-summary-card">
                          <span>{t("alleycat.run.format")}</span>
                          <strong>{ghostStyleLabel}</strong>
                        </div>
                        <div className="manifest-summary-card">
                          <span>{t("alleycat.checkpoints")}</span>
                          <strong>{completedCount}/{totalCheckpoints}</strong>
                        </div>
                      </div>
                      {!run ? (
                        <div className="manifest-top-actions">
                          <button className="primary-button" type="button" onClick={() => startRun(manifest.id)}>
                            {t("alleycat.result.start")}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="manifest-result-grid">
                    <div className="manifest-primary-stack">
                      <div className="manifest-notes manifest-insight-grid">
                        {manifestInsightCards.map((card) => (
                          <div key={card.label} className="manifest-note-card">
                            <span>{card.label}</span>
                            <strong>{card.title}</strong>
                            <p>{card.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="manifest-side-stack">
                      {resolvedShareCode && (
                        <div className="challenge-rivalry-card result-bridge-card">
                          <span>{t("alleycat.run.shareCode")}</span>
                          <strong className="share-code-value">{resolvedShareCode}</strong>
                          <em>{t("share.ready")}</em>
                        </div>
                      )}
                    </div>
                  </div>

                  <section className="manifest-checkpoint-section" id="manifest-checkpoints">
                    <div className="challenge-card-head">
                      <div>
                        <div className="manifest-subtitle">{t("alleycat.checkpoints")}</div>
                        <div className="challenge-card-copy">{t("alleycat.result.checkpointsBody")}</div>
                      </div>
                    </div>
                    <div className="checkpoint-list">
                      {orderedCheckpoints.map((checkpoint, index) => {
                        const isDone = completedCheckpointIds.includes(checkpoint.id);
                        const isNext = !isDone && completedCount === index;
                        const showHint = Boolean(hintUnlocked[checkpoint.id] || isDone);
                        const helpReady = Boolean(isNext && nearCheckpointId === checkpoint.id);
                        const proof = checkpointProofs.find((entry) => entry.checkpoint_id === checkpoint.id);
                        const completionIndex = completionOrderMap[checkpoint.id];
                        const actualCheckpointSeconds = riderCheckpointSeconds(checkpoint.id);
                        const ghostCheckpointSeconds = typeof completionIndex === "number"
                          ? ghostSplitSeconds[completionIndex]
                          : isNext && hasActiveRun
                            ? nextGhostSplitSeconds
                            : null;
                        const showGhostCheckpointRing = Boolean(
                          manifest.ghost_enabled && (hasActiveRun || run?.status === "finished") && ghostCheckpointSeconds !== null
                        );
                        const ghostCheckpointProgress = showGhostCheckpointRing && riderElapsedSeconds !== null && ghostCheckpointSeconds
                          ? Math.max(0, Math.min(100, (riderElapsedSeconds / ghostCheckpointSeconds) * 100))
                          : 0;
                        return (
                          <div key={checkpoint.id} className={`checkpoint-card ${isDone ? "done" : isNext ? "up-next" : ""} ${proof ? "proofed" : ""}`}>
                            <div className="checkpoint-header">
                              <div className="checkpoint-meta">
                                <span>CP {index + 1}</span>
                                <span>{checkpoint.district}</span>
                              </div>
                              <div className="checkpoint-header-tools">
                                {isDone ? (
                                  <div className="checkpoint-state-mark" aria-label={t("alleycat.result.checkpointDone")}>
                                    <Check size={16} />
                                  </div>
                                ) : null}
                                {showGhostCheckpointRing ? (
                                  <div
                                    className={`checkpoint-ghost-indicator ${ghostCheckpointProgress >= 100 ? "done" : ""}`}
                                    style={{ ["--ghost-ring-progress" as any]: `${ghostCheckpointProgress}%` }}
                                    title={`${t("alleycat.run.ghost")}: ${formatMinutes(ghostCheckpointSeconds)}`}
                                  >
                                    <div className="checkpoint-ghost-ring">
                                      <Ghost size={14} />
                                    </div>
                                    <span>{formatMinutes(ghostCheckpointSeconds)}</span>
                                  </div>
                                ) : null}
                                <div className="checkpoint-order-controls">
                                  <button type="button" className="ghost-button small checkpoint-order-button" onClick={() => moveCheckpoint(checkpoint.id, "up")} disabled={index === 0}>
                                    <ArrowUp size={14} />
                                  </button>
                                  <button type="button" className="ghost-button small checkpoint-order-button" onClick={() => moveCheckpoint(checkpoint.id, "down")} disabled={index === orderedCheckpoints.length - 1}>
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="checkpoint-name">{checkpoint.name}</div>
                            <div className="checkpoint-task">{checkpoint.task}</div>
                            {showHint && checkpoint.hint ? <div className="checkpoint-hint">{checkpoint.hint}</div> : null}
                            <div className="manifest-metrics checkpoint-split-grid">
                              <div>
                                <span>{t("alleycat.run.ghost")}</span>
                                <strong>{hasActiveRun || run?.status === "finished" ? formatMinutes(ghostCheckpointSeconds) : "--"}</strong>
                              </div>
                              <div>
                                <span>{t("alleycat.run.yourTime")}</span>
                                <strong>{actualCheckpointSeconds !== null ? formatMinutes(actualCheckpointSeconds) : "--"}</strong>
                              </div>
                            </div>
                            <div className="checkpoint-actions">
                              {hasActiveRun && isNext ? (
                                <>
                                  <button
                                    className={`ghost-button small checkpoint-help-button ${helpReady ? "ready" : ""}`}
                                    type="button"
                                    onClick={() => void unlockCheckpointHint(checkpoint)}
                                  >
                                    <LocateFixed size={14} />
                                    <span>{t("alleycat.result.hint")}</span>
                                  </button>
                                  <button className="primary-button small checkpoint-tick-button" type="button" onClick={() => checkIn(checkpoint.id)}>
                                  <Check size={14} />
                                  <span>{t("alleycat.result.checkpointClear")}</span>
                                </button>
                                </>
                              ) : null}
                              <span className={`checkpoint-state-text ${isDone ? "done" : isNext ? "next" : "waiting"}`}>
                                {isDone ? t("alleycat.result.checkpointDone") : isNext ? t("alleycat.result.checkpointNext") : t("alleycat.result.checkpointWaiting")}
                              </span>
                            </div>
                            {isDone ? (
                              <div className="proof-panel checkpoint-proof-panel">
                                <div className="proof-callout">
                                  <strong>{proof ? t("alleycat.result.proofReady") : t("alleycat.result.proofNeeded")}</strong>
                                  <span>{proof ? t("alleycat.result.proofReadyBody") : t("alleycat.result.proofNeededBody")}</span>
                                </div>
                                <div className="checkpoint-actions checkpoint-proof-actions">
                                  <label className="ghost-button small checkpoint-proof-picker">
                                    <ImagePlus size={14} />
                                    <span>{proofFiles[checkpoint.id]?.name || t("alleycat.result.pickProof")}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(event) =>
                                        setProofFiles((current) => ({
                                          ...current,
                                          [checkpoint.id]: event.target.files?.[0] || null,
                                        }))
                                      }
                                    />
                                  </label>
                                  <button
                                    className="primary-button small"
                                    type="button"
                                    disabled={Boolean(isUploading?.[checkpoint.id]) || (!proofFiles[checkpoint.id] && !proof)}
                                    onClick={() => {
                                      if (!proof && proofFiles[checkpoint.id]) {
                                        void uploadProof(checkpoint, proofFiles[checkpoint.id]).then(() =>
                                          setProofFiles((current) => ({ ...current, [checkpoint.id]: null }))
                                        );
                                      }
                                    }}
                                  >
                                    {proof ? t("alleycat.result.proofSent") : isUploading?.[checkpoint.id] ? t("alleycat.result.proofSending") : t("alleycat.result.sendProof")}
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                  {manifest.ghost_enabled ? (
                    <section className="ghost-preview-panel">
                      <div className="ghost-preview-card">
                        <button className="ghost-toggle-button" type="button" onClick={() => setShowGhostPanel((open) => !open)}>
                          <div>
                            <div className="manifest-subtitle">{t("alleycat.result.ghostToggle")}</div>
                            <div className="challenge-card-copy">
                              {t("alleycat.result.ghostStyleBody", {
                                style: ghostStyleLabel,
                                pressure: ghostPressureLabel,
                              })}
                            </div>
                          </div>
                          {showGhostPanel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {showGhostPanel ? (
                          <>
                            <div className="ghost-preview-shell">
                              <div className="ghost-preview-head">
                                <div>
                                  <div className="manifest-title">{manifest.ghost_label || t("alleycat.run.ghost")}</div>
                                  <p className="ghost-preview-copy">
                                    {hasActiveRun || run?.status === "finished"
                                      ? t("alleycat.result.ghostNoticeLive")
                                      : t("alleycat.result.ghostLockedBody")}
                                  </p>
                                </div>
                                <div className="ghost-preview-chip-row">
                                  <span className="status-chip open">{ghostPressureLabel}</span>
                                  <span className="status-chip">{ghostStyleLabel}</span>
                                </div>
                              </div>
                              <div className="manifest-metrics ghost-preview-metrics">
                                <div>
                                  <span>{t("alleycat.run.yourTime")}</span>
                                  <strong>{riderElapsedSeconds !== null ? formatMinutes(riderElapsedSeconds) : "--"}</strong>
                                </div>
                                <div>
                                  <span>{t("alleycat.result.nextGhostCall")}</span>
                                  <strong>
                                    {hasActiveRun || run?.status === "finished"
                                      ? formatMinutes(nextGhostSplitSeconds)
                                      : "--"}
                                  </strong>
                                </div>
                              </div>
                              <div className="ghost-preview-track">
                                <div className="ghost-preview-line">
                                  <div className="ghost-preview-marker ghost" style={{ left: `${ghostProgress}%` }} />
                                  <div className="ghost-preview-marker rider" style={{ left: `${riderProgress}%` }} />
                                </div>
                                <div className="ghost-preview-legend">
                                  <span>{t("alleycat.run.ghost")}</span>
                                  <span>{t("alleycat.run.yourTime")}</span>
                                </div>
                              </div>
                              <div className="ghost-split-grid">
                                {orderedCheckpoints.map((checkpoint, index) => {
                                  const done = completedCount > index;
                                  const next = completedCount === index;
                                  const splitTarget = ghostSplitSeconds[index];
                                  const splitActual = riderCheckpointSeconds(checkpoint.id);
                                  return (
                                    <div key={checkpoint.id} className={`ghost-split-card ${done ? "done" : next ? "next" : ""}`}>
                                      <div className="ghost-split-meta">
                                        <span>{`CP ${index + 1}`}</span>
                                        <span className={`ghost-split-status ${done ? "done" : next ? "next" : ""}`}>
                                          {done ? t("alleycat.result.ghostNoticeDone") : next ? t("alleycat.result.ghostNoticeLive") : t("alleycat.result.ghostNoticeStart")}
                                        </span>
                                      </div>
                                      <div className="ghost-split-name">{checkpoint.name}</div>
                                      <div className="manifest-metrics">
                                        <div>
                                          <span>{t("alleycat.run.ghost")}</span>
                                          <strong>{hasActiveRun || run?.status === "finished" ? formatMinutes(splitTarget) : "--"}</strong>
                                        </div>
                                        <div>
                                          <span>{t("alleycat.run.yourTime")}</span>
                                          <strong>{splitActual !== null ? formatMinutes(splitActual) : "--"}</strong>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="ghost-notice-card">
                                <strong>{t(allCheckpointsCleared ? "alleycat.result.ghostNoticeDone" : hasActiveRun ? "alleycat.result.ghostNoticeLive" : "alleycat.result.ghostNoticeStart")}</strong>
                                <span>
                                  {riderDeltaSeconds !== null
                                    ? t("alleycat.result.ghostNoticeDelta", {
                                        delta:
                                          riderDeltaSeconds === null
                                            ? "--"
                                            : `${riderDeltaSeconds > 0 ? "+" : "-"}${formatMinutes(Math.abs(riderDeltaSeconds))}`,
                                      })
                                    : t("alleycat.result.ghostNoticeStart")}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  <div className="route-actions manifest-result-actions">
                    {!run ? (
                      <button className="primary-button" type="button" onClick={() => startRun(manifest.id)}>
                        {t("alleycat.result.start")}
                      </button>
                    ) : null}
                    {hasActiveRun && allCheckpointsCleared ? (
                      <button className="primary-button" type="button" onClick={() => finishRun()}>
                        {t("alleycat.result.finish")}
                      </button>
                    ) : null}
                    {hasActiveRun && !allCheckpointsCleared ? (
                      <button className="ghost-button manifest-abandon-button" type="button" onClick={() => abandonRun()}>
                        {t("alleycat.result.abandon")}
                      </button>
                    ) : null}
                    {run && !hasActiveRun ? (
                      <button className="ghost-button" type="button" onClick={() => restartRun()}>
                        {t("alleycat.result.restart")}
                      </button>
                    ) : null}
                    <button className="ghost-button small" type="button" onClick={handleReset}>
                      {t("alleycat.result.reset")}
                    </button>
                  </div>

                  {challenge && (
                    <section className="challenge-board-shell" id="challenge-board">
                      <div className="challenge-board-header">
                        <div>
                          <div className="section-label">{t("alleycat.run.challengeBoard")}</div>
                          <div className="result-title">{t("alleycat.run.sharedStandings")}</div>
                        </div>
                        <div className="challenge-board-code">
                          <strong className="challenge-board-code-value">{challenge.code}</strong>
                          {challengeSummary?.status ? (
                            <span className={`challenge-board-status ${challengeSummary.status}`}>{challengeSummary.status}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="challenge-board-grid">
                        <div className="challenge-overview-card">
                          <div className="challenge-summary-copy">
                            <strong>
                              {challengeSummary?.winner_name
                                ? t("alleycat.board.winnerNow", { name: challengeSummary.winner_name })
                                : t("alleycat.board.pending")}
                            </strong>
                            <span>{challengeSummary?.rivalry || t("alleycat.board.pendingBody")}</span>
                          </div>
                          <div className="challenge-stats-grid">
                            <div className="challenge-stat">
                              <span>{t("alleycat.board.riders")}</span>
                              <strong>{finishedRiders}</strong>
                            </div>
                            <div className="challenge-stat">
                              <span>{t("alleycat.board.topTime")}</span>
                              <strong>{boardLeader?.best_seconds ? formatMinutes(boardLeader.best_seconds) : "--"}</strong>
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
                          <div className="leaderboard-list">
                            {leaderboard.map((entry, index) => (
                              <div key={`${entry.user_id}-${index}`} className="leaderboard-row">
                                <div className="leaderboard-rank">{index + 1}</div>
                                <div className="leaderboard-body">
                                  <strong>{entry.rider_name}</strong>
                                  <span>{entry.best_seconds ? formatMinutes(entry.best_seconds) : t("alleycat.board.waiting")}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
            ref={codeModalCardRef}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" id="share-code-modal-title">{t("alleycat.haveCode")}</div>
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
