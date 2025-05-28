
import React from "react";
import { Pollutant } from "@/lib/types";
import EnhancedTopPollutedChart from "./EnhancedTopPollutedChart";
import { ChartExportButton } from "./ChartExportButton";
import { InsightSummary } from "./InsightSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPollutantName } from "@/lib/utils";

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
  const pollutantDisplayName = formatPollutantName(pollutant.replace('_conc', ''));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              Most Polluted Regions for {pollutantDisplayName} ({year})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Regional comparison showing highest average concentrations
            </p>
          </div>
          {data.length > 0 && (
            <ChartExportButton
              data={data}
              chartType="top-polluted"
              pollutant={pollutant}
              year={year}
            />
          )}
        </CardHeader>
      </Card>

      <EnhancedTopPollutedChart
        pollutant={pollutant}
        year={year}
        data={data}
        loading={loading}
        error={error}
        dataUnit={dataUnit}
      />

      {data.length > 0 && !loading && !error && (
        <InsightSummary
          data={data}
          chartType="top-polluted"
          pollutant={pollutant}
          year={year}
          dataUnit={dataUnit}
        />
      )}
    </div>
  );
};
