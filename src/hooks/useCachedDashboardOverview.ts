import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { QUERY_KEYS } from '@/lib/react-query-config';
import { useCacheStore } from '@/stores/cacheStore';
import { DashboardOverview } from './useDashboardOverview';

// Helper function to transform pandas DataFrame-style JSON to array
const transformPandasToArray = (pandasData: any): any[] => {
  try {
    console.log("Transforming pandas-style data:", pandasData);
    
    if (!pandasData || typeof pandasData !== 'object') {
      console.warn("Invalid pandas data structure:", pandasData);
      return [];
    }

    const columns = Object.keys(pandasData);
    if (columns.length === 0) {
      console.warn("No columns found in pandas data");
      return [];
    }

    const firstColumn = pandasData[columns[0]];
    if (!firstColumn || typeof firstColumn !== 'object') {
      console.warn("Invalid first column structure:", firstColumn);
      return [];
    }

    const rowIndices = Object.keys(firstColumn);
    console.log("Found row indices:", rowIndices);

    const transformedArray = rowIndices.map(rowIndex => {
      const row: any = {};
      columns.forEach(column => {
        if (pandasData[column] && pandasData[column][rowIndex] !== undefined) {
          row[column] = pandasData[column][rowIndex];
        }
      });
      return row;
    });

    console.log("Transformed array:", transformedArray);
    return transformedArray;
  } catch (error) {
    console.error("Error transforming pandas data:", error);
    return [];
  }
};

const isPandasFormat = (data: any): boolean => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) return false;

  const firstValue = data[keys[0]];
  if (!firstValue || typeof firstValue !== 'object') return false;

  const subKeys = Object.keys(firstValue);
  return subKeys.length > 0 && subKeys.every(key => !isNaN(parseInt(key)));
};

const validateDashboardData = (data: any): DashboardOverview | null => {
  try {
    console.log("Validating dashboard data:", data);

    if (!data || typeof data !== 'object') {
      console.error("Dashboard data is not a valid object:", data);
      return null;
    }

    // Handle forecast data transformation
    if (data.forecast) {
      if (isPandasFormat(data.forecast)) {
        console.log("Detected pandas format forecast, transforming...");
        data.forecast = transformPandasToArray(data.forecast);
      } else if (!Array.isArray(data.forecast)) {
        console.warn("Forecast is not an array and not pandas format, setting to empty array:", data.forecast);
        data.forecast = [];
      }
    } else {
      console.warn("No forecast data found, setting to empty array");
      data.forecast = [];
    }

    // Ensure personalized data has valid arrays
    if (!data.personalized || typeof data.personalized !== 'object') {
      console.warn("Personalized data is missing, setting defaults");
      data.personalized = {
        labels: [],
        values: [],
        deltas: [],
        unit: 'μg/m³',
        meta: {
          type: 'trend',
          user_id: '',
          region: data.region || 'unknown'
        }
      };
    } else {
      if (!Array.isArray(data.personalized.labels)) {
        data.personalized.labels = [];
      }
      if (!Array.isArray(data.personalized.values)) {
        data.personalized.values = [];
      }
      if (!Array.isArray(data.personalized.deltas)) {
        data.personalized.deltas = [];
      }
    }

    if (!data.current || typeof data.current !== 'object') {
      data.current = {
        pollutants: {},
        aqi_category: 'unknown'
      };
    }

    if (!data.ai_tip || typeof data.ai_tip !== 'object') {
      data.ai_tip = {
        tip: 'No tips available at the moment.',
        riskLevel: 'unknown',
        personalized: false
      };
    }

    console.log("Validated dashboard data:", data);
    return data as DashboardOverview;
  } catch (error) {
    console.error("Error validating dashboard data:", error);
    return null;
  }
};

export const useCachedDashboardOverview = () => {
  const { getCache, setCache } = useCacheStore();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW,
    queryFn: async () => {
      console.log("Fetching dashboard overview from API...");
      
      // Check cache first
      const cachedData = getCache<DashboardOverview>('dashboard-overview');
      if (cachedData) {
        console.log("Using cached dashboard data");
        return cachedData;
      }

      const response = await dashboardApi.getOverview();
      
      if (response.success && response.data) {
        console.log("Dashboard data received:", response.data);
        
        const validatedData = validateDashboardData(response.data);
        
        if (validatedData) {
          // Cache the validated data
          setCache('dashboard-overview', validatedData);
          return validatedData;
        } else {
          throw new Error("Invalid data format received from server");
        }
      } else {
        throw new Error(response.error || "Failed to load dashboard data");
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // keep in memory for 10 minutes (gcTime replaces cacheTime)
    refetchOnWindowFocus: false, // avoid unnecessary calls
    initialData: () => getCache<DashboardOverview>('dashboard-overview'),
  });

  const handleRefresh = async () => {
    console.log("Manually refreshing dashboard data...");
    // Clear cache before refetching
    setCache('dashboard-overview', null);
    return await refetch();
  };

  return { 
    data, 
    loading: isLoading, 
    error: error ? getErrorMessage(error) : null, 
    refetch: handleRefresh 
  };
};
