
import { create } from "zustand";
import { Pollutant } from "@/lib/types";

interface InsightFiltersState {
  region: string;
  pollutant: Pollutant;
  year: number;
  setFilters: (filters: Partial<Omit<InsightFiltersState, 'setFilters'>>) => void;
  setRegion: (region: string) => void;
  setPollutant: (pollutant: Pollutant) => void;
  setYear: (year: number) => void;
}

export const useInsightFiltersStore = create<InsightFiltersState>((set) => ({
  region: "thessaloniki",
  pollutant: "no2_conc",
  year: 2023,
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  setRegion: (region) => set({ region }),
  setPollutant: (pollutant) => set({ pollutant }),
  setYear: (year) => set({ year }),
}));
