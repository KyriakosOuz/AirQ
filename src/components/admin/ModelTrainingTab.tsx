import React, { useState, useMemo, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { modelApi } from "@/lib/api";
import { Pollutant, ModelDetails, Forecast } from "@/lib/types";
import TrainModelCard from "./TrainModelCard";
import RecentTrainingsCard, { TrainingRecord } from "./RecentTrainingsCard";
import ForecastPreview, { ForecastDataPoint } from "./ForecastPreview";
import ModelDetailsView from "./ModelDetailsView";
import ModelPreviewDialog from "./ModelPreviewDialog";

interface TrainModelResponse {
  success: boolean;
  data?: {
    model_id: string;
  };
  error?: string;
}

interface ModelComparison {
  [pollutant: string]: {
    [region: string]: {
      [frequency: string]: {
        actual: ForecastDataPoint[];
        forecast: ForecastDataPoint[];
      };
    };
  };
}

// Frequency options with their display labels and available ranges
const frequencyOptions = [
  { value: "D", label: "Daily", range: { min: 7, max: 30 } },
  { value: "W", label: "Weekly", range: { min: 4, max: 26 } },
  { value: "M", label: "Monthly", range: { min: 3, max: 12 } },
  { value: "Y", label: "Yearly", range: { min: 1, max: 5 } },
];

const ModelTrainingTab: React.FC = () => {
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [frequency, setFrequency] = useState(frequencyOptions[0].value);
  const [forecastPeriods, setForecastPeriods] = useState(frequencyOptions[0].range.min);
  const [training, setTraining] = useState(false);
  const [recentTrainings, setRecentTrainings] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewModelDetails, setViewModelDetails] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelDetails | null>(null);
  const [modelsToCompare, setModelsToCompare] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  
  // New state variables for forecast preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewModel, setPreviewModel] = useState<ModelDetails | null>(null);
  const [forecastData, setForecastData] = useState<Forecast[] | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  
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
        no2_conc: "NO₂",
        o3_conc: "O₃",
        so2_conc: "SO₂",
        pm10_conc: "PM10",
        pm25_conc: "PM2.5",
        co_conc: "CO",
      };
      return map[pollutantCode] || pollutantCode;
    },
    
    // Get frequency display name
    getFrequencyDisplay: (frequencyCode: string): string => {
      const map: Record<string, string> = {
        D: "Daily",
        W: "Weekly",
        M: "Monthly",
        Y: "Yearly",
      };
      return map[frequencyCode] || frequencyCode;
    }
  }), []);
  
  // New function to handle the preview
  const handlePreviewModel = async (modelId: string) => {
    const model = recentTrainings.find(m => m.id === modelId);
    
    if (!model) {
      toast.error("Model not found");
      return;
    }
    
    // Convert TrainingRecord to ModelDetails
    const modelDetails: ModelDetails = {
      id: model.id,
      region: model.region,
      pollutant: model.pollutant,
      frequency: model.frequency || 'D',
      forecast_periods: model.periods || 7,
      created_at: model.date,
      status: model.status,
      accuracy_mae: model.accuracy_mae,
      accuracy_rmse: model.accuracy_rmse
    };
    
    setPreviewModel(modelDetails);
    setShowPreview(true);
    setForecastData(null);
    setForecastError(null);
    setForecastLoading(true);
    
    try {
      const response = await modelApi.getModelPreview(modelId);
      
      if (response.success && response.data && response.data.forecast) {
        setForecastData(response.data.forecast);
      } else {
        setForecastError(response.error || "Failed to generate forecast preview");
        toast.error("Failed to generate forecast preview");
      }
    } catch (error) {
      console.error("Error fetching model preview:", error);
      setForecastError("An error occurred while generating the forecast preview");
      toast.error("Failed to generate forecast preview");
    } finally {
      setForecastLoading(false);
    }
  };
  
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewModel(null);
    setForecastData(null);
  };
  
  const handleViewModelDetails = async (modelId: string) => {
    setSelectedModelId(modelId);
    setViewModelDetails(true);
    
    try {
      const response = await modelApi.get(modelId);
      
      if (response.success && response.data) {
        setSelectedModel(response.data);
      } else {
        console.error("Failed to fetch model details:", response.error);
        toast.error("Failed to fetch model details");
      }
    } catch (error) {
      console.error("Error fetching model details:", error);
      toast.error("Failed to fetch model details");
    }
  };
  
  const handleToggleCompareModel = (modelId: string) => {
    if (modelsToCompare.includes(modelId)) {
      setModelsToCompare(modelsToCompare.filter(id => id !== modelId));
    } else {
      setModelsToCompare([...modelsToCompare, modelId]);
    }
  };
  
  // Update fetchModels to include models with status="ready" as valid
  const fetchModels = async () => {
    setIsLoading(true);
    try {
      const response = await modelApi.list();
      
      if (response.success && response.data) {
        // Map API response to TrainingRecord format
        const trainings: TrainingRecord[] = response.data.map((model: any) => ({
          id: model.id,
          region: model.region,
          pollutant: model.pollutant,
          date: model.created_at,
          status: model.status,
          frequency: model.frequency,
          periods: model.forecast_periods,
          accuracy_mae: model.accuracy_mae,
          accuracy_rmse: model.accuracy_rmse
        }));
        
        setRecentTrainings(trainings);
      } else {
        console.error("Failed to fetch models:", response.error);
        toast.error("Failed to fetch trained models");
      }
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch trained models");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchModels();
  }, []);
  
  const handleTrainingComplete = (response: TrainModelResponse) => {
    setTraining(false);
    if (response.success && response.data) {
      toast.success("Model training started successfully");
      fetchModels();
    } else {
      toast.error(response.error || "Failed to start model training");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <TrainModelCard onTrainingComplete={fetchModels} />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <RecentTrainingsCard
            recentTrainings={recentTrainings}
            isLoading={isLoading}
            onModelDeleted={fetchModels}
            onViewDetails={handleViewModelDetails}
            formatters={formatters}
            modelsToCompare={modelsToCompare}
            onToggleCompare={handleToggleCompareModel}
            onPreviewModel={handlePreviewModel} // Add the new handler
          />
        </div>
      </div>
      
      {selectedModelId && selectedModel && viewModelDetails && (
        <ModelDetailsView model={selectedModel} formatters={formatters} />
      )}
      
      {/* Add forecast preview dialog */}
      <ModelPreviewDialog
        isOpen={showPreview}
        onClose={handleClosePreview}
        model={previewModel}
        forecast={forecastData}
        isLoading={forecastLoading}
        error={forecastError}
        formatters={formatters}
      />
      
      {modelsToCompare.length === 2 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Model Comparison</h3>
          {/* Implement comparison logic and display here */}
          <p className="text-muted-foreground">
            Comparing models {modelsToCompare[0]} and {modelsToCompare[1]}
          </p>
        </div>
      )}
    </div>
  );
};

export default ModelTrainingTab;
