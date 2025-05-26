
import { useState, useEffect, useCallback } from 'react';
import { insightApi } from '@/lib/api';
import { Pollutant } from '@/lib/types';

export interface InsightOptions {
  [region: string]: {
    years: number[];
    pollutants: string[];
  };
}

export const useInsightOptions = () => {
  const [options, setOptions] = useState<InsightOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching available insight options...");
      const response = await insightApi.getAvailableOptions();
      
      if (response.success && response.data) {
        setOptions(response.data);
        console.log("Available options:", response.data);
      } else {
        console.error("Failed to fetch insight options:", response.error);
        setError("Failed to load available options");
        // Fallback to mock data structure
        setOptions({
          thessaloniki: { years: [2020, 2021, 2022, 2023], pollutants: ['no2_conc', 'o3_conc', 'co_conc'] },
          kalamaria: { years: [2021, 2022, 2023], pollutants: ['no2_conc', 'o3_conc'] },
          'ampelokipoi-menemeni': { years: [2022, 2023], pollutants: ['no2_conc'] }
        });
      }
    } catch (err) {
      console.error("Error fetching insight options:", err);
      setError("Network error while loading options");
      // Fallback to mock data
      setOptions({
        thessaloniki: { years: [2020, 2021, 2022, 2023], pollutants: ['no2_conc', 'o3_conc', 'co_conc'] },
        kalamaria: { years: [2021, 2022, 2023], pollutants: ['no2_conc', 'o3_conc'] },
        'ampelokipoi-menemeni': { years: [2022, 2023], pollutants: ['no2_conc'] }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // Helper functions
  const getAvailableYears = useCallback((region: string): number[] => {
    if (!options || !options[region]) return [];
    return options[region].years || [];
  }, [options]);

  const getAvailablePollutants = useCallback((region: string): Pollutant[] => {
    if (!options || !options[region]) return [];
    return (options[region].pollutants || []) as Pollutant[];
  }, [options]);

  const getAvailableRegions = useCallback((): string[] => {
    if (!options) return [];
    return Object.keys(options);
  }, [options]);

  const isValidCombination = useCallback((region: string, year?: number, pollutant?: Pollutant): boolean => {
    if (!options || !options[region]) return false;
    
    const regionData = options[region];
    
    if (year && !regionData.years.includes(year)) return false;
    if (pollutant && !regionData.pollutants.includes(pollutant)) return false;
    
    return true;
  }, [options]);

  return {
    options,
    loading,
    error,
    refetch: fetchOptions,
    getAvailableYears,
    getAvailablePollutants,
    getAvailableRegions,
    isValidCombination
  };
};
