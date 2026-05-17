import {create} from 'zustand';
import {postJSON} from '../utils/routeUtils';

interface ProfileState {
  publicProfile: any | null;
  isLoading: boolean;

  fetchPublicProfile: (userId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>(set => ({
  publicProfile: null,
  isLoading: false,

  fetchPublicProfile: async userId => {
    set({isLoading: true});
    try {
      const data = await postJSON<any>('/api/rider/profile', {user_id: userId});
      set({publicProfile: data.profile || null});
    } catch {
      set({publicProfile: null});
    } finally {
      set({isLoading: false});
    }
  },
}));
