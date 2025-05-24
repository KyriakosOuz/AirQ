
import { AqiLevel, Pollutant } from "./types";

// Standardized AQI risk score labels (0-4) - aligned with backend
export const RISK_SCORE_LABELS = [
  "Good",                              // 0
  "Moderate",                          // 1
  "Unhealthy for Sensitive Groups",    // 2
  "Unhealthy",                         // 3
  "Very Unhealthy"                     // 4
];

// Standardized risk score colors (0-4) - aligned with backend
export const RISK_SCORE_COLORS = [
  "#22c55e", // Green (0) - Good
  "#eab308", // Yellow (1) - Moderate
  "#f97316", // Orange (2) - Unhealthy for Sensitive Groups
  "#ef4444", // Red (3) - Unhealthy
  "#9333ea"  // Purple (4) - Very Unhealthy
];

// Label normalization mapping for CSS classes and keys
export const CATEGORY_NORMALIZATION: Record<string, string> = {
  "Good": "good",
  "Moderate": "moderate", 
  "Unhealthy for Sensitive Groups": "unhealthy-sensitive",
  "Unhealthy": "unhealthy",
  "Very Unhealthy": "very-unhealthy",
  "Hazardous": "hazardous"
};

// Function to safely get risk color with fallback
export const getRiskColor = (riskScore: number): string => {
  if (riskScore < 0 || riskScore >= RISK_SCORE_COLORS.length) {
    return "#6b7280"; // Gray fallback for invalid scores
  }
  return RISK_SCORE_COLORS[riskScore];
};

// Function to safely get risk label with fallback
export const getRiskLabel = (riskScore: number): string => {
  if (riskScore < 0 || riskScore >= RISK_SCORE_LABELS.length) {
    return "Unknown";
  }
  return RISK_SCORE_LABELS[riskScore];
};

// Function to normalize category labels for CSS classes
export const normalizeCategoryLabel = (category: string): string => {
  return CATEGORY_NORMALIZATION[category] || category.toLowerCase().replace(/\s+/g, "-");
};

// Define AQI thresholds for different pollutants
export const AQI_THRESHOLDS: Record<Pollutant, Array<[number, string]>> = {
  "pollution": [
    [1, "good"],
    [2, "moderate"],
    [3, "unhealthy-sensitive"],
    [4, "unhealthy"],
    [Infinity, "very-unhealthy"]
  ],
  "no2_conc": [
    [40, "good"],
    [100, "moderate"],
    [200, "unhealthy-sensitive"],
    [400, "unhealthy"],
    [Infinity, "very-unhealthy"]
  ],
  "o3_conc": [
    [60, "good"],
    [100, "moderate"],
    [140, "unhealthy-sensitive"],
    [180, "unhealthy"],
    [Infinity, "very-unhealthy"]
  ],
  "so2_conc": [
    [20, "good"],
    [80, "moderate"],
    [250, "unhealthy-sensitive"],
    [350, "unhealthy"],
    [Infinity, "very-unhealthy"]
  ],
  "co_conc": [
    [4.4, "good"],
    [9.4, "moderate"],
    [12.4, "unhealthy-sensitive"],
    [15.4, "unhealthy"],
    [Infinity, "very-unhealthy"]
  ],
  "no_conc": [
    [30, "good"],
    [60, "moderate"],
    [120, "unhealthy-sensitive"],
    [200, "unhealthy"],
    [Infinity, "very-unhealthy"]
  ]
};

// Function to determine AQI level based on pollutant value
export function getAqiLevelForPollutant(pollutant: Pollutant, value: number): AqiLevel {
  const thresholds = AQI_THRESHOLDS[pollutant];
  if (!thresholds) return "moderate"; // Default if pollutant not found
  
  for (const [threshold, level] of thresholds) {
    if (value <= threshold) {
      return level as AqiLevel;
    }
  }
  
  return "hazardous"; // Default to worst case if no match
}

// Get text description for the AQI level
export function getAqiDescription(aqiLevel: AqiLevel): string {
  switch (aqiLevel) {
    case "good":
      return "Air quality is considered satisfactory, and air pollution poses little or no risk.";
    case "moderate":
      return "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people.";
    case "unhealthy-sensitive":
      return "Members of sensitive groups may experience health effects. The general public is not likely to be affected.";
    case "unhealthy":
      return "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.";
    case "very-unhealthy":
      return "Health warnings of emergency conditions. The entire population is more likely to be affected.";
    case "hazardous":
      return "Health alert: everyone may experience more serious health effects.";
    default:
      return "No data available.";
  }
}
