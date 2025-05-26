
import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { useInsightOptions } from "@/hooks/useInsightOptions";
import { Loader2 } from "lucide-react";

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
  const { 
    options, 
    loading: optionsLoading, 
    error: optionsError,
    getAvailableYears, 
    getAvailablePollutants, 
    getAvailableRegions,
    isValidCombination 
  } = useInsightOptions();

  // Get dynamic options based on selected region
  const availableRegions = useMemo(() => getAvailableRegions(), [getAvailableRegions]);
  const availableYears = useMemo(() => getAvailableYears(region), [getAvailableYears, region]);
  const availablePollutants = useMemo(() => getAvailablePollutants(region), [getAvailablePollutants, region]);

  // Validate and auto-correct selections when dynamic options change
  useEffect(() => {
    if (!options || optionsLoading) return;

    // Check if current region is valid
    if (region && !availableRegions.includes(region)) {
      const firstAvailableRegion = availableRegions[0];
      if (firstAvailableRegion) {
        console.log(`Auto-correcting region from ${region} to ${firstAvailableRegion}`);
        onRegionChange(firstAvailableRegion);
      }
      return;
    }

    // Check if current pollutant is valid for selected region
    if (pollutant && !availablePollutants.includes(pollutant)) {
      const firstAvailablePollutant = availablePollutants[0];
      if (firstAvailablePollutant) {
        console.log(`Auto-correcting pollutant from ${pollutant} to ${firstAvailablePollutant}`);
        onPollutantChange(firstAvailablePollutant);
      }
      return;
    }

    // Check if current year is valid for selected region (only for tabs that use year)
    if ((activeTab === "seasonality" || activeTab === "top-polluted") && 
        year && !availableYears.includes(year)) {
      const firstAvailableYear = availableYears[0];
      if (firstAvailableYear) {
        console.log(`Auto-correcting year from ${year} to ${firstAvailableYear}`);
        onYearChange(firstAvailableYear.toString());
      }
    }
  }, [options, optionsLoading, region, pollutant, year, activeTab, availableRegions, availablePollutants, availableYears, onRegionChange, onPollutantChange, onYearChange]);

  // Determine which filters to show based on active tab
  const showRegion = activeTab === "trend" || activeTab === "seasonality";
  const showPollutant = true; // All tabs use pollutant
  const showYear = activeTab === "seasonality" || activeTab === "top-polluted";

  return (
    <div className="space-y-4">
      {/* Loading indicator for dynamic options */}
      {optionsLoading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-blue-800">Loading available options...</span>
        </div>
      )}

      {/* Error indicator for failed options load */}
      {optionsError && (
        <div className="p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {optionsError}. Using fallback options.
          </p>
        </div>
      )}

      {/* Tab-specific filter descriptions */}
      {activeTab === "trend" && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Annual Trend:</strong> Shows historical data across all available years for the selected region and pollutant.
          </p>
        </div>
      )}
      
      {activeTab === "seasonality" && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Seasonality:</strong> Shows seasonal patterns for a specific year and region.
          </p>
        </div>
      )}
      
      {activeTab === "top-polluted" && (
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Top Polluted Areas:</strong> Compares all regions for a specific pollutant and year.
          </p>
        </div>
      )}

      {/* Main filters */}
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
                disabled={loading || optionsLoading}
                regions={availableRegions}
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
                disabled={loading || optionsLoading}
                pollutants={availablePollutants}
              />
              {availablePollutants.length === 0 && region && !optionsLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  No pollutants available for {region}
                </p>
              )}
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
                disabled={loading || optionsLoading || availableYears.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((yearOption) => (
                    <SelectItem key={yearOption} value={yearOption.toString()}>
                      {yearOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableYears.length === 0 && region && !optionsLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  No years available for {region}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
