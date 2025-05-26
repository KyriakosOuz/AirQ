
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import { QUERY_KEYS } from '@/lib/react-query-config';
import { DashboardOverview } from './useDashboardOverview';

export const useCachedDashboardOverview = () => {
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW,
    queryFn: async () => {
      console.log("Fetching dashboard overview from API...");
      
      const response = await dashboardApi.getOverview();
      
      if (response.success && response.data) {
        console.log("Dashboard data received:", response.data);
        return response.data;
      } else {
        throw new Error(response.error || "Failed to load dashboard data");
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // keep in memory for 10 minutes (gcTime replaces cacheTime)
    refetchOnWindowFocus: false, // avoid unnecessary calls
  });

  const handleRefresh = async () => {
    console.log("Manually refreshing dashboard data...");
    return await refetch();
  };

  return { 
    data, 
    loading: isLoading, 
    error: error ? getErrorMessage(error) : null, 
    refetch: handleRefresh 
  };
};
