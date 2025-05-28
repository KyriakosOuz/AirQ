
import { useState, useEffect, useCallback } from 'react';
import { insightApi } from '@/lib/api';
import { Pollutant } from '@/lib/types';

export interface DatasetMetadata {
  [region: string]: {
    [pollutant: string]: number[];
  };
}

export const useInsightOptions = () => {
  const [datasetData, setDatasetData] = useState<DatasetMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatasetData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching available dataset metadata...");
      const response = await insightApi.getAvailableDatasets();
      
      if (response.success && response.data) {
        // Transform the API response to match our DatasetMetadata interface
        const transformedData: DatasetMetadata = {};
        
        for (const [region, pollutants] of Object.entries(response.data)) {
          transformedData[region] = {};
          for (const [pollutant, data] of Object.entries(pollutants as any)) {
            // Handle both formats: direct array or object with years property
            if (Array.isArray(data)) {
              transformedData[region][pollutant] = data;
            } else if (data && typeof data === 'object' && 'years' in data) {
              transformedData[region][pollutant] = (data as any).years;
            } else {
              transformedData[region][pollutant] = [];
            }
          }
        }
        
        setDatasetData(transformedData);
        console.log("Available datasets:", transformedData);
      } else {
        console.error("Failed to fetch dataset metadata:", response.error);
        setError("Failed to load available datasets");
        // Fallback to mock data structure - direct arrays as expected by DatasetMetadata
        setDatasetData({
          thessaloniki: { 
            no2_conc: [2020, 2021, 2022, 2023],
            o3_conc: [2021, 2022, 2023],
            co_conc: [2022, 2023]
          },
          kalamaria: { 
            no2_conc: [2021, 2022, 2023],
            o3_conc: [2022, 2023]
          },
          'ampelokipoi-menemeni': { 
            no2_conc: [2022, 2023]
          }
        });
      }
    } catch (err) {
      console.error("Error fetching dataset metadata:", err);
      setError("Network error while loading datasets");
      // Fallback to mock data - direct arrays as expected by DatasetMetadata
      setDatasetData({
        thessaloniki: { 
          no2_conc: [2020, 2021, 2022, 2023],
          o3_conc: [2021, 2022, 2023],
          co_conc: [2022, 2023]
        },
        kalamaria: { 
          no2_conc: [2021, 2022, 2023],
          o3_conc: [2022, 2023]
        },
        'ampelokipoi-menemeni': { 
          no2_conc: [2022, 2023]
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasetData();
  }, [fetchDatasetData]);

  // Helper functions
  const getAvailableRegions = useCallback((): string[] => {
    if (!datasetData) return [];
    return Object.keys(datasetData);
  }, [datasetData]);

  const getAvailablePollutants = useCallback((region: string): Pollutant[] => {
    if (!datasetData || !datasetData[region]) return [];
    return Object.keys(datasetData[region]) as Pollutant[];
  }, [datasetData]);

  const getAvailableYears = useCallback((region: string, pollutant: Pollutant): number[] => {
    if (!datasetData || !datasetData[region] || !datasetData[region][pollutant]) return [];
    return datasetData[region][pollutant] || [];
  }, [datasetData]);

  const isValidCombination = useCallback((region: string, pollutant?: Pollutant, year?: number): boolean => {
    if (!datasetData || !datasetData[region]) return false;
    
    if (pollutant && !datasetData[region][pollutant]) return false;
    if (pollutant && year && !datasetData[region][pollutant].includes(year)) return false;
    
    return true;
  }, [datasetData]);

  return {
    modelData: datasetData, // Keep the same property name for backward compatibility
    loading,
    error,
    refetch: fetchDatasetData,
    getAvailableRegions,
    getAvailablePollutants,
    getAvailableYears,
    isValidCombination
  };
};
