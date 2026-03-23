import React, { useEffect, useState } from "react";
import leaderboardHero from "../images/hero_8.png";
import { useI18n } from "../i18n";
import { useFeedStore } from "../store/useFeedStore";
import { ALLEYCAT_CITY_PRESETS, toCitySlug, getCityLabel } from "../config";
import { useNavigate, useSearchParams } from "react-router-dom";
import { postJSON } from "../utils/routeUtils";
import LeaderboardPage from "../components/pages/LeaderboardPage";

const Leaderboard: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedCity, setSelectedCity } = useFeedStore();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    const requestedCity = searchParams.get("city")?.trim();
    const nextCity = requestedCity ? toCitySlug(requestedCity) : "";
    if (nextCity !== selectedCity) setSelectedCity(nextCity);
  }, [searchParams, selectedCity, setSelectedCity]);

  useEffect(() => {
    async function fetchPublicLeaderboard() {
      setIsLoading(true);
      try {
        const data = await postJSON<any>("/api/messenger/public-leaderboard", { 
          city: selectedCity,
          country: selectedCountry 
        });
        setLeaderboard(data.leaderboard || []);
      } catch {
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicLeaderboard();
  }, [selectedCity, selectedCountry]);

  const handleSetSelectedCity = (value: string) => {
    setSelectedCity(value);
    if (value) setSearchParams({ city: value });
    else setSearchParams({});
  };

  return (
    <LeaderboardPage
      publicQuarterLabel={t("leaderboard.currentQuarter")}
      selectedLeaderboardCountry={selectedCountry}
      setSelectedLeaderboardCountry={setSelectedCountry}
      selectedLeaderboardCity={selectedCity}
      setSelectedLeaderboardCity={handleSetSelectedCity}
      cityPresets={ALLEYCAT_CITY_PRESETS}
      toCitySlug={toCitySlug}
      getCityLabel={getCityLabel}
      isLoadingPublicLeaderboard={isLoading}
      publicLeaderboard={leaderboard}
      onOpenRiderProfile={(userId) => navigate(`/rider/${userId}`)}
      heroImage={leaderboardHero}
    />
  );
};

export default Leaderboard;
