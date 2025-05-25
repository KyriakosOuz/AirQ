
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";

interface InsightFiltersProps {
  activeTab: string;
  region: string;
  pollutant: Pollutant;
  year: number;
  onRegionChange: (value: string) => void;
  onPollutantChange: (value: Pollutant) => void;
  onYearChange: (value: string) => void;
  loading?: boolean;
}

export const InsightFilters: React.FC<InsightFiltersProps> = ({
  activeTab,
  region,
  pollutant,
  year,
  onRegionChange,
  onPollutantChange,
  onYearChange,
  loading = false
}) => {
  const years = Array.from({ length: 9 }, (_, i) => 2015 + i);

  // Determine which filters to show based on active tab
  const showRegion = activeTab === "trend" || activeTab === "seasonality";
  const showPollutant = true; // All tabs use pollutant
  const showYear = activeTab === "top-polluted";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {showRegion && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Region</CardTitle>
          </CardHeader>
          <CardContent>
            <RegionSelector 
              value={region} 
              onValueChange={onRegionChange}
              disabled={loading}
            />
          </CardContent>
        </Card>
      )}
      
      {showPollutant && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pollutant</CardTitle>
          </CardHeader>
          <CardContent>
            <PollutantSelector 
              value={pollutant} 
              onValueChange={onPollutantChange}
              disabled={loading}
            />
          </CardContent>
        </Card>
      )}
      
      {showYear && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Year</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={year.toString()} 
              onValueChange={onYearChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((yearOption) => (
                  <SelectItem key={yearOption} value={yearOption.toString()}>
                    {yearOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
