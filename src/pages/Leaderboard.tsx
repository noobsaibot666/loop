import React, {useEffect, useState} from 'react';
import leaderboardHero from '../images/hero_8.png';
import {useI18n} from '../i18n';
import {useFeedStore} from '../store/useFeedStore';
import {ALLEYCAT_CITY_PRESETS, toCitySlug, getCityLabel} from '../config';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {postJSON} from '../utils/routeUtils';
import LeaderboardPage from '../components/pages/LeaderboardPage';

const Leaderboard: React.FC = () => {
  const {t} = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {selectedCity, setSelectedCity} = useFeedStore();

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('');
  const selectedCheckpointCount = searchParams.get('checkpoints')?.trim() || '';

  useEffect(() => {
    const requestedCity = searchParams.get('city')?.trim();
    const nextCity = requestedCity ? toCitySlug(requestedCity) : '';
    if (nextCity !== selectedCity) setSelectedCity(nextCity);
  }, [searchParams, selectedCity, setSelectedCity]);

  useEffect(() => {
    async function fetchPublicLeaderboard() {
      setIsLoading(true);
      try {
        const data = await postJSON<any>('/api/messenger/public-leaderboard', {
          city: selectedCity,
          country: selectedCountry,
          checkpoint_count: selectedCheckpointCount,
        });
        setLeaderboard(data.leaderboard || []);
      } catch {
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicLeaderboard();
  }, [selectedCity, selectedCountry, selectedCheckpointCount]);

  const handleSetSelectedCity = (value: string) => {
    setSelectedCity(value);
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set('city', value);
    else nextParams.delete('city');
    setSearchParams(nextParams);
  };

  const handleSetCheckpointCount = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) nextParams.set('checkpoints', value);
    else nextParams.delete('checkpoints');
    setSearchParams(nextParams);
  };

  return (
    <LeaderboardPage
      publicQuarterLabel={t('leaderboard.currentQuarter')}
      selectedLeaderboardCountry={selectedCountry}
      setSelectedLeaderboardCountry={setSelectedCountry}
      selectedLeaderboardCity={selectedCity}
      setSelectedLeaderboardCity={handleSetSelectedCity}
      selectedLeaderboardCheckpointCount={selectedCheckpointCount}
      setSelectedLeaderboardCheckpointCount={handleSetCheckpointCount}
      cityPresets={ALLEYCAT_CITY_PRESETS}
      toCitySlug={toCitySlug}
      getCityLabel={getCityLabel}
      isLoadingPublicLeaderboard={isLoading}
      publicLeaderboard={leaderboard}
      onOpenRiderProfile={userId => navigate(`/rider/${userId}`)}
      heroImage={leaderboardHero}
    />
  );
};

export default Leaderboard;
