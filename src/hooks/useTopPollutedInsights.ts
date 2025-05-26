
import { useQuery } from "@tanstack/react-query";
import { insightApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";

export const useTopPollutedInsights = (pollutant: Pollutant | null, year: number | null) => {
  return useQuery({
    queryKey: ["topPolluted", pollutant, year],
    queryFn: async () => {
      if (!pollutant || !year) throw new Error("Missing parameters");
      
      console.log("Fetching top polluted data for:", { pollutant, year });
      const response = await insightApi.getTopPolluted({ pollutant, year });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || "Failed to load top polluted data");
      }
    },
    staleTime: 1000 * 60 * 10, // 10 mins
    enabled: !!(pollutant && year),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
