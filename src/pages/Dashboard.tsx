
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AqiBadge } from "@/components/ui/aqi-badge";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { healthApi, insightApi, predictionApi } from "@/lib/api";
import { AqiLevel, HealthTip, Pollutant } from "@/lib/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useRegionStore } from "@/stores/regionStore";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

const Dashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("NO2");
  const { setSelectedRegion, setSelectedPollutant } = useRegionStore();
  
  const [loading, setLoading] = useState(false);
  const [healthTip, setHealthTip] = useState<HealthTip | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [currentAqi, setCurrentAqi] = useState<AqiLevel>("moderate");
  
  // Update app state when region or pollutant changes
  useEffect(() => {
    setSelectedRegion(region);
    setSelectedPollutant(pollutant);
  }, [region, pollutant, setSelectedRegion, setSelectedPollutant]);
  
  // Fetch real trend, seasonality, and forecast data from API
  useEffect(() => {
    const fetchInsightData = async () => {
      setLoading(true);
      try {
        // Fetch trend data
        const trendResponse = await insightApi.getTrend({ 
          pollutant, 
          region 
        });
        
        if (trendResponse.success && trendResponse.data) {
          setTrendData(trendResponse.data);
        } else {
          console.error("Failed to fetch trend data:", trendResponse.error);
          toast.error("Failed to load trend data");
        }
        
        // Fetch seasonal data
        const seasonalResponse = await insightApi.getSeasonality({ 
          pollutant, 
          region 
        });
        
        if (seasonalResponse.success && seasonalResponse.data) {
          setSeasonalData(seasonalResponse.data);
        } else {
          console.error("Failed to fetch seasonality data:", seasonalResponse.error);
          toast.error("Failed to load seasonal data");
        }

        // Fetch real forecast data
        const forecastResponse = await predictionApi.forecast({ 
          pollutant, 
          region 
        });
        
        if (forecastResponse.success && forecastResponse.data) {
          // Transform the API response data to a format suitable for our chart
          const transformedForecastData = forecastResponse.data.map(item => ({
            month: new Date(item.ds).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            value: item.yhat,
            lower: item.yhat_lower,
            upper: item.yhat_upper
          }));
          
          setForecastData(transformedForecastData);
        } else {
          console.error("Failed to fetch forecast data:", forecastResponse.error);
          toast.error("Failed to load forecast data");
          
          // Fallback to empty array if API fails
          setForecastData([]);
        }
        
        toast.success(`Data updated for ${pollutant} in ${region}`);
      } catch (error) {
        console.error("Error fetching insight data:", error);
        toast.error("Failed to load dashboard data");
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
        setTrendData(trendResponse.data);
      }
      
      // Re-fetch seasonal data
      const seasonalResponse = await insightApi.getSeasonality({ pollutant, region });
      if (seasonalResponse.success && seasonalResponse.data) {
        setSeasonalData(seasonalResponse.data);
      }
      
      // Re-fetch forecast data
      const forecastResponse = await predictionApi.forecast({ pollutant, region });
      if (forecastResponse.success && forecastResponse.data) {
        const transformedForecastData = forecastResponse.data.map(item => ({
          month: new Date(item.ds).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          value: item.yhat,
          lower: item.yhat_lower,
          upper: item.yhat_upper
        }));
        
        setForecastData(transformedForecastData);
      }
      
      toast.success(`Data updated for ${pollutant} in ${region}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchHealthTip = async () => {
    try {
      // Simulate API call to get health tip
      setLoading(true);
      // In real app: const response = await healthApi.getTip({ pollutant, region });
      
      // Simulate different tips based on pollutant
      let tipText;
      if (pollutant === "NO2") {
        tipText = "Nitrogen dioxide levels may affect respiratory conditions. Consider limiting prolonged outdoor activities if you have asthma.";
      } else if (pollutant === "O3") {
        tipText = "Ozone levels are higher in the afternoon. Schedule outdoor activities for morning if you're sensitive to air pollution.";
      } else {
        tipText = "Sulfur dioxide can irritate the respiratory system. If you have lung disease, monitor your symptoms when outdoors.";
      }
      
      setHealthTip({
        tip: tipText,
        riskLevel: currentAqi,
        personalized: true
      });
      
      toast.success("Health tip updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to get health tip");
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
          Monitor air quality in Thessaloniki and get personalized health recommendations.
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
            <Card className={`border-l-4 border-l-aqi-${healthTip.riskLevel}`}>
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
