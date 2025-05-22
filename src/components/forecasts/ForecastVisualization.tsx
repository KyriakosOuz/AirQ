
import React from "react";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Risk Score color mapping
const RISK_COLORS = [
  "#22c55e", // Green (0)
  "#eab308", // Yellow (1)
  "#f97316", // Orange (2)
  "#ef4444", // Red (3)
  "#9333ea"  // Purple (4)
];

// Risk score to description mapping
const RISK_DESCRIPTIONS = [
  "Low risk",
  "Moderate risk",
  "Medium risk",
  "High risk",
  "Very high risk"
];

// Custom tooltip for the forecast chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.ds);
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <p className="font-medium">{format(date, "MMM d, yyyy")}</p>
        <p className="text-sm text-muted-foreground">{data.pollutant_display} Level: {data.yhat.toFixed(1)} μg/m³</p>
        <p className="text-sm" style={{ color: RISK_COLORS[data.risk_score] }}>
          {data.category} ({RISK_DESCRIPTIONS[data.risk_score]})
        </p>
      </div>
    );
  }
  return null;
};

interface ForecastVisualizationProps {
  data: any[];
  loading: boolean;
  chartType: "bar" | "line";
  pollutant: string;
  frequency: string;
  periods: number;
}

const ForecastVisualization: React.FC<ForecastVisualizationProps> = ({
  data,
  loading,
  chartType,
  pollutant,
  frequency,
  periods
}) => {
  // Function to get display name for pollutant
  const getPollutantDisplay = (pollutantCode: string): string => {
    const map: Record<string, string> = {
      "no2_conc": "NO₂",
      "o3_conc": "O₃",
      "so2_conc": "SO₂",
      "co_conc": "CO",
      "no_conc": "NO",
      "pm10_conc": "PM10",
      "pm25_conc": "PM2.5"
    };
    return map[pollutantCode] || pollutantCode;
  };

  // Get frequency display name
  const getFrequencyDisplay = (freq: string): string => {
    switch (freq) {
      case "D": return "Daily";
      case "W": return "Weekly";
      case "M": return "Monthly";
      default: return freq;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[350px] flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-4">
              <Skeleton className="h-4 w-40 mx-auto" />
              <Skeleton className="h-4 w-60 mx-auto" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {getPollutantDisplay(pollutant)} Forecast
        </CardTitle>
        <CardDescription>
          {getFrequencyDisplay(frequency)} forecast for the next {periods} {frequency === "D" ? "days" : frequency === "W" ? "weeks" : "months"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">No forecast data available. Please update your selection and try again.</p>
          </div>
        ) : (
          <>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ds" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return format(date, "MMM d");
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="yhat" name={getPollutantDisplay(pollutant)}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk_score]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ds" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return format(date, "MMM d");
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="yhat" 
                      name={getPollutantDisplay(pollutant)}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={5} 
                            fill={RISK_COLORS[payload.risk_score]} 
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            
            {/* Risk Legend */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {RISK_COLORS.map((color, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs">{RISK_DESCRIPTIONS[index]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastVisualization;
