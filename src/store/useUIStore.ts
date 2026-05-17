import {create} from 'zustand';

const createDeviceId = () => {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `loop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

interface UIState {
  menuOpen: boolean;
  showLanguageMenu: boolean;
  mobileHeaderVisible: boolean;
  deviceId: string;
  authModalOpen: boolean;
  authMode: 'signin' | 'signup';
  setMenuOpen: (open: boolean) => void;
  setShowLanguageMenu: (show: boolean) => void;
  setMobileHeaderVisible: (visible: boolean) => void;
  setDeviceId: (id: string) => void;
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: 'signin' | 'signup') => void;
  initializeDeviceId: () => void;
}

export const useUIStore = create<UIState>(set => ({
  menuOpen: false,
  showLanguageMenu: false,
  mobileHeaderVisible: true,
  deviceId: '',
  authModalOpen: false,
  authMode: 'signin',
  setMenuOpen: menuOpen => set({menuOpen}),
  setShowLanguageMenu: showLanguageMenu => set({showLanguageMenu}),
  setMobileHeaderVisible: mobileHeaderVisible => set({mobileHeaderVisible}),
  setDeviceId: deviceId => set({deviceId}),
  setAuthModalOpen: authModalOpen => set({authModalOpen}),
  setAuthMode: authMode => set({authMode}),
  initializeDeviceId: () => {
    const stored = localStorage.getItem('loop_device_id');
    if (stored) {
      set({deviceId: stored});
    } else {
      const next = createDeviceId();
      localStorage.setItem('loop_device_id', next);
      set({deviceId: next});
    }
  },
}));
