
import React from "react";
import { Pollutant } from "@/lib/types";
import EnhancedSeasonalChart from "./EnhancedSeasonalChart";

interface SeasonalityTabProps {
  region: string;
  pollutant: Pollutant;
  data: any[];
  loading: boolean;
  error?: string;
  dataUnit: string;
}

export const SeasonalityTab: React.FC<SeasonalityTabProps> = ({
  region,
  pollutant,
  data,
  loading,
  error,
  dataUnit
}) => {
  return (
    <EnhancedSeasonalChart
      region={region}
      pollutant={pollutant}
      data={data}
      loading={loading}
      error={error}
      dataUnit={dataUnit}
    />
  );
};
