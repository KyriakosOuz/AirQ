
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ModelComparisonViewProps {
  data: {
    models: {
      id: string;
      region: string;
      pollutant: string;
      frequency: string;
      forecast: Array<{
        ds: string;
        yhat: number;
      }>;
    }[];
  };
  onClose: () => void;
  formatters: {
    getRegionLabel: (region: string) => string;
    getPollutantDisplay: (pollutant: string) => string;
    getFrequencyDisplay: (frequency: string) => string;
  };
}

// Line colors for different models
const LINE_COLORS = [
  "#2563eb", // blue-600
  "#d946ef", // fuchsia-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
  "#14b8a6", // teal-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
];

const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({ data, onClose, formatters }) => {
  // Format data for the chart
  const formatChartData = () => {
    if (!data || !data.models || data.models.length === 0) {
      return [];
    }
    
    // Find the model with the most forecast points
    const modelWithMostPoints = data.models.reduce(
      (max, model) => (model.forecast.length > max.forecast.length ? model : max),
      data.models[0]
    );
    
    // Create a map of all dates from the model with most points
    return modelWithMostPoints.forecast.map((point, index) => {
      const formattedDate = new Date(point.ds).toLocaleDateString();
      
      // Create an object with the date and values from each model
      const result: Record<string, any> = { date: formattedDate };
      
      // Add values from all models for this date
      data.models.forEach((model, modelIndex) => {
        const modelKey = `model${modelIndex}`;
        // If this model has data for this index, use it, otherwise null
        result[modelKey] = model.forecast[index]?.yhat ?? null;
      });
      
      return result;
    });
  };

  // Generate model labels for the legend
  const getModelLabel = (model: any, index: number) => {
    const region = formatters.getRegionLabel(model.region);
    const pollutant = formatters.getPollutantDisplay(model.pollutant);
    const frequency = formatters.getFrequencyDisplay(model.frequency);
    
    return `${region} - ${pollutant} (${frequency})`;
  };

  const chartData = formatChartData();

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Model Comparison</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {data.models.map((model, idx) => (
                    <Line
                      key={model.id}
                      type="monotone"
                      dataKey={`model${idx}`}
                      name={getModelLabel(model, idx)}
                      stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Models being compared:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.models.map((model, idx) => (
                  <div 
                    key={model.id} 
                    className="flex items-center space-x-2 p-2 rounded-md border border-muted"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: LINE_COLORS[idx % LINE_COLORS.length] }}
                    />
                    <span className="text-sm">{getModelLabel(model, idx)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No comparison data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelComparisonView;
