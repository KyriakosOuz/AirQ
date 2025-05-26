
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/react-query-config';

export interface DashboardOverview {
  region: string;
  current: {
    pollutants: {
      [key: string]: number;
    };
    aqi_category: string;
  };
  forecast: Array<{
    ds: string;
    yhat: number;
    category: string;
  }>;
  personalized: {
    labels: string[];
    values: number[];
    deltas: (number | null)[];
    unit: string;
    meta: {
      type: string;
      user_id: string;
      region: string;
    };
  };
  ai_tip: {
    tip: string;
    riskLevel: string;
    personalized: boolean;
  };
}

export const useDashboardOverview = () => {
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
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,       // prevents re-fetch on remount
    refetchOnWindowFocus: false, // disables focus-triggered refresh
    refetchOnReconnect: false    // disables reconnect-triggered refresh
  });

  return { 
    data, 
    loading: isLoading, 
    error: error ? error.message : null, 
    refetch 
  };
};
