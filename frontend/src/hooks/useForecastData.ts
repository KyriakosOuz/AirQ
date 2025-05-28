
import { useQuery } from "@tanstack/react-query";
import { predictionApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";

interface ForecastParams {
  region: string;
  pollutant: Pollutant;
  frequency: string;
  start_date: string;
  end_date: string;
  user_profile?: any;
}

export const useForecastData = (params: ForecastParams | null) => {
  return useQuery({
    queryKey: ["forecast", params],
    queryFn: async () => {
      if (!params) throw new Error("No parameters provided");
      
      console.log("Fetching forecast data with params:", params);
      const response = await predictionApi.getForecastWithRisk(params);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to load forecast data");
      }
    },
    enabled: !!(params?.start_date && params?.end_date && params?.region && params?.pollutant),
    staleTime: 1000 * 60 * 5, // 5 mins
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
