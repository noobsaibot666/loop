import { create } from "zustand";
import { postJSON } from "../utils/routeUtils";

export interface CityLane {
  city_slug: string;
  city_name: string;
  status: "live" | "ready" | "review" | "draft" | "requested";
  checkpoint_count: number;
  active_checkpoint_count: number;
  district_count: number;
  demand_count: number;
  open_request_count: number;
  route_note: string;
  finish_label: string;
  last_requested_at: string | null;
}

interface CitiesState {
  cityLanes: CityLane[];
  isLoading: boolean;
  
  fetchCityLanes: () => Promise<void>;
  requestCity: (cityName: string) => Promise<void>;
}

export const useCitiesStore = create<CitiesState>((set, get) => ({
  cityLanes: [],
  isLoading: false,

  fetchCityLanes: async () => {
    set({ isLoading: true });
    try {
      const data = await postJSON<any>("/api/cities/lanes", {});
      set({ cityLanes: data.lanes || [] });
    } catch {
      set({ cityLanes: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  requestCity: async (name) => {
    try {
      await postJSON("/api/cities/request", { name });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}));
