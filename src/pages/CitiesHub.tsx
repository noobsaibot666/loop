import React, { useEffect, useState } from "react";
import citiesHero from "../images/hero_19.png";
import { useCitiesStore } from "../store/useCitiesStore";
import { useNavigate } from "react-router-dom";
import CitiesPage from "../components/pages/CitiesPage";
import { useI18n } from "../i18n";

const CitiesHub: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { cityLanes, isLoading, fetchCityLanes, requestCity } = useCitiesStore();
  const [requestStatus, setRequestStatus] = useState("");

  useEffect(() => {
    fetchCityLanes();
  }, [fetchCityLanes]);

  const onOpenMessengerCity = (cityName?: string) => {
    navigate(`/messenger${cityName ? `?city=${cityName}` : ''}`);
  };

  const onOpenWallCity = (cityName?: string) => {
    navigate(`/wall${cityName ? `?city=${cityName}` : ''}`);
  };

  const onOpenLeaderboardCity = (cityName?: string) => {
    navigate(`/leaderboard${cityName ? `?city=${cityName}` : ''}`);
  };

  const onOpenCityRequest = async (cityName?: string) => {
    const targetCity = cityName?.trim();
    if (!targetCity) return;
    try {
      await requestCity(targetCity);
      setRequestStatus(t("cities.requestSent", { city: targetCity }));
      fetchCityLanes();
    } catch {
      setRequestStatus(t("cities.requestFailed"));
    }
  };

  return (
    <CitiesPage
      cityLanes={cityLanes}
      isLoadingCityLanes={isLoading}
      onOpenMessengerCity={onOpenMessengerCity}
      onOpenWallCity={onOpenWallCity}
      onOpenLeaderboardCity={onOpenLeaderboardCity}
      onOpenCityRequest={onOpenCityRequest}
      requestStatus={requestStatus}
      heroImage={citiesHero}
    />
  );
};

export default CitiesHub;
