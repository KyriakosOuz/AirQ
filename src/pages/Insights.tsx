
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { insightApi } from "@/lib/api";
import { Pollutant, AqiLevel } from "@/lib/types";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const Insights: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("NO2");
  const [year, setYear] = useState<number>(2023);
  const [loading, setLoading] = useState(false);
  
  const [trendData, setTrendData] = useState<any[]>([]);
  const [seasonalData, setSeasonalData] = useState<any[]>([]);
  const [topPollutedData, setTopPollutedData] = useState<any[]>([]);
  
  // Years for selection - normally would come from API
  const years = Array.from({ length: 9 }, (_, i) => 2015 + i);

  useEffect(() => {
    // Initialize with mock data
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
      { month: "Jan", value: 115 },
      { month: "Feb", value: 110 },
      { month: "Mar", value: 105 },
      { month: "Apr", value: 95 },
      { month: "May", value: 85 },
      { month: "Jun", value: 80 },
      { month: "Jul", value: 75 },
      { month: "Aug", value: 70 },
      { month: "Sep", value: 85 },
      { month: "Oct", value: 95 },
      { month: "Nov", value: 105 },
      { month: "Dec", value: 115 },
    ];
    
    const mockTopPollutedData = [
      { name: "Thessaloniki Center", value: 105 },
      { name: "Ampelokipoi-Menemeni", value: 95 },
      { name: "Neapoli-Sykies", value: 90 },
      { name: "Kalamaria", value: 75 },
      { name: "Pavlos Melas", value: 70 },
      { name: "Pylaia-Chortiatis", value: 60 },
      { name: "Panorama", value: 55 },
    ];
    
    setTrendData(mockTrendData);
    setSeasonalData(mockSeasonalData);
    setTopPollutedData(mockTopPollutedData);
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // These would be actual API calls in the complete app
      // const trendResponse = await insightApi.getTrend({ pollutant, region });
      // const seasonalResponse = await insightApi.getSeasonality({ pollutant, region });
      // const topPollutedResponse = await insightApi.getTopPolluted({ pollutant, year });
      
      // For demo, we'll use mock data with slight variations
      setTrendData(prev => prev.map(item => ({
        ...item,
        value: item.value * (0.9 + Math.random() * 0.2)
      })));
      
      setSeasonalData(prev => prev.map(item => ({
        ...item,
        value: item.value * (0.9 + Math.random() * 0.2)
      })));
      
      setTopPollutedData(prev => prev.map(item => ({
        ...item,
        value: item.value * (0.9 + Math.random() * 0.2)
      })));
      
      toast.success(`Insights updated for ${pollutant}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load insights data");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegionChange = (value: string) => {
    setRegion(value);
    fetchInsights();
  };
  
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
    fetchInsights();
  };
  
  const handleYearChange = (value: string) => {
    setYear(parseInt(value));
    fetchInsights();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Insights</h1>
        <p className="text-muted-foreground">
          Analyze historical trends and patterns in air quality data.
        </p>
      </div>
      
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
      
      <Button onClick={fetchInsights} disabled={loading}>
        {loading ? "Loading..." : "Update Insights"}
      </Button>
      
      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="trend">Annual Trend</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality</TabsTrigger>
          <TabsTrigger value="top-polluted">Top Polluted Areas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Annual {pollutant} Trend</CardTitle>
              <CardDescription>
                Yearly average concentrations over time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name={`${pollutant} μg/m³`} stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seasonality">
          <Card>
            <CardHeader>
              <CardTitle>Monthly {pollutant} Pattern</CardTitle>
              <CardDescription>
                Monthly average concentrations showing seasonal patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seasonalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="value" name={`${pollutant} μg/m³`} stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="top-polluted">
          <Card>
            <CardHeader>
              <CardTitle>Most Polluted Areas ({year})</CardTitle>
              <CardDescription>
                Regions with highest {pollutant} concentrations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topPollutedData} margin={{ top: 10, right: 30, left: 50, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name={`${pollutant} μg/m³`} fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Insights;
