
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Download, Info, MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ForecastDataPoint } from "@/lib/model-utils";
import { Pollutant } from "@/lib/types";

interface ForecastPreviewProps {
  data: ForecastDataPoint[];
  region: string;
  pollutant: Pollutant;
  frequency: string;
  formatters: {
    getRegionLabel: (region: string) => string;
    getPollutantDisplay: (pollutant: string) => string;
    getFrequencyDisplay: (frequency: string) => string;
  };
}

const ForecastPreview: React.FC<ForecastPreviewProps> = ({
  data,
  region,
  pollutant,
  frequency,
  formatters
}) => {
  // Get AQI thresholds for the pollutant
  const getAQIThresholds = (pollutantCode: string) => {
    const thresholds: Record<string, Array<{value: number, label: string, color: string}>> = {
      no2_conc: [
        { value: 20, label: "Good", color: "#22c55e" },
        { value: 40, label: "Moderate", color: "#eab308" },
        { value: 80, label: "Unhealthy for Sensitive Groups", color: "#f97316" },
        { value: 120, label: "Unhealthy", color: "#ef4444" },
        { value: 200, label: "Very Unhealthy", color: "#8b5cf6" }
      ],
      o3_conc: [
        { value: 60, label: "Good", color: "#22c55e" },
        { value: 100, label: "Moderate", color: "#eab308" },
        { value: 160, label: "Unhealthy for Sensitive Groups", color: "#f97316" },
        { value: 200, label: "Unhealthy", color: "#ef4444" },
        { value: 300, label: "Very Unhealthy", color: "#8b5cf6" }
      ],
      so2_conc: [
        { value: 20, label: "Good", color: "#22c55e" },
        { value: 50, label: "Moderate", color: "#eab308" },
        { value: 100, label: "Unhealthy for Sensitive Groups", color: "#f97316" },
        { value: 150, label: "Unhealthy", color: "#ef4444" },
        { value: 250, label: "Very Unhealthy", color: "#8b5cf6" }
      ],
      pollution: [
        { value: 20, label: "Good", color: "#22c55e" },
        { value: 40, label: "Moderate", color: "#eab308" },
        { value: 70, label: "Unhealthy for Sensitive Groups", color: "#f97316" },
        { value: 100, label: "Unhealthy", color: "#ef4444" },
        { value: 150, label: "Very Unhealthy", color: "#8b5cf6" }
      ]
    };
    
    return thresholds[pollutantCode] || thresholds.pollution;
  };

  const thresholds = getAQIThresholds(pollutant);

  // Download CSV function
  const downloadCSV = () => {
    const headers = ['Date', 'Forecast', 'Lower Bound', 'Upper Bound'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.ds,
        row.yhat?.toFixed(2) || '',
        row.yhat_lower?.toFixed(2) || '',
        row.yhat_upper?.toFixed(2) || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast_${region}_${pollutant}_${frequency}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">Forecast Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.length}-period forecast for {formatters.getPollutantDisplay(pollutant)} in {formatters.getRegionLabel(region)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="max-w-xs text-xs">
                  AQI Guide: Members of sensitive groups may experience health effects. The general public is not likely to be affected.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Options <MoreHorizontal className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border shadow-md">
              <DropdownMenuItem onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="ds" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: `${formatters.getPollutantDisplay(pollutant)} (μg/m³)`, angle: -90, position: 'insideLeft' }}
              />
              
              {/* AQI Reference Lines */}
              {thresholds.map((threshold, index) => (
                <ReferenceLine 
                  key={index}
                  y={threshold.value} 
                  stroke={threshold.color} 
                  strokeDasharray="5 5" 
                  strokeWidth={1}
                  opacity={0.6}
                />
              ))}
              
              {/* Forecast bounds */}
              <Line 
                type="monotone" 
                dataKey="yhat_upper" 
                stroke="#8b5cf6" 
                strokeWidth={1}
                dot={false}
                strokeDasharray="3 3"
                name="Upper Bound"
              />
              <Line 
                type="monotone" 
                dataKey="yhat_lower" 
                stroke="#8b5cf6" 
                strokeWidth={1}
                dot={false}
                strokeDasharray="3 3"
                name="Lower Bound"
              />
              
              {/* Main forecast line */}
              <Line 
                type="monotone" 
                dataKey="yhat" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 0, r: 3 }}
                name="Forecast"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-xs">Forecast</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-purple-500" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 10% 100%)' }}></div>
            <span className="text-xs">Upper Bound</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-1 bg-purple-500" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 10% 100%)' }}></div>
            <span className="text-xs">Lower Bound</span>
          </div>
          
          {thresholds.map((threshold, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div className="w-3 h-1" style={{ backgroundColor: threshold.color }}></div>
              <span className="text-xs">{threshold.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastPreview;
