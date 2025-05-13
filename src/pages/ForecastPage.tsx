import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { predictionApi } from "@/lib/api";
import { Forecast, Pollutant, aqiLevelLabels, stringToAqiLevel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";
import { aqiChartConfig } from "@/lib/chart-config";
import { toast } from "sonner";
import { AqiBadge } from "@/components/ui/aqi-badge";
import { format } from "date-fns";

const ForecastPage: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("NO2");
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    setLoading(true);
    try {
      const response = await predictionApi.forecast({
        pollutant,
        region
      });

      if (response.success && Array.isArray(response.data)) {
        // Process the forecast data to include derived properties
        const processedForecasts = response.data.map((item) => {
          // Make a variance of about 10-15% for lower and upper bounds to display error bands
          const yhat = item.yhat;
          const yhat_lower = yhat * 0.85; // 15% lower
          const yhat_upper = yhat * 1.15; // 15% higher
          
          return {
            ...item,
            yhat_lower,
            yhat_upper
          };
        });
        
        setForecasts(processedForecasts);
      } else {
        console.error("Failed to load forecasts:", response.error);
        toast.error("Failed to load forecast data");
        setForecasts([]); // Ensure forecasts is always an array
      }
    } catch (error) {
      console.error("Error loading forecasts:", error);
      toast.error("Failed to load forecast data");
      setForecasts([]); // Ensure forecasts is always an array
    } finally {
      setLoading(false);
    }
  };

  // Get the next 7 days of forecasts, ensuring we have an array
  const next7DaysForecasts = Array.isArray(forecasts) ? forecasts.slice(0, 7) : [];

  // Get the latest forecast for displaying current AQI, with null check
  const latestForecast = next7DaysForecasts[0] || null;

  // Handler for region change
  const handleRegionChange = (value: string) => {
    setRegion(value);
    loadForecasts();
  };

  // Handler for pollutant change
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
    loadForecasts();
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
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={loadForecasts} className="w-full" disabled={loading}>
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

      <Card>
        <CardHeader>
          <CardTitle>7-Day Forecast: {pollutant} Levels</CardTitle>
          <CardDescription>
            Predicted air quality levels for the next week
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={next7DaysForecasts} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                {Object.entries(aqiChartConfig).map(([key, config]) => (
                  <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={config.color} stopOpacity={0.2} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="ds" 
                tickFormatter={formatForecastDate}
              />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip 
                labelFormatter={(label) => formatForecastDate(label)}
                formatter={(value: any, name: any) => {
                  if (name === "AQI") return [value.toFixed(1) + " µg/m³", name];
                  if (name === "Range") return [value.toFixed(1) + " µg/m³", name];
                  return [value, name];
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="yhat_upper" 
                name="Upper Bound" 
                stroke="transparent" 
                fillOpacity={0.2}
                fill="#888888"
              />
              <Area 
                type="monotone" 
                dataKey="yhat" 
                stroke="#8884d8" 
                fillOpacity={0}
                name="Forecast"
                strokeWidth={2} 
              />
              <Area 
                type="monotone" 
                dataKey="yhat_lower" 
                name="Lower Bound" 
                stroke="transparent" 
                fillOpacity={0.2}
                fill="#888888"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {next7DaysForecasts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {next7DaysForecasts.map((forecast, index) => (
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