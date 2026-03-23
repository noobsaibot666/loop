import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfileStore } from "../store/useProfileStore";
import RiderProfilePage from "../components/pages/RiderProfilePage";
import riderHero from "../images/hero_11.png"; // Placeholder for profile hero

const RiderProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publicProfile, isLoading, fetchPublicProfile } = useProfileStore();

  useEffect(() => {
    if (id) {
      fetchPublicProfile(id);
    }
  }, [id, fetchPublicProfile]);

  return (
    <RiderProfilePage
      isLoadingPublicRiderProfile={isLoading}
      publicRiderProfile={publicProfile}
      onOpenWallCity={(city) => navigate(`/wall${city ? `?city=${city}` : ''}`)}
      onOpenLeaderboardCity={(city) => navigate(`/leaderboard${city ? `?city=${city}` : ''}`)}
      onOpenRiderProfile={(userId) => navigate(`/rider/${userId}`)}
      heroImage={riderHero}
    />
  );
};

export default RiderProfile;
