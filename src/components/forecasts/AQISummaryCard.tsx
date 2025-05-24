
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Updated risk Score color mapping to match backend (0-4)
const RISK_COLORS = [
  "#22c55e", // Green (0) - Low Risk
  "#eab308", // Yellow (1) - Moderate Risk
  "#f97316", // Orange (2) - Medium Risk
  "#ef4444", // Red (3) - High Risk
  "#9333ea"  // Purple (4) - Very High Risk
];

// Updated risk score to personalized risk descriptions (0-4)
const PERSONALIZED_RISK_DESCRIPTIONS = [
  "Low Risk",          // 0
  "Moderate Risk",     // 1
  "Medium Risk",       // 2
  "High Risk",         // 3
  "Very High Risk"     // 4
];

// Function to safely get risk color with fallback
const getRiskColor = (riskScore: number): string => {
  if (riskScore < 0 || riskScore >= RISK_COLORS.length) {
    return "#6b7280"; // Gray fallback for invalid scores
  }
  return RISK_COLORS[riskScore];
};

// Function to safely get personalized risk description with fallback
const getPersonalizedRiskDescription = (riskScore: number): string => {
  if (riskScore < 0 || riskScore >= PERSONALIZED_RISK_DESCRIPTIONS.length) {
    return "Unknown Risk";
  }
  return PERSONALIZED_RISK_DESCRIPTIONS[riskScore];
};

// Function to get lighter background and darker text colors based on risk score
const getRiskSectionColors = (riskScore: number): { backgroundColor: string; color: string } => {
  const baseColor = getRiskColor(riskScore);
  
  // Convert hex to RGB for manipulation
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const rgb = hexToRgb(baseColor);
  
  // Create lighter background (add white, reduce opacity effect)
  const backgroundColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`;
  
  // Create darker text color (reduce RGB values for darker shade)
  const darkerR = Math.max(0, Math.floor(rgb.r * 0.6));
  const darkerG = Math.max(0, Math.floor(rgb.g * 0.6));
  const darkerB = Math.max(0, Math.floor(rgb.b * 0.6));
  const textColor = `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
  
  return { backgroundColor, color: textColor };
};

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

// Function to get personalized risk explanation based on user profile and risk score
const getPersonalizedRiskExplanation = (riskScore: number, profile: any): string => {
  const hasHealthConditions = profile?.has_asthma || profile?.has_heart_disease || 
    profile?.has_lung_disease || profile?.has_diabetes || profile?.is_smoker;
  const isElderly = profile?.age && profile.age > 65;
  
  const baseExplanations = [
    "Based on your health profile, air quality poses minimal risk to your health today.",
    "Given your health conditions, you may experience mild symptoms. Consider limiting prolonged outdoor activities.",
    "Your health profile indicates moderate risk. Sensitive individuals should reduce outdoor exertion.",
    "Your personal risk is elevated due to your health conditions. Limit outdoor activities and consider staying indoors.",
    "Your health profile puts you at very high risk. Avoid outdoor activities and stay indoors when possible."
  ];
  
  let explanation = baseExplanations[riskScore] || "Air quality risk assessment unavailable.";
  
  // Add specific health condition context
  if (hasHealthConditions || isElderly) {
    const conditions = [];
    if (profile?.has_asthma) conditions.push("asthma");
    if (profile?.has_heart_disease) conditions.push("heart condition");
    if (profile?.has_lung_disease) conditions.push("lung condition");
    if (profile?.has_diabetes) conditions.push("diabetes");
    if (profile?.is_smoker) conditions.push("smoking history");
    if (isElderly) conditions.push("age over 65");
    
    if (conditions.length > 0) {
      explanation += ` This personalized assessment considers your ${conditions.join(", ")}.`;
    }
  }
  
  return explanation;
};

interface AQISummaryCardProps {
  currentData: any | null;
  loading: boolean;
  profile?: any;
}

const AQISummaryCard: React.FC<AQISummaryCardProps> = ({ currentData, loading, profile }) => {
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
          <CardTitle>Personal Air Quality Risk</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Update the forecast to view your personalized air quality risk assessment.</p>
        </CardContent>
      </Card>
    );
  }

  // Ensure risk_score is within valid range
  const riskScore = Math.max(0, Math.min(4, currentData.risk_score || 0));
  const sectionColors = getRiskSectionColors(riskScore);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Air Quality Risk</CardTitle>
        <CardDescription>
          Personalized assessment for today ({format(new Date(currentData.ds), "MMMM d, yyyy")})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div 
            className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-xl",
              "transition-all duration-300 hover:scale-105"
            )}
            style={{ backgroundColor: getRiskColor(riskScore) }}
          >
            {riskScore}
          </div>
          <div>
            <p className="text-xl font-semibold">{getPersonalizedRiskDescription(riskScore)}</p>
            <p className="text-lg">{getPollutantDisplay(currentData.pollutant_display || '')}: {currentData.yhat.toFixed(1)} μg/m³</p>
            <p className="text-sm text-muted-foreground">
              General AQI: <span className="font-semibold">{currentData.category}</span>
            </p>
          </div>
        </div>
        
        <div className="mt-2">
          <h4 className="font-medium mb-1">What this means for you:</h4>
          <p 
            className="text-sm p-3 rounded-md animate-fade-in"
            style={sectionColors}
          >
            {getPersonalizedRiskExplanation(riskScore, profile)}
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
