
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { insightApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { AlertCircle, TrendingUp, Calendar, Trophy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Chart configuration for consistent styling
const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--primary))",
  },
  trend: {
    label: "Trend",
    color: "hsl(var(--primary))",
  },
  seasonal: {
    label: "Seasonal",
    color: "hsl(var(--chart-2))",
  },
  regions: {
    label: "Regions",
    color: "hsl(var(--chart-3))",
  },
};

const Insights: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [year, setYear] = useState<number>(2023);
  
  // Separate loading states for each tab
  const [trendLoading, setTrendLoading] = useState(false);
  const [seasonalLoading, setSeasonalLoading] = useState(false);
  const [topPollutedLoading, setTopPollutedLoading] = useState(false);
  
  const [trendData, setTrendData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [topPollutedData, setTopPollutedData] = useState<any[]>([]);
  const [dataUnit, setDataUnit] = useState("μg/m³");
  const [errors, setErrors] = useState<{ trend?: string; seasonal?: string; topPolluted?: string }>({});
  
  // Years for selection
  const years = Array.from({ length: 9 }, (_, i) => 2015 + i);

  // Helper function to get pollutant display name
  const getPollutantDisplayName = (pollutant: Pollutant) => {
    if (pollutant === "pollution") return "Combined Pollution Index";
    const pollutantNames: Record<Pollutant, string> = {
      pollution: "Combined Pollution Index",
      no2_conc: "NO₂",
      o3_conc: "O₃",
      co_conc: "CO",
      no_conc: "NO",
      so2_conc: "SO₂"
    };
    return pollutantNames[pollutant] || pollutant;
  };

  // Helper function to get region display name
  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  useEffect(() => {
    fetchInsights();
  }, [region, pollutant, year]);

  const fetchTrendData = async () => {
    setTrendLoading(true);
    setErrors(prev => ({ ...prev, trend: undefined }));
    
    try {
      console.log("Fetching trend data for:", { pollutant, region });
      const trendResponse = await insightApi.getTrend({ 
        pollutant, 
        region 
      });
      
      console.log("Trend API response:", trendResponse);
      
      if (trendResponse.success && trendResponse.data) {
        // Extract data from nested trend structure
        const trendSection = trendResponse.data.trend;
        if (trendSection && trendSection.labels && trendSection.values) {
          const transformedTrendData = trendSection.labels.map((yearLabel, index) => ({
            year: yearLabel,
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
    setSeasonalLoading(true);
    setErrors(prev => ({ ...prev, seasonal: undefined }));
    
    try {
      console.log("Fetching seasonal data for:", { pollutant, region });
      const seasonalResponse = await insightApi.getSeasonality({ 
        pollutant, 
        region 
      });
      
      console.log("Seasonal API response:", seasonalResponse);
      
      if (seasonalResponse.success && seasonalResponse.data) {
        // Extract data from nested seasonal_avg structure
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
    setTopPollutedLoading(true);
    setErrors(prev => ({ ...prev, topPolluted: undefined }));
    
    try {
      console.log("Fetching top polluted data for:", { pollutant, year });
      const topPollutedResponse = await insightApi.getTopPolluted({
        pollutant,
        year
      });
      
      console.log("Top polluted API response:", topPollutedResponse);
      
      if (topPollutedResponse.success && topPollutedResponse.data) {
        // Handle flat array response directly
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

  const fetchInsights = async () => {
    await Promise.all([
      fetchTrendData(),
      fetchSeasonalData(), 
      fetchTopPollutedData()
    ]);
    
    toast.success(`Insights updated for ${getPollutantDisplayName(pollutant)}`);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Insights</h1>
        <p className="text-muted-foreground">
          Analyze historical trends and patterns in air quality data across different regions and time periods.
        </p>
      </div>
      
      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Region</CardTitle>
          </CardHeader>
          <CardContent>
            <RegionSelector value={region} onValueChange={handleRegionChange} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pollutant</CardTitle>
          </CardHeader>
          <CardContent>
            <PollutantSelector value={pollutant} onValueChange={handlePollutantChange} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Year</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={year.toString()} onValueChange={handleYearChange}>
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
      </div>
      
      <Button onClick={fetchInsights} disabled={trendLoading || seasonalLoading || topPollutedLoading} className="w-full sm:w-auto">
        {(trendLoading || seasonalLoading || topPollutedLoading) ? "Loading..." : "Update Insights"}
      </Button>
      
      {/* Charts Section */}
      <Tabs defaultValue="trend" className="w-full">
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
          <Card>
            <CardHeader>
              <CardTitle>
                {getPollutantDisplayName(pollutant)} Trend in {getRegionDisplayName(region)}
              </CardTitle>
              <CardDescription>
                Yearly average concentrations over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading trend data...</p>
                  </div>
                </div>
              ) : errors.trend ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.trend}</AlertDescription>
                </Alert>
              ) : trendData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis label={{ value: dataUnit, angle: -90, position: 'insideLeft' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="var(--color-trend)" 
                        strokeWidth={2} 
                        dot={{ fill: "var(--color-trend)" }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seasonality">
          <Card>
            <CardHeader>
              <CardTitle>
                {getPollutantDisplayName(pollutant)} Seasonality in {getRegionDisplayName(region)}
              </CardTitle>
              <CardDescription>
                Monthly average concentrations showing seasonal patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {seasonalLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading seasonal data...</p>
                  </div>
                </div>
              ) : errors.seasonal ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.seasonal}</AlertDescription>
                </Alert>
              ) : seasonalData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={seasonalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis label={{ value: dataUnit, angle: -90, position: 'insideLeft' }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-seasonal)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No seasonal data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-polluted">
          <Card>
            <CardHeader>
              <CardTitle>
                Most Polluted Regions for {getPollutantDisplayName(pollutant)} ({year})
              </CardTitle>
              <CardDescription>
                Regions with highest average concentrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topPollutedLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading top polluted data...</p>
                  </div>
                </div>
              ) : errors.topPolluted ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.topPolluted}</AlertDescription>
                </Alert>
              ) : topPollutedData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical" 
                      data={topPollutedData} 
                      margin={{ top: 10, right: 30, left: 50, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" label={{ value: dataUnit, position: 'insideBottom', offset: -5 }} />
                      <YAxis dataKey="name" type="category" width={150} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="var(--color-regions)" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No top polluted regions data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Insights;
