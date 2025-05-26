
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingUp, Calendar, Trophy } from "lucide-react";
import { InsightFilters } from "@/components/insights/InsightFilters";
import { TrendTab } from "@/components/insights/TrendTab";
import { SeasonalityTab } from "@/components/insights/SeasonalityTab";
import { TopPollutedTab } from "@/components/insights/TopPollutedTab";
import { CurrentSelectionBreadcrumb } from "@/components/insights/CurrentSelectionBreadcrumb";
import { useInsightOptions } from "@/hooks/useInsightOptions";
import { formatPollutantName } from "@/lib/utils";
import { useTrendInsights } from "@/hooks/useTrendInsights";
import { useSeasonalInsights } from "@/hooks/useSeasonalInsights";
import { useTopPollutedInsights } from "@/hooks/useTopPollutedInsights";
import { useInsightFiltersStore } from "@/stores/insightFiltersStore";
import { Pollutant } from "@/lib/types";

const Insights: React.FC = () => {
  const [activeTab, setActiveTab] = useState("trend");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Use Zustand store for filters
  const { 
    region, 
    pollutant, 
    year, 
    setRegion, 
    setPollutant, 
    setYear 
  } = useInsightFiltersStore();

  // React Query hooks for data fetching
  const trendQuery = useTrendInsights(hasSubmitted ? region : null, hasSubmitted ? pollutant : null, hasSubmitted ? year : null);
  const seasonalQuery = useSeasonalInsights(hasSubmitted ? region : null, hasSubmitted ? pollutant : null, hasSubmitted ? year : null);
  const topPollutedQuery = useTopPollutedInsights(hasSubmitted ? pollutant : null, hasSubmitted ? year : null);

  // Dynamic options hook
  const { isValidCombination } = useInsightOptions();

  // Helper function to get region display name
  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Transform data for components
  const transformTrendData = (data: any) => {
    if (!data?.trend) return [];
    const trendSection = data.trend;
    if (trendSection?.labels && trendSection?.values) {
      return trendSection.labels.map((label: string, index: number) => ({
        year: label,
        value: trendSection.values[index],
        delta: trendSection.deltas?.[index] || 0
      }));
    }
    return [];
  };

  const transformSeasonalData = (data: any) => {
    if (!data?.seasonal_avg) return [];
    const seasonalSection = data.seasonal_avg;
    if (seasonalSection?.labels && seasonalSection?.values) {
      return seasonalSection.labels.map((month: string, index: number) => ({
        month,
        value: seasonalSection.values[index]
      }));
    }
    return [];
  };

  const transformTopPollutedData = (data: any) => {
    if (!Array.isArray(data)) return [];
    return data.map(({ name, value }) => ({
      name: getRegionDisplayName(name),
      value
    }));
  };

  // Handle submit button click
  const handleSubmit = () => {
    setHasSubmitted(true);
    const pollutantDisplayName = formatPollutantName(pollutant.replace('_conc', ''));
    toast.success(`Loading insights for ${pollutantDisplayName} in ${getRegionDisplayName(region)} (${year})`);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleRegionChange = (value: string) => {
    setRegion(value);
    setHasSubmitted(false);
  };
  
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
    setHasSubmitted(false);
  };
  
  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
    setHasSubmitted(false);
  };

  const isLoading = trendQuery.isLoading || seasonalQuery.isLoading || topPollutedQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Insights</h1>
        <p className="text-muted-foreground">
          Explore historical air quality data across different regions and time periods.
        </p>
      </div>

      {/* Filter Selection Panel */}
      <InsightFilters
        activeTab={activeTab}
        region={region}
        pollutant={pollutant}
        year={year}
        onRegionChange={handleRegionChange}
        onPollutantChange={handlePollutantChange}
        onYearChange={handleYearChange}
        onSubmit={handleSubmit}
        loading={isLoading}
      />

      {/* Current Selection Breadcrumb */}
      {hasSubmitted && (
        <CurrentSelectionBreadcrumb
          region={region}
          year={year}
          pollutant={pollutant}
        />
      )}
      
      {/* Charts Section - Only show after submission */}
      {hasSubmitted && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="trend" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Annual Trend
            </TabsTrigger>
            <TabsTrigger value="seasonality" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Seasonality
            </TabsTrigger>
            <TabsTrigger value="top-polluted" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Top Polluted Areas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trend">
            <TrendTab
              region={region}
              pollutant={pollutant}
              data={transformTrendData(trendQuery.data)}
              loading={trendQuery.isLoading}
              error={trendQuery.error?.message}
              dataUnit={trendQuery.data?.trend?.unit || "μg/m³"}
            />
          </TabsContent>
          
          <TabsContent value="seasonality">
            <SeasonalityTab
              region={region}
              pollutant={pollutant}
              data={transformSeasonalData(seasonalQuery.data)}
              loading={seasonalQuery.isLoading}
              error={seasonalQuery.error?.message}
              dataUnit="μg/m³"
            />
          </TabsContent>
          
          <TabsContent value="top-polluted">
            <TopPollutedTab
              pollutant={pollutant}
              year={year}
              data={transformTopPollutedData(topPollutedQuery.data)}
              loading={topPollutedQuery.isLoading}
              error={topPollutedQuery.error?.message}
              dataUnit="μg/m³"
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Instructions for first-time users */}
      {!hasSubmitted && (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Ready to Explore Air Quality Insights?</h3>
          <p className="text-muted-foreground">
            Select your filters above and click "Generate Insights" to view detailed air quality analysis.
          </p>
        </div>
      )}
    </div>
  );
};

export default Insights;
