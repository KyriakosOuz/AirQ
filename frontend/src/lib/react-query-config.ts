
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for the entire session (until app closes)
      staleTime: Infinity, // Data never becomes stale automatically
      gcTime: Infinity, // Keep data in memory until app closes
      retry: 2,
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnMount: false, // Don't refetch when component mounts if we have data
      refetchOnReconnect: true, // Only refetch when internet reconnects
    },
  },
});

// Query keys for different data types
export const QUERY_KEYS = {
  DASHBOARD_OVERVIEW: ['dashboard', 'overview'],
  DATASET_AVAILABILITY: ['datasets', 'availability'],
  MODEL_EXISTS: (region: string, pollutant: string, frequency: string) => 
    ['model', 'exists', region, pollutant, frequency],
  INSIGHT_OPTIONS: ['insights', 'options'],
  FORECAST_DATA: (region: string, pollutant: string) => 
    ['forecast', region, pollutant],
} as const;
