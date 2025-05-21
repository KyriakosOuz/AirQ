import { supabase } from "@/integrations/supabase/client";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`);
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
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'DELETE',
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

      const response = await fetch(`${apiBaseUrl}/datasets/upload`, {
        method: 'POST',
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
  getModelPreview: async (modelId: string): Promise<ApiResponse<any>> => {
    return api.get(`/models/preview/${modelId}`);
  }
};
