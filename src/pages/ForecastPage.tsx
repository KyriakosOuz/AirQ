
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { predictionApi } from "@/lib/api";
import { Forecast, Pollutant, aqiLevelLabels, stringToAqiLevel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AqiBadge } from "@/components/ui/aqi-badge";
import ForecastChart from "@/components/ForecastChart";

const ForecastPage: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [frequency, setFrequency] = useState("D"); // Default to daily
  const [periodMode, setPeriodMode] = useState<"periods" | "daterange">("periods");
  const [periods, setPeriods] = useState(6); // Default to 6 periods
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(false);

  // Frequency options
  const frequencyOptions = [
    { value: "D", label: "Daily" },
    { value: "W", label: "Weekly" },
    { value: "M", label: "Monthly" },
    { value: "Y", label: "Yearly" }
  ];

  // Period options based on frequency
  const periodOptions = {
    "D": [7, 14, 30, 60, 90],
    "W": [4, 8, 12, 24],
    "M": [3, 6, 12, 24],
    "Y": [1, 2, 3, 5]
  };

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    setLoading(true);
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

      const response = await predictionApi.forecast(params);

      if (response.success && Array.isArray(response.data)) {
        setForecasts(response.data);
      } else {
        console.error("Failed to load forecasts:", response.error);
        toast.error("Failed to load forecast data");
        setForecasts([]);
      }
    } catch (error) {
      console.error("Error loading forecasts:", error);
      toast.error("Failed to load forecast data");
      setForecasts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get the latest forecast for displaying current AQI, with null check
  const latestForecast = forecasts.length > 0 ? forecasts[0] : null;

  // Handler for region change
  const handleRegionChange = (value: string) => {
    setRegion(value);
  };

  // Handler for pollutant change
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
  };

  // Format date for display with error handling
  const formatForecastDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM d");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Forecast</h1>
        <p className="text-muted-foreground">
          View predicted air quality levels for the coming days.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <CardTitle className="text-base">Frequency</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Forecast Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Tabs defaultValue="periods" onValueChange={(value) => setPeriodMode(value as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="periods" className="flex-1">Periods</TabsTrigger>
                <TabsTrigger value="daterange" className="flex-1">Date Range</TabsTrigger>
              </TabsList>
              <TabsContent value="periods" className="pt-2">
                <Select 
                  value={periods.toString()} 
                  onValueChange={(val) => setPeriods(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select periods" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions[frequency as keyof typeof periodOptions].map(option => (
                      <SelectItem key={option} value={option.toString()}>
                        {option} {frequency === "D" ? "days" : 
                                 frequency === "W" ? "weeks" : 
                                 frequency === "M" ? "months" : "years"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="daterange" className="pt-2 space-y-2">
                <div className="grid gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal w-full",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal w-full",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "End Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => 
                          (startDate ? date < startDate : false)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={loadForecasts} className="w-full" disabled={loading || (periodMode === "daterange" && (!startDate || !endDate))}>
              {loading ? "Loading..." : "Update Forecast"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {latestForecast && (
        <Card>
          <CardHeader>
            <CardTitle>Current Air Quality</CardTitle>
            <CardDescription>
              {region} - {new Date().toLocaleDateString()}
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
                The air quality in {region} today is considered <strong>{aqiLevelLabels[stringToAqiLevel(latestForecast.category)]}</strong> based on {pollutant} levels.
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
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {forecasts.map((forecast, index) => (
                <div key={index} className="flex flex-col items-center p-3 border rounded-lg">
                  <div className="text-sm font-medium">{formatForecastDate(forecast.ds)}</div>
                  <AqiBadge level={stringToAqiLevel(forecast.category)} className="my-3 h-10 w-10" />
                  <div className="font-bold text-center">{aqiLevelLabels[stringToAqiLevel(forecast.category)]}</div>
                  <div className="text-xs text-muted-foreground text-center">{forecast.yhat.toFixed(1)} µg/m³</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ForecastPage;
