import { create } from "zustand";

interface UIState {
  menuOpen: boolean;
  showLanguageMenu: boolean;
  mobileHeaderVisible: boolean;
  deviceId: string;
  authModalOpen: boolean;
  authMode: "signin" | "signup";
  setMenuOpen: (open: boolean) => void;
  setShowLanguageMenu: (show: boolean) => void;
  setMobileHeaderVisible: (visible: boolean) => void;
  setDeviceId: (id: string) => void;
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: "signin" | "signup") => void;
  initializeDeviceId: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  menuOpen: false,
  showLanguageMenu: false,
  mobileHeaderVisible: true,
  deviceId: "",
  authModalOpen: false,
  authMode: "signin",
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setShowLanguageMenu: (showLanguageMenu) => set({ showLanguageMenu }),
  setMobileHeaderVisible: (mobileHeaderVisible) => set({ mobileHeaderVisible }),
  setDeviceId: (deviceId) => set({ deviceId }),
  setAuthModalOpen: (authModalOpen) => set({ authModalOpen }),
  setAuthMode: (authMode) => set({ authMode }),
  initializeDeviceId: () => {
    const stored = localStorage.getItem("loop_device_id");
    if (stored) {
      set({ deviceId: stored });
    } else {
      const next = crypto.randomUUID();
      localStorage.setItem("loop_device_id", next);
      set({ deviceId: next });
    }
  },
}));
