
import { useQuery } from "@tanstack/react-query";
import { insightApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";

export const useTrendInsights = (region: string | null, pollutant: Pollutant | null, year: number | null) => {
  return useQuery({
    queryKey: ["trend", region, pollutant, year],
    queryFn: async () => {
      if (!region || !pollutant || !year) throw new Error("Missing parameters");
      
      console.log("Fetching trend data for:", { pollutant, region, year });
      const response = await insightApi.getTrend({ pollutant, region, year });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to load trend data");
      }
    },
    staleTime: 1000 * 60 * 10, // 10 mins
    enabled: !!(region && pollutant && year),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
