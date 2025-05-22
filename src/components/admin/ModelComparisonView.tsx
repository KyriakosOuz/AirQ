
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart
} from 'recharts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

interface Forecast {
  ds: string;
  yhat: number;
  yhat_lower?: number;
  yhat_upper?: number;
  category?: string;
}

interface ComparisonModel {
  id: string;
  region: string;
  pollutant: string;
  frequency: string;
  forecast: Forecast[];
}

interface ModelComparisonViewProps {
  data: {
    models: ComparisonModel[];
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
  const [showConfidenceIntervals, setShowConfidenceIntervals] = useState<boolean>(false);
  
  // Format data for the chart
  const formatChartData = () => {
    // Ensure data and models exist and is an array
    if (!data || !data.models || !Array.isArray(data.models) || data.models.length === 0) {
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
        
        // Add confidence intervals if available
        if (showConfidenceIntervals) {
          result[`${modelKey}Lower`] = model.forecast[index]?.yhat_lower ?? null;
          result[`${modelKey}Upper`] = model.forecast[index]?.yhat_upper ?? null;
        }
      });
      
      return result;
    });
  };

  // Generate model labels for the legend
  const getModelLabel = (model: ComparisonModel) => {
    const region = formatters.getRegionLabel(model.region);
    const pollutant = formatters.getPollutantDisplay(model.pollutant);
    const frequency = formatters.getFrequencyDisplay(model.frequency);
    
    return `${region} - ${pollutant} (${frequency})`;
  };

  const chartData = formatChartData();

  // Export data to CSV
  const exportToCSV = () => {
    if (!data || !data.models || data.models.length === 0) {
      return;
    }
    
    // Create CSV header
    const headers = ['Date'];
    data.models.forEach(model => {
      const modelLabel = getModelLabel(model);
      headers.push(`${modelLabel} (µg/m³)`);
      
      if (showConfidenceIntervals) {
        headers.push(`${modelLabel} Lower (µg/m³)`);
        headers.push(`${modelLabel} Upper (µg/m³)`);
      }
    });
    
    // Create CSV rows
    const csvRows = [headers.join(',')];
    chartData.forEach(dataPoint => {
      const row = [dataPoint.date];
      
      data.models.forEach((_, modelIndex) => {
        const modelKey = `model${modelIndex}`;
        row.push(dataPoint[modelKey] !== null ? dataPoint[modelKey].toFixed(2) : '');
        
        if (showConfidenceIntervals) {
          const lowerKey = `${modelKey}Lower`;
          const upperKey = `${modelKey}Upper`;
          row.push(dataPoint[lowerKey] !== null ? dataPoint[lowerKey].toFixed(2) : '');
          row.push(dataPoint[upperKey] !== null ? dataPoint[upperKey].toFixed(2) : '');
        }
      });
      
      csvRows.push(row.join(','));
    });
    
    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast_comparison_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Model Comparison</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {(chartData.length > 0 && data && data.models && Array.isArray(data.models) && data.models.length > 0) ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="confidence-intervals" 
                  checked={showConfidenceIntervals}
                  onCheckedChange={setShowConfidenceIntervals}
                />
                <label htmlFor="confidence-intervals" className="text-sm">
                  Show confidence intervals
                </label>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV}>
                    Download as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {showConfidenceIntervals ? (
                  <ComposedChart
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
                    <YAxis label={{ value: "µg/m³", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(value) => [`${value} µg/m³`, ""]} />
                    <Legend />
                    {data.models.map((model, idx) => (
                      <React.Fragment key={model.id}>
                        <Area 
                          type="monotone" 
                          dataKey={`model${idx}Upper`} 
                          stackId={`stack${idx}`}
                          stroke="none"
                          fill={LINE_COLORS[idx % LINE_COLORS.length]}
                          fillOpacity={0.1}
                          name={`${getModelLabel(model)} (Upper)`}
                          legendType="none"
                        />
                        <Area 
                          type="monotone" 
                          dataKey={`model${idx}Lower`} 
                          stackId={`stack${idx}`}
                          stroke="none"
                          fill={LINE_COLORS[idx % LINE_COLORS.length]}
                          fillOpacity={0.1}
                          name={`${getModelLabel(model)} (Lower)`}
                          legendType="none"
                        />
                        <Line
                          type="monotone"
                          dataKey={`model${idx}`}
                          name={getModelLabel(model)}
                          stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                          activeDot={{ r: 8 }}
                          strokeWidth={2}
                        />
                      </React.Fragment>
                    ))}
                  </ComposedChart>
                ) : (
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
                    <YAxis label={{ value: "µg/m³", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(value) => [`${value} µg/m³`, ""]} />
                    <Legend />
                    {data.models.map((model, idx) => (
                      <Line
                        key={model.id}
                        type="monotone"
                        dataKey={`model${idx}`}
                        name={getModelLabel(model)}
                        stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                )}
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
                    <span className="text-sm">{getModelLabel(model)}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No models selected or forecast data unavailable</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelComparisonView;
