
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PollutionMap } from "@/components/insights/PollutionMap";
import { insightApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { AlertCircle, TrendingUp, Calendar, Trophy, MapPin } from "lucide-react";
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
  const [loading, setLoading] = useState(false);
  
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

  const fetchInsights = async () => {
    setLoading(true);
    setErrors({});
    
    try {
      // Fetch trend data
      const trendResponse = await insightApi.getTrend({ 
        pollutant, 
        region 
      });
      
      if (trendResponse.success && trendResponse.data) {
        const transformedTrendData = trendResponse.data.labels.map((yearLabel, index) => ({
          year: yearLabel,
          value: trendResponse.data.values[index],
          delta: trendResponse.data.deltas?.[index] || 0
        }));
        setTrendData(transformedTrendData);
        if (trendResponse.data.unit) {
          setDataUnit(trendResponse.data.unit);
        }
      } else {
        console.error("Failed to fetch trend data:", trendResponse.error);
        setErrors(prev => ({ ...prev, trend: "Trend data unavailable" }));
        setTrendData([]);
      }
      
      // Fetch seasonal data
      const seasonalResponse = await insightApi.getSeasonality({ 
        pollutant, 
        region 
      });
      
      if (seasonalResponse.success && seasonalResponse.data) {
        const transformedSeasonalData = seasonalResponse.data.labels.map((month, index) => ({
          month,
          value: seasonalResponse.data.values[index]
        }));
        setSeasonalData(transformedSeasonalData);
      } else {
        console.error("Failed to fetch seasonality data:", seasonalResponse.error);
        setErrors(prev => ({ ...prev, seasonal: "Seasonal data unavailable" }));
        setSeasonalData([]);
      }
      
      // Fetch top polluted data
      const topPollutedResponse = await insightApi.getTopPolluted({
        pollutant,
        year
      });
      
      if (topPollutedResponse.success && topPollutedResponse.data) {
        const safeData = Array.isArray(topPollutedResponse.data) ? topPollutedResponse.data : [];
        setTopPollutedData(safeData);
      } else {
        console.error("Failed to fetch top polluted data:", topPollutedResponse.error);
        setErrors(prev => ({ ...prev, topPolluted: "Top polluted regions data unavailable" }));
        setTopPollutedData([]);
      }
      
      if (trendResponse.success || seasonalResponse.success || topPollutedResponse.success) {
        toast.success(`Insights updated for ${getPollutantDisplayName(pollutant)}`);
      }
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error("Failed to load insights data");
    } finally {
      setLoading(false);
    }
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
      
      <Button onClick={fetchInsights} disabled={loading} className="w-full sm:w-auto">
        {loading ? "Loading..." : "Update Insights"}
      </Button>
      
      {/* Charts Section */}
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
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
          <TabsTrigger value="pollution-map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Pollution Map
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
              {errors.trend ? (
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
              {errors.seasonal ? (
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
              {errors.topPolluted ? (
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
        
        <TabsContent value="pollution-map">
          <PollutionMap
            data={topPollutedData}
            pollutant={pollutant}
            year={year}
            unit={dataUnit}
            loading={loading}
            error={errors.topPolluted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Insights;
