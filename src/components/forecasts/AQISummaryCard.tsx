
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  standardizeAqiDataPoint, 
  getColorByRiskScore, 
  getCategoryByRiskScore,
  normalizeRiskScore,
  getAqiDescription,
  getPollutantDisplayName,
  AqiCategory,
  normalizeCategory
} from "@/lib/aqi-standardization";

// Function to remove emojis from text
const removeEmojis = (text: string): string => {
  return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
};

// Function to get lighter background and darker text colors based on risk score
const getRiskSectionColors = (riskScore: number): { backgroundColor: string; color: string } => {
  const baseColor = getColorByRiskScore(riskScore);
  
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

// Function to get personalized risk explanation based on user profile and risk score
const getPersonalizedRiskExplanation = (riskScore: number, category: AqiCategory, profile: any): string => {
  const hasHealthConditions = profile?.has_asthma || profile?.has_heart_disease || 
    profile?.has_lung_disease || profile?.has_diabetes || profile?.is_smoker;
  const isElderly = profile?.age && profile.age > 65;
  
  let baseExplanation = getAqiDescription(category);
  
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
      baseExplanation += ` This personalized assessment considers your ${conditions.join(", ")}.`;
    }
  }
  
  return baseExplanation;
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

  // Standardize the data using the new system
  const standardizedData = standardizeAqiDataPoint(currentData);
  const sectionColors = getRiskSectionColors(standardizedData.riskScore);
  
  // Clean category name from emojis
  const cleanCategory = removeEmojis(standardizedData.category);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Air Quality Risk</CardTitle>
        <CardDescription>
          Personalized assessment for today ({format(new Date(standardizedData.date), "MMMM d, yyyy")})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div 
            className={cn(
              "h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold text-xl",
              "transition-all duration-300 hover:scale-105"
            )}
            style={{ backgroundColor: standardizedData.color }}
          >
            {standardizedData.riskScore}
          </div>
          <div>
            <p className="text-xl font-semibold">Your Risk: {cleanCategory}</p>
            <p className="text-lg">{standardizedData.pollutantDisplay}: {standardizedData.value.toFixed(1)} μg/m³</p>
            <p className="text-sm text-muted-foreground">
              General AQI: <span className="font-semibold">{cleanCategory}</span>
            </p>
          </div>
        </div>
        
        <div className="mt-2">
          <h4 className="font-medium mb-1">What this means for you:</h4>
          <p 
            className="text-sm p-3 rounded-md animate-fade-in"
            style={sectionColors}
          >
            {getPersonalizedRiskExplanation(standardizedData.riskScore, standardizedData.category, profile)}
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
