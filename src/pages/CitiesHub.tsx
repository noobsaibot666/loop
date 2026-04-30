import React, { useEffect, useState } from "react";
import citiesHero from "../images/hero_19.png";
import { useCitiesStore } from "../store/useCitiesStore";
import { useNavigate } from "react-router-dom";
import CitiesPage from "../components/pages/CitiesPage";
import { useI18n } from "../i18n";

const CitiesHub: React.FC = () => {
  const navigate = useNavigate();
  const { cityLanes, isLoading, fetchCityLanes } = useCitiesStore();

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

  return (
    <CitiesPage
      cityLanes={cityLanes}
      isLoadingCityLanes={isLoading}
      onOpenMessengerCity={onOpenMessengerCity}
      onOpenWallCity={onOpenWallCity}
      onOpenLeaderboardCity={onOpenLeaderboardCity}
      heroImage={citiesHero}
    />
  );
};

export default CitiesHub;
