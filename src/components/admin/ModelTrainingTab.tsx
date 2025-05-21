
import React, { useState, useEffect } from 'react';
import { Grid } from "@/components/ui/grid";
import { toast } from "sonner";
import { Pollutant } from "@/lib/types";
import { modelApi } from "@/lib/api";
import TrainModelCard from "@/components/admin/TrainModelCard";
import RecentTrainingsCard, { TrainingRecord } from "@/components/admin/RecentTrainingsCard";
import ForecastPreview from "@/components/admin/ForecastPreview";
import ModelComparisonView from "@/components/admin/ModelComparisonView";
import ModelDetailsView from "@/components/admin/ModelDetailsView";

// Define frequency options with min/max period ranges
const FREQUENCY_OPTIONS = [
  { 
    value: "daily", 
    label: "Daily", 
    ranges: [7, 14, 30, 60, 90, 180, 365],
    minPeriod: 1,
    maxPeriod: 365
  },
  { 
    value: "weekly", 
    label: "Weekly", 
    ranges: [4, 8, 12, 24, 52],
    minPeriod: 1,
    maxPeriod: 52
  },
  { 
    value: "monthly", 
    label: "Monthly", 
    ranges: [3, 6, 12, 24],
    minPeriod: 1,
    maxPeriod: 36
  }
];

const ModelTrainingTab: React.FC = () => {
  // Training form state
  const [trainRegion, setTrainRegion] = useState<string>("thessaloniki");
  const [trainPollutant, setTrainPollutant] = useState<Pollutant>("no2_conc");
  const [trainFrequency, setTrainFrequency] = useState<string>("daily");
  const [trainPeriods, setTrainPeriods] = useState<number>(14);
  const [overwriteModel, setOverwriteModel] = useState<boolean>(false);
  
  // UI state
  const [trainLoading, setTrainLoading] = useState<boolean>(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [recentTrainings, setRecentTrainings] = useState<TrainingRecord[]>([]);
  const [trainingsLoading, setTrainingsLoading] = useState<boolean>(true);
  const [modelExists, setModelExists] = useState<boolean>(false);
  const [isCheckingModel, setIsCheckingModel] = useState<boolean>(false);
  const [availableFilters, setAvailableFilters] = useState(null);
  const [filtersLoading, setFiltersLoading] = useState<boolean>(true);
  
  // Forecast preview state
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [forecastLoading, setForecastLoading] = useState<boolean>(false);
  const [forecastData, setForecastData] = useState(null);
  
  // Model comparison state
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [modelsToCompare, setModelsToCompare] = useState<string[]>([]);
  
  // Model details view state
  const [showModelDetails, setShowModelDetails] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<TrainingRecord | null>(null);

  // Get available periods based on selected frequency
  const availableRanges = React.useMemo(() => {
    const option = FREQUENCY_OPTIONS.find(opt => opt.value === trainFrequency);
    return option ? option.ranges : [];
  }, [trainFrequency]);
  
  // Formatting helpers
  const formatters = {
    formatDate: (date?: string) => {
      if (!date) return "Unknown";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    getRegionLabel: (region: string) => {
      const regionMap: Record<string, string> = {
        "thessaloniki": "Thessaloniki",
        "kalamaria": "Kalamaria",
        "pavlos-melas": "Pavlos Melas",
        "neapoli-sykies": "Neapoli-Sykies",
        "ampelokipoi-menemeni": "Ampelokipoi-Menemeni",
        "panorama": "Panorama",
        "pylaia-chortiatis": "Pylaia-Chortiatis"
      };
      return regionMap[region] || region;
    },
    getPollutantDisplay: (pollutant: string) => {
      const map: Record<string, string> = {
        "no2_conc": "NO₂",
        "o3_conc": "O₃",
        "so2_conc": "SO₂",
        "pm10_conc": "PM10",
        "pm25_conc": "PM2.5",
        "co_conc": "CO"
      };
      return map[pollutant] || pollutant;
    },
    getFrequencyDisplay: (frequency: string) => {
      const map: Record<string, string> = {
        "daily": "Daily",
        "weekly": "Weekly",
        "monthly": "Monthly"
      };
      return map[frequency] || frequency;
    }
  };

  // Fetch available training metadata filters
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        setFiltersLoading(true);
        const response = await modelApi.getMetadata();
        if (response.success && response.data) {
          setAvailableFilters(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
        toast.error("Failed to load available training options");
      } finally {
        setFiltersLoading(false);
      }
    };
    
    fetchFilters();
  }, []);

  // Fetch recent trainings
  useEffect(() => {
    fetchRecentTrainings();
  }, []);
  
  // Check if model exists when parameters change
  useEffect(() => {
    const checkModelExists = async () => {
      setIsCheckingModel(true);
      try {
        const response = await modelApi.exists({
          region: trainRegion,
          pollutant: trainPollutant,
          frequency: trainFrequency
        });
        
        if (response.success) {
          setModelExists(response.data.exists);
        } else {
          setModelExists(false);
        }
      } catch (error) {
        console.error("Failed to check if model exists:", error);
        setModelExists(false);
      } finally {
        setIsCheckingModel(false);
      }
    };
    
    if (trainRegion && trainPollutant && trainFrequency) {
      checkModelExists();
    }
  }, [trainRegion, trainPollutant, trainFrequency]);

  // Reset selected model when parameters change
  useEffect(() => {
    if (selectedModel && (
      selectedModel.region !== trainRegion ||
      selectedModel.pollutant !== trainPollutant ||
      selectedModel.frequency !== trainFrequency
    )) {
      setSelectedModel(null);
      setSelectedModelId(null);
    }
  }, [trainRegion, trainPollutant, trainFrequency, selectedModel]);

  const fetchRecentTrainings = async () => {
    setTrainingsLoading(true);
    try {
      const response = await modelApi.getTrainings();
      
      if (response.success && response.data) {
        setRecentTrainings(response.data);
      } else {
        toast.error("Failed to load recent trainings");
      }
    } catch (error) {
      console.error("Failed to fetch trainings:", error);
      toast.error("Failed to load recent trainings");
    } finally {
      setTrainingsLoading(false);
    }
  };
  
  const handleTrainModel = async () => {
    setTrainLoading(true);
    setTrainingError(null);
    
    try {
      const response = await modelApi.train({
        region: trainRegion,
        pollutant: trainPollutant,
        frequency: trainFrequency,
        periods: trainPeriods,
        overwrite: overwriteModel
      });
      
      if (response.success) {
        toast.success("Model training started successfully");
        
        // Delay fetch to allow backend to create training record
        setTimeout(() => {
          fetchRecentTrainings();
        }, 1000);
      } else {
        setTrainingError(response.error || "Failed to start model training");
        toast.error(response.error || "Failed to start model training");
      }
    } catch (error) {
      console.error("Training error:", error);
      setTrainingError("An unexpected error occurred");
      toast.error("An unexpected error occurred during training");
    } finally {
      setTrainLoading(false);
    }
  };
  
  const handlePreviewForecast = async () => {
    setForecastLoading(true);
    try {
      const modelId = selectedModel?.id;
      let response;
      
      if (modelId) {
        // Preview for selected model
        response = await modelApi.getForecast(modelId);
      } else {
        // Preview for current parameters
        response = await modelApi.getForecast(null, {
          region: trainRegion,
          pollutant: trainPollutant,
          frequency: trainFrequency
        });
      }
      
      if (response.success && response.data) {
        setForecastData(response.data);
        setShowForecast(true);
      } else {
        toast.error("Failed to load forecast data");
      }
    } catch (error) {
      console.error("Forecast preview error:", error);
      toast.error("Failed to load forecast data");
    } finally {
      setForecastLoading(false);
    }
  };
  
  const handleViewModelDetails = async (modelId: string) => {
    setSelectedModelId(modelId);
    setShowModelDetails(true);
  };
  
  const handleToggleCompareModel = (modelId: string) => {
    setModelsToCompare(prev => {
      if (prev.includes(modelId)) {
        return prev.filter(id => id !== modelId);
      } else {
        if (prev.length >= 3) {
          toast.warning("You can compare up to 3 models at once");
          return prev;
        }
        return [...prev, modelId];
      }
    });
  };
  
  const handleModelSelect = (model: TrainingRecord | null) => {
    setSelectedModel(model);
    if (model) {
      // Auto-populate form fields when a model is selected
      setTrainRegion(model.region);
      setTrainPollutant(model.pollutant);
      setTrainFrequency(model.frequency || "daily");
      if (model.periods) {
        setTrainPeriods(model.periods);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Grid className="grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Training Form Card */}
        <div>
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
            onTrainModel={handleTrainModel}
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
            onPreviewForecast={handlePreviewForecast}
            selectedModel={selectedModel}
          />
        </div>
        
        {/* Recent Trainings Card */}
        <div className="xl:col-span-1">
          <RecentTrainingsCard
            recentTrainings={recentTrainings}
            formatters={formatters}
            isLoading={trainingsLoading}
            onModelDeleted={fetchRecentTrainings}
            onViewDetails={handleViewModelDetails}
            modelsToCompare={modelsToCompare}
            onToggleCompare={handleToggleCompareModel}
            selectedModelId={selectedModelId}
            onModelSelect={handleModelSelect}
          />
        </div>
      </Grid>
      
      {/* Forecast Preview Dialog */}
      {showForecast && (
        <ForecastPreview
          open={showForecast}
          onOpenChange={setShowForecast}
          data={forecastData}
          region={selectedModel?.region || trainRegion}
          pollutant={selectedModel?.pollutant || trainPollutant}
          frequency={selectedModel?.frequency || trainFrequency}
          formatters={formatters}
        />
      )}
      
      {/* Model Comparison Dialog */}
      {showComparison && (
        <ModelComparisonView
          open={showComparison}
          onOpenChange={setShowComparison}
          modelIds={modelsToCompare}
          trainings={recentTrainings}
          formatters={formatters}
        />
      )}
      
      {/* Model Details Dialog */}
      {showModelDetails && selectedModelId && (
        <ModelDetailsView
          open={showModelDetails}
          onOpenChange={setShowModelDetails}
          modelId={selectedModelId}
          formatters={formatters}
        />
      )}
      
      {/* Comparison Button (shown when models selected) */}
      {modelsToCompare.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowComparison(true)}
            className="bg-primary text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-2"
          >
            <span>Compare {modelsToCompare.length} Models</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelTrainingTab;
