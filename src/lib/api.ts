
import { supabase } from "@/integrations/supabase/client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
let authToken: string | null = null;

export const setToken = (token: string) => {
  authToken = token;
};

export const removeToken = () => {
  authToken = null;
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Forecast {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
  category: string;
}

export interface DatasetPreviewResponse {
  data: any[];
  columns: string[];
}

const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`, { headers });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch data' };
      }

      return { success: true, data: data as T };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  post: async <T>(endpoint: string, payload: any): Promise<ApiResponse<T>> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to post data' };
      }

      return { success: true, data: data as T };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  put: async <T>(endpoint: string, payload: any): Promise<ApiResponse<T>> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to update data' };
      }

      return { success: true, data: data as T };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  delete: async (endpoint: string): Promise<ApiResponse<any>> => {
    try {
      const headers: Record<string, string> = {};
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.error || 'Failed to delete data' };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

export const datasetApi = {
  list: async (): Promise<ApiResponse<any>> => {
    return api.get('/datasets');
  },
  get: async (datasetId: string): Promise<ApiResponse<any>> => {
    return api.get(`/datasets/${datasetId}`);
  },
  create: async (datasetData: any): Promise<ApiResponse<any>> => {
    return api.post('/datasets', datasetData);
  },
  update: async (datasetId: string, datasetData: any): Promise<ApiResponse<any>> => {
    return api.put(`/datasets/${datasetId}`, datasetData);
  },
  delete: async (datasetId: string): Promise<ApiResponse<any>> => {
    return api.delete(`/datasets/${datasetId}`);
  },
  upload: async (file: File, datasetId?: string): Promise<ApiResponse<any>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (datasetId) {
        formData.append('dataset_id', datasetId);
      }

      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiBaseUrl}/datasets/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to upload file' };
      }

      return { success: true, data: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  // Add preview function
  preview: async (datasetId: string): Promise<ApiResponse<DatasetPreviewResponse>> => {
    return api.get(`/datasets/${datasetId}/preview`);
  }
};

export const modelApi = {
  train: async (trainData: {
    pollutant: string;
    region: string;
    frequency?: string;
    periods?: number;
    overwrite?: boolean;
  }): Promise<ApiResponse<unknown>> => {
    return api.post('/models/train', trainData);
  },
  list: async (): Promise<ApiResponse<unknown>> => {
    return api.get('/models');
  },
  delete: async (modelId: string): Promise<ApiResponse<any>> => {
    return api.delete(`/models/${modelId}`);
  },
  getModelPreview: async (modelId: string): Promise<ApiResponse<{
    model_id: string;
    region: string;
    pollutant: string;
    frequency: string;
    forecast_periods: number;
    forecast: Forecast[];
  }>> => {
    return api.get(`/models/preview/${modelId}`);
  }
};

// Add missing API modules with empty implementations
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<any>> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      if (data.session?.access_token) {
        setToken(data.session.access_token);
      }
      
      return { 
        success: true, 
        data: { user: data.user, session: data.session } 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  logout: async (): Promise<ApiResponse<any>> => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      removeToken();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};

// Add stubs for the missing API modules
export const alertApi = {
  list: async (): Promise<ApiResponse<any[]>> => {
    return { success: true, data: [] };
  },
};

export const metadataApi = {
  getRegions: async (): Promise<ApiResponse<string[]>> => {
    return { success: true, data: [] };
  },
  getPollutants: async (): Promise<ApiResponse<string[]>> => {
    return { success: true, data: [] };
  },
};

export const predictionApi = {
  getForecast: async (params: any): Promise<ApiResponse<any>> => {
    return { success: true, data: [] };
  },
};

export const insightApi = {
  getDailyInsights: async (): Promise<ApiResponse<any>> => {
    return { success: true, data: [] };
  },
  getWeeklyReport: async (): Promise<ApiResponse<any>> => {
    return { success: true, data: [] };
  },
};

export const healthApi = {
  getUserHealth: async (): Promise<ApiResponse<any>> => {
    return { success: true, data: {} };
  },
};

export const userApi = {
  getProfile: async (): Promise<ApiResponse<any>> => {
    return { success: true, data: {} };
  },
  updateProfile: async (profile: any): Promise<ApiResponse<any>> => {
    return { success: true, data: {} };
  },
};
