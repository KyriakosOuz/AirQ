
import { useQuery } from '@tanstack/react-query';
import { modelApi } from '@/lib/api';
import { Pollutant } from '@/lib/types';
import { QUERY_KEYS } from '@/lib/react-query-config';
import { useCacheStore } from '@/stores/cacheStore';

interface UseModelExistsProps {
  region: string;
  pollutant: Pollutant;
  frequency: string;
  skip?: boolean;
}

export function useCachedModelExists({ region, pollutant, frequency, skip = false }: UseModelExistsProps) {
  const { getCache, setCache } = useCacheStore();

  const {
    data: modelExists,
    isLoading: isChecking,
    error: checkError,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.MODEL_EXISTS(region, pollutant, frequency),
    queryFn: async () => {
      const cacheKey = `model-exists-${region}-${pollutant}-${frequency}`;
      
      // Check cache first
      const cachedData = getCache<boolean>(cacheKey);
      if (cachedData !== null) {
        console.log(`Using cached model exists data: ${cachedData}`);
        return cachedData;
      }

      const response = await modelApi.checkExists({
        region,
        pollutant,
        frequency
      });
      
      if (response.success && response.data) {
        const exists = response.data.exists;
        // Cache for 10 minutes since model availability doesn't change often
        setCache(cacheKey, exists, 10 * 60 * 1000);
        console.log(`Model exists check: ${exists}`);
        return exists;
      } else {
        throw new Error(response.error || "Failed to check if model exists");
      }
    },
    enabled: !skip && !!region && !!pollutant && !!frequency,
    initialData: () => {
      if (skip || !region || !pollutant || !frequency) return undefined;
      const cacheKey = `model-exists-${region}-${pollutant}-${frequency}`;
      return getCache<boolean>(cacheKey);
    },
  });

  const checkExists = async (): Promise<boolean> => {
    if (!region || !pollutant || !frequency) return false;
    
    const result = await refetch();
    return result.data ?? false;
  };

  return { 
    modelExists: modelExists ?? false, 
    isChecking, 
    checkError: checkError ? String(checkError) : null, 
    checkExists 
  };
}
