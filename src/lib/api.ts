
import { toast } from "sonner";
import { Pollutant, Region, Dataset, HealthTip } from "@/lib/types";

// Define the base URL for API requests - fallback to mock data if API fails
export const API_URL = "http://localhost:8000"; 

// Define types for API responses
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Storage key for the auth token
const TOKEN_KEY = "air_quality_token";

// Default request timeout (in milliseconds)
export const DEFAULT_TIMEOUT = 5000;

// Circuit breaker configuration
const CIRCUIT_BREAKER = {
  maxFailures: 3,
  resetTimeout: 30000, // 30 seconds
  failureCount: 0,
  tripped: false,
  lastFailure: 0
};

// Helper to get the stored token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Helper to set the token
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Helper to remove the token
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Check if circuit breaker is tripped
const isCircuitBreakerTripped = () => {
  // Reset circuit breaker after timeout
  if (CIRCUIT_BREAKER.tripped && 
      Date.now() - CIRCUIT_BREAKER.lastFailure > CIRCUIT_BREAKER.resetTimeout) {
    console.log("Circuit breaker reset after timeout");
    CIRCUIT_BREAKER.tripped = false;
    CIRCUIT_BREAKER.failureCount = 0;
  }
  return CIRCUIT_BREAKER.tripped;
};

// Trip the circuit breaker
const tripCircuitBreaker = () => {
  CIRCUIT_BREAKER.failureCount++;
  CIRCUIT_BREAKER.lastFailure = Date.now();
  
  if (CIRCUIT_BREAKER.failureCount >= CIRCUIT_BREAKER.maxFailures) {
    console.warn("Circuit breaker tripped! Too many API failures");
    CIRCUIT_BREAKER.tripped = true;
    toast.error("API is currently unavailable. Using offline mode.", {
      id: "circuit-breaker",
      duration: 5000,
    });
  }
};

// Function to create a request with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

// Base fetch function with authentication, timeouts, and better error handling
export const fetchWithAuth = async <T>(
  endpoint: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<ApiResponse<T>> => {
  try {
    // Check if circuit breaker is tripped
    if (isCircuitBreakerTripped()) {
      console.log(`Circuit breaker active, skipping API call to: ${API_URL}${endpoint}`);
      return { success: false, error: "API is currently unavailable. Using offline mode." };
    }
    
    console.log(`API Request to: ${API_URL}${endpoint}`);
    const token = getToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Use fetchWithTimeout to prevent hanging requests
    const response = await fetchWithTimeout(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    }, timeout);

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Non-JSON response received:", await response.text());
      tripCircuitBreaker();
      return { 
        success: false, 
        error: "Invalid response format from server" 
      };
    }

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      tripCircuitBreaker();
      return { 
        success: false, 
        error: "Failed to parse server response" 
      };
    }

    if (!response.ok) {
      // Handle error response
      console.error("API Error Response:", data);
      tripCircuitBreaker();
      return { success: false, error: data.detail || "API Error" };
    }

    // Reset failure count on success
    CIRCUIT_BREAKER.failureCount = 0;
    return { success: true, data };
  } catch (error) {
    // Trip circuit breaker on failure
    tripCircuitBreaker();
    
    // Specific error handling for timeout (AbortError)
    if (error instanceof Error && error.name === "AbortError") {
      console.error("API Request timeout:", endpoint);
      return { success: false, error: "Request timed out. Using offline data." };
    }
    
    console.error("API Error:", error);
    return { success: false, error: "Network error. Using offline data." };
  }
};

// Auth endpoints - will use Supabase directly in their respective components
export const authApi = {
  // Placeholder for reference. Actual auth will be handled by Supabase.
  login: async (email: string, password: string) => {
    // This will be replaced with Supabase auth
    const response = await fetchWithAuth<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    
    if (response.success && response.data?.token) {
      setToken(response.data.token);
    }
    
    return response;
  },
  logout: () => {
    removeToken();
  }
};

// User profile endpoints
export const userApi = {
  saveProfile: async (profileData: any) => {
    // Transform frontend camelCase to backend snake_case
    const transformedData = {
      age: profileData.age,
      has_asthma: profileData.hasAsthma,
      has_heart_disease: profileData.hasHeartIssues,
      is_smoker: profileData.isSmoker,
    };
    
    return fetchWithAuth("/users/profile/", {
      method: "POST",
      body: JSON.stringify(transformedData),
    });
  },
  getProfile: async () => {
    return fetchWithAuth("/users/profile/");
  },
  getRiskTimeline: async () => {
    return fetchWithAuth("/users/risk-timeline/");
  }
};

// Dataset endpoints
export const datasetApi = {
  upload: async (formData: FormData) => {
    return fetchWithAuth<{ dataset_id: string, file_url: string }>("/datasets/upload/", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set content-type with boundary for FormData
    });
  },
  list: async () => {
    return fetchWithAuth<Dataset[]>("/datasets/list/");
  },
  preview: async (datasetId: string) => {
    return fetchWithAuth<{
      columns: string[],
      rows: Record<string, any>[]
    }>(`/datasets/preview/${datasetId}`);
  },
  delete: async (datasetId: string) => {
    return fetchWithAuth(`/datasets/${datasetId}`, {
      method: "DELETE",
    });
  }
};

// Model training endpoints with improved error handling
export const modelApi = {
  train: async (trainData: { pollutant: string; region: string }) => {
    return fetchWithAuth("/models/train/", {
      method: "POST",
      body: JSON.stringify(trainData),
    }, 10000); // Longer timeout for training requests
  },
  list: async () => {
    return fetchWithAuth("/models/list/");
  },
  getForecast: async (modelId: string) => {
    return fetchWithAuth(`/models/forecast/${modelId}`);
  }
};

// Prediction endpoints with improved error handling
export const predictionApi = {
  forecast: async (params: { pollutant: string; region: string }) => {
    // Updated to use models/predict instead of prediction/forecast
    const queryParams = new URLSearchParams(params as any).toString();
    return fetchWithAuth<Array<{ ds: string; yhat: number; category: string }>>(`/models/predict/?${queryParams}`, {}, 8000);
  },
  compare: async (compareData: { pollutant: string; regions: string[] }) => {
    return fetchWithAuth("/models/predict/compare/", {
      method: "POST",
      body: JSON.stringify(compareData),
    }, 8000);
  }
};

// Health suggestions endpoints
export const healthApi = {
  getTip: async (params: { pollutant: string; region: string }) => {
    // Add include_profile=true parameter to get personalized health tips
    const queryParams = new URLSearchParams({
      ...params,
      include_profile: 'true'
    } as any).toString();
    
    return fetchWithAuth<HealthTip>(`/health/tip/?${queryParams}`);
  }
};

// Insights endpoints
export const insightApi = {
  getTrend: async (params: { pollutant: string; region: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return fetchWithAuth<Array<{ year: number; value: number }>>(`/insights/trend/?${queryParams}`);
  },
  getTopPolluted: async (params: { pollutant: string; year: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return fetchWithAuth<Array<{ name: string; value: number }>>(`/insights/top-polluted/?${queryParams}`);
  },
  getSeasonality: async (params: { pollutant: string; region: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return fetchWithAuth<Array<{ month: string; value: number }>>(`/insights/seasonality/?${queryParams}`);
  },
  getPersonalized: async (params: { pollutant: string; region: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/insights/personalized/?${queryParams}`);
  },
  getSummary: async (params: { pollutant: string; region: string; year: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/insights/summary/?${queryParams}`);
  },
  getHistorical: async (params: { pollutant: string; region: string; year: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return fetchWithAuth(`/insights/historical/?${queryParams}`);
  }
};

// AQI alerts endpoints
export const alertApi = {
  subscribe: async (alertData: { region: string; pollutant: string; threshold: string }) => {
    // Updated to accept string thresholds instead of numeric ("Good", "Moderate", etc.)
    return fetchWithAuth("/alerts/subscribe/", {
      method: "POST",
      body: JSON.stringify(alertData),
    });
  },
  list: async () => {
    return fetchWithAuth("/alerts/my-subscriptions/");
  },
  delete: async (alertId: string) => {
    return fetchWithAuth(`/alerts/unsubscribe/${alertId}`, {
      method: "DELETE",
    });
  },
  checkAlerts: async (sendEmail: boolean = false) => {
    return fetchWithAuth(`/alerts/check-alerts/?send_email=${sendEmail}`);
  }
};

// Metadata endpoints with caching and fallback to reduce API calls
export const metadataApi = {
  // Cache for pollutants data
  _pollutantsCache: null as Array<{label: string, value: Pollutant}> | null,
  // Cache for regions data
  _regionsCache: null as Array<{label: string, value: string}> | null,
  
  getPollutants: async () => {
    // Return cached data if available
    if (metadataApi._pollutantsCache) {
      return { success: true, data: metadataApi._pollutantsCache };
    }
    
    const response = await fetchWithAuth<Array<{label: string, value: string}>>("/metadata/pollutants");
    
    // If API succeeds, cache the result
    if (response.success && response.data) {
      // Cast the data to ensure it matches the expected Pollutant type
      const typedData = response.data.map(item => ({
        label: item.label,
        value: item.value as Pollutant
      }));
      metadataApi._pollutantsCache = typedData;
    }
    
    // If API fails, return mock data
    if (!response.success) {
      console.log("Using mock pollutant data due to API failure");
      const mockData = [
        { value: "NO2" as Pollutant, label: "Nitrogen Dioxide (NO₂)" },
        { value: "O3" as Pollutant, label: "Ozone (O₃)" },
        { value: "PM10" as Pollutant, label: "Particulate Matter 10 (PM₁₀)" },
        { value: "PM25" as Pollutant, label: "Particulate Matter 2.5 (PM₂.₅)" },
        { value: "SO2" as Pollutant, label: "Sulfur Dioxide (SO₂)" }
      ];
      // Cache mock data too
      metadataApi._pollutantsCache = mockData;
      return { success: true, data: mockData };
    }
    
    return response;
  },
  
  getRegions: async () => {
    // Return cached data if available
    if (metadataApi._regionsCache) {
      return { success: true, data: metadataApi._regionsCache };
    }
    
    const response = await fetchWithAuth<Array<{label: string, value: string}>>("/metadata/regions");
    
    // If API succeeds, cache the result
    if (response.success && response.data) {
      metadataApi._regionsCache = response.data;
    }
    
    // If API fails, return mock data
    if (!response.success) {
      console.log("Using mock region data due to API failure");
      const mockData = [
        { value: "ampelokipoi-menemeni", label: "Ampelokipoi-Menemeni" },
        { value: "kalamaria", label: "Kalamaria" },
        { value: "pavlos-melas", label: "Pavlos Melas" },
        { value: "neapoli-sykies", label: "Neapoli-Sykies" },
        { value: "thessaloniki", label: "Thessaloniki Center" },
        { value: "panorama", label: "Panorama" },
        { value: "pylaia-chortiatis", label: "Pylaia-Chortiatis" },
      ];
      // Cache mock data too
      metadataApi._regionsCache = mockData;
      return { success: true, data: mockData };
    }
    
    return response;
  },
  
  // Method to clear cache if needed
  clearCache: () => {
    metadataApi._pollutantsCache = null;
    metadataApi._regionsCache = null;
  }
};
