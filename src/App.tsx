import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { I18nProvider } from "./i18n";
import { useAuthStore } from "./store/useAuthStore";
import { useUIStore } from "./store/useUIStore";
import { useCreditStore } from "./store/useCreditStore";
import { postJSON } from "./utils/routeUtils";
import MainLayout from "./components/MainLayout";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const LoopBuilder = lazy(() => import("./pages/LoopBuilder"));
const AlleycatMode = lazy(() => import("./pages/AlleycatMode"));
const WallOfFame = lazy(() => import("./pages/WallOfFame"));
const CitiesHub = lazy(() => import("./pages/CitiesHub"));
const RiderAccount = lazy(() => import("./pages/RiderAccount"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const NightRide = lazy(() => import("./pages/NightRide"));
const RiderProfile = lazy(() => import("./pages/RiderProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const App: React.FC = () => {
  const { initialize: initAuth, accessToken } = useAuthStore();
  const { initializeDeviceId } = useUIStore();
  const { fetchAccountSummary } = useCreditStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Global initializations
    initAuth();
    initializeDeviceId();
  }, [initAuth, initializeDeviceId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    const isMembership = params.get("membership") === "success";

    if (sessionId && isMembership && accessToken) {
      const verify = async () => {
        try {
          await postJSON("/api/stripe/verify-membership-session", { session_id: sessionId });
          fetchAccountSummary(accessToken);
          // Redirect to clean the URL
          navigate("/account", { replace: true });
        } catch (e) {
          console.error("Membership verification failed", e);
        }
      };
      verify();
    }
  }, [location, accessToken, navigate, fetchAccountSummary]);

  return (
    <I18nProvider>
      <Suspense fallback={<div className="loading-screen">LOADING LOOP...</div>}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/loop" element={<LoopBuilder />} />
            <Route path="/messenger" element={<AlleycatMode />} />
            <Route path="/wall" element={<WallOfFame />} />
            <Route path="/cities" element={<CitiesHub />} />
            <Route path="/account" element={<RiderAccount />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/night" element={<NightRide />} />
            <Route path="/rider/:id" element={<RiderProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </I18nProvider>
  );
};

export default App;
