
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';

interface DatasetAvailability {
  region: string;
  availableYears: number[];
  pollutants: string[];
  totalDatasets: number;
}

interface DatasetAvailabilityMatrix {
  availability: DatasetAvailability[];
  totalRegions: number;
  yearRange: { min: number; max: number };
  lastUpdated: string;
}

export function useDatasetAvailabilityMatrix() {
  const [data, setData] = useState<DatasetAvailabilityMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAvailabilityMatrix() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchWithAuth<DatasetAvailabilityMatrix>('/datasets/availability-matrix');
        
        if (response.success && response.data) {
          setData(response.data);
        } else {
          // Fallback to mock data for development
          const mockData: DatasetAvailabilityMatrix = {
            availability: [
              {
                region: 'thessaloniki',
                availableYears: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
                pollutants: ['no2_conc', 'o3_conc', 'co_conc'],
                totalDatasets: 24
              },
              {
                region: 'ampelokipoi-menemeni',
                availableYears: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
                pollutants: ['no2_conc', 'o3_conc'],
                totalDatasets: 14
              },
              {
                region: 'neapoli-sykies',
                availableYears: [2019, 2020, 2021, 2022, 2023, 2024],
                pollutants: ['no2_conc', 'co_conc'],
                totalDatasets: 12
              },
              {
                region: 'kalamaria',
                availableYears: [2017, 2019, 2020, 2021, 2022, 2023, 2024],
                pollutants: ['no2_conc', 'o3_conc', 'so2_conc'],
                totalDatasets: 21
              },
              {
                region: 'pavlos-melas',
                availableYears: [2020, 2021, 2022, 2023, 2024],
                pollutants: ['no2_conc'],
                totalDatasets: 5
              },
              {
                region: 'pylaia-chortiatis',
                availableYears: [2021, 2022, 2023, 2024],
                pollutants: ['no2_conc', 'o3_conc'],
                totalDatasets: 8
              }
            ],
            totalRegions: 6,
            yearRange: { min: 2017, max: 2024 },
            lastUpdated: new Date().toISOString()
          };
          setData(mockData);
        }
      } catch (err) {
        console.error('Error fetching dataset availability matrix:', err);
        setError('Failed to load dataset availability');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAvailabilityMatrix();
  }, []);

  return { data, isLoading, error };
}
