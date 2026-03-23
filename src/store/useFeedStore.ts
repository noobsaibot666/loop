import { create } from "zustand";
import { WallPost, NightRideFeedPost } from "../types";
import { postJSON } from "../utils/routeUtils";

interface FeedState {
  wallPosts: WallPost[];
  nightRidePosts: NightRideFeedPost[];
  isLoadingWall: boolean;
  isLoadingNight: boolean;
  selectedCity: string;
  
  setSelectedCity: (city: string) => void;
  fetchWall: (city: string) => Promise<void>;
  fetchNightRide: () => Promise<void>;
  addNightRidePost: (post: NightRideFeedPost) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  wallPosts: [],
  nightRidePosts: [],
  isLoadingWall: false,
  isLoadingNight: false,
  selectedCity: "BARCELONA", // Default

  setSelectedCity: (city) => set({ selectedCity: city }),

  fetchWall: async (city) => {
    set({ isLoadingWall: true });
    try {
      const data = await postJSON<any>("/api/messenger/wall", { city });
      set({ wallPosts: data.posts || [] });
    } catch {
      set({ wallPosts: [] });
    } finally {
      set({ isLoadingWall: false });
    }
  },

  fetchNightRide: async () => {
    set({ isLoadingNight: true });
    try {
      const data = await postJSON<any>("/api/night-ride/feed", {});
      set({ nightRidePosts: data.posts || [] });
    } catch {
      set({ nightRidePosts: [] });
    } finally {
      set({ isLoadingNight: false });
    }
  },

  addNightRidePost: (post) => set((s) => ({ 
    nightRidePosts: [post, ...s.nightRidePosts].slice(0, 24) 
  }))
}));
