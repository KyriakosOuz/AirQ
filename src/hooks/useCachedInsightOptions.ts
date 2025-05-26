
import { useQuery } from '@tanstack/react-query';
import { insightApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/react-query-config';
import { useCacheStore } from '@/stores/cacheStore';
import { DatasetMetadata } from './useInsightOptions';
import { Pollutant } from '@/lib/types';

export const useCachedInsightOptions = () => {
  const { getCache, setCache } = useCacheStore();

  const {
    data: datasetData,
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.INSIGHT_OPTIONS,
    queryFn: async () => {
      console.log("Fetching available dataset metadata...");
      
      // Check cache first
      const cachedData = getCache<DatasetMetadata>('insight-options');
      if (cachedData) {
        console.log("Using cached insight options data");
        return cachedData;
      }

      const response = await insightApi.getAvailableDatasets();
      
      if (response.success && response.data) {
        const transformedData: DatasetMetadata = {};
        
        for (const [region, pollutants] of Object.entries(response.data)) {
          transformedData[region] = {};
          for (const [pollutant, data] of Object.entries(pollutants as any)) {
            if (Array.isArray(data)) {
              transformedData[region][pollutant] = data;
            } else if (data && typeof data === 'object' && 'years' in data) {
              transformedData[region][pollutant] = (data as any).years;
            } else {
              transformedData[region][pollutant] = [];
            }
          }
        }
        
        // Cache the transformed data
        setCache('insight-options', transformedData);
        console.log("Available datasets:", transformedData);
        return transformedData;
      } else {
        console.error("Failed to fetch dataset metadata:", response.error);
        // Fallback data
        const fallbackData: DatasetMetadata = {
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
        };
        setCache('insight-options', fallbackData);
        return fallbackData;
      }
    },
    initialData: () => getCache<DatasetMetadata>('insight-options'),
  });

  // Helper functions
  const getAvailableRegions = (): string[] => {
    if (!datasetData) return [];
    return Object.keys(datasetData);
  };

  const getAvailablePollutants = (region: string): Pollutant[] => {
    if (!datasetData || !datasetData[region]) return [];
    return Object.keys(datasetData[region]) as Pollutant[];
  };

  const getAvailableYears = (region: string, pollutant: Pollutant): number[] => {
    if (!datasetData || !datasetData[region] || !datasetData[region][pollutant]) return [];
    return datasetData[region][pollutant] || [];
  };

  const isValidCombination = (region: string, pollutant?: Pollutant, year?: number): boolean => {
    if (!datasetData || !datasetData[region]) return false;
    
    if (pollutant && !datasetData[region][pollutant]) return false;
    if (pollutant && year && !datasetData[region][pollutant].includes(year)) return false;
    
    return true;
  };

  const handleRefresh = async () => {
    console.log("Manually refreshing insight options...");
    setCache('insight-options', null);
    return await refetch();
  };

  return {
    modelData: datasetData,
    loading,
    error: error ? String(error) : null,
    refetch: handleRefresh,
    getAvailableRegions,
    getAvailablePollutants,
    getAvailableYears,
    isValidCombination
  };
};
