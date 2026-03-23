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

  useEffect(() => {
    const requestedCity = searchParams.get("city")?.trim();
    const nextCity = requestedCity ? toCitySlug(requestedCity) : "";
    if (nextCity !== selectedCity) setSelectedCity(nextCity);
  }, [searchParams, selectedCity, setSelectedCity]);

  useEffect(() => {
    fetchWall(selectedCity);
    fetchNightRide(selectedCity);
  }, [selectedCity, fetchWall, fetchNightRide]);

  const handleSetSelectedCity = (value: string) => {
    setSelectedCity(value);
    if (value) setSearchParams({ city: value });
    else setSearchParams({});
  };

  return (
    <WallPage
      publicQuarterLabel={t("leaderboard.currentQuarter")}
      selectedWallCity={selectedCity}
      setSelectedWallCity={handleSetSelectedCity}
      cityPresets={ALLEYCAT_CITY_PRESETS}
      toCitySlug={toCitySlug}
      getCityLabel={getCityLabel}
      isLoadingWall={isLoadingWall}
      wallPosts={wallPosts as any}
      nightRidePosts={nightRidePosts as any}
      onOpenRiderProfile={(userId) => navigate(`/rider/${userId}`)}
      onOpenWallCity={(cityName) => navigate(`/wall${cityName ? `?city=${toCitySlug(cityName)}` : ''}`)}
      onOpenLeaderboardCity={(cityName) => navigate(`/leaderboard${cityName ? `?city=${toCitySlug(cityName)}` : ''}`)}
      heroImage={wallHero}
    />
  );
};

export default WallOfFame;
