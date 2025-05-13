
import React, { useState, useMemo } from "react";
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

const ModelTrainingTab: React.FC = () => {
  // State for the training form
  const [trainRegion, setTrainRegion] = useState("thessaloniki");
  const [trainPollutant, setTrainPollutant] = useState<Pollutant>("no2_conc");
  const [trainLoading, setTrainLoading] = useState(false);
  
  // State for forecast data and training records
  const [forecastData, setForecastData] = useState<ForecastDataPoint[]>([]);
  const [recentTrainings, setRecentTrainings] = useState<TrainingRecord[]>([]);
  
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
    }
  }), []);

  // Handle model training
  const trainModel = async () => {
    setTrainLoading(true);
    try {
      const response = await modelApi.train({
        pollutant: trainPollutant,
        region: trainRegion,
      });
      
      if (response.success) {
        toast.success(`Model trained for ${trainRegion} - ${trainPollutant}`);
        
        // Handle the forecast data if available in the response
        const apiResponse = response.data as ModelTrainingResponse;
        
        if (apiResponse && apiResponse.forecast) {
          setForecastData(apiResponse.forecast);
          
          // Add training record to the recent trainings list
          const newTraining: TrainingRecord = {
            region: trainRegion,
            pollutant: trainPollutant,
            date: apiResponse.trained_at || new Date().toISOString(),
            status: "complete"
          };
          
          setRecentTrainings(prev => [newTraining, ...prev.slice(0, 4)]);
        }
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TrainModelCard
        trainRegion={trainRegion}
        setTrainRegion={setTrainRegion}
        trainPollutant={trainPollutant}
        setTrainPollutant={setTrainPollutant}
        trainLoading={trainLoading}
        onTrainModel={trainModel}
      />
      
      <RecentTrainingsCard
        recentTrainings={recentTrainings}
        formatters={formatters}
      />
      
      {forecastData && forecastData.length > 0 && (
        <ForecastPreview
          data={forecastData}
          region={trainRegion}
          pollutant={trainPollutant}
          formatters={formatters}
        />
      )}
    </div>
  );
};

export default ModelTrainingTab;
