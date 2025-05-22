
import { Dataset, HealthTip, Pollutant, TrendChart, SeasonalityChart, UserProfile, Alert } from "./types";
import { authHeader, setToken, removeToken, fetchWithAuth } from "./auth-header";
import { ModelTrainRequest, ModelTrainingResponse, ModelMetadataFilters, ModelComparisonResponse } from "./model-utils";

// Re-export the auth-header functions for use in other files
export { setToken, removeToken, fetchWithAuth };

// Define response types
export interface DatasetPreviewResponse {
  success: boolean;
  data?: {
    headers: string[];
    samples: Record<string, any>[];
  };
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  meta?: any;
}

export const datasetApi = {
  list: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/`, {
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
  create: async (dataset: Omit<Dataset, "id">): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(dataset),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to create dataset: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error creating dataset:", error);
      return { success: false, error: error.message || "Failed to create dataset" };
    }
  },
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/${id}`, {
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
  // Add missing functions
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
        return { success: false, error: `Failed to upload dataset: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error uploading dataset:", error);
      return { success: false, error: error.message || "Failed to upload dataset" };
    }
  },
  preview: async (id: string): Promise<DatasetPreviewResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/datasets/${id}/preview`, {
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
};

export const healthApi = {
  getTip: async (params: { pollutant: Pollutant; region: string }): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health/tip?pollutant=${params.pollutant}&region=${params.region}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch health tip: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching health tip:", error);
      return { success: false, error: error.message || "Failed to fetch health tip" };
    }
  },
};

export const insightApi = {
  getTrend: async (params: { pollutant: Pollutant; region: string }): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/insights/trend?pollutant=${params.pollutant}&region=${params.region}`, {
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
  getSeasonality: async (params: { pollutant: Pollutant; region: string }): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/insights/seasonality?pollutant=${params.pollutant}&region=${params.region}`, {
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
  // Add missing function
  getTopPolluted: async (params: { pollutant?: Pollutant; limit?: number }): Promise<ApiResponse> => {
    try {
      const queryParams = new URLSearchParams();
      if (params.pollutant) queryParams.append('pollutant', params.pollutant);
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

export const predictionApi = {
  forecast: async (params: {
    pollutant: string;
    region: string;
    frequency: string;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
      const response = await fetch(`${API_BASE_URL}/models/predict?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch forecast data: ${errorText}` };
      }

      const data = await response.json();
      return { success: true, data, meta: data.meta };
    } catch (error: any) {
      console.error("Error fetching forecast data:", error);
      return { success: false, error: error.message || "Failed to fetch forecast data" };
    }
  },
};

export const userApi = {
  getProfile: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch user profile: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      return { success: false, error: error.message || "Failed to fetch user profile" };
    }
  },
  updateProfile: async (profile: UserProfile): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to update user profile: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      return { success: false, error: error.message || "Failed to update user profile" };
    }
  },
  // Add missing function
  saveProfile: async (profile: Partial<UserProfile>): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to save user profile: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error saving user profile:", error);
      return { success: false, error: error.message || "Failed to save user profile" };
    }
  },
};

export const alertApi = {
  list: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/`, {
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
  create: async (alert: Omit<Alert, "id">): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(alert),
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to create alert: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error creating alert:", error);
      return { success: false, error: error.message || "Failed to create alert" };
    }
  },
  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
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
  // Add missing functions
  subscribe: async (subscription: { region: string; pollutant: string; threshold: string }): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(subscription),
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
  checkAlerts: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/check`, {
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

export const modelApi = {
  train: async (params: ModelTrainRequest): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/train`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to train model: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Error training model:", error);
      return {
        success: false,
        error: error.message || "Failed to train model",
      };
    }
  },
  list: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch models: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching models:", error);
      return { success: false, error: error.message || "Failed to fetch models" };
    }
  },
  getInfo: async (modelId: string): Promise<ApiResponse> => {
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
        return { success: false, error: `Failed to fetch model info: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching model info:", error);
      return { success: false, error: error.message || "Failed to fetch model info" };
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
  compareModels: async (modelIds: string[]): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/compare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({ model_ids: modelIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to compare models: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Error comparing models:", error);
      return {
        success: false,
        error: error.message || "Failed to compare models",
      };
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
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });

      const response = await fetch(`${API_BASE_URL}/models/forecast-range?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to fetch forecast range: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Error fetching forecast range:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch forecast range",
      };
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
        return {
          success: false,
          error: `Failed to fetch model preview: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Error fetching model preview:", error);
      return {
        success: false,
        error: error.message || "Failed to fetch model preview",
      };
    }
  },
  getMetadataFilters: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/metadata-filters`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch filter metadata: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching filter metadata:", error);
      return { success: false, error: error.message || "Failed to fetch filter metadata" };
    }
  },
  compareRegions: async (params: {
    regions: string[];
    pollutant: string;
    frequency?: string;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/models/compare-regions/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to compare regions: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Error comparing regions:", error);
      return {
        success: false,
        error: error.message || "Failed to compare regions",
      };
    }
  },
  // Add missing function
  checkExists: async (params: {
    region: string;
    pollutant: string;
    frequency: string;
  }): Promise<ApiResponse> => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });

      const response = await fetch(`${API_BASE_URL}/models/exists?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Failed to check model existence: ${errorText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error("Error checking model existence:", error);
      return {
        success: false,
        error: error.message || "Failed to check model existence",
      };
    }
  },
};

// Add missing metadata API
export const metadataApi = {
  getRegions: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/regions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch regions: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching regions:", error);
      return { success: false, error: error.message || "Failed to fetch regions" };
    }
  },
  getPollutants: async (): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/metadata/pollutants`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to fetch pollutants: ${errorText}` };
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching pollutants:", error);
      return { success: false, error: error.message || "Failed to fetch pollutants" };
    }
  },
};

// Add missing auth API
export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
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
