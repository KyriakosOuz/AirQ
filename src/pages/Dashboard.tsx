
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
  
  // Mock data for initial render
  useEffect(() => {
    // Initialize with demo data
    const mockTrendData = [
      { year: 2015, value: 120 },
      { year: 2016, value: 118 },
      { year: 2017, value: 115 },
      { year: 2018, value: 112 },
      { year: 2019, value: 109 },
      { year: 2020, value: 80 }, // COVID lockdowns
      { year: 2021, value: 95 },
      { year: 2022, value: 100 },
      { year: 2023, value: 105 },
    ];
    
    const mockSeasonalData = [
      { name: "Jan", value: 115 },
      { name: "Feb", value: 110 },
      { name: "Mar", value: 105 },
      { name: "Apr", value: 95 },
      { name: "May", value: 85 },
      { name: "Jun", value: 80 },
      { name: "Jul", value: 75 },
      { name: "Aug", value: 70 },
      { name: "Sep", value: 85 },
      { name: "Oct", value: 95 },
      { name: "Nov", value: 105 },
      { name: "Dec", value: 115 },
    ];
    
    const mockForecastData = [
      { month: "Jan 2024", value: 110, lower: 100, upper: 120 },
      { month: "Feb 2024", value: 108, lower: 98, upper: 118 },
      { month: "Mar 2024", value: 105, lower: 95, upper: 115 },
      { month: "Apr 2024", value: 102, lower: 92, upper: 112 },
      { month: "May 2024", value: 98, lower: 88, upper: 108 },
      { month: "Jun 2024", value: 95, lower: 85, upper: 105 },
    ];
    
    setTrendData(mockTrendData);
    setSeasonalData(mockSeasonalData);
    setForecastData(mockForecastData);
    
    // Mock health tip
    setHealthTip({
      tip: "Today's nitrogen dioxide levels are moderate. If you have respiratory conditions, consider limiting extended outdoor activity.",
      riskLevel: "moderate",
      personalized: true
    });
    
    // Set current AQI level
    setCurrentAqi("moderate");
  }, []);
  
  // Update app state when region or pollutant changes
  useEffect(() => {
    setSelectedRegion(region);
    setSelectedPollutant(pollutant);
  }, [region, pollutant, setSelectedRegion, setSelectedPollutant]);
  
  // In a real app, this would fetch data from the API
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // These would be actual API calls in the complete app
      // const trendResponse = await insightApi.getTrend({ pollutant, region });
      // const seasonalResponse = await insightApi.getSeasonality({ pollutant, region });
      // const forecastResponse = await predictionApi.forecast({ pollutant, region });
      
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
    fetchDashboardData();
  };
  
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
    fetchDashboardData();
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
