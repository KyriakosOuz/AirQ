
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { modelApi } from "@/lib/api";
import { toast } from "sonner";
import { Pollutant } from "@/lib/types";
import TrainModelCard, { FrequencyOption } from "./TrainModelCard"; 
import RecentTrainingsCard, { TrainingRecord } from "./RecentTrainingsCard";
import ModelDetailsView from "./ModelDetailsView";
import ForecastPreview from "./ForecastPreview";
import ModelComparisonView from "./ModelComparisonView";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

// Interface for model metadata filters - ensuring properties are always arrays
interface ModelMetadataFilters {
  available: Array<{
    region: string;
    pollutant: string;
    frequency: string;
  }>;
  regions?: string[];
  pollutants?: string[];
  frequencies?: string[];
}

// Interface for model details - adding specific status types
interface ModelDetails {
  id: string;
  region: string;
  pollutant: string;
  frequency: string;
  forecast_periods: number;
  created_at: string;
  status: "ready" | "training" | "failed";
  model_type: string;
  file_path: string;
  accuracy_mae?: number;
  accuracy_rmse?: number;
}

// Define the frequency options with their available ranges
const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    value: "daily",
    label: "Daily",
    ranges: [3, 7, 14, 30]
  },
  {
    value: "weekly",
    label: "Weekly",
    ranges: [4, 8, 12, 24]
  },
  {
    value: "monthly",
    label: "Monthly",
    ranges: [3, 6, 12, 24]
  }
];

const ModelTrainingTab: React.FC = () => {
  // State for model training form
  const [trainRegion, setTrainRegion] = useState<string>("thessaloniki");
  const [trainPollutant, setTrainPollutant] = useState<Pollutant>("no2_conc");
  const [trainFrequency, setTrainFrequency] = useState<string>(FREQUENCY_OPTIONS[0].value);
  const [trainPeriods, setTrainPeriods] = useState<number>(FREQUENCY_OPTIONS[0].ranges[0]);
  const [overwriteModel, setOverwriteModel] = useState<boolean>(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainLoading, setTrainLoading] = useState<boolean>(false);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  
  // State for models
  const [models, setModels] = useState<ModelDetails[]>([]);
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<ModelDetails | null>(null);
  const [modelExists, setModelExists] = useState<boolean>(false);
  const [isCheckingModel, setIsCheckingModel] = useState<boolean>(false);
  
  // State for comparing models
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [allowCrossPollutantComparison, setAllowCrossPollutantComparison] = useState<boolean>(false);
  const [basePollutant, setBasePollutant] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [availableFilters, setAvailableFilters] = useState<ModelMetadataFilters | null>({
    available: [],
    regions: [],
    pollutants: [],
    frequencies: []
  });
  const [filtersLoading, setFiltersLoading] = useState(false);
  
  // Get available ranges for the selected frequency
  const availableRanges = useMemo(() => {
    const frequencyOption = FREQUENCY_OPTIONS.find(option => option.value === trainFrequency);
    return frequencyOption ? frequencyOption.ranges : [];
  }, [trainFrequency]);
  
  // Check if data is available for training
  const isDataAvailableForTraining = useCallback(() => {
    if (!availableFilters || !availableFilters.available || !Array.isArray(availableFilters.available)) {
      return false;
    }

    return availableFilters.available.some(
      item => item.region === trainRegion && item.pollutant === trainPollutant && item.frequency === trainFrequency
    );
  }, [availableFilters, trainRegion, trainPollutant, trainFrequency]);
  
  // Check if a model exists with the current parameters
  const checkModelExists = useCallback(async () => {
    try {
      setIsCheckingModel(true);
      
      // First, check if data is available for training
      if (!isDataAvailableForTraining()) {
        setModelExists(false);
        return;
      }
      
      const response = await modelApi.checkExists({
        region: trainRegion,
        pollutant: trainPollutant,
        frequency: trainFrequency
      });
      
      // Only set modelExists to true if the API explicitly says the model exists
      if (response.success && response.data && response.data.exists === true) {
        console.log("Model exists check:", response.data);
        setModelExists(true);
      } else {
        console.log("Model does not exist or check failed:", response);
        setModelExists(false);
      }
    } catch (error) {
      console.error("Error checking if model exists:", error);
      setModelExists(false); // Assume model doesn't exist on error
    } finally {
      setIsCheckingModel(false);
    }
  }, [trainRegion, trainPollutant, trainFrequency, isDataAvailableForTraining]);
  
  // Effect to check if a model exists when parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      checkModelExists();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [trainRegion, trainPollutant, trainFrequency, checkModelExists]);
  
  // Train a model with the current parameters
  const trainModel = async () => {
    try {
      setTrainingError(null);
      setTrainLoading(true);
      
      // Check if data is available for training
      if (!isDataAvailableForTraining()) {
        setTrainingError("No data available for the selected parameters");
        toast.error("No data available for the selected parameters");
        return;
      }
      
      // Train the model
      const response = await modelApi.train({
        region: trainRegion,
        pollutant: trainPollutant,
        frequency: trainFrequency,
        periods: trainPeriods,
        overwrite: overwriteModel
      });
      
      if (response.success) {
        toast.success("Model training started");
        fetchModels();
      } else {
        setTrainingError(response.error || "Failed to train model");
        toast.error(response.error || "Failed to train model");
      }
    } catch (error) {
      console.error("Error training model:", error);
      setTrainingError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setTrainLoading(false);
    }
  };
  
  // Fetch the list of trained models
  const fetchModels = useCallback(async () => {
    console.log("Fetching trained models...");
    try {
      setModelsLoading(true);
      const response = await modelApi.list();
      
      if (response.success && response.data) {
        console.log("Received models data:", response.data);
        setModels(response.data as ModelDetails[]);
      } else {
        console.error("Failed to fetch models:", response.error);
        toast.error("Failed to fetch models");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setModelsLoading(false);
    }
  }, []);
  
  // Fetch model metadata filters
  const fetchFilters = useCallback(async () => {
    try {
      setFiltersLoading(true);
      const response = await modelApi.getMetadataFilters();
      if (response.success && response.data) {
        console.log("Received filter metadata:", response.data);
        // Process the data to ensure we always have arrays for regions, pollutants, and frequencies
        const filterData = response.data as any;
        
        // Create a properly structured ModelMetadataFilters object
        const processedFilters: ModelMetadataFilters = {
          available: Array.isArray(filterData.available) ? filterData.available : [],
          regions: Array.isArray(filterData.regions) ? filterData.regions : [],
          pollutants: Array.isArray(filterData.pollutants) ? filterData.pollutants : [],
          frequencies: Array.isArray(filterData.frequencies) ? filterData.frequencies : []
        };
        
        setAvailableFilters(processedFilters);
      } else {
        console.error("Failed to fetch filter metadata:", response.error);
        // Set default empty arrays to prevent length access on undefined
        setAvailableFilters({
          available: [],
          regions: [],
          pollutants: [],
          frequencies: []
        });
      }
    } catch (error) {
      console.error("Error fetching filter metadata:", error);
      // Set default empty arrays to prevent length access on undefined
      setAvailableFilters({
          available: [],
          regions: [],
          pollutants: [],
          frequencies: []
      });
    } finally {
      setFiltersLoading(false);
    }
  }, []);
  
  // Fetch models and filters on component mount
  useEffect(() => {
    fetchModels();
    fetchFilters();
  }, [fetchModels, fetchFilters]);
  
  // Preview a forecast for a model
  const previewForecast = async (modelId: string, periods?: number) => {
    try {
      setSelectedModel(models.find(m => m.id === modelId) || null);
      setForecastLoading(true);
      
      const response = await modelApi.getModelPreview(modelId, periods || 6);
      if (response.success && response.data) {
        toast.success("Forecast preview loaded");
      }
    } catch (error) {
      console.error("Error fetching model preview:", error);
      toast.error("Failed to load forecast preview");
    } finally {
      setForecastLoading(false);
    }
  };
  
  // Handle model selection for comparison
  const toggleModelSelection = (modelId: string, pollutant: string) => {
    // If this is the first model being selected, set the base pollutant
    if (selectedModels.length === 0) {
      setBasePollutant(pollutant);
    }
    
    if (selectedModels.includes(modelId)) {
      // If model is already selected, remove it from the selection
      setSelectedModels(prev => prev.filter(id => id !== modelId));
      
      // If we removed all models, reset the base pollutant
      if (selectedModels.length <= 1) {
        setBasePollutant(null);
      }
      
      // If we removed the only model of the base pollutant type, find a new base pollutant
      if (selectedModels.length > 0 && basePollutant === pollutant) {
        const remainingModels = selectedModels.filter(id => id !== modelId);
        if (remainingModels.length > 0) {
          const newBaseModel = models.find(m => m.id === remainingModels[0]);
          if (newBaseModel) {
            setBasePollutant(newBaseModel.pollutant);
          }
        }
      }
    } else {
      // If model is not selected, add it to the selection
      setSelectedModels(prev => [...prev, modelId]);
    }
  };
  
  // Compare selected models
  const compareModels = async () => {
    if (selectedModels.length < 2) {
      toast.error("Select at least 2 models to compare");
      return;
    }
    
    try {
      setComparisonLoading(true);
      const response = await modelApi.compareModels(selectedModels);
      
      if (response.success && response.data) {
        setComparisonData(response.data);
        setShowComparison(true);
      } else {
        toast.error(response.error || "Failed to compare models");
      }
    } catch (error) {
      console.error("Error comparing models:", error);
      toast.error("Failed to compare models");
    } finally {
      setComparisonLoading(false);
    }
  };
  
  // Delete a model
  const deleteModel = async (modelId: string) => {
    try {
      const response = await modelApi.delete(modelId);
      
      if (response.success) {
        toast.success("Model deleted successfully");
        fetchModels();
        
        // Remove from selected models if it was selected
        if (selectedModels.includes(modelId)) {
          setSelectedModels(prev => prev.filter(id => id !== modelId));
        }
        
        // Clear selected model if it was selected
        if (selectedModel && selectedModel.id === modelId) {
          setSelectedModel(null);
        }
      } else {
        toast.error(response.error || "Failed to delete model");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Failed to delete model");
    }
  };
  
  // Reset the comparison view
  const resetComparison = () => {
    setShowComparison(false);
    setComparisonData(null);
    setSelectedModels([]);
    setBasePollutant(null);
  };

  // Check if a model can be selected for comparison based on pollutant restrictions
  const canSelectModel = (model: ModelDetails) => {
    if (allowCrossPollutantComparison) return true;
    if (!basePollutant) return true;
    return model.pollutant === basePollutant;
  };

  // Get the pollutant display name
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
  
  // Get the region display name
  const getRegionLabel = (region: string): string => {
    return region.charAt(0).toUpperCase() + region.slice(1);
  };

  // Get the frequency display name
  const getFrequencyDisplay = (frequency: string): string => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.value === frequency);
    return option ? option.label : frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  // Convert ModelDetails to TrainingRecord for RecentTrainingsCard
  const convertToTrainingRecords = (models: ModelDetails[]): TrainingRecord[] => {
    return models.map(model => ({
      id: model.id,
      region: model.region,
      pollutant: model.pollutant as Pollutant,
      date: model.created_at,
      status: model.status === "training" ? "in-progress" : model.status,
      frequency: model.frequency,
      periods: model.forecast_periods,
      accuracy_mae: model.accuracy_mae,
      accuracy_rmse: model.accuracy_rmse
    }));
  };

  // Format date helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formatters object for components
  const formatters = {
    formatDate,
    getRegionLabel,
    getPollutantDisplay,
    getFrequencyDisplay
  };
  
  return (
    <Tabs defaultValue="train" className="space-y-6">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="train">Train Models</TabsTrigger>
        <TabsTrigger value="compare">Compare Models</TabsTrigger>
      </TabsList>
      
      <TabsContent value="train" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            availableFilters={availableFilters || { available: [], regions: [], pollutants: [], frequencies: [] }}
            filtersLoading={filtersLoading}
            forecastLoading={forecastLoading}
            onPreviewForecast={previewForecast}
          />
          
          <div className="lg:col-span-2">
            <RecentTrainingsCard 
              recentTrainings={convertToTrainingRecords(models)}
              formatters={formatters}
              isLoading={modelsLoading}
              onModelDeleted={fetchModels}
              onViewDetails={(modelId) => {
                const model = models.find(m => m.id === modelId);
                if (model) setSelectedModel(model);
              }}
              onPreviewForecast={previewForecast}
              modelsToCompare={selectedModels}
              onToggleCompare={toggleModelSelection}
              canSelectForComparison={(pollutant) => allowCrossPollutantComparison || !basePollutant || pollutant === basePollutant}
              getDisabledTooltip={(pollutant) => {
                if (!allowCrossPollutantComparison && basePollutant && pollutant !== basePollutant) {
                  return `This model cannot be compared with the selected ${getPollutantDisplay(basePollutant)} models. Enable cross-pollutant comparison to select it.`;
                }
                return "";
              }}
            />
          </div>
          
          {selectedModel && (
            <ModelDetailsView 
              model={{
                ...selectedModel,
                status: selectedModel.status === "training" ? "in-progress" : selectedModel.status
              }}
              formatters={formatters}
            />
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="compare" className="space-y-6">
        {showComparison && comparisonData ? (
          <ModelComparisonView
            data={comparisonData}
            onClose={resetComparison}
            formatters={formatters}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold">Select Models to Compare</h3>
                <p className="text-sm text-muted-foreground">
                  Choose two or more models to compare their forecasts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="cross-pollutant" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Allow cross-pollutant comparison
                  </label>
                  <input
                    type="checkbox"
                    id="cross-pollutant"
                    checked={allowCrossPollutantComparison}
                    onChange={(e) => setAllowCrossPollutantComparison(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
                <Button 
                  variant="default"
                  disabled={selectedModels.length < 2 || comparisonLoading}
                  onClick={compareModels}
                >
                  {comparisonLoading ? "Comparing..." : "Compare Models"}
                </Button>
              </div>
            </div>
            
            {!allowCrossPollutantComparison && basePollutant && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Only models with pollutant {getPollutantDisplay(basePollutant)} can be compared. Enable cross-pollutant to override.
                </p>
              </div>
            )}
            
            {allowCrossPollutantComparison && selectedModels.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                <p className="text-sm flex items-center text-yellow-800">
                  <Info className="h-4 w-4 mr-2" />
                  ⚠️ Comparing different pollutants may not provide meaningful results.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelsLoading ? (
                Array(6).fill(null).map((_, i) => (
                  <div key={i} className="border rounded-lg p-4 h-48 animate-pulse bg-muted" />
                ))
              ) : models.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">No models available for comparison</p>
                </div>
              ) : (
                Array.from(new Set(models.map(model => model.pollutant))).map(pollutant => (
                  <div key={pollutant} className="col-span-full mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-md font-semibold">{getPollutantDisplay(pollutant)}</h3>
                      <Badge variant="outline">{models.filter(m => m.pollutant === pollutant).length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {models
                        .filter(model => model.pollutant === pollutant)
                        .map(model => {
                          const isSelected = selectedModels.includes(model.id);
                          const isDisabled = !canSelectModel(model) && !isSelected;
                          
                          return (
                            <div 
                              key={model.id}
                              onClick={() => !isDisabled && toggleModelSelection(model.id, model.pollutant)}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'border-primary bg-primary/5' 
                                  : isDisabled 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:border-primary/50'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium">
                                  {model.region.charAt(0).toUpperCase() + model.region.slice(1)}
                                </h4>
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => !isDisabled && toggleModelSelection(model.id, model.pollutant)}
                                  disabled={isDisabled}
                                  className="h-4 w-4"
                                />
                              </div>
                              <div className="space-y-1 text-sm">
                                <p className="flex justify-between">
                                  <span className="text-muted-foreground">Pollutant:</span>
                                  <span>{getPollutantDisplay(model.pollutant)}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-muted-foreground">Frequency:</span>
                                  <span>{model.frequency}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-muted-foreground">Periods:</span>
                                  <span>{model.forecast_periods}</span>
                                </p>
                                <p className="flex justify-between">
                                  <span className="text-muted-foreground">Created:</span>
                                  <span>{formatDate(model.created_at)}</span>
                                </p>
                                {model.accuracy_mae && (
                                  <p className="flex justify-between">
                                    <span className="text-muted-foreground">Accuracy:</span>
                                    <span>MAE: {model.accuracy_mae.toFixed(2)}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ModelTrainingTab;
