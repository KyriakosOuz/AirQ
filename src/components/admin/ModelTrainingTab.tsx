
import React, { useState, useMemo, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { modelApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import TrainModelCard from "./TrainModelCard";
import RecentTrainingsCard, { TrainingRecord } from "./RecentTrainingsCard";
import ForecastPreview, { ForecastDataPoint } from "./ForecastPreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// Interface for model training API response
interface ModelTrainingResponse {
  message?: string;
  trained_at?: string;
  forecast?: ForecastDataPoint[];
  accuracy_mae?: number;
  accuracy_rmse?: number;
}

// Interface for model data from API
interface ModelData {
  id: string;
  region: string;
  pollutant: string;
  model_type?: string;
  frequency?: string;
  forecast_periods?: number;
  created_at: string;
  status?: string;
  accuracy_mae?: number;
  accuracy_rmse?: number;
}

// Frequency options with their display labels and available ranges
const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily", ranges: [7, 14, 30, 60, 90, 180, 365] },
  { value: "weekly", label: "Weekly", ranges: [4, 12, 26, 52] },
  { value: "monthly", label: "Monthly", ranges: [3, 6, 12, 24] },
  { value: "yearly", label: "Yearly", ranges: [1, 2, 3, 5] },
];

const ModelTrainingTab: React.FC = () => {
  // State for the training form
  const [trainRegion, setTrainRegion] = useState("thessaloniki");
  const [trainPollutant, setTrainPollutant] = useState<Pollutant>("no2_conc");
  const [trainFrequency, setTrainFrequency] = useState("daily"); // Default: Daily
  const [trainPeriods, setTrainPeriods] = useState(365); // Default: 365 periods
  const [trainLoading, setTrainLoading] = useState(false);
  const [overwriteModel, setOverwriteModel] = useState(false); // New state for the overwrite option
  
  // State for forecast data and training records
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [recentTrainings, setRecentTrainings] = useState<TrainingRecord[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [noForecastAvailable, setNoForecastAvailable] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null); // New state to track specific training errors
  
  // Get available ranges for the selected frequency
  const availableRanges = useMemo(() => {
    const selectedFreq = FREQUENCY_OPTIONS.find(opt => opt.value === trainFrequency);
    return selectedFreq ? selectedFreq.ranges : [365];
  }, [trainFrequency]);
  
  // Update periods when frequency changes to use the first available range
  useEffect(() => {
    if (availableRanges.length > 0) {
      setTrainPeriods(availableRanges[0]);
    }
  }, [trainFrequency, availableRanges]);
  
  // Formatters for display values
  const formatters = useMemo(() => ({
    // Format date helper
    formatDate: (dateString?: string): string => {
      if (!dateString) return 'Unknown';
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    
    // Get region label from value
    getRegionLabel: (regionValue: string): string => {
      const regionMap: Record<string, string> = {
        "thessaloniki": "Thessaloniki Center",
        "kalamaria": "Kalamaria",
        "pavlos-melas": "Pavlos Melas",
        "neapoli-sykies": "Neapoli-Sykies",
        "ampelokipoi-menemeni": "Ampelokipoi-Menemeni",
        "panorama": "Panorama",
        "pylaia-chortiatis": "Pylaia-Chortiatis",
      };
      
      return regionMap[regionValue] || regionValue;
    },
    
    // Get pollutant display name
    getPollutantDisplay: (pollutantCode: string): string => {
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
    },

    // Get frequency display name
    getFrequencyDisplay: (freqCode: string): string => {
      const freq = FREQUENCY_OPTIONS.find(f => f.value === freqCode);
      return freq ? freq.label : freqCode;
    }
  }), []);

  // Fetch trained models from API
  const fetchTrainedModels = async () => {
    setModelsLoading(true);
    try {
      console.log("Fetching trained models...");
      const response = await modelApi.list();
      
      if (response.success && response.data) {
        console.log("Received models data:", response.data);
        
        // Convert API model data to TrainingRecord format
        const trainings: TrainingRecord[] = (response.data as ModelData[]).map(model => ({
          id: model.id,
          region: model.region,
          pollutant: model.pollutant as Pollutant, // Ensure pollutant is cast to Pollutant type
          date: model.created_at,
          status: (model.status || "complete") as "complete" | "in-progress" | "failed", // Fix status type with proper casting
          frequency: model.frequency,
          periods: model.forecast_periods,
          accuracy_mae: model.accuracy_mae,
          accuracy_rmse: model.accuracy_rmse
        }));
        
        // Sort by date, most recent first
        trainings.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setRecentTrainings(trainings);
      } else {
        console.error("Failed to fetch trained models:", response.error);
      }
    } catch (error) {
      console.error("Error fetching trained models:", error);
    } finally {
      setModelsLoading(false);
    }
  };
  
  // Fetch trained models on component mount and after training
  useEffect(() => {
    fetchTrainedModels();
  }, []);

  // Generate mock forecast data based on current parameters
  const generateMockForecastData = (periods: number): ForecastDataPoint[] => {
    const now = new Date();
    const data: ForecastDataPoint[] = [];
    
    let timeIncrement: number;
    switch (trainFrequency) {
      case "daily": 
        timeIncrement = 86400000; // 1 day in ms
        break;
      case "weekly":
        timeIncrement = 604800000; // 1 week in ms
        break;
      case "monthly":
        timeIncrement = 2592000000; // ~30 days in ms
        break;
      case "yearly":
        timeIncrement = 31536000000; // ~365 days in ms
        break;
      default:
        timeIncrement = 86400000;
    }
    
    // Base value depends on pollutant
    let baseValue = 30; // Default
    switch (trainPollutant) {
      case "no2_conc": baseValue = 35; break;
      case "o3_conc": baseValue = 45; break;
      case "so2_conc": baseValue = 5; break;
      case "pm10_conc" as Pollutant: baseValue = 25; break; // Type cast as Pollutant
      case "pm25_conc" as Pollutant: baseValue = 15; break; // Type cast as Pollutant
      case "co_conc": baseValue = 300; break;
      default: baseValue = 30;
    }
    
    // Generate data points
    for (let i = 0; i < periods; i++) {
      const date = new Date(now.getTime() + (i * timeIncrement));
      // Add some randomness to the forecast
      const randomFactor = 0.2; // 20% variation
      const yhat = baseValue * (1 + (Math.random() * randomFactor - randomFactor/2));
      data.push({
        ds: date.toISOString(),
        yhat: yhat,
        yhat_lower: yhat * 0.8, // 20% below forecast
        yhat_upper: yhat * 1.2, // 20% above forecast
      });
    }
    
    return data;
  };

  // Handle model training
  const trainModel = async () => {
    setTrainLoading(true);
    setTrainingError(null); // Clear any previous errors
    
    try {
      console.log(`Training model for ${trainRegion}, pollutant ${trainPollutant}, frequency ${trainFrequency}, periods ${trainPeriods}, overwrite: ${overwriteModel}`);
      
      const response = await modelApi.train({
        pollutant: trainPollutant,
        region: trainRegion,
        frequency: trainFrequency,
        periods: trainPeriods,
        overwrite: overwriteModel // Add the overwrite flag to the API call
      });
      
      console.log("Training response:", response);
      
      if (response.success) {
        toast.success(`Model trained for ${formatters.getRegionLabel(trainRegion)} - ${formatters.getPollutantDisplay(trainPollutant)}`);
        
        // Handle the forecast data if available in the response
        const apiResponse = response.data as ModelTrainingResponse;
        
        if (apiResponse && apiResponse.forecast && apiResponse.forecast.length > 0) {
          console.log("Using forecast data from API response:", apiResponse.forecast);
          // Only take the first 6 forecast points for display
          setForecastData(apiResponse.forecast.slice(0, 6));
          setNoForecastAvailable(false);
        } else {
          console.log("No forecast data in response, using mock data");
          // Use mock data as fallback
          const mockData = generateMockForecastData(6);
          setForecastData(mockData);
          setNoForecastAvailable(false);
        }
        
        // Refresh the list of trained models
        fetchTrainedModels();
      } else {
        // Handle specific error cases
        console.error("Training failed:", response.error);
        
        if (response.error && response.error.includes("already exists")) {
          // Model already exists error - show specific message
          setTrainingError("Model already exists. Use the 'Retrain' option to overwrite.");
          toast.error("Model already exists. Use the 'Retrain' option to overwrite.");
        } else {
          // Generic error message for other errors
          setTrainingError(response.error || "Training failed");
          toast.error(response.error || "Training failed");
        }
        
        setNoForecastAvailable(true);
      }
    } catch (error) {
      console.error("Training error:", error);
      toast.error("An error occurred during model training");
      setTrainingError("An error occurred during model training");
      setNoForecastAvailable(true);
    } finally {
      setTrainLoading(false);
    }
  };

  // When either frequency or range changes, fetch new forecast range
  const fetchForecastRange = async () => {
    if (!trainRegion || !trainPollutant || !trainFrequency || !trainPeriods) {
      return;
    }

    setForecastLoading(true);
    setNoForecastAvailable(false);
    
    try {
      console.log(`Fetching forecast range for ${trainRegion}, pollutant ${trainPollutant}, frequency ${trainFrequency}, periods ${trainPeriods}`);
      
      // Clear previous forecast data
      setForecastData([]);
      
      // Call the forecast-range endpoint
      const response = await modelApi.getForecastRange({
        region: trainRegion,
        pollutant: trainPollutant,
        frequency: trainFrequency,
        limit: trainPeriods
      });
      
      if (response.success && response.data && response.data.forecast && response.data.forecast.length > 0) {
        console.log("Received forecast data:", response.data.forecast);
        setForecastData(response.data.forecast);
      } else {
        console.log("No forecast data in response or API error:", response.error);
        setForecastData([]);
        setNoForecastAvailable(true);
      }
    } catch (error) {
      console.error("Error fetching forecast range:", error);
      setForecastData([]);
      setNoForecastAvailable(true);
      
      // Check if it's a 404 error (model not found)
      if (error instanceof Error && error.message.includes("404")) {
        console.log("Model not found (404)");
      }
    } finally {
      setForecastLoading(false);
    }
  };

  // Fetch forecast data when parameters change
  useEffect(() => {
    // Debounce the request to avoid too many calls when changing parameters quickly
    const timer = setTimeout(() => {
      fetchForecastRange();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [trainRegion, trainPollutant, trainFrequency, trainPeriods]);

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
      <ResizablePanel defaultSize={33} minSize={25}>
        <TrainModelCard
          trainRegion={trainRegion}
          setTrainRegion={setTrainRegion}
          trainPollutant={trainPollutant}
          setTrainPollutant={setTrainPollutant}
          trainFrequency={trainFrequency}
          setTrainFrequency={setTrainFrequency}
          trainPeriods={trainPeriods}
          setTrainPeriods={setTrainPeriods}
          trainLoading={trainLoading}
          onTrainModel={trainModel}
          frequencyOptions={FREQUENCY_OPTIONS}
          availableRanges={availableRanges}
          overwriteModel={overwriteModel}
          setOverwriteModel={setOverwriteModel}
          trainingError={trainingError}
        />
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel defaultSize={67}>
        <div className="h-full space-y-6 p-1">
          <RecentTrainingsCard
            recentTrainings={recentTrainings}
            formatters={formatters}
            isLoading={modelsLoading}
            onModelDeleted={fetchTrainedModels}
          />
          
          {forecastLoading && (
            <Card className="col-span-2 flex items-center justify-center h-[300px]">
              <div className="flex flex-col items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="mt-2 text-muted-foreground">Loading forecast data...</p>
              </div>
            </Card>
          )}
          
          {!forecastLoading && forecastData && forecastData.length > 0 && (
            <ForecastPreview
              data={forecastData}
              region={trainRegion}
              pollutant={trainPollutant}
              frequency={trainFrequency}
              formatters={formatters}
            />
          )}
          
          {!forecastLoading && noForecastAvailable && (
            <Card className="col-span-2 flex flex-col items-center justify-center h-[300px] p-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No forecast available</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                No forecast model is available for {formatters.getPollutantDisplay(trainPollutant)} in {formatters.getRegionLabel(trainRegion)} with {formatters.getFrequencyDisplay(trainFrequency).toLowerCase()} frequency.
              </p>
              <p className="text-sm text-center text-muted-foreground">
                Please train a model using the form on the left to generate forecasts.
              </p>
            </Card>
          )}
          
          {!forecastLoading && !noForecastAvailable && (!forecastData || forecastData.length === 0) && (
            <Card className="col-span-2 flex items-center justify-center h-[300px]">
              <p className="text-muted-foreground">
                Forecast preview will appear here after training a model
              </p>
            </Card>
          )}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ModelTrainingTab;
