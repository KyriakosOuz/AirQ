
import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Button } from "@/components/ui/button";
import { Pollutant } from "@/lib/types";
import { useInsightOptions } from "@/hooks/useInsightOptions";
import { Loader2, Search, Database } from "lucide-react";

interface InsightFiltersProps {
  activeTab: string;
  region: string;
  pollutant: Pollutant;
  year: number;
  onRegionChange: (value: string) => void;
  onPollutantChange: (value: Pollutant) => void;
  onYearChange: (value: string) => void;
  onSubmit: () => void;
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
  onSubmit,
  loading = false
}) => {
  const { 
    modelData: datasetData,
    loading: datasetsLoading, 
    error: datasetsError,
  } = useInsightOptions();

  // Get dynamic options based on available dataset data
  const availableRegions = useMemo(() => {
    if (!datasetData) return [];
    return Object.keys(datasetData);
  }, [datasetData]);

  const availablePollutants = useMemo(() => {
    if (!datasetData || !region || !datasetData[region]) return [];
    return Object.keys(datasetData[region]) as Pollutant[];
  }, [datasetData, region]);

  const availableYears = useMemo(() => {
    if (!datasetData || !region || !pollutant || !datasetData[region] || !datasetData[region][pollutant]) return [];
    return datasetData[region][pollutant] || [];
  }, [datasetData, region, pollutant]);

  // Auto-correct selections when dataset data changes
  useEffect(() => {
    if (!datasetData || datasetsLoading) return;

    // Check if current region is valid
    if (region && !availableRegions.includes(region)) {
      const firstAvailableRegion = availableRegions[0];
      if (firstAvailableRegion) {
        onRegionChange(firstAvailableRegion);
      }
      return;
    }

    // Check if current pollutant is valid for selected region
    if (region && pollutant && !availablePollutants.includes(pollutant)) {
      const firstAvailablePollutant = availablePollutants[0];
      if (firstAvailablePollutant) {
        onPollutantChange(firstAvailablePollutant);
      }
      return;
    }

    // Check if current year is valid for selected region and pollutant
    if (region && pollutant && year && !availableYears.includes(year)) {
      const firstAvailableYear = availableYears[0];
      if (firstAvailableYear) {
        onYearChange(firstAvailableYear.toString());
      }
    }
  }, [datasetData, datasetsLoading, region, pollutant, year, availableRegions, availablePollutants, availableYears, onRegionChange, onPollutantChange, onYearChange]);

  // Handle region change - reset pollutant and year
  const handleRegionChange = (newRegion: string) => {
    onRegionChange(newRegion);
    
    // Reset pollutant and year when region changes
    const newAvailablePollutants = datasetData && datasetData[newRegion] ? Object.keys(datasetData[newRegion]) as Pollutant[] : [];
    if (newAvailablePollutants.length > 0) {
      const firstPollutant = newAvailablePollutants[0];
      onPollutantChange(firstPollutant);
      
      // Reset year when pollutant changes
      const newAvailableYears = datasetData?.[newRegion]?.[firstPollutant] ?? [];
      if (newAvailableYears.length > 0) {
        onYearChange(newAvailableYears[0].toString());
      }
    }
  };

  // Handle pollutant change - reset year
  const handlePollutantChange = (newPollutant: Pollutant) => {
    onPollutantChange(newPollutant);
    
    // Reset year when pollutant changes
    const newAvailableYears = datasetData?.[region]?.[newPollutant] ?? [];
    if (newAvailableYears.length > 0) {
      onYearChange(newAvailableYears[0].toString());
    }
  };

  // Check if all filters are selected
  const isReadyToSubmit = region && pollutant && year && !loading && !datasetsLoading;
  
  // Determine which filters to show based on active tab
  const showRegion = activeTab === "trend" || activeTab === "seasonality";
  const showPollutant = true;
  const showYear = true;

  // Calculate total available combinations
  const totalCombinations = useMemo(() => {
    if (!datasetData) return 0;
    let total = 0;
    Object.values(datasetData).forEach(regionData => {
      Object.values(regionData).forEach(pollutantData => {
        total += pollutantData?.length || 0;
      });
    });
    return total;
  }, [datasetData]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Database className="h-5 w-5" />
          Filter Selection Panel
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {totalCombinations > 0 && (
            <span>{totalCombinations} dataset combinations available</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading indicator for dataset data */}
        {datasetsLoading && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-blue-800">Loading available datasets...</span>
          </div>
        )}

        {/* Error indicator for failed dataset data load */}
        {datasetsError && (
          <div className="p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> {datasetsError}. Using fallback data.
            </p>
          </div>
        )}

        {/* Filter Instructions */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Step-by-step:</strong> Select a region first, then choose a pollutant, then pick a year, and finally click Submit to load insights.
          </p>
        </div>

        {/* Main filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {showRegion && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                1. Region {!region && <span className="text-red-500">*</span>}
              </label>
              <RegionSelector 
                value={region} 
                onValueChange={handleRegionChange}
                disabled={loading || datasetsLoading}
                regions={availableRegions}
              />
              {availableRegions.length === 0 && !datasetsLoading && (
                <p className="text-xs text-red-500">No datasets available</p>
              )}
            </div>
          )}
          
          {showPollutant && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                2. Pollutant {!pollutant && <span className="text-red-500">*</span>}
              </label>
              <PollutantSelector 
                value={pollutant} 
                onValueChange={handlePollutantChange}
                disabled={loading || datasetsLoading || !region || availablePollutants.length === 0}
                pollutants={availablePollutants}
              />
              {availablePollutants.length === 0 && region && !datasetsLoading && (
                <p className="text-xs text-red-500">No datasets available for {region}</p>
              )}
            </div>
          )}
          
          {showYear && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                3. Year {!year && <span className="text-red-500">*</span>}
              </label>
              <Select 
                value={year.toString()} 
                onValueChange={onYearChange}
                disabled={loading || datasetsLoading || !region || !pollutant || availableYears.length === 0}
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
              {availableYears.length === 0 && region && pollutant && !datasetsLoading && (
                <p className="text-xs text-red-500">No datasets available for {pollutant} in {region}</p>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t">
          <Button 
            onClick={onSubmit}
            disabled={!isReadyToSubmit}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading Insights...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
          
          {!isReadyToSubmit && !loading && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please select all filters to continue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
