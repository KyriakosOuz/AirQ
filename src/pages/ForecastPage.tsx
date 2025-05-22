
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { predictionApi, modelApi } from "@/lib/api";
import { Forecast, Pollutant, aqiLevelLabels, stringToAqiLevel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionMultiSelect } from "@/components/ui/region-multi-select";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn, getErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { AqiBadge } from "@/components/ui/aqi-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ForecastRangeSelector } from "@/components/ui/forecast-range-selector";
import { ForecastComparisonChart } from "@/components/ForecastComparisonChart";
import { AqiAlertWarning } from "@/components/AqiAlertWarning"; 
import ForecastChart from "@/components/ForecastChart";

// Define chart colors for consistent region coloring
const REGION_COLORS = [
  "#8884d8", // purple
  "#82ca9d", // green
  "#ffc658", // yellow
  "#ff8042", // orange
  "#0088fe", // blue
  "#00C49F", // teal
  "#FFBB28", // amber
  "#FF8042", // coral
];

const ForecastPage: React.FC = () => {
  // Individual forecast state
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [frequency, setFrequency] = useState("D"); // Default to daily
  const [periodMode, setPeriodMode] = useState<"periods" | "daterange">("periods");
  const [periods, setPeriods] = useState(7); // Default to 7 days
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingFallbackModel, setUsingFallbackModel] = useState(false);
  const [noModelAvailable, setNoModelAvailable] = useState(false);

  // NEW: Multi-region comparison state
  const [forecastMode, setForecastMode] = useState<"single" | "compare">("single");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionOptions, setRegionOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [comparisonForecasts, setComparisonForecasts] = useState<Array<{
    region: string;
    forecasts: Forecast[];
    color: string;
  }>>([]);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Frequency options
  const frequencyOptions = [
    { value: "D", label: "Daily" },
    { value: "W", label: "Weekly" },
    { value: "M", label: "Monthly" },
    { value: "Y", label: "Yearly" }
  ];

  // Period options based on frequency
  const periodOptions = {
    "D": [7, 14, 30, 60, 90, 365],
    "W": [4, 8, 12, 24, 52],
    "M": [3, 6, 12, 24],
    "Y": [1, 2, 3, 5]
  };

  // Load region options
  useEffect(() => {
    const loadRegionOptions = async () => {
      try {
        // In a real app, you might fetch this from an API
        setRegionOptions([
          { value: "thessaloniki", label: "Thessaloniki" },
          { value: "kalamaria", label: "Kalamaria" },
          { value: "pavlos-melas", label: "Pavlos Melas" },
          { value: "neapoli-sykies", label: "Neapoli-Sykies" },
          { value: "ampelokipoi-menemeni", label: "Ampelokipoi-Menemeni" },
          { value: "panorama", label: "Panorama" },
          { value: "pylaia-chortiatis", label: "Pylaia-Chortiatis" },
        ]);
      } catch (error) {
        console.error("Failed to load region options:", error);
      }
    };
    
    loadRegionOptions();
  }, []);

  // Load forecasts when component mounts
  useEffect(() => {
    if (forecastMode === "single") {
      loadForecasts();
    }
  }, [forecastMode]); 

  const loadForecasts = async () => {
    setLoading(true);
    setUsingFallbackModel(false); // Reset fallback status
    setNoModelAvailable(false); // Reset no model status
    setForecasts([]); // Clear previous forecasts
    
    try {
      // Build the query parameters
      const params: {
        pollutant: string;
        region: string;
        frequency: string;
        limit?: number;
        start_date?: string;
        end_date?: string;
      } = {
        pollutant,
        region,
        frequency
      };

      // Add either periods or date range
      if (periodMode === "periods") {
        params.limit = periods;
      } else if (startDate && endDate) {
        params.start_date = format(startDate, "yyyy-MM-dd");
        params.end_date = format(endDate, "yyyy-MM-dd");
      }

      console.log(`Fetching forecast for ${region}, pollutant ${pollutant}, frequency ${frequency}, periods ${periods}`);
      const response = await predictionApi.forecast(params);

      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        console.log(`Received ${response.data.length} forecast data points`);
        
        // Validate and sanitize data to prevent undefined values
        const validatedData = response.data.map(forecast => ({
          ...forecast,
          // Ensure numeric values or provide defaults
          yhat: typeof forecast.yhat === 'number' ? forecast.yhat : 0,
          yhat_lower: typeof forecast.yhat_lower === 'number' ? forecast.yhat_lower : 0,
          yhat_upper: typeof forecast.yhat_upper === 'number' ? forecast.yhat_upper : 0,
          // Ensure category has a valid value
          category: forecast.category || "Unknown"
        }));
        
        setForecasts(validatedData);
        
        // Check if response metadata indicates a fallback model was used
        if (response.meta?.using_fallback_model) {
          console.log("Using fallback model for forecast");
          setUsingFallbackModel(true);
        }
      } else {
        console.error("Failed to load forecasts or empty forecast data:", response.error);
        console.log("Response data:", JSON.stringify(response));
        toast.error(`No forecast model available for ${getPollutantDisplay(pollutant)}`);
        setNoModelAvailable(true);
      }
    } catch (error) {
      console.error("Error loading forecasts:", error);
      toast.error(`No forecast model available for ${getPollutantDisplay(pollutant)}`);
      setNoModelAvailable(true);
    } finally {
      setLoading(false);
    }
  };
  
  // NEW: Load multiple region forecasts for comparison
  const loadComparisonForecasts = async () => {
    if (!selectedRegions.length) {
      toast.warning("Please select at least one region to compare");
      return;
    }
    
    setLoadingComparison(true);
    setComparisonForecasts([]);
    
    try {
      // Option 1: Use the compare API endpoint if available (preferred)
      const response = await modelApi.compareRegions({
        regions: selectedRegions,
        pollutant,
        frequency,
        limit: periods
      });
      
      if (response.success && response.data?.forecasts) {
        // Process data from comparison endpoint
        const processedData = selectedRegions.map((region, index) => ({
          region,
          forecasts: response.data.forecasts[region] || [],
          color: REGION_COLORS[index % REGION_COLORS.length]
        }));
        
        setComparisonForecasts(processedData);
      } else {
        console.log("Comparison API failed, falling back to individual requests");
        
        // Option 2: Fall back to individual requests if compare endpoint fails
        const forecasts = await Promise.all(
          selectedRegions.map(async (regionValue) => {
            try {
              const response = await predictionApi.forecast({
                pollutant,
                region: regionValue,
                frequency,
                limit: periods
              });
              
              if (response.success && Array.isArray(response.data)) {
                return {
                  region: regionValue,
                  forecasts: response.data,
                  color: REGION_COLORS[selectedRegions.indexOf(regionValue) % REGION_COLORS.length]
                };
              }
              return null;
            } catch (error) {
              console.error(`Error fetching forecast for ${regionValue}:`, error);
              return null;
            }
          })
        );
        
        setComparisonForecasts(forecasts.filter(Boolean) as any[]);
      }
    } catch (error) {
      console.error("Error loading comparison forecasts:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingComparison(false);
    }
  };

  // Get the latest forecast for displaying current AQI
  const latestForecast = forecasts.length > 0 ? forecasts[0] : null;

  // Handler for region change
  const handleRegionChange = (value: string) => {
    setRegion(value);
  };

  // Handler for pollutant change
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
  };

  // Format date for display
  const formatForecastDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM d");
    } catch {
      return dateStr;
    }
  };

  // Get pollutant display name
  const getPollutantDisplay = (pollutantCode: string): string => {
    const map: Record<string, string> = {
      "no2_conc": "NO₂",
      "o3_conc": "O₃",
      "so2_conc": "SO₂",
      "pm10_conc": "PM10",
      "pm25_conc": "PM2.5",
      "co_conc": "CO",
      "no_conc": "NO",
    };
    return map[pollutantCode] || pollutantCode;
  };

  // Get region display name
  const getRegionDisplay = (regionValue: string): string => {
    return regionValue.charAt(0).toUpperCase() + regionValue.slice(1).replace(/-/g, " ");
  };

  // Update periods when frequency changes
  useEffect(() => {
    // Set the first available period option for this frequency
    const availableOptions = periodOptions[frequency as keyof typeof periodOptions] || [];
    if (availableOptions.length > 0) {
      setPeriods(availableOptions[0]);
    }
  }, [frequency]);

  // Handle forecast mode change
  const handleForecastModeChange = (mode: "single" | "compare") => {
    setForecastMode(mode);
    
    if (mode === "compare") {
      // Initialize with current region selected
      setSelectedRegions([region]);
    }
  };

  // Handle multiple region selection
  const handleRegionsChange = (values: string[]) => {
    setSelectedRegions(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Forecast</h1>
        <p className="text-muted-foreground">
          View predicted air quality levels for upcoming periods.
        </p>
      </div>

      <Tabs value={forecastMode} onValueChange={(v) => handleForecastModeChange(v as "single" | "compare")}>
        <TabsList>
          <TabsTrigger value="single">Single Region</TabsTrigger>
          <TabsTrigger value="compare">Multi-Region Comparison</TabsTrigger>
        </TabsList>

        <Card className="overflow-hidden border-border/40 shadow-sm mt-4">
          <CardContent className="p-0">
            <TabsContent value="single" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/30">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <RegionSelector value={region} onValueChange={handleRegionChange} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pollutant</label>
                  <PollutantSelector value={pollutant} onValueChange={handlePollutantChange} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Forecast Range</label>
                  <ForecastRangeSelector
                    mode={periodMode}
                    periods={periods}
                    startDate={startDate}
                    endDate={endDate}
                    frequency={frequency}
                    periodOptions={periodOptions}
                    onModeChange={setPeriodMode}
                    onPeriodsChange={setPeriods}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    onClick={loadForecasts} 
                    className="w-full" 
                    disabled={loading || (periodMode === "daterange" && (!startDate || !endDate))}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Update Forecast"
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="compare" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Regions</label>
                  <RegionMultiSelect 
                    values={selectedRegions} 
                    options={regionOptions} 
                    onChange={handleRegionsChange} 
                    placeholder="Select regions to compare" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Pollutant</label>
                  <PollutantSelector value={pollutant} onValueChange={handlePollutantChange} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Forecast Periods</label>
                  <div className="flex items-end justify-between gap-4">
                    <Select 
                      value={periods.toString()} 
                      onValueChange={(val) => setPeriods(parseInt(val))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select periods" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions[frequency]?.map(option => (
                          <SelectItem key={option} value={option.toString()}>
                            {option} {frequency === "D" ? "days" : 
                                    frequency === "W" ? "weeks" : 
                                    frequency === "M" ? "months" : "years"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={loadComparisonForecasts} 
                      className="flex-1" 
                      disabled={loadingComparison || !selectedRegions.length}
                    >
                      {loadingComparison ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Compare"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <TabsContent value="single" className="m-0 space-y-6">
        {noModelAvailable && (
          <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              No forecast model is available for {getPollutantDisplay(pollutant)} in {getRegionDisplay(region)} with {frequency === "D" ? "daily" : 
                                frequency === "W" ? "weekly" : 
                                frequency === "M" ? "monthly" : "yearly"} frequency.
            </AlertDescription>
          </Alert>
        )}

        {usingFallbackModel && !noModelAvailable && (
          <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              Showing forecast from the most recent available model (not the latest trained model).
            </AlertDescription>
          </Alert>
        )}

        {/* NEW: AQI Alerts integration */}
        {forecasts.length > 0 && (
          <AqiAlertWarning 
            forecasts={forecasts} 
            region={region} 
            pollutant={pollutant} 
            daysToCheck={30}
          />
        )}

        {latestForecast && (
          <Card>
            <CardHeader>
              <CardTitle>Current Air Quality</CardTitle>
              <CardDescription>
                {getRegionDisplay(region)} - {getPollutantDisplay(pollutant)} - {format(new Date(), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex flex-col items-center justify-center">
                <AqiBadge level={stringToAqiLevel(latestForecast.category)} className="h-20 w-20" />
                <span className="text-xl font-bold mt-2">{aqiLevelLabels[stringToAqiLevel(latestForecast.category)]}</span>
                <span className="text-sm text-muted-foreground">{latestForecast.yhat.toFixed(1)} µg/m³</span>
              </div>
              <div className="flex-1">
                <p>
                  The {getPollutantDisplay(pollutant)} level in {getRegionDisplay(region)} today is considered{" "}
                  <strong>{aqiLevelLabels[stringToAqiLevel(latestForecast.category)]}</strong>.
                </p>
                {stringToAqiLevel(latestForecast.category) === "good" && (
                  <p className="mt-2">
                    The air is clean and poses little to no health risk. It's a great day to be outdoors and enjoy activities.
                  </p>
                )}
                {stringToAqiLevel(latestForecast.category) === "moderate" && (
                  <p className="mt-2">
                    Air quality is acceptable, but there may be some risk for people who are unusually sensitive to air pollution.
                  </p>
                )}
                {stringToAqiLevel(latestForecast.category) === "unhealthy-sensitive" && (
                  <p className="mt-2">
                    Members of sensitive groups may experience health effects. The general public is less likely to be affected.
                  </p>
                )}
                {(stringToAqiLevel(latestForecast.category) === "unhealthy" || 
                  stringToAqiLevel(latestForecast.category) === "very-unhealthy" || 
                  stringToAqiLevel(latestForecast.category) === "hazardous") && (
                  <p className="mt-2 text-red-600 dark:text-red-400 font-medium">
                    Health alert: Everyone may experience more serious health effects! Limit outdoor activities and wear a mask if going outside.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {forecasts.length > 0 && (
          <ForecastChart data={forecasts} region={region} pollutant={pollutant} />
        )}

        {forecasts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Daily Forecast</CardTitle>
              <CardDescription>
                {periods}-period forecast for {getPollutantDisplay(pollutant)} in {getRegionDisplay(region)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                {forecasts.slice(0, 7).map((forecast, index) => (
                  <div key={index} className="flex flex-col items-center p-3 border rounded-lg">
                    <div className="text-sm font-medium">{formatForecastDate(forecast.ds)}</div>
                    <AqiBadge level={stringToAqiLevel(forecast.category)} className="my-3 h-10 w-10" />
                    <div className="font-bold text-center">{aqiLevelLabels[stringToAqiLevel(forecast.category)]}</div>
                    <div className="text-xs text-muted-foreground text-center">{forecast.yhat.toFixed(1)} µg/m³</div>
                  </div>
                ))}
              </div>
              {forecasts.length > 7 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Showing first 7 periods of {forecasts.length} total periods
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="compare" className="m-0 space-y-6">
        {loadingComparison ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading Comparison Data</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-muted-foreground">Loading comparison data...</p>
              </div>
            </CardContent>
          </Card>
        ) : comparisonForecasts.length > 0 ? (
          <ForecastComparisonChart data={comparisonForecasts} pollutant={pollutant} />
        ) : selectedRegions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Region Comparison</CardTitle>
              <CardDescription>
                Click the "Compare" button to see forecast data
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-12 text-center">
              <div className="max-w-md">
                <p className="text-muted-foreground">
                  You have selected {selectedRegions.length} region{selectedRegions.length !== 1 ? "s" : ""}. 
                  Click the "Compare" button above to visualize and compare forecast data across these regions.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Region Comparison</CardTitle>
              <CardDescription>
                Select multiple regions to compare
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-12 text-center">
              <div className="max-w-md">
                <p className="text-muted-foreground">
                  Please select two or more regions from the dropdown menu above to compare their forecast data.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {forecasts.length === 0 && !loading && noModelAvailable && forecastMode === "single" && (
        <Card>
          <CardHeader>
            <CardTitle>Forecast Unavailable</CardTitle>
            <CardDescription>
              No forecast data for {getPollutantDisplay(pollutant)} in {getRegionDisplay(region)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No forecast model available</h3>
            <p className="text-muted-foreground max-w-md">
              There is no trained model available to provide forecasts for this pollutant and region combination.
              Try selecting a different pollutant or region.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForecastPage;
