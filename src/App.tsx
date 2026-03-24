import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { I18nProvider } from "./i18n";
import { useAuthStore } from "./store/useAuthStore";
import { useUIStore } from "./store/useUIStore";
import { useCreditStore } from "./store/useCreditStore";
import { postJSON } from "./utils/routeUtils";
import MainLayout from "./components/MainLayout";

const routeModuleLoaders = {
  Home: () => import("./pages/Home"),
  LoopBuilder: () => import("./pages/LoopBuilder"),
  AlleycatMode: () => import("./pages/AlleycatMode"),
  WallOfFame: () => import("./pages/WallOfFame"),
  CitiesHub: () => import("./pages/CitiesHub"),
  RiderAccount: () => import("./pages/RiderAccount"),
  Leaderboard: () => import("./pages/Leaderboard"),
  NightRide: () => import("./pages/NightRide"),
  RiderProfile: () => import("./pages/RiderProfile"),
  AdminDashboard: () => import("./pages/AdminDashboard"),
} as const;

const Home = lazy(routeModuleLoaders.Home);
const LoopBuilder = lazy(routeModuleLoaders.LoopBuilder);
const AlleycatMode = lazy(routeModuleLoaders.AlleycatMode);
const WallOfFame = lazy(routeModuleLoaders.WallOfFame);
const CitiesHub = lazy(routeModuleLoaders.CitiesHub);
const RiderAccount = lazy(routeModuleLoaders.RiderAccount);
const Leaderboard = lazy(routeModuleLoaders.Leaderboard);
const NightRide = lazy(routeModuleLoaders.NightRide);
const RiderProfile = lazy(routeModuleLoaders.RiderProfile);
const AdminDashboard = lazy(routeModuleLoaders.AdminDashboard);

const preloadRouteModules = () =>
  Promise.allSettled(Object.values(routeModuleLoaders).map((loadRoute) => loadRoute()));

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
    let cancelled = false;
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const warmRoutes = () => {
      if (cancelled) return;
      void preloadRouteModules();
    };

    if ("requestIdleCallback" in window) {
      idleHandle = (window as Window & typeof globalThis & {
        requestIdleCallback: (callback: IdleRequestCallback) => number;
      }).requestIdleCallback(() => warmRoutes());
    } else {
      timeoutHandle = globalThis.setTimeout(warmRoutes, 900);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null && "cancelIdleCallback" in window) {
        (window as Window & typeof globalThis & {
          cancelIdleCallback: (handle: number) => void;
        }).cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        globalThis.clearTimeout(timeoutHandle);
      }
    };
  }, []);

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
