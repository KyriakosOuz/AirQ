
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

// Function to get custom pollutant display name for the card
const getCardPollutantDisplayName = (pollutant: string): string => {
  // Handle the main pollution case
  if (pollutant === "pollution") {
    return "Combined Pollution";
  }
  // Also handle potential variations
  if (pollutant === "Pollution (Averaged from 5 pollutants)" || pollutant === "averaged" || pollutant === "combined") {
    return "Combined Pollution";
  }
  return getPollutantDisplayName(pollutant);
};

interface AQISummaryCardProps {
  currentData: any | null;
  loading: boolean;
  profile?: any;
  startDate?: Date;
  endDate?: Date;
}

const AQISummaryCard: React.FC<AQISummaryCardProps> = ({ currentData, loading, profile, startDate, endDate }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-2 w-24" />
            </div>
          </div>
          <Skeleton className="h-12 w-full mt-2" />
        </CardContent>
      </Card>
    );
  }
  
  if (!currentData) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personal Air Quality Risk</CardTitle>
          <CardDescription className="text-xs">No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Update the forecast to view your personalized air quality risk assessment.</p>
        </CardContent>
      </Card>
    );
  }

  // Standardize the data using the new system
  const standardizedData = standardizeAqiDataPoint(currentData);
  const sectionColors = getRiskSectionColors(standardizedData.riskScore);
  
  // Get the personalized risk category based on the actual risk score
  const personalizedRiskCategory = getCategoryByRiskScore(standardizedData.riskScore);
  const cleanPersonalizedCategory = removeEmojis(personalizedRiskCategory);
  
  // Clean general category name from emojis for display
  const cleanGeneralCategory = removeEmojis(standardizedData.category);
  
  // Get the proper pollutant display name - use the pollutant from currentData first, then fallback to standardized
  const pollutantToDisplay = currentData.pollutant || standardizedData.pollutant || "pollution";
  const pollutantDisplayName = getCardPollutantDisplayName(pollutantToDisplay);
  
  // Format the date range for the description
  const getDateRangeDescription = () => {
    if (startDate && endDate) {
      const startFormatted = format(startDate, "MMM do");
      const endFormatted = format(endDate, "MMM do");
      return `Personalized assessment for ${startFormatted} to ${endFormatted}`;
    }
    // Fallback to current data date if start/end dates are not available
    return `Personalized assessment for ${format(new Date(standardizedData.date), "MMM d, yyyy")}`;
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Personal Air Quality Risk</CardTitle>
        <CardDescription className="text-xs">
          {getDateRangeDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-3">
          <div 
            className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-base",
              "transition-all duration-300 hover:scale-105"
            )}
            style={{ backgroundColor: standardizedData.color }}
          >
            {standardizedData.riskScore}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">Your Risk: {cleanPersonalizedCategory}</p>
            <p className="text-xs text-gray-600 truncate">{pollutantDisplayName}: {standardizedData.value.toFixed(1)} μg/m³</p>
            <p className="text-xs text-muted-foreground">
              General AQI: <span className="font-medium">{cleanGeneralCategory}</span>
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-xs font-medium mb-2 text-gray-900">What this means for you:</h4>
          <p 
            className="text-xs leading-relaxed p-2 rounded-md animate-fade-in"
            style={sectionColors}
          >
            {getPersonalizedRiskExplanation(standardizedData.riskScore, personalizedRiskCategory, profile)}
          </p>
        </div>
        
        {/* Trend indicator */}
        {currentData.trend && (
          <div className="flex items-center">
            <Badge 
              variant={currentData.trend === "improving" ? "success" : currentData.trend === "stable" ? "outline" : "destructive"}
              className="text-xs"
            >
              {currentData.trend === "improving" ? "Improving" : currentData.trend === "stable" ? "Stable" : "Worsening"}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AQISummaryCard;
