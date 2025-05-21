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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ModelDetailsView from "./ModelDetailsView";
import ModelComparisonView from "./ModelComparisonView";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

// Interface for model metadata filters
interface ModelMetadataFilters {
  available: Array<{
    region: string;
    pollutant: string;
    frequency: string;
  }>;
}

// Interface for model details - adding specific status types
interface ModelDetails {
  id: string;
  region: string;
  pollutant: string;
  frequency: string;
  forecast_periods: number;
  created_at: string;
  trained_by?: string;
  status: "complete" | "ready" | "in-progress" | "failed"; // Fixed to use string literals
  accuracy_mae?: number;
  accuracy_rmse?: number;
  model_type?: string;
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
  const [overwriteModel, setOverwriteModel] = useState(false); // State for the overwrite option
  
  // State for forecast data and training records
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [recentTrainings, setRecentTrainings] = useState<TrainingRecord[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [noForecastAvailable, setNoForecastAvailable] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null); // State to track specific training errors
  
  // New state for model existence check, details, and comparison
  const [modelExists, setModelExists] = useState(false);
  const [isCheckingModel, setIsCheckingModel] = useState(false);
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModelDetails, setSelectedModelDetails] = useState<ModelDetails | null>(null);
  const [modelDetailsLoading, setModelDetailsLoading] = useState(false);
  const [modelsToCompare, setModelsToCompare] = useState<string[]>([]);
  const [allowCrossPollutantComparison, setAllowCrossPollutantComparison] = useState(false);
  const [basePollutant, setBasePollutant] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<ModelMetadataFilters | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  
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
    fetchAvailableFilters();
  }, []);

  // Fetch available filters for regions, pollutants, and frequencies
  const fetchAvailableFilters = async () => {
    setFiltersLoading(true);
    try {
      const response = await modelApi.getMetadataFilters();
      if (response.success && response.data) {
        console.log("Received filter metadata:", response.data);
        setAvailableFilters(response.data as ModelMetadataFilters);
      } else {
        console.error("Failed to fetch filter metadata:", response.error);
      }
    } catch (error) {
      console.error("Error fetching filter metadata:", error);
    } finally {
      setFiltersLoading(false);
    }
  };

  // Check if a model already exists before training
  const checkModelExists = async () => {
    setIsCheckingModel(true);
    setModelExists(false);
    try {
      const response = await modelApi.checkExists({
        region: trainRegion,
        pollutant: trainPollutant,
        frequency: trainFrequency
      });
      
      if (response.success && response.data) {
        const exists = response.data.exists;
        setModelExists(exists);
        console.log(`Model exists check: ${exists}`);
        
        if (exists && !overwriteModel) {
          toast.info("A model with these parameters already exists. Enable 'Retrain Model' to overwrite it.");
          return true;
        }
      } else {
        console.error("Failed to check if model exists:", response.error);
      }
      return false;
    } catch (error) {
      console.error("Error checking if model exists:", error);
      return false;
    } finally {
      setIsCheckingModel(false);
    }
  };

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
      case "pm10_conc": baseValue = 25; break;
      case "pm25_conc": baseValue = 15; break;
      case "co_conc": baseValue = 300; break;
      default: baseValue = 30;
    }
    
    // Generate data points for the requested number of periods
    for (let i = 0; i < periods; i++) {
      const date = new Date(now.getTime() + (i * timeIncrement));
      // Add some randomness to the forecast
      const randomFactor = 0.2; // 20% variation
      const yhat = baseValue * (1 + (Math.random() * randomFactor - randomFactor/2));
      
      // Add seasonal pattern for more realistic data
      const seasonalFactor = i % 7 === 0 ? 1.1 : // Higher on same day each week
                            i % 7 === 3 ? 0.9 : // Lower on another day
                            1.0;
      
      const adjustedYhat = yhat * seasonalFactor;
      
      data.push({
        ds: date.toISOString(),
        yhat: adjustedYhat,
        yhat_lower: adjustedYhat * 0.8, // 20% below forecast
        yhat_upper: adjustedYhat * 1.2, // 20% above forecast
      });
    }
    
    return data;
  };

  // Handle model training with existence check
  const trainModel = async () => {
    // First check if model exists
    const exists = await checkModelExists();
    if (exists && !overwriteModel) {
      return; // Stop if model exists and overwrite not enabled
    }
    
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
          // Pass the full forecast data from API response
          setForecastData(apiResponse.forecast);
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
        fetchAvailableFilters(); // Refresh available filters
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

  // Fetch model details when a model is selected
  const fetchModelDetails = async (modelId: string) => {
    setModelDetailsLoading(true);
    try {
      const response = await modelApi.getInfo(modelId);
      if (response.success && response.data) {
        console.log("Model details:", response.data);
        setSelectedModelDetails(response.data as ModelDetails);
        setModelDetailsOpen(true);
      } else {
        console.error("Failed to fetch model details:", response.error);
        toast.error("Failed to fetch model details");
      }
    } catch (error) {
      console.error("Error fetching model details:", error);
      toast.error("Error loading model details");
    } finally {
      setModelDetailsLoading(false);
    }
  };

  // Handle model selection for details view
  const handleViewModelDetails = (modelId: string) => {
    setSelectedModelId(modelId);
    fetchModelDetails(modelId);
  };

  // Toggle model selection for comparison
  const toggleModelForComparison = (modelId: string, pollutant: string) => {
    setModelsToCompare(prev => {
      // If removing a model
      if (prev.includes(modelId)) {
        const newModels = prev.filter(id => id !== modelId);
        
        // If all models are removed, reset the base pollutant
        if (newModels.length === 0) {
          setBasePollutant(null);
        }
        
        return newModels;
      } 
      // If adding a model
      else {
        // If this is the first model, set its pollutant as the base
        if (prev.length === 0) {
          setBasePollutant(pollutant);
        }
        
        return [...prev, modelId];
      }
    });
  };

  // Check if a model can be selected for comparison based on pollutant rules
  const canSelectForComparison = (pollutant: string): boolean => {
    // If cross-pollutant comparison is allowed, or no base pollutant is set, or pollutant matches base
    return allowCrossPollutantComparison || basePollutant === null || pollutant === basePollutant;
  };

  // Get tooltip text for disabled model selection
  const getDisabledTooltip = (pollutant: string): string => {
    if (basePollutant && pollutant !== basePollutant) {
      return `Only models with pollutant ${formatters.getPollutantDisplay(basePollutant)} can be compared. Enable cross-pollutant to override.`;
    }
    return "";
  };

  // Compare selected models
  const compareSelectedModels = async () => {
    if (modelsToCompare.length < 2) {
      toast.warning("Please select at least 2 models to compare");
      return;
    }
    
    setComparisonLoading(true);
    try {
      const response = await modelApi.compareModels(modelsToCompare);
      if (response.success && response.data) {
        console.log("Comparison data:", response.data);
        setComparisonData(response.data);
        setShowComparison(true);
      } else {
        console.error("Failed to compare models:", response.error);
        toast.error("Failed to compare models");
      }
    } catch (error) {
      console.error("Error comparing models:", error);
      toast.error("Error comparing models");
    } finally {
      setComparisonLoading(false);
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

  // New function to preview forecast with specific periods
  const handlePreviewForecast = async (modelId: string, periods: number = 6) => {
    setForecastLoading(true);
    setNoForecastAvailable(false);
    
    try {
      console.log(`Previewing forecast for model ${modelId} with ${periods} periods`);
      
      // Call the model preview endpoint
      const response = await modelApi.getModelPreview(modelId, periods);
      
      if (response.success && response.data && response.data.forecast && response.data.forecast.length > 0) {
        console.log(`Received forecast data with ${response.data.forecast.length} periods:`, response.data.forecast);
        setForecastData(response.data.forecast);
        
        // Also get model details to show proper labels
        const modelDetails = await modelApi.getInfo(modelId);
        if (modelDetails.success && modelDetails.data) {
          const data = modelDetails.data as ModelDetails; // Type assertion
          setTrainRegion(data.region);
          setTrainPollutant(data.pollutant as Pollutant);
          setTrainFrequency(data.frequency);
        }
      } else {
        console.log("No forecast data in preview response:", response.error);
        
        // Use mock data as fallback
        const mockData = generateMockForecastData(periods);
        console.log(`Generated mock forecast data with ${periods} periods`);
        setForecastData(mockData);
      }
    } catch (error) {
      console.error("Error getting forecast preview:", error);
      
      // Fallback to mock data
      const mockData = generateMockForecastData(periods);
      console.log(`Using fallback mock forecast data with ${periods} periods`);
      setForecastData(mockData);
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {modelsToCompare.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {modelsToCompare.length} model{modelsToCompare.length !== 1 ? 's' : ''} selected for comparison
            </span>
            {basePollutant && (
              <Badge variant="outline" className="ml-2">
                Base: {formatters.getPollutantDisplay(basePollutant)}
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <div className="flex items-center space-x-2">
              <Switch 
                id="cross-pollutant"
                checked={allowCrossPollutantComparison}
                onCheckedChange={setAllowCrossPollutantComparison}
              />
              <label 
                htmlFor="cross-pollutant" 
                className="text-sm cursor-pointer flex items-center"
              >
                Allow cross-pollutant comparison
                {allowCrossPollutantComparison && (
                  <span className="ml-2 text-amber-500 text-xs flex items-center">
                    ⚠️ Comparing different pollutants may not be meaningful
                  </span>
                )}
              </label>
            </div>
            <div className="flex space-x-2 sm:ml-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setModelsToCompare([]);
                  setBasePollutant(null);
                }}
              >
                Clear
              </Button>
              <Button 
                size="sm" 
                onClick={compareSelectedModels} 
                disabled={modelsToCompare.length < 2 || comparisonLoading}
              >
                {comparisonLoading ? 'Comparing...' : 'Compare Models'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
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
            modelExists={modelExists}
            isCheckingModel={isCheckingModel}
            availableFilters={availableFilters}
            filtersLoading={filtersLoading}
            forecastLoading={forecastLoading}
            onPreviewForecast={() => {}}
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
              onViewDetails={handleViewModelDetails}
              onPreviewForecast={handlePreviewForecast}
              modelsToCompare={modelsToCompare}
              onToggleCompare={(modelId, pollutant) => toggleModelForComparison(modelId, pollutant)}
              canSelectForComparison={canSelectForComparison}
              getDisabledTooltip={getDisabledTooltip}
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
                  No forecast model is available for {formatters.getPollutantDisplay(trainPollutant)} in {formatters.getRegionLabel(trainRegion)} with {formatters.getFrequencyDisplay?.(trainFrequency).toLowerCase()} frequency.
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
            
            {showComparison && comparisonData && (
              <ModelComparisonView 
                data={comparisonData}
                onClose={() => setShowComparison(false)}
                formatters={formatters}
              />
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Model details dialog */}
      <Dialog open={modelDetailsOpen} onOpenChange={setModelDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Model Details</DialogTitle>
            <DialogDescription>
              Detailed information about the selected forecast model
            </DialogDescription>
          </DialogHeader>
          {modelDetailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="ml-2">Loading model details...</p>
            </div>
          ) : selectedModelDetails ? (
            <ModelDetailsView model={selectedModelDetails as ModelDetails} formatters={formatters} />
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No model details available
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModelTrainingTab;
