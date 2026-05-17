import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {Usage, AccountSummary} from '../types';
import {postJSON} from '../utils/routeUtils';

interface CreditState {
  usage: Usage | null;
  accountSummary: AccountSummary | null;
  isLoading: boolean;

  fetchUsage: (userId: string, deviceId: string) => Promise<void>;
  fetchAccountSummary: (accessToken: string) => Promise<void>;
  updateUsage: (usage: Usage) => void;
}

export const useCreditStore = create<CreditState>()(
  persist(
    (set, get) => ({
      usage: null,
      accountSummary: null,
      isLoading: false,

      updateUsage: usage => set({usage}),

      fetchUsage: async (userId, deviceId) => {
        set({isLoading: true});
        try {
          const data = await postJSON<any>('/api/usage/check', {
            user_id: userId,
            device_id: deviceId,
          });
          set({
            usage: {
              free_used: data.free_used,
              donation_credits: data.donation_credits,
              free_remaining:
                data.free_remaining ?? Math.max(0, 10 - data.free_used),
              credits_remaining: data.credits_remaining || 0,
              is_admin: data.is_admin,
              unlimited_credits: data.unlimited_credits,
            },
          });
        } catch {
          set({usage: null});
        } finally {
          set({isLoading: false});
        }
      },

      fetchAccountSummary: async accessToken => {
        if (!accessToken) return;
        set({isLoading: true});
        try {
          const data = await postJSON<AccountSummary>(
            '/api/account/summary',
            {},
          );
          set({accountSummary: data});
        } catch {
          set({accountSummary: null});
        } finally {
          set({isLoading: false});
        }
      },
    }),
    {
      name: 'credit-storage',
    },
  ),
);
