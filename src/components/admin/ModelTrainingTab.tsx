import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { modelApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import TrainModelCard from "./TrainModelCard";
import RecentTrainingsCard, { TrainingRecord } from "./RecentTrainingsCard";
import ForecastPreview from "./ForecastPreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ModelDetailsView from "./ModelDetailsView";
import ModelComparisonView from "./ModelComparisonView";
import { Button } from "@/components/ui/button";
import { useModelExists } from "@/hooks/use-model-exists";
import { 
  FREQUENCY_OPTIONS, 
  ModelTrainingResponse, 
  ModelData, 
  ModelDetails,
  ModelMetadataFilters,
  ForecastDataPoint,
  stringToModelStatus,
  ModelComparisonResponse
} from "@/lib/model-utils";

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
  const [modelDetailsOpen, setModelDetailsOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModelDetails, setSelectedModelDetails] = useState<ModelDetails | null>(null);
  const [modelDetailsLoading, setModelDetailsLoading] = useState(false);
  const [modelsToCompare, setModelsToCompare] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<ModelMetadataFilters | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  
  // NEW: State to track the model selected for preview
  const [selectedPreviewModel, setSelectedPreviewModel] = useState<TrainingRecord | null>(null);
  
  // Use our custom hook to check if a model exists
  const { modelExists, isChecking: isCheckingModel } = useModelExists({
    region: trainRegion,
    pollutant: trainPollutant,
    frequency: trainFrequency
  });
  
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
        
        // Convert API model data to TrainingRecord format with proper type casting
        const trainings: TrainingRecord[] = (response.data as ModelData[]).map(model => ({
          id: model.id,
          region: model.region,
          pollutant: model.pollutant as Pollutant, // Ensure pollutant is cast to Pollutant type
          date: model.created_at,
          status: stringToModelStatus(model.status || "complete"), // Ensure proper status type casting
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
        toast.error("Failed to load trained models");
      }
    } catch (error) {
      console.error("Error fetching trained models:", error);
      toast.error("Error loading trained models");
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
        toast.error("Failed to load filter options");
      }
    } catch (error) {
      console.error("Error fetching filter metadata:", error);
      toast.error("Error loading filter options");
    } finally {
      setFiltersLoading(false);
    }
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
          // Pass the full forecast data from API response
          setForecastData(apiResponse.forecast);
          setNoForecastAvailable(false);
        } else {
          console.log("No forecast data in response");
          setForecastData([]);
          setNoForecastAvailable(true);
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
        // Ensure status has the correct type
        const modelDetails = response.data as ModelDetails;
        modelDetails.status = stringToModelStatus(modelDetails.status);
        
        setSelectedModelDetails(modelDetails);
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
  const toggleModelForComparison = (modelId: string) => {
    setModelsToCompare(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        return [...prev, modelId];
      }
    });
  };

  // NEW: Handle model selection for preview
  const handleSelectModelForPreview = (modelId: string, selected: boolean) => {
    // Clear any previous selection if deselecting
    if (!selected) {
      setSelectedPreviewModel(null);
      return;
    }
    
    // Find the selected model in the recentTrainings list
    const model = recentTrainings.find(model => model.id === modelId);
    if (model) {
      setSelectedPreviewModel(model);
      
      // Auto-update the training form fields to match the selected model
      setTrainRegion(model.region);
      setTrainPollutant(model.pollutant);
      if (model.frequency) setTrainFrequency(model.frequency);
      if (model.periods) setTrainPeriods(model.periods);
    }
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
        // Add proper type assertion here to fix the TypeScript errors
        const comparisonData = response.data as ModelComparisonResponse;
        
        if (comparisonData && Array.isArray(comparisonData.models)) {
          console.log("Comparison data:", comparisonData.models);
          setComparisonData({ models: comparisonData.models });
          setShowComparison(true);
        } else {
          console.error("Invalid comparison data structure:", response.data);
          toast.error("Invalid data format received from server");
        }
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

  // NEW: Updated fetchForecastRange to use the selected model when available
  const fetchForecastRange = async () => {
    // Clear previous data
    setForecastData([]);
    setNoForecastAvailable(false);
    setForecastLoading(true);
    
    try {
      let response;
      
      // Check if we have a selected model to use for preview
      if (selectedPreviewModel && selectedPreviewModel.id) {
        console.log(`Fetching forecast preview for model ID: ${selectedPreviewModel.id}`);
        
        // Use the model preview endpoint with the selected model ID
        response = await modelApi.getModelPreview(
          selectedPreviewModel.id,
          selectedPreviewModel.periods || trainPeriods
        );
      } else {
        // Fallback to using parameters when no model is selected
        if (!trainRegion || !trainPollutant || !trainFrequency || !trainPeriods) {
          setForecastLoading(false);
          return;
        }
        
        console.log(`Fetching forecast range for ${trainRegion}, pollutant ${trainPollutant}, frequency ${trainFrequency}, periods ${trainPeriods}`);
        
        // Use the forecast range endpoint with parameters
        response = await modelApi.getForecastRange({
          region: trainRegion,
          pollutant: trainPollutant,
          frequency: trainFrequency,
          limit: trainPeriods
        });
      }
      
      // Process the response (both endpoints should return similar data structure)
      if (response.success && response.data && Array.isArray(response.data.forecast) && response.data.forecast.length > 0) {
        console.log("Received forecast data:", response.data.forecast);
        setForecastData(response.data.forecast);
        setNoForecastAvailable(false);
      } else {
        console.log("No forecast data returned or empty response");
        setForecastData([]);
        setNoForecastAvailable(true);
        
        if (response.error) {
          toast.error(`Failed to fetch forecast: ${response.error}`);
        }
      }
    } catch (error) {
      console.error("Error fetching forecast data:", error);
      setForecastData([]);
      setNoForecastAvailable(true);
      toast.error("Failed to fetch forecast data");
      
      if (error instanceof Error && error.message.includes("404")) {
        toast.error("No forecast model found for the selected parameters");
      }
    } finally {
      setForecastLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {modelsToCompare.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {modelsToCompare.length} model{modelsToCompare.length !== 1 ? 's' : ''} selected for comparison
            </span>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setModelsToCompare([])}
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
      )}
      
      <div className="w-full">
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
          onPreviewForecast={fetchForecastRange}
          selectedPreviewModel={selectedPreviewModel}
        />
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
        <ResizablePanel defaultSize={100} minSize={50}>
          <div className="h-full space-y-6 p-1">
            <RecentTrainingsCard
              recentTrainings={recentTrainings}
              formatters={formatters}
              isLoading={modelsLoading}
              onModelDeleted={fetchTrainedModels}
              onViewDetails={handleViewModelDetails}
              modelsToCompare={modelsToCompare}
              onToggleCompare={toggleModelForComparison}
              onSelectForPreview={handleSelectModelForPreview}
              selectedPreviewModel={selectedPreviewModel ? selectedPreviewModel.id : null}
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
                region={selectedPreviewModel ? selectedPreviewModel.region : trainRegion}
                pollutant={selectedPreviewModel ? selectedPreviewModel.pollutant : trainPollutant}
                frequency={selectedPreviewModel?.frequency || trainFrequency}
                formatters={formatters}
              />
            )}
            
            {!forecastLoading && noForecastAvailable && (
              <Card className="col-span-2 flex flex-col items-center justify-center h-[300px] p-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No forecast available</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  {selectedPreviewModel ? 
                    `No forecast data available for the selected model.` :
                    `No forecast model is available for ${formatters.getPollutantDisplay(trainPollutant)} in ${formatters.getRegionLabel(trainRegion)} with ${formatters.getFrequencyDisplay(trainFrequency).toLowerCase()} frequency.`
                  }
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  {selectedPreviewModel ? 
                    "Please select a different model." :
                    "Please train a model using the form on the left to generate forecasts."
                  }
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
            <ModelDetailsView model={selectedModelDetails} formatters={formatters} />
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
