
import { useState, useEffect } from 'react';
import { dashboardApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export interface DashboardOverview {
  region: string;
  current: {
    pollutants: {
      [key: string]: number;
    };
    aqi_category: string;
  };
  forecast: Array<{
    ds: string;
    yhat: number;
    category: string;
  }>;
  personalized: {
    labels: string[];
    values: number[];
    deltas: (number | null)[];
    unit: string;
    meta: {
      type: string;
      user_id: string;
      region: string;
    };
  };
  ai_tip: {
    tip: string;
    riskLevel: string;
    personalized: boolean;
  };
}

// Validation helper to ensure arrays exist and are valid
const validateDashboardData = (data: any): DashboardOverview | null => {
  try {
    console.log("Validating dashboard data:", data);

    if (!data || typeof data !== 'object') {
      console.error("Dashboard data is not a valid object:", data);
      return null;
    }

    // Ensure forecast is an array
    if (!Array.isArray(data.forecast)) {
      console.warn("Forecast is not an array, setting to empty array:", data.forecast);
      data.forecast = [];
    }

    // Ensure personalized data has valid arrays
    if (!data.personalized || typeof data.personalized !== 'object') {
      console.warn("Personalized data is missing, setting defaults");
      data.personalized = {
        labels: [],
        values: [],
        deltas: [],
        unit: 'μg/m³',
        meta: {
          type: 'trend',
          user_id: '',
          region: data.region || 'unknown'
        }
      };
    } else {
      // Validate personalized arrays
      if (!Array.isArray(data.personalized.labels)) {
        console.warn("Personalized labels is not an array, setting to empty array:", data.personalized.labels);
        data.personalized.labels = [];
      }
      if (!Array.isArray(data.personalized.values)) {
        console.warn("Personalized values is not an array, setting to empty array:", data.personalized.values);
        data.personalized.values = [];
      }
      if (!Array.isArray(data.personalized.deltas)) {
        console.warn("Personalized deltas is not an array, setting to empty array:", data.personalized.deltas);
        data.personalized.deltas = [];
      }
    }

    // Ensure other required fields exist
    if (!data.current || typeof data.current !== 'object') {
      data.current = {
        pollutants: {},
        aqi_category: 'unknown'
      };
    }

    if (!data.ai_tip || typeof data.ai_tip !== 'object') {
      data.ai_tip = {
        tip: 'No tips available at the moment.',
        riskLevel: 'unknown',
        personalized: false
      };
    }

    console.log("Validated dashboard data:", data);
    return data as DashboardOverview;
  } catch (error) {
    console.error("Error validating dashboard data:", error);
    return null;
  }
};

export const useDashboardOverview = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching dashboard overview from API...");
      
      // Call the real API endpoint
      const response = await dashboardApi.getOverview();
      
      if (response.success && response.data) {
        console.log("Dashboard data received:", response.data);
        
        // Validate and sanitize the data before setting state
        const validatedData = validateDashboardData(response.data);
        
        if (validatedData) {
          setData(validatedData);
        } else {
          console.error("Failed to validate dashboard data");
          setError("Invalid data format received from server");
        }
      } else {
        console.error("Failed to fetch dashboard data:", response.error);
        setError(response.error || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refetch = async () => {
    console.log("Refetching dashboard data...");
    await fetchDashboardData();
  };

  return { data, loading, error, refetch };
};
