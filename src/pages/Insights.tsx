import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { insightApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { toast } from "sonner";
import { TrendingUp, Calendar, Trophy, Database } from "lucide-react";
import { InsightFilters } from "@/components/insights/InsightFilters";
import { TrendTab } from "@/components/insights/TrendTab";
import { SeasonalityTab } from "@/components/insights/SeasonalityTab";
import { TopPollutedTab } from "@/components/insights/TopPollutedTab";
import { DatasetAvailabilityTable } from "@/components/insights/DatasetAvailabilityTable";
import { CurrentSelectionBreadcrumb } from "@/components/insights/CurrentSelectionBreadcrumb";
import { useDatasetAvailabilityMatrix } from "@/hooks/useDatasetAvailabilityMatrix";
import { useInsightOptions } from "@/hooks/useInsightOptions";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Insights: React.FC = () => {
  const [activeTab, setActiveTab] = useState("trend");
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [year, setYear] = useState<number>(2023);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(true);
  
  // Separate loading states for each tab
  const [trendLoading, setTrendLoading] = useState(false);
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [topPollutedLoading, setTopPollutedLoading] = useState(false);
  
  const [trendData, setTrendData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [topPollutedData, setTopPollutedData] = useState<any[]>([]);
  const [dataUnit, setDataUnit] = useState("μg/m³");
  const [errors, setErrors] = useState<{ trend?: string; seasonal?: string; topPolluted?: string }>({});

  // Dataset availability hook
  const { data: availabilityData, isLoading: availabilityLoading } = useDatasetAvailabilityMatrix();
  
  // Dynamic options hook
  const { isValidCombination } = useInsightOptions();

  // Helper function to get region display name
  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const fetchTrendData = async () => {
    if (!isValidCombination(region, pollutant, year)) {
      console.warn("Invalid combination for trend data:", { region, pollutant, year });
      setTrendData([]);
      setErrors(prev => ({ ...prev, trend: "No trained model available for this combination" }));
      return;
    }

    setTrendLoading(true);
    setErrors(prev => ({ ...prev, trend: undefined }));
    
    try {
      console.log("Fetching trend data for:", { pollutant, region, year });
      
      const trendResponse = await insightApi.getTrend({ pollutant, region, year });
      
      console.log("Trend API response:", trendResponse);
      
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
          console.log("Transformed trend data:", transformedTrendData);
        } else {
          console.error("Invalid trend data structure:", trendResponse.data);
          setErrors(prev => ({ ...prev, trend: "Invalid trend data structure" }));
          setTrendData([]);
        }
      } else {
        console.error("Failed to fetch trend data:", trendResponse.error);
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
  };

  const fetchSeasonalData = async () => {
    if (!isValidCombination(region, pollutant, year)) {
      console.warn("Invalid combination for seasonal data:", { region, pollutant, year });
      setSeasonalData([]);
      setErrors(prev => ({ ...prev, seasonal: "No trained model available for this combination" }));
      return;
    }

    setSeasonalLoading(true);
    setErrors(prev => ({ ...prev, seasonal: undefined }));
    
    try {
      console.log("Fetching seasonal data for:", { pollutant, region, year });
      
      const seasonalResponse = await insightApi.getSeasonality({ pollutant, region, year });
      
      console.log("Seasonal API response:", seasonalResponse);
      
      if (seasonalResponse.success && seasonalResponse.data) {
        const seasonalSection = seasonalResponse.data.seasonal_avg;
        if (seasonalSection && seasonalSection.labels && seasonalSection.values) {
          const transformedSeasonalData = seasonalSection.labels.map((month, index) => ({
            month,
            value: seasonalSection.values[index]
          }));
          setSeasonalData(transformedSeasonalData);
          console.log("Transformed seasonal data:", transformedSeasonalData);
        } else {
          console.error("Invalid seasonal data structure:", seasonalResponse.data);
          setErrors(prev => ({ ...prev, seasonal: "Invalid seasonal data structure" }));
          setSeasonalData([]);
        }
      } else {
        console.error("Failed to fetch seasonality data:", seasonalResponse.error);
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
  };

  const fetchTopPollutedData = async () => {
    if (!isValidCombination("", pollutant, year)) {
      console.warn("Invalid combination for top polluted data:", { pollutant, year });
      setTopPollutedData([]);
      setErrors(prev => ({ ...prev, topPolluted: "No trained models available for this combination" }));
      return;
    }

    setTopPollutedLoading(true);
    setErrors(prev => ({ ...prev, topPolluted: undefined }));
    
    try {
      console.log("Fetching top polluted data for:", { pollutant, year });
      
      const topPollutedResponse = await insightApi.getTopPolluted({ pollutant, year });
      
      console.log("Top polluted API response:", topPollutedResponse);
      
      if (topPollutedResponse.success && topPollutedResponse.data) {
        if (Array.isArray(topPollutedResponse.data)) {
          const transformedTopPollutedData = topPollutedResponse.data.map(({ name, value }) => ({
            name: getRegionDisplayName(name),
            value
          }));
          setTopPollutedData(transformedTopPollutedData);
          console.log("Transformed top polluted data:", transformedTopPollutedData);
        } else {
          console.error("Invalid top polluted data structure:", topPollutedResponse.data);
          setErrors(prev => ({ ...prev, topPolluted: "Invalid top polluted data structure" }));
          setTopPollutedData([]);
        }
      } else {
        console.error("Failed to fetch top polluted data:", topPollutedResponse.error);
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
  };

  // Handle region/year selection from availability table
  const handleRegionYearSelect = (selectedRegion: string, selectedYear: number) => {
    console.log("Selected region/year:", selectedRegion, selectedYear);
    setRegion(selectedRegion);
    setSelectedYear(selectedYear);
    setYear(selectedYear);
    
    // Switch to Annual Trend tab to show all years for this region
    setActiveTab("trend");
    
    // Close availability table to focus on data
    setIsAvailabilityOpen(false);
    
    toast.success(`Selected ${getRegionDisplayName(selectedRegion)} data for ${selectedYear}`);
  };

  // Handle pollutant selection from availability table
  const handlePollutantSelect = (selectedRegion: string, selectedPollutant: Pollutant) => {
    console.log("Selected region/pollutant:", selectedRegion, selectedPollutant);
    setRegion(selectedRegion);
    setPollutant(selectedPollutant);
    
    // Switch to Annual Trend tab to show trend for this pollutant
    setActiveTab("trend");
    
    // Close availability table to focus on data
    setIsAvailabilityOpen(false);
    
    toast.success(`Selected ${selectedPollutant.replace('_conc', '').toUpperCase()} analysis for ${getRegionDisplayName(selectedRegion)}`);
  };

  // Fetch data based on active tab and filters
  useEffect(() => {
    if (activeTab === "trend") {
      fetchTrendData();
    } else if (activeTab === "seasonality") {
      fetchSeasonalData();
    } else if (activeTab === "top-polluted") {
      fetchTopPollutedData();
    }
  }, [activeTab, region, pollutant, year]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleRegionChange = (value: string) => {
    setRegion(value);
  };
  
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
  };
  
  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
  };

  const isLoading = trendLoading || seasonalLoading || topPollutedLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Insights</h1>
        <p className="text-muted-foreground">
          Explore historical air quality data across different regions and time periods. Start by selecting available datasets below.
        </p>
      </div>

      {/* Dataset Availability Section */}
      <Collapsible open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Available Datasets
            </div>
            {isAvailabilityOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {availabilityLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading dataset availability...</p>
              </div>
            </div>
          ) : availabilityData ? (
            <DatasetAvailabilityTable
              data={availabilityData}
              onRegionYearSelect={handleRegionYearSelect}
              onPollutantSelect={handlePollutantSelect}
              selectedRegion={region}
              selectedYear={selectedYear}
              selectedPollutant={pollutant}
            />
          ) : null}
        </CollapsibleContent>
      </Collapsible>

      {/* Current Selection Breadcrumb */}
      <CurrentSelectionBreadcrumb
        region={region}
        year={activeTab === "top-polluted" ? year : selectedYear}
        pollutant={pollutant}
      />
      
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

        {/* Tab-specific Filter Controls */}
        <InsightFilters
          activeTab={activeTab}
          region={region}
          pollutant={pollutant}
          year={year}
          onRegionChange={handleRegionChange}
          onPollutantChange={handlePollutantChange}
          onYearChange={handleYearChange}
          loading={isLoading}
        />
        
        {/* Charts Section */}
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
    </div>
  );
};

export default Insights;
