
import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insightApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { toast } from "sonner";
import { TrendingUp, Calendar, Trophy } from "lucide-react";
import { InsightFilters } from "@/components/insights/InsightFilters";
import { TrendTab } from "@/components/insights/TrendTab";
import { SeasonalityTab } from "@/components/insights/SeasonalityTab";
import { TopPollutedTab } from "@/components/insights/TopPollutedTab";
import { CurrentSelectionBreadcrumb } from "@/components/insights/CurrentSelectionBreadcrumb";
import { useInsightOptions } from "@/hooks/useInsightOptions";

const Insights: React.FC = () => {
  const [activeTab, setActiveTab] = useState("trend");
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [year, setYear] = useState<number>(2023);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Separate loading states for each tab
  const [trendLoading, setTrendLoading] = useState(false);
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [topPollutedLoading, setTopPollutedLoading] = useState(false);
  
  const [trendData, setTrendData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [topPollutedData, setTopPollutedData] = useState<any[]>([]);
  const [dataUnit, setDataUnit] = useState("μg/m³");
  const [errors, setErrors] = useState<{ trend?: string; seasonal?: string; topPolluted?: string }>({});

  // Dynamic options hook
  const { isValidCombination } = useInsightOptions();

  // Helper function to get region display name
  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const fetchTrendData = useCallback(async () => {
    setTrendLoading(true);
    setErrors(prev => ({ ...prev, trend: undefined }));
    
    try {
      console.log("Fetching trend data for:", { pollutant, region, year });
      
      const trendResponse = await insightApi.getTrend({ pollutant, region, year });
      
      if (trendResponse.success && trendResponse.data) {
        const trendSection = trendResponse.data.trend;
        if (trendSection && trendSection.labels && trendSection.values) {
          const transformedTrendData = trendSection.labels.map((label, index) => ({
            year: label,
            value: trendSection.values[index],
            delta: trendSection.deltas?.[index] || 0
          }));
          setTrendData(transformedTrendData);
          if (trendSection.unit) {
            setDataUnit(trendSection.unit);
          }
        } else {
          setErrors(prev => ({ ...prev, trend: "Invalid trend data structure" }));
          setTrendData([]);
        }
      } else {
        setErrors(prev => ({ ...prev, trend: "Trend data unavailable" }));
        setTrendData([]);
      }
    } catch (error) {
      console.error("Error fetching trend data:", error);
      setErrors(prev => ({ ...prev, trend: "Failed to load trend data" }));
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  }, [region, pollutant, year]);

  const fetchSeasonalData = useCallback(async () => {
    setSeasonalLoading(true);
    setErrors(prev => ({ ...prev, seasonal: undefined }));
    
    try {
      console.log("Fetching seasonal data for:", { pollutant, region, year });
      
      const seasonalResponse = await insightApi.getSeasonality({ pollutant, region, year });
      
      if (seasonalResponse.success && seasonalResponse.data) {
        const seasonalSection = seasonalResponse.data.seasonal_avg;
        if (seasonalSection && seasonalSection.labels && seasonalSection.values) {
          const transformedSeasonalData = seasonalSection.labels.map((month, index) => ({
            month,
            value: seasonalSection.values[index]
          }));
          setSeasonalData(transformedSeasonalData);
        } else {
          setErrors(prev => ({ ...prev, seasonal: "Invalid seasonal data structure" }));
          setSeasonalData([]);
        }
      } else {
        setErrors(prev => ({ ...prev, seasonal: "Seasonal data unavailable" }));
        setSeasonalData([]);
      }
    } catch (error) {
      console.error("Error fetching seasonal data:", error);
      setErrors(prev => ({ ...prev, seasonal: "Failed to load seasonal data" }));
      setSeasonalData([]);
    } finally {
      setSeasonalLoading(false);
    }
  }, [region, pollutant, year]);

  const fetchTopPollutedData = useCallback(async () => {
    setTopPollutedLoading(true);
    setErrors(prev => ({ ...prev, topPolluted: undefined }));
    
    try {
      console.log("Fetching top polluted data for:", { pollutant, year });
      
      const topPollutedResponse = await insightApi.getTopPolluted({ pollutant, year });
      
      if (topPollutedResponse.success && topPollutedResponse.data) {
        if (Array.isArray(topPollutedResponse.data)) {
          const transformedTopPollutedData = topPollutedResponse.data.map(({ name, value }) => ({
            name: getRegionDisplayName(name),
            value
          }));
          setTopPollutedData(transformedTopPollutedData);
        } else {
          setErrors(prev => ({ ...prev, topPolluted: "Invalid top polluted data structure" }));
          setTopPollutedData([]);
        }
      } else {
        setErrors(prev => ({ ...prev, topPolluted: "Top polluted regions data unavailable" }));
        setTopPollutedData([]);
      }
    } catch (error) {
      console.error("Error fetching top polluted data:", error);
      setErrors(prev => ({ ...prev, topPolluted: "Failed to load top polluted data" }));
      setTopPollutedData([]);
    } finally {
      setTopPollutedLoading(false);
    }
  }, [pollutant, year]);

  // Handle submit button click
  const handleSubmit = useCallback(async () => {
    setHasSubmitted(true);
    toast.success(`Loading insights for ${pollutant.replace('_conc', '').toUpperCase()} in ${getRegionDisplayName(region)} (${year})`);
    
    // Fetch data for all tabs
    await Promise.all([
      fetchTrendData(),
      fetchSeasonalData(),
      fetchTopPollutedData()
    ]);
  }, [fetchTrendData, fetchSeasonalData, fetchTopPollutedData, pollutant, region, year]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleRegionChange = (value: string) => {
    setRegion(value);
    setHasSubmitted(false); // Reset submission state when filters change
  };
  
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
    setHasSubmitted(false);
  };
  
  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
    setHasSubmitted(false);
  };

  const isLoading = trendLoading || seasonalLoading || topPollutedLoading;

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
              data={trendData}
              loading={trendLoading}
              error={errors.trend}
              dataUnit={dataUnit}
            />
          </TabsContent>
          
          <TabsContent value="seasonality">
            <SeasonalityTab
              region={region}
              pollutant={pollutant}
              data={seasonalData}
              loading={seasonalLoading}
              error={errors.seasonal}
              dataUnit={dataUnit}
            />
          </TabsContent>
          
          <TabsContent value="top-polluted">
            <TopPollutedTab
              pollutant={pollutant}
              year={year}
              data={topPollutedData}
              loading={topPollutedLoading}
              error={errors.topPolluted}
              dataUnit={dataUnit}
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
