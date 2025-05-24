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
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Updated risk score color mapping to handle all possible values (0-9)
const RISK_COLORS = [
  "#22c55e", // Green (0) - Good
  "#65a30d", // Light Green (1) - Good
  "#eab308", // Yellow (2) - Moderate
  "#f59e0b", // Amber (3) - Moderate
  "#f97316", // Orange (4) - Unhealthy for Sensitive Groups
  "#ea580c", // Dark Orange (5) - Unhealthy for Sensitive Groups
  "#ef4444", // Red (6) - Unhealthy
  "#dc2626", // Dark Red (7) - Very Unhealthy
  "#9333ea", // Purple (8) - Very Unhealthy
  "#7c2d12"  // Dark Brown (9) - Hazardous
];

// Updated risk score to description mapping to handle all possible values (0-9)
const RISK_DESCRIPTIONS = [
  "Good",                              // 0
  "Good",                              // 1
  "Moderate",                          // 2
  "Moderate",                          // 3
  "Unhealthy for Sensitive Groups",    // 4
  "Unhealthy for Sensitive Groups",    // 5
  "Unhealthy",                         // 6
  "Very Unhealthy",                    // 7
  "Very Unhealthy",                    // 8
  "Hazardous"                          // 9
];

// Function to safely get risk color with fallback
const getRiskColor = (riskScore: number): string => {
  if (riskScore < 0 || riskScore >= RISK_COLORS.length) {
    return "#6b7280"; // Gray fallback for invalid scores
  }
  return RISK_COLORS[riskScore];
};

// Function to safely get risk description with fallback
const getRiskDescription = (riskScore: number): string => {
  if (riskScore < 0 || riskScore >= RISK_DESCRIPTIONS.length) {
    return "Unknown";
  }
  return RISK_DESCRIPTIONS[riskScore];
};

// Custom tooltip for the forecast chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.ds);
    const riskScore = data.risk_score || 0;
    
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <p className="font-medium">{format(date, "MMM d, yyyy")}</p>
        <p className="text-sm text-muted-foreground">{data.pollutant_display} Level: {data.yhat.toFixed(1)} μg/m³</p>
        <p className="text-sm" style={{ color: getRiskColor(riskScore) }}>
          {data.category} ({getRiskDescription(riskScore)})
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
  forecastMode: "periods" | "daterange";
}

const ForecastVisualization: React.FC<ForecastVisualizationProps> = ({
  data,
  loading,
  chartType,
  pollutant,
  frequency,
  periods,
  forecastMode
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
  
  // Get date range for display in the subtitle
  const getDateRangeText = (dataPoints: any[]): string => {
    if (dataPoints.length < 2) return "";
    
    const startDate = new Date(dataPoints[0].ds);
    const endDate = new Date(dataPoints[dataPoints.length - 1].ds);
    
    return `${format(startDate, "MMM d, yyyy")} to ${format(endDate, "MMM d, yyyy")}`;
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {getPollutantDisplay(pollutant)} Forecast
        </CardTitle>
        <CardDescription>
          {forecastMode === "periods" ? (
            `${getFrequencyDisplay(frequency)} forecast for the next ${periods} ${frequency === "D" ? "days" : frequency === "W" ? "weeks" : "months"}`
          ) : (
            `Date range forecast: ${getDateRangeText(data)}`
          )}
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
                        <Cell key={`cell-${index}`} fill={getRiskColor(entry.risk_score || 0)} />
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
                            fill={getRiskColor(payload.risk_score || 0)} 
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            
            {/* Updated Risk Legend to show only unique categories */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {Array.from(new Set(RISK_DESCRIPTIONS)).map((description, index) => {
                // Find the first risk score that matches this description
                const riskScore = RISK_DESCRIPTIONS.indexOf(description);
                return (
                  <div key={description} className="flex items-center space-x-1">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: getRiskColor(riskScore) }}
                    ></div>
                    <span className="text-xs">{description}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastVisualization;
