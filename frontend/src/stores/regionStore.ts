
import { create } from 'zustand';
import { Pollutant, Region } from '@/lib/types';

type RegionState = {
  selectedRegion: string | null;
  selectedPollutant: Pollutant | null;
  availableRegions: Region[];
  setSelectedRegion: (region: string) => void;
  setSelectedPollutant: (pollutant: Pollutant) => void;
  setAvailableRegions: (regions: Region[]) => void;
};

export const useRegionStore = create<RegionState>((set) => ({
  selectedRegion: null,
  selectedPollutant: null,
  availableRegions: [],
  
  setSelectedRegion: (region) => set(() => ({ selectedRegion: region })),
  setSelectedPollutant: (pollutant) => set(() => ({ selectedPollutant: pollutant })),
  setAvailableRegions: (regions) => set(() => ({ availableRegions: regions })),
}));
