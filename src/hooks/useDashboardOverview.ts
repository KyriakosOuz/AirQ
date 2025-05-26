
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
        setData(response.data);
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
