
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

// Helper function to transform pandas DataFrame-style JSON to array
const transformPandasToArray = (pandasData: any): any[] => {
  try {
    console.log("Transforming pandas-style data:", pandasData);
    
    if (!pandasData || typeof pandasData !== 'object') {
      console.warn("Invalid pandas data structure:", pandasData);
      return [];
    }

    // Get all the column keys
    const columns = Object.keys(pandasData);
    if (columns.length === 0) {
      console.warn("No columns found in pandas data");
      return [];
    }

    // Get the row indices from the first column
    const firstColumn = pandasData[columns[0]];
    if (!firstColumn || typeof firstColumn !== 'object') {
      console.warn("Invalid first column structure:", firstColumn);
      return [];
    }

    const rowIndices = Object.keys(firstColumn);
    console.log("Found row indices:", rowIndices);

    // Transform each row
    const transformedArray = rowIndices.map(rowIndex => {
      const row: any = {};
      
      columns.forEach(column => {
        if (pandasData[column] && pandasData[column][rowIndex] !== undefined) {
          row[column] = pandasData[column][rowIndex];
        }
      });
      
      return row;
    });

    console.log("Transformed array:", transformedArray);
    return transformedArray;
  } catch (error) {
    console.error("Error transforming pandas data:", error);
    return [];
  }
};

// Helper function to detect if data is in pandas DataFrame format
const isPandasFormat = (data: any): boolean => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  // Check if it has column-like structure with row indices
  const keys = Object.keys(data);
  if (keys.length === 0) return false;

  // Check if the first key contains an object with numeric string keys
  const firstValue = data[keys[0]];
  if (!firstValue || typeof firstValue !== 'object') return false;

  const subKeys = Object.keys(firstValue);
  return subKeys.length > 0 && subKeys.every(key => !isNaN(parseInt(key)));
};

// Validation helper to ensure arrays exist and are valid
const validateDashboardData = (data: any): DashboardOverview | null => {
  try {
    console.log("Validating dashboard data:", data);

    if (!data || typeof data !== 'object') {
      console.error("Dashboard data is not a valid object:", data);
      return null;
    }

    // Handle forecast data transformation
    if (data.forecast) {
      if (isPandasFormat(data.forecast)) {
        console.log("Detected pandas format forecast, transforming...");
        data.forecast = transformPandasToArray(data.forecast);
      } else if (!Array.isArray(data.forecast)) {
        console.warn("Forecast is not an array and not pandas format, setting to empty array:", data.forecast);
        data.forecast = [];
      }
    } else {
      console.warn("No forecast data found, setting to empty array");
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
