
import { Dataset, HealthTip, Pollutant, TrendChart, SeasonalityChart, UserProfile, Alert } from "./types";
import { authHeader, setToken, removeToken, fetchWithAuth } from "./auth-header";
import { ModelTrainRequest, ModelTrainingResponse, ModelMetadataFilters, ModelComparisonResponse, ModelInfo } from "./model-utils";

// Re-export the auth-header functions for use in other files
export { setToken, removeToken, fetchWithAuth };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Define response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DatasetPreviewResponse {
  success: boolean;
  data?: {
    columns: string[];
    preview: Record<string, any>[];
  };
  error?: string;
}

export const datasetApi = {
  list: async (): Promise<ApiResponse<Dataset[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch datasets: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching datasets:", error);
      return { success: false, error: error.message || "Failed to fetch datasets" };
    }
  },
  upload: async (formData: FormData): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
        method: "POST",
        headers: {
          ...authHeader(),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Upload failed: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Upload error:", error);
      return { success: false, error: error.message || "Upload failed" };
    }
  },
  preview: async (datasetId: string): Promise<ApiResponse<{ columns: string[]; preview: Record<string, any>[] }>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/${datasetId}/preview`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to preview dataset: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error previewing dataset:", error);
      return { success: false, error: error.message || "Failed to preview dataset" };
    }
  },
  delete: async (datasetId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/${datasetId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to delete dataset: ${errorText}` };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting dataset:", error);
      return { success: false, error: error.message || "Failed to delete dataset" };
    }
  },
};

export const metadataApi = {
  getHealthTips: async (aqiLevel: string, personalized: boolean = false): Promise<ApiResponse<HealthTip[]>> => {
    try {
      let url = `${API_BASE_URL}/metadata/health-tips?aqi_level=${aqiLevel}`;
      if (personalized) {
        url += '&personalized=true';
      }
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch health tips: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching health tips:", error);
      return { success: false, error: error.message || "Failed to fetch health tips" };
    }
  },
};

export const alertApi = {
  list: async (): Promise<ApiResponse<Alert[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch alerts: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching alerts:", error);
      return { success: false, error: error.message || "Failed to fetch alerts" };
    }
  },
  subscribe: async (params: { region: string; pollutant: string; threshold: string }): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to subscribe to alert: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error subscribing to alert:", error);
      return { success: false, error: error.message || "Failed to subscribe to alert" };
    }
  },
  delete: async (alertId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to delete alert: ${errorText}` };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error deleting alert:", error);
      return { success: false, error: error.message || "Failed to delete alert" };
    }
  },
  checkAlerts: async (sendEmail: boolean = false): Promise<ApiResponse> => {
    try {
      const queryParams = sendEmail ? '?send_email=true' : '';
      const response = await fetch(`${API_BASE_URL}/alerts/check${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to check alerts: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error checking alerts:", error);
      return { success: false, error: error.message || "Failed to check alerts" };
    }
  },
};

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Login failed: ${errorText}` };
      }
      const data = await response.json();
      
      // Set auth token
      if (data.token) {
        setToken(data.token);
      }
      
      return { success: true, data };
    } catch (error: any) {
      console.error("Error during login:", error);
      return { success: false, error: error.message || "Login failed" };
    }
  },
  logout: async (): Promise<ApiResponse> => {
    try {
      removeToken();
      return { success: true };
    } catch (error: any) {
      console.error("Error during logout:", error);
      return { success: false, error: error.message || "Logout failed" };
    }
  },
};

export const insightApi = {
  getTrend: async (params: { pollutant?: Pollutant; region?: string }): Promise<ApiResponse<TrendChart>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
      if (params.region) queryParams.append('region', params.region);

      const response = await fetch(`${API_BASE_URL}/insights/trend?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch trend data: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching trend data:", error);
      return { success: false, error: error.message || "Failed to fetch trend data" };
    }
  },
  getSeasonality: async (params: { pollutant?: Pollutant; region?: string }): Promise<ApiResponse<SeasonalityChart>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
      if (params.region) queryParams.append('region', params.region);

      const response = await fetch(`${API_BASE_URL}/insights/seasonality?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch seasonality data: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching seasonality data:", error);
      return { success: false, error: error.message || "Failed to fetch seasonality data" };
    }
  },
  getTopPolluted: async (params: { pollutant?: Pollutant; year?: number; limit?: number }): Promise<ApiResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
      if (params.year) queryParams.append('year', params.year.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await fetch(`${API_BASE_URL}/insights/top-polluted?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch top polluted regions: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching top polluted regions:", error);
      return { success: false, error: error.message || "Failed to fetch top polluted regions" };
    }
  },
};

export const userApi = {
  getProfile: async (): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch profile: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      return { success: false, error: error.message || "Failed to fetch profile" };
    }
  },
  updateProfile: async (profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to update profile: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message || "Failed to update profile" };
    }
  },
  saveProfile: async (profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    return userApi.updateProfile(profileData); // Alias for updateProfile
  }
};

export const healthApi = {
  getPersonalizedTips: async (aqiLevel: string): Promise<ApiResponse<HealthTip[]>> => {
    return metadataApi.getHealthTips(aqiLevel, true);
  }
};

export const predictionApi = {
  getForecast: async (params: { 
    pollutant: string; 
    region: string; 
    frequency: string; 
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
      if (params.region) queryParams.append('region', params.region);
      if (params.frequency) queryParams.append('frequency', params.frequency);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      
      const response = await fetch(`${API_BASE_URL}/predictions/forecast?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch forecast: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching forecast:", error);
      return { success: false, error: error.message || "Failed to fetch forecast" };
    }
  },
  compareRegions: async (params: { 
    regions: string[]; 
    pollutant: string; 
    frequency: string;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
      if (params.frequency) queryParams.append('frequency', params.frequency);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.regions && params.regions.length > 0) {
        queryParams.append('regions', params.regions.join(','));
      }
      
      const response = await fetch(`${API_BASE_URL}/predictions/compare-regions?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to compare regions: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error comparing regions:", error);
      return { success: false, error: error.message || "Failed to compare regions" };
    }
  }
};

export const modelApi = {
  // Method renamed to match usage in ModelTrainingTab
  train: async (request: ModelTrainRequest): Promise<ApiResponse<ModelTrainingResponse>> => {
    return modelApi.trainModel(request);
  },
  trainModel: async (request: ModelTrainRequest): Promise<ApiResponse<ModelTrainingResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to train model: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error training model:", error);
      return { success: false, error: error.message || "Failed to train model" };
    }
  },
  getTrainingProgress: async (trainingId: string): Promise<ApiResponse<ModelTrainingResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/training/${trainingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to get training progress: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error getting training progress:", error);
      return { success: false, error: error.message || "Failed to get training progress" };
    }
  },
  getAvailableFilters: async (): Promise<ApiResponse<ModelMetadataFilters>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/filters`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to get available filters: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error getting available filters:", error);
      return { success: false, error: error.message || "Failed to get available filters" };
    }
  },
  getMetadataFilters: async (): Promise<ApiResponse<ModelMetadataFilters>> => {
    return modelApi.getAvailableFilters();
  },
  compareModels: async (modelIds: string[]): Promise<ApiResponse<ModelComparisonResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/compare?model_ids=${modelIds.join(',')}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to compare models: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error comparing models:", error);
      return { success: false, error: error.message || "Failed to compare models" };
    }
  },
  // Additional model API methods needed
  list: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to list models: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error listing models:", error);
      return { success: false, error: error.message || "Failed to list models" };
    }
  },
  getInfo: async (modelId: string): Promise<ApiResponse<ModelInfo>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${modelId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to get model info: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error getting model info:", error);
      return { success: false, error: error.message || "Failed to get model info" };
    }
  },
  delete: async (modelId: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${modelId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to delete model: ${errorText}` };
      }
      return { success: true };
    } catch (error: any) {
      console.error("Error deleting model:", error);
      return { success: false, error: error.message || "Failed to delete model" };
    }
  },
  getModelPreview: async (modelId: string, periods: number): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/${modelId}/preview?periods=${periods}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to get model preview: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error getting model preview:", error);
      return { success: false, error: error.message || "Failed to get model preview" };
    }
  },
  getForecastRange: async (params: { 
    region: string; 
    pollutant: string;
    frequency: string;
    limit: number;
  }): Promise<ApiResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.region) queryParams.append('region', params.region);
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
      if (params.frequency) queryParams.append('frequency', params.frequency);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const response = await fetch(`${API_BASE_URL}/models/forecast?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to get forecast range: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error getting forecast range:", error);
      return { success: false, error: error.message || "Failed to get forecast range" };
    }
  },
  checkExists: async (params: { 
    region: string;
    pollutant: string;
    frequency: string;
  }): Promise<ApiResponse<{exists: boolean}>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.region) queryParams.append('region', params.region);
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
      if (params.frequency) queryParams.append('frequency', params.frequency);
      
      const response = await fetch(`${API_BASE_URL}/models/exists?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to check if model exists: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error checking if model exists:", error);
      return { success: false, error: error.message || "Failed to check if model exists" };
    }
  }
};
