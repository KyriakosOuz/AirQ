
import React from "react";
import { Pollutant } from "@/lib/types";
import EnhancedSeasonalChart from "./EnhancedSeasonalChart";
import { ChartExportButton } from "./ChartExportButton";
import { InsightSummary } from "./InsightSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const regionDisplayName = region.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  const pollutantDisplayName = pollutant.replace('_conc', '').toUpperCase();
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              Seasonality of {pollutantDisplayName} in {regionDisplayName} ({currentYear})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly average concentrations showing seasonal patterns
            </p>
          </div>
          {data.length > 0 && (
            <ChartExportButton
              data={data}
              chartType="seasonal"
              pollutant={pollutant}
              region={region}
              year={currentYear}
            />
          )}
        </CardHeader>
      </Card>

      <EnhancedSeasonalChart
        region={region}
        pollutant={pollutant}
        data={data}
        loading={loading}
        error={error}
        dataUnit={dataUnit}
      />

      {data.length > 0 && !loading && !error && (
        <InsightSummary
          data={data}
          chartType="seasonal"
          pollutant={pollutant}
          region={region}
          year={currentYear}
          dataUnit={dataUnit}
        />
      )}
    </div>
  );
};
