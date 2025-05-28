
import React, { useState } from "react";
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
import { ChevronDown, ChevronUp, Info, BarChart3, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { 
  standardizeAqiDataPoint,
  getColorByRiskScore,
  getCategoryByRiskScore,
  getPollutantDisplayName
} from "@/lib/aqi-standardization";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Pollutant } from "@/lib/types";

// Enhanced tooltip for seasonal data
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Transform insights seasonal data to AQI format for standardization
    const aqiData = {
      ds: `2023-${String(data.month === 'Jan' ? 1 : data.month === 'Feb' ? 2 : data.month === 'Mar' ? 3 : data.month === 'Apr' ? 4 : data.month === 'May' ? 5 : data.month === 'Jun' ? 6 : data.month === 'Jul' ? 7 : data.month === 'Aug' ? 8 : data.month === 'Sep' ? 9 : data.month === 'Oct' ? 10 : data.month === 'Nov' ? 11 : 12).padStart(2, '0')}-01T00:00:00Z`,
      yhat: data.value,
      risk_score: Math.min(6, Math.max(1, Math.round(data.value / 10))), // Estimate risk from value
      category: data.value < 20 ? "good" : data.value < 40 ? "moderate" : data.value < 60 ? "unhealthy-sensitive" : "unhealthy",
      pollutant: "seasonal_data"
    };
    
    const standardizedData = standardizeAqiDataPoint(aqiData);
    
    return (
      <div className="bg-background border rounded-md p-3 shadow-md min-w-[200px]">
        <p className="font-medium mb-2">{data.month}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Avg Value:</span>
            <span className="text-sm">{data.value.toFixed(1)} μg/m³</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">🎯 Est. Risk:</span>
            <div className="flex items-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: standardizedData.color }}
              ></div>
              <span className="text-sm font-medium">{standardizedData.riskScore}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">🏷 Category:</span>
            <span className="text-sm font-medium">{standardizedData.category}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface EnhancedSeasonalChartProps {
  region: string;
  pollutant: Pollutant;
  data: any[];
  loading: boolean;
  error?: string;
  dataUnit: string;
}

const EnhancedSeasonalChart: React.FC<EnhancedSeasonalChartProps> = ({
  region,
  pollutant,
  data,
  loading,
  error,
  dataUnit
}) => {
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>
              {getPollutantDisplayName(pollutant)} Seasonality in {getRegionDisplayName(region)}
            </CardTitle>
            <CardDescription>
              Monthly average concentrations showing seasonal patterns
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={chartType === "line" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("line")}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === "bar" ? "default" : "outline"}
              size="sm"
              onClick={() => setChartType("bar")}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">No seasonal data available. Please update your selection and try again.</p>
          </div>
        ) : (
          <>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: dataUnit, angle: -90, position: 'insideLeft' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name={getPollutantDisplayName(pollutant)}>
                      {data.map((entry, index) => {
                        const estimatedRisk = Math.min(6, Math.max(1, Math.round(entry.value / 10)));
                        const color = getColorByRiskScore(estimatedRisk);
                        return (
                          <Cell key={`cell-${index}`} fill={color} />
                        );
                      })}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: dataUnit, angle: -90, position: 'insideLeft' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name={getPollutantDisplayName(pollutant)}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const estimatedRisk = Math.min(6, Math.max(1, Math.round(payload.value / 10)));
                        const color = getColorByRiskScore(estimatedRisk);
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={5} 
                            fill={color} 
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
                      <span className="text-sm font-medium">Understanding Seasonal Patterns</span>
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
                      <span className="text-lg">🗓️</span>
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900">Seasonal Variations</h4>
                        <p className="text-xs text-blue-700">
                          This chart reveals how pollution levels typically vary throughout the year. 
                          Look for patterns like winter peaks (heating) or summer spikes (ozone formation).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900">Planning Your Activities</h4>
                        <p className="text-xs text-blue-700">
                          Use these patterns to plan outdoor activities during months with typically better air quality,
                          and take extra precautions during high-pollution seasons.
                        </p>
                      </div>
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

export default EnhancedSeasonalChart;
