import { create } from "zustand";
import { WallPost, NightRideFeedPost, GroupChallengeWallEntry } from "../types";
import { postJSON } from "../utils/routeUtils";

interface FeedState {
  wallPosts: WallPost[];
  nightRidePosts: NightRideFeedPost[];
  groupChallenges: GroupChallengeWallEntry[];
  isLoadingWall: boolean;
  isLoadingNight: boolean;
  isLoadingGroups: boolean;
  selectedCity: string;

  setSelectedCity: (city: string) => void;
  fetchWall: (city: string, checkpointCount?: string) => Promise<void>;
  fetchNightRide: (city?: string) => Promise<void>;
  fetchGroupChallenges: () => Promise<void>;
  addNightRidePost: (post: NightRideFeedPost) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  wallPosts: [],
  nightRidePosts: [],
  groupChallenges: [],
  isLoadingWall: false,
  isLoadingNight: false,
  isLoadingGroups: false,
  selectedCity: "",

  setSelectedCity: (city) => set({ selectedCity: city }),

  fetchWall: async (city, checkpointCount = "") => {
    set({ isLoadingWall: true });
    try {
      const data = await postJSON<any>("/api/messenger/wall", { city, checkpoint_count: checkpointCount });
      set({ wallPosts: data.posts || [] });
    } catch {
      set({ wallPosts: [] });
    } finally {
      set({ isLoadingWall: false });
    }
  },

  fetchNightRide: async (city = "") => {
    set({ isLoadingNight: true });
    try {
      const data = await postJSON<any>("/api/night-ride/feed", { city });
      set({ nightRidePosts: data.posts || [] });
    } catch {
      set({ nightRidePosts: [] });
    } finally {
      set({ isLoadingNight: false });
    }
  },

  fetchGroupChallenges: async () => {
    set({ isLoadingGroups: true });
    try {
      const data = await postJSON<any>("/api/messenger/group-wall", {});
      set({ groupChallenges: data.groups || [] });
    } catch {
      set({ groupChallenges: [] });
    } finally {
      set({ isLoadingGroups: false });
    }
  },

  addNightRidePost: (post) => set((s) => ({
    nightRidePosts: [post, ...s.nightRidePosts].slice(0, 24)
  }))
}));
