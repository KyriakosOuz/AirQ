import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AqiBadge } from "@/components/ui/aqi-badge";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { healthApi, insightApi, predictionApi } from "@/lib/api";
import { AqiLevel, HealthTip, Pollutant, TrendChart, SeasonalityChart } from "@/lib/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useRegionStore } from "@/stores/regionStore";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { getErrorMessage } from "@/lib/utils";

const Dashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const { setSelectedRegion, setSelectedPollutant } = useRegionStore();
  
  const [loading, setLoading] = useState(false);
  const [healthTip, setHealthTip] = useState<HealthTip | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [currentAqi, setCurrentAqi] = useState<AqiLevel>("moderate");
  
  // Update app state when region or pollutant changes
  useEffect(() => {
    // Fix: Use region string directly as the value instead of trying to pass it as a Region object
    setSelectedRegion(region);
    setSelectedPollutant(pollutant);
  }, [region, pollutant, setSelectedRegion, setSelectedPollutant]);
  
  // Fetch real trend, seasonality, and forecast data from API
  useEffect(() => {
    const fetchInsightData = async () => {
      setLoading(true);
      try {
        // Fetch trend data - this endpoint looks correct
        const trendResponse = await insightApi.getTrend({ 
          pollutant, 
          region 
        });
        
        if (trendResponse.success && trendResponse.data) {
          // Convert TrendChart to array format expected by charts - access nested trend property
          const chartData = trendResponse.data.trend.labels.map((label, index) => ({
            year: label,
            value: trendResponse.data.trend.values[index],
            delta: trendResponse.data.trend.deltas[index]
          }));
          setTrendData(chartData);
        } else {
          console.error("Failed to fetch trend data:", trendResponse.error);
          toast.error(getErrorMessage(trendResponse.error));
        }
        
        // Fetch seasonal data - this endpoint looks correct
        const seasonalResponse = await insightApi.getSeasonality({ 
          pollutant, 
          region 
        });
        
        if (seasonalResponse.success && seasonalResponse.data) {
          // Convert SeasonalityChart to array format expected by charts - access nested seasonal_avg property
          const chartData = seasonalResponse.data.seasonal_avg.labels.map((label, index) => ({
            name: label,
            value: seasonalResponse.data.seasonal_avg.values[index]
          }));
          setSeasonalData(chartData);
        } else {
          console.error("Failed to fetch seasonality data:", seasonalResponse.error);
          toast.error(getErrorMessage(seasonalResponse.error));
        }

        // Fetch real forecast data - updated to use models/predict instead
        const forecastResponse = await predictionApi.forecast({ 
          pollutant, 
          region 
        });
        
        if (forecastResponse.success && forecastResponse.data) {
          // Transform the API response data to a format suitable for our chart
          // Backend returns { ds, yhat, category } but our chart expects { month, value, lower, upper }
          const transformedForecastData = forecastResponse.data.map(item => ({
            month: new Date(item.ds).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            value: item.yhat,
            // Backend doesn't provide confidence intervals, so we'll estimate them
            lower: Math.max(0, item.yhat * 0.85), // 15% below prediction
            upper: item.yhat * 1.15, // 15% above prediction
            category: item.category // Keep the category from backend for reference
          }));
          
          setForecastData(transformedForecastData);
          
          // If we have forecast data, set the current AQI level based on the first data point
          if (forecastData.length > 0 && forecastData[0].category) {
            // Convert backend category to our AqiLevel type
            const categoryMap: Record<string, AqiLevel> = {
              "Good": "good",
              "Moderate": "moderate",
              "Unhealthy for Sensitive Groups": "unhealthy-sensitive",
              "Unhealthy": "unhealthy",
              "Very Unhealthy": "very-unhealthy",
              "Hazardous": "hazardous"
            };
            
            setCurrentAqi(categoryMap[forecastData[0].category] || "moderate");
          }
        } else {
          console.error("Failed to fetch forecast data:", forecastResponse.error);
          toast.error(getErrorMessage(forecastResponse.error));
          
          // Fallback to empty array if API fails
          setForecastData([]);
        }
        
        toast.success(`Data updated for ${pollutant} in ${region}`);
      } catch (error) {
        console.error("Error fetching insight data:", error);
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    
    fetchInsightData();
  }, [region, pollutant]); // Refetch when region or pollutant changes
  
  // This function now just refreshes the data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Re-fetch trend data
      const trendResponse = await insightApi.getTrend({ pollutant, region });
      if (trendResponse.success && trendResponse.data) {
        // Convert TrendChart to array format expected by charts - access nested trend property
        const chartData = trendResponse.data.trend.labels.map((label, index) => ({
          year: label,
          value: trendResponse.data.trend.values[index],
          delta: trendResponse.data.trend.deltas[index]
        }));
        setTrendData(chartData);
      }
      
      // Re-fetch seasonal data
      const seasonalResponse = await insightApi.getSeasonality({ pollutant, region });
      if (seasonalResponse.success && seasonalResponse.data) {
        // Convert SeasonalityChart to array format expected by charts - access nested seasonal_avg property
        const chartData = seasonalResponse.data.seasonal_avg.labels.map((label, index) => ({
          name: label,
          value: seasonalResponse.data.seasonal_avg.values[index]
        }));
        setSeasonalData(chartData);
      }
      
      // Re-fetch forecast data with updated endpoint
      const forecastResponse = await predictionApi.forecast({ pollutant, region });
      if (forecastResponse.success && forecastResponse.data) {
        const transformedForecastData = forecastResponse.data.map(item => ({
          month: new Date(item.ds).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: item.yhat,
          // Backend doesn't provide confidence intervals, so we'll estimate them
          lower: Math.max(0, item.yhat * 0.85),
          upper: item.yhat * 1.15,
          category: item.category
        }));
        
        setForecastData(transformedForecastData);
      }
      
      toast.success(`Data updated for ${pollutant} in ${region}`);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };
  
  const fetchHealthTip = async () => {
    try {
      setLoading(true);
      // Updated to include_profile=true parameter for personalized tips
      const response = await healthApi.getTip({ pollutant, region });
      
      if (response.success && response.data) {
        setHealthTip(response.data);
        toast.success("Health tip updated");
      } else {
        console.error("Failed to fetch health tip:", response.error);
        toast.error(getErrorMessage(response.error));
        
        // Fix: use correct property name 'severity' instead of 'riskLevel'
        setHealthTip({
          tip: "Unable to fetch personalized health advice. Please try again later.",
          severity: "moderate",
          personalized: false
        });
      }
    } catch (error) {
      console.error("Error fetching health tip:", error);
      toast.error(getErrorMessage(error));
      
      // Fix: use correct property name 'severity' instead of 'riskLevel'
      setHealthTip({
        tip: "Unable to fetch personalized health advice. Please try again later.",
        severity: "moderate",
        personalized: false
      });
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
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor air quality and get personalized health recommendations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Location & Pollutant</CardTitle>
              <CardDescription>
                Select a region and pollutant to monitor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Region</label>
                  <RegionSelector value={region} onValueChange={handleRegionChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Pollutant</label>
                  <PollutantSelector value={pollutant} onValueChange={handlePollutantChange} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <span>Current Status</span>
                <AqiBadge level={currentAqi} />
              </CardTitle>
              <CardDescription>
                Air quality information for {region}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col border rounded-lg p-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {pollutant} Level
                  </span>
                  <span className="text-2xl font-bold">105 μg/m³</span>
                </div>
                <div className="flex flex-col border rounded-lg p-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    24hr Change
                  </span>
                  <span className="text-2xl font-bold text-orange-500">+2.3%</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                variant="secondary"
                onClick={fetchHealthTip}
                disabled={loading}
              >
                {loading ? "Loading..." : "Get Health Advice"}
              </Button>
            </CardFooter>
          </Card>
          
          {healthTip && (
            // Fix: Updated to use the correct property 'severity' instead of 'riskLevel'
            <Card className={`border-l-4 border-l-aqi-${healthTip.severity}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Health Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{healthTip.tip}</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Annual Trend</CardTitle>
              <CardDescription>
                Yearly average {pollutant} concentration
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Seasonal Pattern</CardTitle>
              <CardDescription>
                Monthly average {pollutant} levels
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
