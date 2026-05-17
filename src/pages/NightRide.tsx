import React, {useEffect, useState} from 'react';
import nightRideHero from '../images/hero_18.png';
import {useI18n} from '../i18n';
import {useFeedStore} from '../store/useFeedStore';
import {useAuthStore} from '../store/useAuthStore';
import {useCreditStore} from '../store/useCreditStore';
import {useUIStore} from '../store/useUIStore';
import {API_BASE, supabase, NIGHT_RIDE_BUCKET} from '../config';
import {getJSON, postJSON} from '../utils/routeUtils';
import NightRidePage from '../components/pages/NightRidePage';

const NightRide: React.FC = () => {
  const {t} = useI18n();
  const {user} = useAuthStore();
  const {deviceId} = useUIStore();
  const {nightRidePosts, isLoadingNight, fetchNightRide, addNightRidePost} =
    useFeedStore();
  const {usage, fetchUsage} = useCreditStore();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchNightRide();
    if (user && deviceId) fetchUsage(user.id, deviceId);
  }, [user, deviceId, fetchNightRide, fetchUsage]);

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      if (!user) {
        setHistory([]);
        return;
      }
      try {
        const data = await getJSON<{sessions?: any[]}>('/api/night-rides/mine');
        if (!cancelled) setHistory(data.sessions || []);
      } catch {
        if (!cancelled) setHistory([]);
      }
    };
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const formatDate = (value?: string | null) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString();
  };

  const requireLogin = (message: string) => {
    // Optional: We could show the message via a toast, but for now just open the modal
    useUIStore.getState().setAuthMode('signin');
    useUIStore.getState().setAuthModalOpen(true);
  };

  return (
    <NightRidePage
      apiBase={API_BASE}
      user={user}
      supabase={supabase}
      bucketName={NIGHT_RIDE_BUCKET}
      totalCredits={
        (usage?.free_remaining || 0) + (usage?.credits_remaining || 0)
      }
      hasUnlimitedCredits={usage?.unlimited_credits || false}
      requireLogin={requireLogin}
      postJSON={postJSON}
      formatDate={formatDate}
      feed={nightRidePosts as any}
      history={history}
      onPostCreated={post => addNightRidePost(post as any)}
      heroImage={nightRideHero}
    />
  );
};

export default NightRide;
