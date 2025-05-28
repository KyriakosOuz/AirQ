
import React, { useState } from "react";
import {
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
import { ChevronDown, ChevronUp, Info, Trophy } from "lucide-react";
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

// Enhanced tooltip for top polluted data
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Transform insights top polluted data to AQI format for standardization
    const aqiData = {
      ds: `2023-01-01T00:00:00Z`,
      yhat: data.value,
      risk_score: Math.min(6, Math.max(1, Math.round(data.value / 10))), // Estimate risk from value
      category: data.value < 20 ? "good" : data.value < 40 ? "moderate" : data.value < 60 ? "unhealthy-sensitive" : "unhealthy",
      pollutant: "regional_data"
    };
    
    const standardizedData = standardizeAqiDataPoint(aqiData);
    
    return (
      <div className="bg-background border rounded-md p-3 shadow-md min-w-[200px]">
        <p className="font-medium mb-2">{data.name}</p>
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

interface EnhancedTopPollutedChartProps {
  pollutant: Pollutant;
  year: number;
  data: any[];
  loading: boolean;
  error?: string;
  dataUnit: string;
}

const EnhancedTopPollutedChart: React.FC<EnhancedTopPollutedChartProps> = ({
  pollutant,
  year,
  data,
  loading,
  error,
  dataUnit
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

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

  // Sort data by value in descending order for better visualization
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Most Polluted Regions for {getPollutantDisplayName(pollutant)} ({year})
            </CardTitle>
            <CardDescription>
              Regions with highest average concentrations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : sortedData.length === 0 ? (
          <div className="h-[350px] flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">No regional data available. Please update your selection and try again.</p>
          </div>
        ) : (
          <>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={sortedData} 
                  margin={{ top: 10, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    label={{ value: dataUnit, position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={120}
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name={getPollutantDisplayName(pollutant)}>
                    {sortedData.map((entry, index) => {
                      const estimatedRisk = Math.min(6, Math.max(1, Math.round(entry.value / 10)));
                      const color = getColorByRiskScore(estimatedRisk);
                      return (
                        <Cell key={`cell-${index}`} fill={color} />
                      );
                    })}
                  </Bar>
                </BarChart>
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

            {/* Top 3 Regions Summary */}
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h4 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Top 3 Most Polluted Regions
              </h4>
              <div className="space-y-1">
                {sortedData.slice(0, 3).map((region, index) => (
                  <div key={region.name} className="flex justify-between items-center text-xs">
                    <span className="flex items-center gap-1">
                      <span className="font-medium text-amber-700">#{index + 1}</span>
                      <span>{region.name}</span>
                    </span>
                    <span className="font-medium">{region.value.toFixed(1)} {dataUnit}</span>
                  </div>
                ))}
              </div>
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
                      <span className="text-sm font-medium">Understanding Regional Comparisons</span>
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
                      <span className="text-lg">🏆</span>
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900">Regional Rankings</h4>
                        <p className="text-xs text-blue-700">
                          This chart ranks regions by their average pollution levels, helping you identify 
                          the most affected areas that may need increased attention or intervention.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <h4 className="font-semibold text-sm text-blue-900">Making Informed Decisions</h4>
                        <p className="text-xs text-blue-700">
                          Use this information when planning visits, relocations, or policy decisions. 
                          Higher-ranked regions may require more air quality monitoring or health precautions.
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

export default EnhancedTopPollutedChart;
