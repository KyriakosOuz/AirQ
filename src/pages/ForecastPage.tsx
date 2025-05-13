import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { predictionApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Scatter } from "recharts";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ForecastPage: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("NO2");
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["thessaloniki"]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  
  // Fetch initial forecast data
  useEffect(() => {
    if (!compareMode) {
      fetchForecast();
    } else {
      fetchComparison();
    }
  }, []); // Empty dependency array ensures this runs only once on mount
  
  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await predictionApi.forecast({ pollutant, region });
      
      if (response.success && response.data) {
        // Transform API response data for the chart
        const transformedData = response.data.map(item => {
          // Format the date as "Jun 2024" etc.
          const date = new Date(item.ds);
          const month = date.toLocaleDateString('en-US', { month: 'short' });
          const year = date.getFullYear();
          
          // Check if this is historical or future data
          const now = new Date();
          const isHistorical = date < now;
          
          return {
            month: `${month} ${year}`,
            actual: isHistorical ? item.yhat : null, // Only show actual for historical data
            predicted: item.yhat,
            lower: item.yhat_lower,
            upper: item.yhat_upper
          };
        });
        
        setForecastData(transformedData);
        toast.success(`Forecast updated for ${pollutant} in ${region}`);
      } else {
        console.error("Failed to fetch forecast:", response.success ? "No data" : "API error");
        toast.error("Failed to load forecast data");
        
        // If API fails, maintain current data or use empty array if no data exists
        if (forecastData.length === 0) {
          // Provide fallback mock data if no data exists
          const mockForecastData = [
            { month: "Jan 2024", actual: 105, predicted: 108, lower: 95, upper: 118 },
            { month: "Feb 2024", actual: 102, predicted: 104, lower: 92, upper: 114 },
            { month: "Mar 2024", actual: 98, predicted: 100, lower: 88, upper: 112 },
            { month: "Apr 2024", actual: 95, predicted: 96, lower: 86, upper: 105 },
            { month: "May 2024", actual: 92, predicted: 93, lower: 84, upper: 102 },
            { month: "Jun 2024", actual: null, predicted: 90, lower: 82, upper: 98 },
            { month: "Jul 2024", actual: null, predicted: 87, lower: 78, upper: 96 },
            { month: "Aug 2024", actual: null, predicted: 85, lower: 76, upper: 94 },
            { month: "Sep 2024", actual: null, predicted: 88, lower: 80, upper: 96 },
            { month: "Oct 2024", actual: null, predicted: 92, lower: 83, upper: 101 },
            { month: "Nov 2024", actual: null, predicted: 97, lower: 87, upper: 107 },
            { month: "Dec 2024", actual: null, predicted: 102, lower: 92, upper: 112 },
          ];
          setForecastData(mockForecastData);
        }
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      toast.error("Failed to load forecast data");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchComparison = async () => {
    setLoading(true);
    try {
      // In real app, this would call the comparison API
      // For now, we'll simulate it using multiple forecast calls
      
      // Create a map to store results by month
      const resultsByMonth: Record<string, Record<string, any>> = {};
      const regions = selectedRegions.length > 0 ? selectedRegions : ["thessaloniki"];
      
      // For each selected region, fetch its forecast
      for (const regionValue of regions) {
        const response = await predictionApi.forecast({ pollutant, region: regionValue });
        
        if (response.success && response.data) {
          // Find the matching region display name
          const regionName = comparisonRegions.find(r => r.value === regionValue)?.label || regionValue;
          
          // Process each data point
          response.data.forEach(item => {
            const date = new Date(item.ds);
            const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            // Initialize month entry if needed
            if (!resultsByMonth[monthStr]) {
              resultsByMonth[monthStr] = { month: monthStr };
            }
            
            // Add region value to this month
            resultsByMonth[monthStr][regionName] = item.yhat;
          });
        }
      }
      
      // Convert to array format for chart
      const comparisonArray = Object.values(resultsByMonth);
      
      // Sort by date
      comparisonArray.sort((a, b) => {
        const dateA = new Date(a.month.replace(' ', ' 1, '));
        const dateB = new Date(b.month.replace(' ', ' 1, '));
        return dateA.getTime() - dateB.getTime();
      });
      
      if (comparisonArray.length > 0) {
        setComparisonData(comparisonArray);
        toast.success(`Comparison updated for ${selectedRegions.join(", ")}`);
      } else {
        // If no data was returned, maintain current comparison data or use fallback
        if (comparisonData.length === 0) {
          // Use fallback mock data
          const mockComparisonData = [
            { month: "Jan 2024", "Thessaloniki Center": 108, "Kalamaria": 85, "Panorama": 62 },
            { month: "Feb 2024", "Thessaloniki Center": 104, "Kalamaria": 82, "Panorama": 60 },
            { month: "Mar 2024", "Thessaloniki Center": 100, "Kalamaria": 80, "Panorama": 58 },
            { month: "Apr 2024", "Thessaloniki Center": 96, "Kalamaria": 78, "Panorama": 55 },
            { month: "May 2024", "Thessaloniki Center": 93, "Kalamaria": 75, "Panorama": 53 },
            { month: "Jun 2024", "Thessaloniki Center": 90, "Kalamaria": 72, "Panorama": 50 },
            { month: "Jul 2024", "Thessaloniki Center": 87, "Kalamaria": 70, "Panorama": 48 },
            { month: "Aug 2024", "Thessaloniki Center": 85, "Kalamaria": 68, "Panorama": 46 },
            { month: "Sep 2024", "Thessaloniki Center": 88, "Kalamaria": 70, "Panorama": 50 },
            { month: "Oct 2024", "Thessaloniki Center": 92, "Kalamaria": 74, "Panorama": 53 },
            { month: "Nov 2024", "Thessaloniki Center": 97, "Kalamaria": 78, "Panorama": 55 },
            { month: "Dec 2024", "Thessaloniki Center": 102, "Kalamaria": 82, "Panorama": 58 },
          ];
          setComparisonData(mockComparisonData);
        }
      }
    } catch (error) {
      console.error("Error fetching comparison data:", error);
      toast.error("Failed to load comparison data");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegionChange = (value: string) => {
    setRegion(value);
    if (!compareMode) {
      fetchForecast();
    }
  };
  
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
    if (!compareMode) {
      fetchForecast();
    } else {
      fetchComparison();
    }
  };
  
  const handleRegionCheckboxChange = (regionValue: string, checked: boolean) => {
    if (checked) {
      setSelectedRegions(prev => [...prev, regionValue]);
    } else {
      setSelectedRegions(prev => prev.filter(r => r !== regionValue));
    }
  };
  
  // List of available regions for comparison
  const comparisonRegions = [
    { value: "thessaloniki", label: "Thessaloniki Center" },
    { value: "kalamaria", label: "Kalamaria" },
    { value: "panorama", label: "Panorama" },
    { value: "ampelokipoi-menemeni", label: "Ampelokipoi-Menemeni" },
    { value: "neapoli-sykies", label: "Neapoli-Sykies" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pollutant Forecasts</h1>
        <p className="text-muted-foreground">
          View future air quality projections based on historical data and statistical models.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Forecast Settings</CardTitle>
          <CardDescription>
            Select parameters for pollutant forecasting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="compareMode"
              checked={compareMode}
              onCheckedChange={(checked) => setCompareMode(!!checked)} 
            />
            <Label htmlFor="compareMode">Enable region comparison mode</Label>
          </div>
          
          {!compareMode ? (
            // Single region forecast mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Region</Label>
                <RegionSelector value={region} onValueChange={handleRegionChange} />
              </div>
              <div className="space-y-2">
                <Label>Pollutant</Label>
                <PollutantSelector value={pollutant} onValueChange={handlePollutantChange} />
              </div>
              <div className="md:col-span-2">
                <Button onClick={fetchForecast} disabled={loading} className="w-full">
                  {loading ? "Loading..." : "Update Forecast"}
                </Button>
              </div>
            </div>
          ) : (
            // Comparison mode
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Pollutant</Label>
                <PollutantSelector value={pollutant} onValueChange={handlePollutantChange} />
              </div>
              
              <div className="space-y-2">
                <Label>Select Regions to Compare</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {comparisonRegions.map((regionOption) => (
                    <div key={regionOption.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`region-${regionOption.value}`}
                        checked={selectedRegions.includes(regionOption.value)}
                        onCheckedChange={(checked) => 
                          handleRegionCheckboxChange(regionOption.value, !!checked)
                        }
                      />
                      <Label htmlFor={`region-${regionOption.value}`}>{regionOption.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={fetchComparison} 
                disabled={loading || selectedRegions.length === 0}
                className="w-full"
              >
                {loading ? "Loading..." : "Compare Regions"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!compareMode ? (
        <Card>
          <CardHeader>
            <CardTitle>{pollutant} Forecast for {region}</CardTitle>
            <CardDescription>
              12-month forecast with confidence intervals
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stackId="1" 
                  stroke="none" 
                  fill="#0ea5e970" 
                  name="Upper Bound"
                />
                <Area 
                  type="monotone" 
                  dataKey="lower" 
                  stackId="2" 
                  stroke="none" 
                  fill="#0ea5e930" 
                  name="Lower Bound"
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  name="Predicted"
                />
                <Scatter 
                  dataKey="actual" 
                  fill="#f97316" 
                  name="Actual" 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{pollutant} Comparison Across Regions</CardTitle>
            <CardDescription>
              Forecasted values for selected regions
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={comparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {selectedRegions.includes("thessaloniki") && (
                  <Line
                    type="monotone"
                    dataKey="Thessaloniki Center"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                  />
                )}
                {selectedRegions.includes("kalamaria") && (
                  <Line
                    type="monotone"
                    dataKey="Kalamaria"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                )}
                {selectedRegions.includes("panorama") && (
                  <Line
                    type="monotone"
                    dataKey="Panorama"
                    stroke="#f97316"
                    strokeWidth={2}
                  />
                )}
                {selectedRegions.includes("ampelokipoi-menemeni") && (
                  <Line
                    type="monotone"
                    dataKey="Ampelokipoi-Menemeni"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                )}
                {selectedRegions.includes("neapoli-sykies") && (
                  <Line
                    type="monotone"
                    dataKey="Neapoli-Sykies"
                    stroke="#f43f5e"
                    strokeWidth={2}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
            
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h4 className="font-medium mb-2">Forecast Analysis</h4>
              <p className="text-sm">
                The forecast shows significant variation between urban center locations and suburban areas. 
                City centers typically experience 30-50% higher pollutant levels than peripheral areas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForecastPage;
