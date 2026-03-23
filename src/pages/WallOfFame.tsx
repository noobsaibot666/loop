import React, { useEffect } from "react";
import wallHero from "../images/hero_12.png";
import { useI18n } from "../i18n";
import { useFeedStore } from "../store/useFeedStore";
import { ALLEYCAT_CITY_PRESETS, toCitySlug, getCityLabel } from "../config";
import { useNavigate } from "react-router-dom";
import WallPage from "../components/pages/WallPage";

const WallOfFame: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { 
    wallPosts, nightRidePosts, isLoadingWall, fetchWall, fetchNightRide,
    selectedCity, setSelectedCity
  } = useFeedStore();

  useEffect(() => {
    fetchWall(selectedCity);
    fetchNightRide();
  }, [selectedCity, fetchWall, fetchNightRide]);

  return (
    <WallPage
      publicQuarterLabel={t("leaderboard.currentQuarter")}
      selectedWallCity={selectedCity}
      setSelectedWallCity={setSelectedCity}
      cityPresets={ALLEYCAT_CITY_PRESETS}
      toCitySlug={toCitySlug}
      getCityLabel={getCityLabel}
      isLoadingWall={isLoadingWall}
      wallPosts={wallPosts as any}
      nightRidePosts={nightRidePosts as any}
      onOpenRiderProfile={(userId) => navigate(`/rider/${userId}`)}
      onOpenWallCity={(cityName) => navigate(`/wall${cityName ? `?city=${cityName}` : ''}`)}
      onOpenLeaderboardCity={(cityName) => navigate(`/leaderboard${cityName ? `?city=${cityName}` : ''}`)}
      heroImage={wallHero}
    />
  );
};

export default WallOfFame;
