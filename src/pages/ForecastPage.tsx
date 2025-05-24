
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { predictionApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { startOfMonth, startOfWeek, endOfMonth, endOfWeek, addDays, addMonths, addWeeks } from "date-fns";

// Import our components
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
  const [periods, setPeriods] = useState(7); // Kept for backward compatibility
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  
  // Date range state
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default to 30 days ahead
  
  // State for API data
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [currentData, setCurrentData] = useState<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Get user profile from store
  const { profile } = useUserStore();

  // Update end date when frequency changes
  useEffect(() => {
    if (startDate) {
      // Set appropriate end date based on frequency when it changes
      let newEndDate: Date;
      
      switch (frequency) {
        case "W":
          // For weekly, set end date to 8 weeks ahead
          newEndDate = addWeeks(startOfWeek(startDate), 8);
          break;
        case "M":
          // For monthly, set end date to 6 months ahead
          newEndDate = addMonths(startOfMonth(startDate), 6);
          break;
        default:
          // For daily, set end date to 30 days ahead
          newEndDate = addDays(startDate, 30);
      }
      
      setEndDate(newEndDate);
    }
  }, [frequency, startDate]);

  // Adjust start date when frequency changes
  useEffect(() => {
    if (startDate) {
      let adjustedStartDate: Date;
      
      switch (frequency) {
        case "W":
          adjustedStartDate = startOfWeek(startDate);
          break;
        case "M":
          adjustedStartDate = startOfMonth(startDate);
          break;
        default:
          adjustedStartDate = startDate;
      }
      
      if (adjustedStartDate.getTime() !== startDate.getTime()) {
        setStartDate(adjustedStartDate);
      }
    }
  }, [frequency]);

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
    setInitialLoad(false);
    try {
      // Check if dates are valid
      if (!startDate || !endDate) {
        toast.error("Please select both start and end dates");
        setLoading(false);
        return;
      }
      
      if (startDate > endDate) {
        toast.error("Start date must be before end date");
        setLoading(false);
        return;
      }
      
      const start = formatDateForApi(startDate);
      const end = formatDateForApi(endDate);
      
      // Include user profile in the API call for personalized risk assessment
      const apiParams: any = {
        region, 
        pollutant,
        frequency,
        start_date: start,
        end_date: end
      };

      // Add user profile data for personalization if available
      if (profile) {
        apiParams.user_profile = {
          age: profile.age,
          has_asthma: profile.has_asthma,
          has_heart_disease: profile.has_heart_disease,
          has_lung_disease: profile.has_lung_disease,
          has_diabetes: profile.has_diabetes,
          is_smoker: profile.is_smoker
        };
      }
      
      const response = await predictionApi.getForecastWithRisk(apiParams);
      
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
        
        toast.success(`Updated personalized forecast for ${getPollutantDisplay(pollutant)} in ${region}`);
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
  };
  
  // Handler for chart type change
  const handleChartTypeChange = (type: "bar" | "line") => {
    setChartType(type);
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
    <div className="space-y-6 max-w-full">
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
        forecastMode="daterange"
        startDate={startDate}
        endDate={endDate}
        onRegionChange={handleRegionChange}
        onPollutantChange={handlePollutantChange}
        onFrequencyChange={handleFrequencyChange}
        onPeriodsChange={() => {}} // Empty handler as we don't use periods anymore
        onChartTypeChange={handleChartTypeChange}
        onForecastModeChange={() => {}} // Empty handler as we don't switch modes anymore
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
        onUpdateForecast={loadForecastData}
      />

      {/* Initial state - no data yet */}
      {initialLoad && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Select your forecast parameters and press "Update Forecast" to view predictions.
          </AlertDescription>
        </Alert>
      )}

      {/* No Data Alert (after attempted load) */}
      {!loading && !initialLoad && forecastData.length === 0 && (
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
          forecastMode="daterange"
        />
      )}
      
      {/* Cards Section */}
      {!initialLoad && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current AQI Summary Card - Now with user profile */}
          <AQISummaryCard 
            currentData={currentData} 
            loading={loading}
            profile={profile}
          />
          
          {/* Personalized Insight Card */}
          <PersonalizedInsightCard 
            currentData={currentData}
            profile={profile}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default ForecastPage;
