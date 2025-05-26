
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
    modelData,
    loading: modelsLoading, 
    error: modelsError,
    getAvailableRegions,
    getAvailablePollutants, 
    getAvailableYears,
    isValidCombination 
  } = useInsightOptions();

  // Get dynamic options based on trained model data
  const availableRegions = useMemo(() => {
    if (!modelData) return [];
    return Object.keys(modelData);
  }, [modelData]);

  const availablePollutants = useMemo(() => {
    if (!modelData || !region || !modelData[region]) return [];
    return Object.keys(modelData[region]) as Pollutant[];
  }, [modelData, region]);

  const availableYears = useMemo(() => {
    if (!modelData || !region || !pollutant || !modelData[region] || !modelData[region][pollutant]) return [];
    return modelData[region][pollutant].years || [];
  }, [modelData, region, pollutant]);

  // Auto-correct selections when model data changes or when selections become invalid
  useEffect(() => {
    if (!modelData || modelsLoading) return;

    console.log("Model data updated:", modelData);
    console.log("Current selections:", { region, pollutant, year });
    console.log("Available options:", { 
      regions: availableRegions, 
      pollutants: availablePollutants, 
      years: availableYears 
    });

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
    if (region && pollutant && !availablePollutants.includes(pollutant)) {
      const firstAvailablePollutant = availablePollutants[0];
      if (firstAvailablePollutant) {
        console.log(`Auto-correcting pollutant from ${pollutant} to ${firstAvailablePollutant}`);
        onPollutantChange(firstAvailablePollutant);
      }
      return;
    }

    // Check if current year is valid for selected region and pollutant
    if (region && pollutant && year && !availableYears.includes(year)) {
      const firstAvailableYear = availableYears[0];
      if (firstAvailableYear) {
        console.log(`Auto-correcting year from ${year} to ${firstAvailableYear}`);
        onYearChange(firstAvailableYear.toString());
      }
    }
  }, [modelData, modelsLoading, region, pollutant, year, availableRegions, availablePollutants, availableYears, onRegionChange, onPollutantChange, onYearChange]);

  // Handle region change - reset pollutant and year
  const handleRegionChange = (newRegion: string) => {
    console.log("Region changed to:", newRegion);
    onRegionChange(newRegion);
    
    // Reset pollutant and year when region changes
    const newAvailablePollutants = modelData && modelData[newRegion] ? Object.keys(modelData[newRegion]) as Pollutant[] : [];
    if (newAvailablePollutants.length > 0) {
      const firstPollutant = newAvailablePollutants[0];
      onPollutantChange(firstPollutant);
      
      // Reset year when pollutant changes
      const newAvailableYears = modelData && modelData[newRegion] && modelData[newRegion][firstPollutant] 
        ? modelData[newRegion][firstPollutant].years 
        : [];
      if (newAvailableYears.length > 0) {
        onYearChange(newAvailableYears[0].toString());
      }
    }
  };

  // Handle pollutant change - reset year
  const handlePollutantChange = (newPollutant: Pollutant) => {
    console.log("Pollutant changed to:", newPollutant);
    onPollutantChange(newPollutant);
    
    // Reset year when pollutant changes
    const newAvailableYears = modelData && modelData[region] && modelData[region][newPollutant] 
      ? modelData[region][newPollutant].years 
      : [];
    if (newAvailableYears.length > 0) {
      onYearChange(newAvailableYears[0].toString());
    }
  };

  // Determine which filters to show based on active tab
  const showRegion = activeTab === "trend" || activeTab === "seasonality";
  const showPollutant = true; // All tabs use pollutant
  const showYear = true; // All tabs now require year parameter

  return (
    <div className="space-y-4">
      {/* Loading indicator for model data */}
      {modelsLoading && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-blue-800">Loading available models...</span>
        </div>
      )}

      {/* Error indicator for failed model data load */}
      {modelsError && (
        <div className="p-3 bg-amber-50 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> {modelsError}. Using fallback data.
          </p>
        </div>
      )}

      {/* Tab-specific filter descriptions */}
      {activeTab === "trend" && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Annual Trend:</strong> Shows historical data for the selected region, pollutant, and year.
          </p>
        </div>
      )}
      
      {activeTab === "seasonality" && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Seasonality:</strong> Shows seasonal patterns for a specific region, pollutant, and year.
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
                onValueChange={handleRegionChange}
                disabled={loading || modelsLoading}
                regions={availableRegions}
              />
              {availableRegions.length === 0 && !modelsLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  No trained models available
                </p>
              )}
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
                onValueChange={handlePollutantChange}
                disabled={loading || modelsLoading || !region || availablePollutants.length === 0}
                pollutants={availablePollutants}
              />
              {availablePollutants.length === 0 && region && !modelsLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  No trained models available for {region}
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
                disabled={loading || modelsLoading || !region || !pollutant || availableYears.length === 0}
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
              {availableYears.length === 0 && region && pollutant && !modelsLoading && (
                <p className="text-xs text-muted-foreground mt-1">
                  No trained models available for {pollutant} in {region}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
