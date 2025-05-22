
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

// Function to get pollutant display name
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

interface AQISummaryCardProps {
  currentData: any | null;
  loading: boolean;
}

const AQISummaryCard: React.FC<AQISummaryCardProps> = ({ currentData, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-24 w-full mt-2" />
        </CardContent>
      </Card>
    );
  }
  
  if (!currentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Air Quality</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Update the forecast to view current air quality information.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Air Quality</CardTitle>
        <CardDescription>
          Based on the forecast for today ({format(new Date(currentData.ds), "MMMM d, yyyy")})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div 
            className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold",
              "transition-all duration-300 hover:scale-105"
            )}
            style={{ backgroundColor: RISK_COLORS[currentData.risk_score] }}
          >
            {currentData.risk_score}
          </div>
          <div>
            <p className="text-xl font-semibold">{currentData.category}</p>
            <p className="text-lg">{getPollutantDisplay(currentData.pollutant_display || '')}: {currentData.yhat.toFixed(1)} μg/m³</p>
            <p className="text-sm text-muted-foreground">
              Your risk score: <span className="font-semibold">{currentData.risk_score}</span> - {RISK_DESCRIPTIONS[currentData.risk_score]}
            </p>
          </div>
        </div>
        
        <div className="mt-2">
          <h4 className="font-medium mb-1">What this means:</h4>
          <p className={cn(
            "text-sm p-3 rounded-md",
            "animate-fade-in",
            currentData.category === "Good" && "bg-green-50 text-green-800",
            currentData.category === "Moderate" && "bg-yellow-50 text-yellow-800",
            currentData.category === "Unhealthy for Sensitive Groups" && "bg-orange-50 text-orange-800",
            currentData.category === "Unhealthy" && "bg-red-50 text-red-800",
            currentData.category === "Very Unhealthy" && "bg-purple-50 text-purple-800",
            currentData.category === "Hazardous" && "bg-red-100 text-red-900"
          )}>
            {currentData.category === "Good" && "Air quality is considered satisfactory, and air pollution poses little or no risk."}
            {currentData.category === "Moderate" && "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution."}
            {currentData.category === "Unhealthy for Sensitive Groups" && "Members of sensitive groups may experience health effects. The general public is less likely to be affected."}
            {currentData.category === "Unhealthy" && "Some members of the general public may experience health effects; members of sensitive groups may experience more serious effects."}
            {currentData.category === "Very Unhealthy" && "Health alert: The risk of health effects is increased for everyone."}
            {currentData.category === "Hazardous" && "Health warning of emergency conditions: everyone is more likely to be affected."}
          </p>
        </div>
        
        {/* Trend indicator */}
        {currentData.trend && (
          <div className="flex items-center mt-2">
            <Badge variant={currentData.trend === "improving" ? "success" : currentData.trend === "stable" ? "outline" : "destructive"}>
              {currentData.trend === "improving" ? "Improving" : currentData.trend === "stable" ? "Stable" : "Worsening"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AQISummaryCard;
