import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { predictionApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { startOfMonth, startOfWeek, endOfMonth, endOfWeek, addDays, addMonths, addWeeks } from "date-fns";
import ForecastControls from "@/components/forecasts/ForecastControls";
import ForecastVisualization from "@/components/forecasts/ForecastVisualization";
import AQISummaryCard from "@/components/forecasts/AQISummaryCard";
import PersonalizedInsightCard from "@/components/forecasts/PersonalizedInsightCard";
import { healthApi } from "@/lib/api";
import { getPollutantDisplayName } from "@/lib/aqi-standardization";
import { getFrequencyAdjustedDate, getValidEndDates } from "@/lib/date-picker-utils";

// Main ForecastPage component
const ForecastPage: React.FC = () => {
  // State hooks for user inputs - setting default to "pollution" for averaged data
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("pollution");
  const [frequency, setFrequency] = useState("D");
  const [periods, setPeriods] = useState(7);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  
  // Date range state with today as default start date
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // Default to 30 days ahead
  
  // State for API data
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [currentData, setCurrentData] = useState<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Add state for AI health tip
  const [aiHealthTip, setAiHealthTip] = useState<{
    tip: string;
    riskLevel: string;
    personalized: boolean;
  } | null>(null);
  const [aiTipLoading, setAiTipLoading] = useState(false);
  const [aiTipError, setAiTipError] = useState<string | null>(null);
  
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

  // Enhanced start date handler with frequency adjustment
  const handleStartDateChange = (date: Date | undefined) => {
    if (!date) {
      setStartDate(undefined);
      setEndDate(undefined);
      return;
    }
    
    const adjustedDate = getFrequencyAdjustedDate(date, frequency, false);
    setStartDate(adjustedDate);
    
    // Auto-adjust end date based on frequency
    const { minDate } = getValidEndDates(adjustedDate, frequency);
    setEndDate(minDate);
  };
  
  // Enhanced end date handler with validation
  const handleEndDateChange = (date: Date | undefined) => {
    if (!date || !startDate) {
      setEndDate(undefined);
      return;
    }
    
    const adjustedDate = getFrequencyAdjustedDate(date, frequency, true);
    setEndDate(adjustedDate);
  };

  // Function to format date for API
  const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Function to load AI health tip with improved error handling
  const loadAIHealthTip = async () => {
    if (!startDate || !endDate) return;
    
    setAiTipLoading(true);
    setAiTipError(null);
    
    try {
      const start = formatDateForApi(startDate);
      const end = formatDateForApi(endDate);
      
      console.log("Loading AI health tip with timeout of 45 seconds...");
      
      const response = await healthApi.getAIHealthTip({
        region,
        pollutant,
        start_date: start,
        end_date: end
      });
      
      if (response.success && response.data) {
        setAiHealthTip(response.data);
        console.log("AI health tip loaded successfully");
      } else {
        const errorMessage = response.error || "Failed to load AI health tip";
        console.error("AI health tip error:", errorMessage);
        setAiTipError(errorMessage);
        
        // Show different toast messages based on error type
        if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
          toast.error("AI health tip is taking longer than expected. Please try again.", {
            duration: 5000,
          });
        } else {
          toast.error("Failed to load personalized health insights", {
            duration: 4000,
          });
        }
      }
    } catch (error) {
      console.error("Error loading AI health tip:", error);
      const errorMessage = error instanceof Error ? error.message : "Error loading AI health tip";
      setAiTipError(errorMessage);
      
      if (errorMessage.includes("timeout") || errorMessage.includes("AbortError")) {
        toast.error("AI processing timed out. Please try again in a moment.", {
          duration: 5000,
        });
      } else {
        toast.error("Unable to load personalized health insights", {
          duration: 4000,
        });
      }
    } finally {
      setAiTipLoading(false);
    }
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
      
      // Build API parameters - properly handle user profile data
      const apiParams: any = {
        region, 
        pollutant,
        frequency,
        start_date: start,
        end_date: end
      };

      // Add user profile data for personalization if available
      if (profile && (profile.age || profile.has_asthma || profile.has_heart_disease || 
                     profile.has_lung_disease || profile.has_diabetes || profile.is_smoker)) {
        // Create a clean user profile object with only the health-related fields
        const userProfileData = {
          ...(profile.age && { age: profile.age }),
          ...(profile.has_asthma !== undefined && { has_asthma: profile.has_asthma }),
          ...(profile.has_heart_disease !== undefined && { has_heart_disease: profile.has_heart_disease }),
          ...(profile.has_lung_disease !== undefined && { has_lung_disease: profile.has_lung_disease }),
          ...(profile.has_diabetes !== undefined && { has_diabetes: profile.has_diabetes }),
          ...(profile.is_smoker !== undefined && { is_smoker: profile.is_smoker })
        };
        
        // Only add user_profile if we have actual data
        if (Object.keys(userProfileData).length > 0) {
          apiParams.user_profile = userProfileData;
        }
      }
      
      console.log("API call parameters:", apiParams);
      
      const response = await predictionApi.getForecastWithRisk(apiParams);
      
      if (response.success && response.data) {
        const { forecast, current } = response.data;
        
        // Enhance forecast data with additional display properties using standardized system
        const enhancedForecast = forecast.map(item => ({
          ...item,
          pollutant_display: getPollutantDisplayName(pollutant)
        }));
        
        setForecastData(enhancedForecast);
        
        // Enhance current data with the pollutant display name
        if (current) {
          setCurrentData({
            ...current,
            pollutant_display: getPollutantDisplayName(pollutant)
          });
        }
        
        toast.success(`Updated personalized forecast for ${getPollutantDisplayName(pollutant)} in ${region}`);
        
        // Load AI health tip after successful forecast load
        loadAIHealthTip();
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
  
  // Handler for frequency change with date adjustment
  const handleFrequencyChange = (value: string) => {
    setFrequency(value);
    
    // Adjust existing dates to new frequency
    if (startDate) {
      const adjustedStartDate = getFrequencyAdjustedDate(startDate, value, false);
      setStartDate(adjustedStartDate);
      
      if (endDate) {
        const adjustedEndDate = getFrequencyAdjustedDate(endDate, value, true);
        setEndDate(adjustedEndDate);
      }
    }
  };
  
  // Handler for chart type change
  const handleChartTypeChange = (type: "bar" | "line") => {
    setChartType(type);
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
        onRegionChange={setRegion}
        onPollutantChange={setPollutant}
        onFrequencyChange={handleFrequencyChange}
        onPeriodsChange={() => {}} // Empty handler as we don't use periods anymore
        onChartTypeChange={setChartType}
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
      
      {/* Show loading message for AI health tip if it's taking a while */}
      {aiTipLoading && !loading && forecastData.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Generating personalized health insights... This may take up to 45 seconds.
          </AlertDescription>
        </Alert>
      )}
      
      {/* AI Health Tip Section - Commented out */}
      {/* 
      {!initialLoad && (
        <AIHealthTipCard
          tip={aiHealthTip?.tip || null}
          riskLevel={aiHealthTip?.riskLevel || null}
          personalized={aiHealthTip?.personalized || false}
          loading={aiTipLoading}
          error={aiTipError}
        />
      )}
      */}
      
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
      
      {/* Cards Section with adjusted proportions */}
      {!initialLoad && (
        <div className="grid grid-cols-3 gap-6">
          {/* Current AQI Summary Card - Now 33% width */}
          <div className="col-span-1">
            <AQISummaryCard 
              currentData={currentData} 
              loading={loading}
              profile={profile}
              startDate={startDate}
              endDate={endDate}
              selectedPollutant={pollutant}
            />
          </div>
          
          {/* Personalized Insight Card - Now 67% width */}
          <div className="col-span-2">
            <PersonalizedInsightCard 
              currentData={currentData}
              profile={profile}
              loading={loading}
              aiHealthTip={aiHealthTip}
              aiTipLoading={aiTipLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastPage;
