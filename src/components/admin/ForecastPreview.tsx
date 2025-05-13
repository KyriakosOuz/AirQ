
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { Pollutant } from "@/lib/types";

// Interface for forecast data point
export interface ForecastDataPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

interface ForecastPreviewProps {
  data: ForecastDataPoint[];
  region: string;
  pollutant: Pollutant;
  formatters: {
    getRegionLabel: (regionValue: string) => string;
    getPollutantDisplay: (pollutantCode: string) => string;
  };
}

const ForecastPreview: React.FC<ForecastPreviewProps> = ({
  data,
  region,
  pollutant,
  formatters,
}) => {
  // Format data for chart
  const chartData = data.map(point => ({
    ...point,
    date: format(parseISO(point.ds), 'MMM dd'),
    value: Number(point.yhat.toFixed(2)),
    lower: Number(point.yhat_lower.toFixed(2)),
    upper: Number(point.yhat_upper.toFixed(2))
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Forecast Preview</CardTitle>
        <CardDescription>
          6-day forecast for {formatters.getPollutantDisplay(pollutant)} in {formatters.getRegionLabel(region)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value}`, 'Value']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <defs>
                <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="upper" 
                stroke="#82ca9d" 
                fillOpacity={1}
                fill="url(#colorUpper)" 
                strokeWidth={1}
              />
              <Area 
                type="monotone" 
                dataKey="lower" 
                stroke="#8884d8" 
                fillOpacity={1}
                fill="url(#colorLower)" 
                strokeWidth={1}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                fillOpacity={1}
                fill="url(#colorValue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-2">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-[#2563eb] rounded-full mr-1"></div>
            <span className="text-xs">Forecast</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-[#82ca9d] rounded-full mr-1"></div>
            <span className="text-xs">Upper Bound</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-[#8884d8] rounded-full mr-1"></div>
            <span className="text-xs">Lower Bound</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastPreview;
