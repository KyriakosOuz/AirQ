
import { create } from "zustand";
import { Pollutant } from "@/lib/types";

interface ForecastFiltersState {
  region: string;
  pollutant: Pollutant;
  frequency: string;
  chartType: "bar" | "line";
  startDate: Date | undefined;
  endDate: Date | undefined;
  setFilters: (filters: Partial<Omit<ForecastFiltersState, 'setFilters'>>) => void;
  setRegion: (region: string) => void;
  setPollutant: (pollutant: Pollutant) => void;
  setFrequency: (frequency: string) => void;
  setChartType: (chartType: "bar" | "line") => void;
  setStartDate: (startDate: Date | undefined) => void;
  setEndDate: (endDate: Date | undefined) => void;
}

export const useForecastFiltersStore = create<ForecastFiltersState>((set) => ({
  region: "thessaloniki",
  pollutant: "pollution",
  frequency: "D",
  chartType: "bar",
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  setFilters: (filters) => set((state) => ({ ...state, ...filters })),
  setRegion: (region) => set({ region }),
  setPollutant: (pollutant) => set({ pollutant }),
  setFrequency: (frequency) => set({ frequency }),
  setChartType: (chartType) => set({ chartType }),
  setStartDate: (startDate) => set({ startDate }),
  setEndDate: (endDate) => set({ endDate }),
}));
