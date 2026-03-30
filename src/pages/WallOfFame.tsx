import React, { useEffect } from "react";
import wallHero from "../images/hero_12.png";
import { useI18n } from "../i18n";
import { useFeedStore } from "../store/useFeedStore";
import { ALLEYCAT_CITY_PRESETS, toCitySlug, getCityLabel } from "../config";
import { useNavigate, useSearchParams } from "react-router-dom";
import WallPage from "../components/pages/WallPage";

const WallOfFame: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    wallPosts, nightRidePosts, isLoadingWall, fetchWall, fetchNightRide,
    selectedCity, setSelectedCity
  } = useFeedStore();
  const selectedCheckpointCount = searchParams.get("checkpoints")?.trim() || "";

  useEffect(() => {
    const requestedCity = searchParams.get("city")?.trim();
    const nextCity = requestedCity ? toCitySlug(requestedCity) : "";
    if (nextCity !== selectedCity) setSelectedCity(nextCity);
  }, [searchParams, selectedCity, setSelectedCity]);

  useEffect(() => {
    fetchWall(selectedCity, selectedCheckpointCount);
    fetchNightRide(selectedCity);
  }, [selectedCity, selectedCheckpointCount, fetchWall, fetchNightRide]);

  const handleSetSelectedCity = (value: string) => {
    setSelectedCity(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set("city", value);
    else nextParams.delete("city");
    setSearchParams(nextParams);
  };

  const handleSetCheckpointCount = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set("checkpoints", value);
    else nextParams.delete("checkpoints");
    setSearchParams(nextParams);
  };

  return (
    <WallPage
      publicQuarterLabel={t("leaderboard.currentQuarter")}
      selectedWallCity={selectedCity}
      setSelectedWallCity={handleSetSelectedCity}
      selectedCheckpointCount={selectedCheckpointCount}
      setSelectedCheckpointCount={handleSetCheckpointCount}
      cityPresets={ALLEYCAT_CITY_PRESETS}
      toCitySlug={toCitySlug}
      getCityLabel={getCityLabel}
      isLoadingWall={isLoadingWall}
      wallPosts={wallPosts as any}
      nightRidePosts={nightRidePosts as any}
      onOpenRiderProfile={(userId) => navigate(`/rider/${userId}`)}
      onOpenWallCity={(cityName) => navigate(`/wall${cityName ? `?city=${toCitySlug(cityName)}` : ''}`)}
      onOpenLeaderboardCity={(cityName) => {
        const params = new URLSearchParams();
        if (cityName) params.set("city", toCitySlug(cityName));
        if (selectedCheckpointCount) params.set("checkpoints", selectedCheckpointCount);
        navigate(`/leaderboard${params.toString() ? `?${params.toString()}` : ""}`);
      }}
      heroImage={wallHero}
    />
  );
};

export default WallOfFame;
