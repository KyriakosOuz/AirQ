
import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  standardizeAqiDataPoint,
  getColorByRiskScore,
  getCategoryByRiskScore,
  AQI_CATEGORIES,
  getColorByCategory,
  getPollutantDisplayName
} from "@/lib/aqi-standardization";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Enhanced tooltip showing both risk score and AQI category
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const standardizedData = standardizeAqiDataPoint(data);
    const date = new Date(standardizedData.date);
    
    return (
      <div className="bg-background border rounded-md p-3 shadow-md min-w-[200px]">
        <p className="font-medium mb-2">{format(date, "MMM d, yyyy")}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pollutant:</span>
            <span className="text-sm font-medium">{standardizedData.pollutantDisplay}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Level:</span>
            <span className="text-sm">{standardizedData.value.toFixed(1)} μg/m³</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">🎯 Risk Score:</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: standardizedData.color }}
              ></div>
              <span className="text-sm font-medium">{standardizedData.riskScore}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">🏷 AQI Category:</span>
            <span className="text-sm font-medium">{standardizedData.category}</span>
          </div>
        </div>
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
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

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

  // Standardize all data points
  const standardizedData = data.map(item => standardizeAqiDataPoint(item));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {getPollutantDisplayName(pollutant)} Forecast
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
                    <Bar dataKey="yhat" name={getPollutantDisplayName(pollutant)}>
                      {data.map((entry, index) => {
                        const standardized = standardizeAqiDataPoint(entry);
                        return (
                          <Cell key={`cell-${index}`} fill={standardized.color} />
                        );
                      })}
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
                      name={getPollutantDisplayName(pollutant)}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const standardized = standardizeAqiDataPoint(payload);
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={5} 
                            fill={standardized.color} 
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            
            {/* Risk Score Legend */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[1, 2, 3, 4, 5, 6].map((score) => (
                <div key={score} className="flex items-center space-x-1">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: getColorByRiskScore(score) }}
                  ></div>
                  <span className="text-xs">{getCategoryByRiskScore(score)}</span>
                </div>
              ))}
            </div>

            {/* Collapsible Explanation Section */}
            <div className="mt-4">
              <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between p-2 h-auto text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">What do these mean?</span>
                    </div>
                    {isExplanationOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2 px-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900">Risk Score (1-6)</h4>
                        <p className="text-xs text-blue-700">
                          Your personal health risk from air pollution based on your profile (age, asthma, heart conditions, etc.). 
                          Higher scores mean greater risk for you specifically.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🏷</span>
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900">AQI Category</h4>
                        <p className="text-xs text-blue-700">
                          The standard pollution level for everyone in the area, based on pollutant concentration thresholds 
                          (Good, Moderate, Unhealthy, etc.).
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Score Scale */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2">Risk Score Scale:</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        { score: 1, label: "Good", desc: "Minimal risk" },
                        { score: 2, label: "Moderate", desc: "Low risk" },
                        { score: 3, label: "Unhealthy for Sensitive", desc: "Moderate risk" },
                        { score: 4, label: "Unhealthy", desc: "High risk" },
                        { score: 5, label: "Very Unhealthy", desc: "Very high risk" },
                        { score: 6, label: "Hazardous", desc: "Extremely high risk" }
                      ].map(({ score, label, desc }) => (
                        <div key={score} className="flex items-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getColorByRiskScore(score) }}
                          ></div>
                          <span className="text-xs">
                            <strong>{score}:</strong> {desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ForecastVisualization;
