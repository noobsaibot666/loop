import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {supabase} from '../config';

interface AuthState {
  user: any | null;
  session: any | null;
  accessToken: string;
  initialize: () => void;
  setSession: (session: any) => void;
  handleLogout: () => Promise<void>;
  handleLoginWithEmail: (email: string) => Promise<void>;
  handlePasswordLogin: (email: string, password: string) => Promise<void>;
  handleSignup: (email: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      session: null,
      accessToken: '',

      initialize: async () => {
        if (!supabase) return;
        try {
          const {
            data: {session},
          } = await supabase.auth.getSession();
          set({
            session,
            user: session?.user || null,
            accessToken: session?.access_token || '',
          });
        } catch (error) {
          console.warn(
            'Failed to restore Supabase session, clearing local auth state.',
            error,
          );
          await supabase.auth.signOut({scope: 'local'});
          set({session: null, user: null, accessToken: ''});
        }

        supabase.auth.onAuthStateChange((_event, session) => {
          set({
            session,
            user: session?.user || null,
            accessToken: session?.access_token || '',
          });
        });
      },

      setSession: session => {
        set({
          session,
          user: session?.user || null,
          accessToken: session?.access_token || '',
        });
      },

      handleLogout: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        set({session: null, user: null, accessToken: ''});
      },

      handleLoginWithEmail: async (email: string) => {
        if (!supabase) return;
        const {error} = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
      },

      handlePasswordLogin: async (email, password) => {
        if (!supabase) return;
        const {error} = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },

      handleSignup: async (email, password) => {
        if (!supabase) return;
        const {error} = await supabase.auth.signUp({email, password});
        if (error) throw error;
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
);
