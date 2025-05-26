
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Mock data for now - replace with actual API call
        const mockData: DashboardOverview = {
          region: "thessaloniki",
          current: {
            pollutants: {
              no2_conc: 42.1,
              o3_conc: 18.3,
              co_conc: 0.7
            },
            aqi_category: "Moderate"
          },
          forecast: [
            { ds: "2025-05-27", yhat: 43.2, category: "Moderate" },
            { ds: "2025-05-28", yhat: 49.1, category: "Unhealthy" },
            { ds: "2025-05-29", yhat: 38.5, category: "Moderate" },
            { ds: "2025-05-30", yhat: 52.3, category: "Unhealthy" },
            { ds: "2025-05-31", yhat: 35.2, category: "Good" },
            { ds: "2025-06-01", yhat: 41.8, category: "Moderate" },
            { ds: "2025-06-02", yhat: 46.7, category: "Moderate" }
          ],
          personalized: {
            labels: ["2021", "2022", "2023"],
            values: [33.1, 38.4, 45.2],
            deltas: [null, 5.3, 6.8],
            unit: "μg/m³",
            meta: {
              type: "personalized_trend",
              user_id: "user123",
              region: "thessaloniki"
            }
          },
          ai_tip: {
            tip: "1. **Limit outdoor activity** on days with high pollution levels\n2. **Wear a mask** if you're asthmatic or have respiratory conditions\n3. **Keep windows closed** during peak pollution hours (7-9 AM, 6-8 PM)",
            riskLevel: "Moderate",
            personalized: true
          }
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(mockData);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const refetch = async () => {
    // Implement refetch logic here
    console.log("Refetching dashboard data...");
  };

  return { data, loading, error, refetch };
};
