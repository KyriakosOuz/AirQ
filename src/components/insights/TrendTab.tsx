
import React from "react";
import { Pollutant } from "@/lib/types";
import EnhancedTrendChart from "./EnhancedTrendChart";

interface TrendTabProps {
  region: string;
  pollutant: Pollutant;
  data: any[];
  loading: boolean;
  error?: string;
  dataUnit: string;
}

export const TrendTab: React.FC<TrendTabProps> = ({
  region,
  pollutant,
  data,
  loading,
  error,
  dataUnit
}) => {
  return (
    <EnhancedTrendChart
      region={region}
      pollutant={pollutant}
      data={data}
      loading={loading}
      error={error}
      dataUnit={dataUnit}
    />
  );
};
