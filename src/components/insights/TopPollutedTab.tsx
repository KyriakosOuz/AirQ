
import React from "react";
import { Pollutant } from "@/lib/types";
import EnhancedTopPollutedChart from "./EnhancedTopPollutedChart";

interface TopPollutedTabProps {
  pollutant: Pollutant;
  year: number;
  data: any[];
  loading: boolean;
  error?: string;
  dataUnit: string;
}

export const TopPollutedTab: React.FC<TopPollutedTabProps> = ({
  pollutant,
  year,
  data,
  loading,
  error,
  dataUnit
}) => {
  return (
    <EnhancedTopPollutedChart
      pollutant={pollutant}
      year={year}
      data={data}
      loading={loading}
      error={error}
      dataUnit={dataUnit}
    />
  );
};
