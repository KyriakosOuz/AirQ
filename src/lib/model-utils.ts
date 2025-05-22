
import { Pollutant } from "@/lib/types";

// Define standard model status types
export type ModelStatus = "ready" | "in-progress" | "failed";

// Model status display mapping
export const modelStatusLabels: Record<ModelStatus, string> = {
  "ready": "Complete",
  "in-progress": "Training",
  "failed": "Failed"
};

// Model status color mapping for UI elements
export const modelStatusColors: Record<ModelStatus, string> = {
  "ready": "success",
  "in-progress": "warning",
  "failed": "destructive"
};

// Convert string to ModelStatus with type safety
export const stringToModelStatus = (status: string): ModelStatus => {
  if (status === "ready" || status === "in-progress" || status === "failed") {
    return status;
  }
  return "failed"; // Default fallback
};

// Define consistent interfaces for model data
export interface ModelTrainRequest {
  pollutant: Pollutant;
  region: string;
  frequency: string;
  periods: number;
  overwrite: boolean;
}

export interface ModelTrainingResponse {
  message?: string;
  trained_at?: string;
  forecast?: ForecastDataPoint[];
  accuracy_mae?: number;
  accuracy_rmse?: number;
  test_samples?: number;
}

export interface ModelMetadataFilters {
  available: Array<{
    region: string;
    pollutant: string;
    frequency: string;
  }>;
}

export interface ForecastDataPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
  category?: string;
}

export interface ModelData {
  id: string;
  region: string;
  pollutant: string;
  model_type?: string;
  frequency?: string;
  forecast_periods?: number;
  created_at: string;
  status: ModelStatus;
  accuracy_mae?: number;
  accuracy_rmse?: number;
}

export interface ModelDetails {
  id: string;
  region: string;
  pollutant: string;
  frequency: string;
  forecast_periods: number;
  created_at: string;
  trained_by?: string;
  status: ModelStatus;
  accuracy_mae?: number;
  accuracy_rmse?: number;
  model_type?: string;
}

// Add the ModelComparisonResponse interface
export interface ModelComparisonResponse {
  models: Array<{
    id: string;
    region: string;
    pollutant: string;
    frequency?: string;
    accuracy_mae?: number;
    accuracy_rmse?: number;
    created_at?: string;
    [key: string]: any; // Allow for additional properties
  }>;
}

// Function to check if models can be compared (same pollutant and frequency)
export const canCompareModels = (models: ModelData[]): boolean => {
  if (models.length < 2) return false;
  
  const firstModel = models[0];
  return models.every(model => 
    model.pollutant === firstModel.pollutant && 
    model.frequency === firstModel.frequency
  );
};

// Frequency options with their display labels and available ranges
export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily", ranges: [7, 14, 30, 60, 90, 180, 365] },
  { value: "weekly", label: "Weekly", ranges: [4, 12, 26, 52] },
  { value: "monthly", label: "Monthly", ranges: [3, 6, 12, 24] },
  { value: "yearly", label: "Yearly", ranges: [1, 2, 3, 5] },
];
