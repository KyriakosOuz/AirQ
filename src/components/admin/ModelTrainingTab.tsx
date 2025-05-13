
import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { modelApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import TrainModelCard from "./TrainModelCard";
import RecentTrainingsCard, { TrainingRecord } from "./RecentTrainingsCard";
import ForecastPreview, { ForecastDataPoint } from "./ForecastPreview";

// Interface for model training API response
interface ModelTrainingResponse {
  message?: string;
  trained_at?: string;
  forecast?: ForecastDataPoint[];
}

// Interface for model data from API
interface ModelData {
  id: string;
  region: string;
  pollutant: string;
  model_type?: string;
  frequency?: string;
  forecast_periods?: number;
  created_at: string;
  status?: string;
}

// Frequency options with their display labels and available ranges
const FREQUENCY_OPTIONS = [
  { value: "D", label: "Daily", ranges: [7, 14, 30, 60, 90, 180, 365] },
  { value: "W", label: "Weekly", ranges: [4, 12, 26, 52] },
  { value: "M", label: "Monthly", ranges: [3, 6, 12, 24] },
  { value: "Y", label: "Yearly", ranges: [1, 2, 3, 5] },
];

const ModelTrainingTab: React.FC = () => {
  // State for the training form
  const [trainRegion, setTrainRegion] = useState("thessaloniki");
  const [trainPollutant, setTrainPollutant] = useState<Pollutant>("no2_conc");
  const [trainFrequency, setTrainFrequency] = useState("D"); // Default: Daily
  const [trainPeriods, setTrainPeriods] = useState(365); // Default: 365 periods
  const [trainLoading, setTrainLoading] = useState(false);
  
  // State for forecast data and training records
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [recentTrainings, setRecentTrainings] = useState<TrainingRecord[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  
  // Get available ranges for the selected frequency
  const availableRanges = useMemo(() => {
    const selectedFreq = FREQUENCY_OPTIONS.find(opt => opt.value === trainFrequency);
    return selectedFreq ? selectedFreq.ranges : [365];
  }, [trainFrequency]);
  
  // Update periods when frequency changes to use the first available range
  useEffect(() => {
    if (availableRanges.length > 0) {
      setTrainPeriods(availableRanges[0]);
    }
  }, [trainFrequency, availableRanges]);
  
  // Formatters for display values
  const formatters = useMemo(() => ({
    // Format date helper
    formatDate: (dateString?: string): string => {
      if (!dateString) return 'Unknown';
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    
    // Get region label from value
    getRegionLabel: (regionValue: string): string => {
      const regionMap: Record<string, string> = {
        "thessaloniki": "Thessaloniki Center",
        "kalamaria": "Kalamaria",
        "pavlos-melas": "Pavlos Melas",
        "neapoli-sykies": "Neapoli-Sykies",
        "ampelokipoi-menemeni": "Ampelokipoi-Menemeni",
        "panorama": "Panorama",
        "pylaia-chortiatis": "Pylaia-Chortiatis",
      };
      
      return regionMap[regionValue] || regionValue;
    },
    
    // Get pollutant display name
    getPollutantDisplay: (pollutantCode: string): string => {
      const map: Record<string, string> = {
        "no2_conc": "NO₂",
        "o3_conc": "O₃",
        "so2_conc": "SO₂",
        "pm10_conc": "PM10",
        "pm25_conc": "PM2.5",
        "co_conc": "CO",
        "no_conc": "NO",
      };
      return map[pollutantCode] || pollutantCode;
    },

    // Get frequency display name
    getFrequencyDisplay: (freqCode: string): string => {
      const freq = FREQUENCY_OPTIONS.find(f => f.value === freqCode);
      return freq ? freq.label : freqCode;
    }
  }), []);

  // Fetch trained models from API
  const fetchTrainedModels = async () => {
    setModelsLoading(true);
    try {
      const response = await modelApi.list();
      
      if (response.success && response.data) {
        // Convert API model data to TrainingRecord format
        const trainings: TrainingRecord[] = (response.data as ModelData[]).map(model => ({
          region: model.region,
          pollutant: model.pollutant,
          date: model.created_at,
          status: "complete", // Always set to complete as specified
          frequency: model.frequency,
          periods: model.forecast_periods
        }));
        
        // Sort by date, most recent first
        trainings.sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        setRecentTrainings(trainings);
      } else {
        console.error("Failed to fetch trained models:", response.error);
      }
    } catch (error) {
      console.error("Error fetching trained models:", error);
    } finally {
      setModelsLoading(false);
    }
  };
  
  // Fetch trained models on component mount and after training
  useEffect(() => {
    fetchTrainedModels();
  }, []);

  // Handle model training
  const trainModel = async () => {
    setTrainLoading(true);
    try {
      const response = await modelApi.train({
        pollutant: trainPollutant,
        region: trainRegion,
        frequency: trainFrequency,
        periods: trainPeriods,
      });
      
      if (response.success) {
        toast.success(`Model trained for ${trainRegion} - ${trainPollutant}`);
        
        // Handle the forecast data if available in the response
        const apiResponse = response.data as ModelTrainingResponse;
        
        if (apiResponse && apiResponse.forecast) {
          // Only take the first 6 forecast points for display
          setForecastData(apiResponse.forecast.slice(0, 6));
        }
        
        // Refresh the list of trained models
        fetchTrainedModels();
      } else {
        toast.error(response.error || "Training failed");
      }
    } catch (error) {
      console.error("Training error:", error);
      toast.error("An error occurred during model training");
    } finally {
      setTrainLoading(false);
    }
  };

  // When either frequency or range changes, fetch new forecast range
  const fetchForecastRange = async () => {
    if (!trainRegion || !trainPollutant || !trainFrequency || !trainPeriods) {
      return;
    }

    try {
      // Clear previous forecast data
      setForecastData([]);
      
      // Call the forecast-range endpoint
      const response = await modelApi.getForecastRange({
        region: trainRegion,
        pollutant: trainPollutant,
        frequency: trainFrequency,
        limit: trainPeriods
      });
      
      if (response.success && response.data) {
        setForecastData(response.data.forecast || []);
      } else {
        console.error("Failed to get forecast range:", response.error);
      }
    } catch (error) {
      console.error("Error fetching forecast range:", error);
    }
  };

  // Fetch forecast data when parameters change
  useEffect(() => {
    // Debounce the request to avoid too many calls when changing parameters quickly
    const timer = setTimeout(() => {
      fetchForecastRange();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [trainRegion, trainPollutant, trainFrequency, trainPeriods]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TrainModelCard
        trainRegion={trainRegion}
        setTrainRegion={setTrainRegion}
        trainPollutant={trainPollutant}
        setTrainPollutant={setTrainPollutant}
        trainFrequency={trainFrequency}
        setTrainFrequency={setTrainFrequency}
        trainPeriods={trainPeriods}
        setTrainPeriods={setTrainPeriods}
        trainLoading={trainLoading}
        onTrainModel={trainModel}
        frequencyOptions={FREQUENCY_OPTIONS}
        availableRanges={availableRanges}
      />
      
      <RecentTrainingsCard
        recentTrainings={recentTrainings}
        formatters={formatters}
        isLoading={modelsLoading}
      />
      
      {forecastData && forecastData.length > 0 && (
        <ForecastPreview
          data={forecastData}
          region={trainRegion}
          pollutant={trainPollutant}
          frequency={trainFrequency}
          formatters={formatters}
        />
      )}
    </div>
  );
};

export default ModelTrainingTab;
