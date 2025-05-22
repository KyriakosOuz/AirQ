
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { predictionApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import our new components
import ForecastControls from "@/components/forecasts/ForecastControls";
import ForecastVisualization from "@/components/forecasts/ForecastVisualization";
import AQISummaryCard from "@/components/forecasts/AQISummaryCard";
import PersonalizedInsightCard from "@/components/forecasts/PersonalizedInsightCard";

// Function to get display name for pollutant
const getPollutantDisplay = (pollutantCode: string): string => {
  const map: Record<string, string> = {
    "no2_conc": "NO₂",
    "o3_conc": "O₃",
    "so2_conc": "SO₂",
    "co_conc": "CO",
    "no_conc": "NO",
    "pm10_conc": "PM10",
    "pm25_conc": "PM2.5"
  };
  return map[pollutantCode] || pollutantCode;
};

// Main ForecastPage component
const ForecastPage: React.FC = () => {
  // State hooks for user inputs
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [frequency, setFrequency] = useState("D"); // Default to daily
  const [periods, setPeriods] = useState(7); // Default to 7 days
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  
  // New state for date range mode
  const [forecastMode, setForecastMode] = useState<"periods" | "daterange">("periods");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default to 30 days ahead
  
  // State for API data
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [currentData, setCurrentData] = useState<any>(null);
  
  // Get user profile from store
  const { profile } = useUserStore();

  // Load forecast data when component mounts
  useEffect(() => {
    loadForecastData();
  }, []);

  // Debug log to check if date format is correct
  useEffect(() => {
    if (forecastData.length > 0) {
      console.log("Forecast data sample:", forecastData[0]);
      console.log("Date from forecast:", new Date(forecastData[0].ds));
    }
  }, [forecastData]);

  // Function to format date for API
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to load forecast data from API
  const loadForecastData = async () => {
    setLoading(true);
    try {
      let response;
      
      if (forecastMode === "periods") {
        // Use periods-based forecast
        response = await predictionApi.getForecastWithRisk({
          region, 
          pollutant,
          frequency,
          periods
        });
      } else {
        // Use date-range based forecast
        if (!startDate || !endDate) {
          toast.error("Please select both start and end dates");
          setLoading(false);
          return;
        }
        
        const start = formatDateForApi(startDate);
        const end = formatDateForApi(endDate);
        
        // Check if dates are valid
        if (startDate > endDate) {
          toast.error("Start date must be before end date");
          setLoading(false);
          return;
        }
        
        response = await predictionApi.getForecastWithRisk({
          region, 
          pollutant,
          start_date: start,
          end_date: end
        });
      }
      
      if (response.success && response.data) {
        const { forecast, current } = response.data;
        
        // Enhance forecast data with additional display properties
        const enhancedForecast = forecast.map(item => ({
          ...item,
          pollutant_display: getPollutantDisplay(pollutant)
        }));
        
        setForecastData(enhancedForecast);
        
        // Enhance current data with the pollutant display name
        if (current) {
          setCurrentData({
            ...current,
            pollutant_display: getPollutantDisplay(pollutant)
          });
        }
        
        toast.success(`Updated forecast for ${getPollutantDisplay(pollutant)} in ${region}`);
      } else {
        toast.error("Failed to load forecast data");
        console.error("Failed to load forecast:", response.error);
      }
    } catch (error) {
      toast.error("Error loading forecast data");
      console.error("Error loading forecast:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for region change
  const handleRegionChange = (value: string) => {
    setRegion(value);
  };
  
  // Handler for pollutant change
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
  };
  
  // Handler for frequency change
  const handleFrequencyChange = (value: string) => {
    setFrequency(value);
    
    // Reset periods to default based on frequency
    if (value === "D") setPeriods(7);
    if (value === "W") setPeriods(4);
    if (value === "M") setPeriods(3);
  };
  
  // Handler for periods change
  const handlePeriodsChange = (value: number) => {
    setPeriods(value);
  };
  
  // Handler for chart type change
  const handleChartTypeChange = (type: "bar" | "line") => {
    setChartType(type);
  };
  
  // Handler for forecast mode change
  const handleForecastModeChange = (mode: "periods" | "daterange") => {
    setForecastMode(mode);
  };
  
  // Handler for start date change
  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
  };
  
  // Handler for end date change
  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Personal Air Quality Forecast</h1>
        <p className="text-muted-foreground">
          View personalized air quality forecasts with health risk assessments based on your profile.
        </p>
      </div>

      {/* Input Controls Section */}
      <ForecastControls
        region={region}
        pollutant={pollutant}
        frequency={frequency}
        periods={periods}
        chartType={chartType}
        loading={loading}
        forecastMode={forecastMode}
        startDate={startDate}
        endDate={endDate}
        onRegionChange={handleRegionChange}
        onPollutantChange={handlePollutantChange}
        onFrequencyChange={handleFrequencyChange}
        onPeriodsChange={handlePeriodsChange}
        onChartTypeChange={handleChartTypeChange}
        onForecastModeChange={handleForecastModeChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onUpdateForecast={loadForecastData}
      />

      {/* No Data Alert */}
      {!loading && forecastData.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No forecast data available. Please update your selection and try again.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Forecast Chart Section */}
      {(forecastData.length > 0 || loading) && (
        <ForecastVisualization
          data={forecastData}
          loading={loading}
          chartType={chartType}
          pollutant={pollutant}
          frequency={frequency}
          periods={periods}
          forecastMode={forecastMode}
        />
      )}
      
      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current AQI Summary Card */}
        <AQISummaryCard 
          currentData={currentData} 
          loading={loading}
        />
        
        {/* Personalized Insight Card */}
        <PersonalizedInsightCard 
          currentData={currentData}
          profile={profile}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ForecastPage;
