
import { Pollutant } from "./types";

// Standardized AQI categories with consistent naming
export const AQI_CATEGORIES = {
  GOOD: "Good",
  MODERATE: "Moderate", 
  UNHEALTHY_SENSITIVE: "Unhealthy for Sensitive Groups",
  UNHEALTHY: "Unhealthy",
  VERY_UNHEALTHY: "Very Unhealthy",
  HAZARDOUS: "Hazardous"
} as const;

export type AqiCategory = typeof AQI_CATEGORIES[keyof typeof AQI_CATEGORIES];

// Standardized risk scores (1-6 to include hazardous)
export const RISK_SCORES = {
  GOOD: 1,
  MODERATE: 2,
  UNHEALTHY_SENSITIVE: 3,
  UNHEALTHY: 4,
  VERY_UNHEALTHY: 5,
  HAZARDOUS: 6
} as const;

// Fixed color mapping - Risk 6 (Hazardous) should be dark red, not purple
export const AQI_COLORS = {
  [AQI_CATEGORIES.GOOD]: "#22c55e",
  [AQI_CATEGORIES.MODERATE]: "#eab308",
  [AQI_CATEGORIES.UNHEALTHY_SENSITIVE]: "#f97316",
  [AQI_CATEGORIES.UNHEALTHY]: "#ef4444",
  [AQI_CATEGORIES.VERY_UNHEALTHY]: "#9333ea",
  [AQI_CATEGORIES.HAZARDOUS]: "#7f1d1d"
};

// Distinct risk score colors - using blue gradient to avoid confusion with AQI colors
export const RISK_SCORE_COLORS = {
  1: "#3b82f6", // Blue-500 - Minimal risk
  2: "#1d4ed8", // Blue-700 - Low risk
  3: "#1e40af", // Blue-800 - Moderate risk
  4: "#1e3a8a", // Blue-900 - High risk
  5: "#172554", // Blue-950 - Very high risk
  6: "#0f172a"  // Slate-900 - Extremely high risk
} as const;

// Risk score labels
export const RISK_SCORE_LABELS = {
  1: "Minimal risk",
  2: "Low risk",
  3: "Moderate risk",
  4: "High risk",
  5: "Very high risk",
  6: "Extremely high risk"
} as const;

// Risk score to category mapping
export const RISK_SCORE_TO_CATEGORY: Record<number, AqiCategory> = {
  1: AQI_CATEGORIES.GOOD,
  2: AQI_CATEGORIES.MODERATE,
  3: AQI_CATEGORIES.UNHEALTHY_SENSITIVE,
  4: AQI_CATEGORIES.UNHEALTHY,
  5: AQI_CATEGORIES.VERY_UNHEALTHY,
  6: AQI_CATEGORIES.HAZARDOUS
};

// Category to risk score mapping
export const CATEGORY_TO_RISK_SCORE: Record<AqiCategory, number> = {
  [AQI_CATEGORIES.GOOD]: 1,
  [AQI_CATEGORIES.MODERATE]: 2,
  [AQI_CATEGORIES.UNHEALTHY_SENSITIVE]: 3,
  [AQI_CATEGORIES.UNHEALTHY]: 4,
  [AQI_CATEGORIES.VERY_UNHEALTHY]: 5,
  [AQI_CATEGORIES.HAZARDOUS]: 6
};

// Standardized functions
export const getColorByCategory = (category: string): string => {
  return AQI_COLORS[category as AqiCategory] || "#6b7280";
};

export const getColorByRiskScore = (riskScore: number): string => {
  const category = RISK_SCORE_TO_CATEGORY[riskScore];
  return category ? AQI_COLORS[category] : "#6b7280";
};

// New function for risk score colors (distinct from AQI colors)
export const getRiskScoreColor = (riskScore: number): string => {
  return RISK_SCORE_COLORS[riskScore as keyof typeof RISK_SCORE_COLORS] || "#6b7280";
};

// Function to get risk score label
export const getRiskScoreLabel = (riskScore: number): string => {
  return RISK_SCORE_LABELS[riskScore as keyof typeof RISK_SCORE_LABELS] || "Unknown risk";
};

export const getCategoryByRiskScore = (riskScore: number): AqiCategory => {
  return RISK_SCORE_TO_CATEGORY[riskScore] || AQI_CATEGORIES.MODERATE;
};

export const getRiskScoreByCategory = (category: string): number => {
  return CATEGORY_TO_RISK_SCORE[category as AqiCategory] || 2;
};

// Validate and normalize risk scores
export const normalizeRiskScore = (riskScore: number | undefined | null): number => {
  if (typeof riskScore !== 'number' || isNaN(riskScore)) {
    return 2; // Default to moderate
  }
  return Math.max(1, Math.min(6, Math.round(riskScore)));
};

// Validate and normalize categories
export const normalizeCategory = (category: string | undefined | null): AqiCategory => {
  if (!category) return AQI_CATEGORIES.MODERATE;
  
  // Check if it's already a valid category
  const validCategories = Object.values(AQI_CATEGORIES);
  if (validCategories.includes(category as AqiCategory)) {
    return category as AqiCategory;
  }
  
  // Try to map common variations
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('good')) return AQI_CATEGORIES.GOOD;
  if (categoryLower.includes('moderate')) return AQI_CATEGORIES.MODERATE;
  if (categoryLower.includes('sensitive')) return AQI_CATEGORIES.UNHEALTHY_SENSITIVE;
  if (categoryLower.includes('unhealthy') && !categoryLower.includes('very')) return AQI_CATEGORIES.UNHEALTHY;
  if (categoryLower.includes('very')) return AQI_CATEGORIES.VERY_UNHEALTHY;
  if (categoryLower.includes('hazardous')) return AQI_CATEGORIES.HAZARDOUS;
  
  return AQI_CATEGORIES.MODERATE; // Default fallback
};

// Get AQI description
export const getAqiDescription = (category: AqiCategory): string => {
  switch (category) {
    case AQI_CATEGORIES.GOOD:
      return "Air quality is considered satisfactory, and air pollution poses little or no risk.";
    case AQI_CATEGORIES.MODERATE:
      return "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.";
    case AQI_CATEGORIES.UNHEALTHY_SENSITIVE:
      return "Members of sensitive groups may experience health effects. The general public is not likely to be affected.";
    case AQI_CATEGORIES.UNHEALTHY:
      return "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.";
    case AQI_CATEGORIES.VERY_UNHEALTHY:
      return "Health warnings of emergency conditions. The entire population is more likely to be affected.";
    case AQI_CATEGORIES.HAZARDOUS:
      return "Health alert: everyone may experience more serious health effects.";
    default:
      return "No data available.";
  }
};

// UI pollutant to display name mapping - prioritize UI selection
export const UI_POLLUTANT_DISPLAY_NAMES: Record<Pollutant, string> = {
  "pollution": "Combined Pollution",
  "no2_conc": "Nitrogen Dioxide (NO₂)",
  "o3_conc": "Ozone (O₃)",
  "so2_conc": "Sulfur Dioxide (SO₂)",
  "co_conc": "Carbon Monoxide (CO)",
  "no_conc": "Nitric Oxide (NO)"
};

// Enhanced pollutant display names with comprehensive mappings
export const POLLUTANT_DISPLAY_NAMES: Record<string, string> = {
  // Main pollution case
  "pollution": "Combined Pollution",
  
  // Standard pollutant codes
  "no2_conc": "Nitrogen Dioxide (NO₂)",
  "o3_conc": "Ozone (O₃)",
  "so2_conc": "Sulfur Dioxide (SO₂)",
  "co_conc": "Carbon Monoxide (CO)",
  "no_conc": "Nitric Oxide (NO)",
  "pm10_conc": "Particulate Matter (PM10)",
  "pm25_conc": "Fine Particulate Matter (PM2.5)",
  
  // Alternative formats that might come from API
  "no2": "Nitrogen Dioxide (NO₂)",
  "o3": "Ozone (O₃)",
  "so2": "Sulfur Dioxide (SO₂)",
  "co": "Carbon Monoxide (CO)",
  "no": "Nitric Oxide (NO)",
  "pm10": "Particulate Matter (PM10)",
  "pm25": "Fine Particulate Matter (PM2.5)",
  "pm2.5": "Fine Particulate Matter (PM2.5)",
  
  // Possible variations
  "nitrogen_dioxide": "Nitrogen Dioxide (NO₂)",
  "ozone": "Ozone (O₃)",
  "sulfur_dioxide": "Sulfur Dioxide (SO₂)",
  "carbon_monoxide": "Carbon Monoxide (CO)",
  "nitric_oxide": "Nitric Oxide (NO)",
  "particulate_matter_10": "Particulate Matter (PM10)",
  "particulate_matter_25": "Fine Particulate Matter (PM2.5)",
  
  // Fallback for unknown
  "unknown": "Air Quality Data"
};

export const getPollutantDisplayName = (pollutantCode: string): string => {
  console.log("getPollutantDisplayName - Input pollutant code:", pollutantCode);
  
  if (!pollutantCode) {
    console.log("getPollutantDisplayName - No pollutant code provided, returning default");
    return "Air Quality Data";
  }
  
  // Check direct mapping first
  const directMatch = POLLUTANT_DISPLAY_NAMES[pollutantCode.toLowerCase()];
  if (directMatch) {
    console.log("getPollutantDisplayName - Direct match found:", directMatch);
    return directMatch;
  }
  
  // Check for partial matches for complex names
  const lowerCode = pollutantCode.toLowerCase();
  
  if (lowerCode.includes("no2")) return "Nitrogen Dioxide (NO₂)";
  if (lowerCode.includes("o3") || lowerCode.includes("ozone")) return "Ozone (O₃)";
  if (lowerCode.includes("so2")) return "Sulfur Dioxide (SO₂)";
  if (lowerCode.includes("co") && !lowerCode.includes("conc")) return "Carbon Monoxide (CO)";
  if (lowerCode.includes("no") && !lowerCode.includes("no2")) return "Nitric Oxide (NO)";
  if (lowerCode.includes("pm10")) return "Particulate Matter (PM10)";
  if (lowerCode.includes("pm25") || lowerCode.includes("pm2.5")) return "Fine Particulate Matter (PM2.5)";
  if (lowerCode.includes("pollution") || lowerCode.includes("averaged") || lowerCode.includes("combined")) {
    return "Combined Pollution";
  }
  
  console.log("getPollutantDisplayName - No match found, returning formatted version of:", pollutantCode);
  
  // If no match found, return a formatted version of the original code
  return pollutantCode
    .replace(/_/g, ' ')
    .replace(/conc/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim() || "Air Quality Data";
};

// Data validation and standardization
export interface StandardizedAqiData {
  riskScore: number;
  category: AqiCategory;
  color: string;
  value: number;
  pollutant: string;
  pollutantDisplay: string;
  date: string;
}

export const standardizeAqiDataPoint = (dataPoint: any): StandardizedAqiData => {
  const riskScore = normalizeRiskScore(dataPoint.risk_score);
  const category = dataPoint.category ? 
    normalizeCategory(dataPoint.category) : 
    getCategoryByRiskScore(riskScore);
  
  return {
    riskScore,
    category,
    color: getColorByCategory(category),
    value: typeof dataPoint.yhat === 'number' ? dataPoint.yhat : 0,
    pollutant: dataPoint.pollutant || 'unknown',
    pollutantDisplay: getPollutantDisplayName(dataPoint.pollutant || 'unknown'),
    date: dataPoint.ds || new Date().toISOString()
  };
};
