
import { useState, useEffect, useCallback } from 'react';
import { insightApi } from '@/lib/api';
import { Pollutant } from '@/lib/types';

export interface ModelMetadata {
  [region: string]: {
    [pollutant: string]: {
      years: number[];
    };
  };
}

export const useInsightOptions = () => {
  const [modelData, setModelData] = useState<ModelMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModelData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching available model metadata...");
      const response = await insightApi.getAvailableModels();
      
      if (response.success && response.data) {
        setModelData(response.data);
        console.log("Available models:", response.data);
      } else {
        console.error("Failed to fetch model metadata:", response.error);
        setError("Failed to load available models");
        // Fallback to mock data structure
        setModelData({
          thessaloniki: { 
            no2_conc: { years: [2020, 2021, 2022, 2023] },
            o3_conc: { years: [2021, 2022, 2023] },
            co_conc: { years: [2022, 2023] }
          },
          kalamaria: { 
            no2_conc: { years: [2021, 2022, 2023] },
            o3_conc: { years: [2022, 2023] }
          },
          'ampelokipoi-menemeni': { 
            no2_conc: { years: [2022, 2023] }
          }
        });
      }
    } catch (err) {
      console.error("Error fetching model metadata:", err);
      setError("Network error while loading models");
      // Fallback to mock data
      setModelData({
        thessaloniki: { 
          no2_conc: { years: [2020, 2021, 2022, 2023] },
          o3_conc: { years: [2021, 2022, 2023] },
          co_conc: { years: [2022, 2023] }
        },
        kalamaria: { 
          no2_conc: { years: [2021, 2022, 2023] },
          o3_conc: { years: [2022, 2023] }
        },
        'ampelokipoi-menemeni': { 
          no2_conc: { years: [2022, 2023] }
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModelData();
  }, [fetchModelData]);

  // Helper functions
  const getAvailableRegions = useCallback((): string[] => {
    if (!modelData) return [];
    return Object.keys(modelData);
  }, [modelData]);

  const getAvailablePollutants = useCallback((region: string): Pollutant[] => {
    if (!modelData || !modelData[region]) return [];
    return Object.keys(modelData[region]) as Pollutant[];
  }, [modelData]);

  const getAvailableYears = useCallback((region: string, pollutant: Pollutant): number[] => {
    if (!modelData || !modelData[region] || !modelData[region][pollutant]) return [];
    return modelData[region][pollutant].years || [];
  }, [modelData]);

  const isValidCombination = useCallback((region: string, pollutant?: Pollutant, year?: number): boolean => {
    if (!modelData || !modelData[region]) return false;
    
    if (pollutant && !modelData[region][pollutant]) return false;
    if (pollutant && year && !modelData[region][pollutant].years.includes(year)) return false;
    
    return true;
  }, [modelData]);

  return {
    modelData,
    loading,
    error,
    refetch: fetchModelData,
    getAvailableRegions,
    getAvailablePollutants,
    getAvailableYears,
    isValidCombination
  };
};
