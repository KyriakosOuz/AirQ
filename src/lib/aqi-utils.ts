import { AqiLevel, Pollutant } from "./types";

// Re-export everything from the new standardized system
export * from './aqi-standardization';

// Keep backward compatibility for existing imports
import { 
  AQI_CATEGORIES, 
  AqiCategory,
  getColorByCategory, 
  getColorByRiskScore,
  getCategoryByRiskScore,
  normalizeRiskScore,
  normalizeCategory,
  getAqiDescription as getStandardizedAqiDescription
} from './aqi-standardization';

// Legacy compatibility functions - these will use the new standardized system
export const RISK_SCORE_LABELS = [
  "", // Index 0 - unused
  AQI_CATEGORIES.GOOD,
  AQI_CATEGORIES.MODERATE,
  AQI_CATEGORIES.UNHEALTHY_SENSITIVE,
  AQI_CATEGORIES.UNHEALTHY,
  AQI_CATEGORIES.VERY_UNHEALTHY,
  AQI_CATEGORIES.HAZARDOUS
];

export const RISK_SCORE_COLORS = [
  "", // Index 0 - unused
  getColorByCategory(AQI_CATEGORIES.GOOD),
  getColorByCategory(AQI_CATEGORIES.MODERATE),
  getColorByCategory(AQI_CATEGORIES.UNHEALTHY_SENSITIVE),
  getColorByCategory(AQI_CATEGORIES.UNHEALTHY),
  getColorByCategory(AQI_CATEGORIES.VERY_UNHEALTHY),
  getColorByCategory(AQI_CATEGORIES.HAZARDOUS)
];

// Legacy category colors - now using standardized colors
export const CATEGORY_COLORS: Record<string, string> = {
  "Good": getColorByCategory(AQI_CATEGORIES.GOOD),
  "Moderate": getColorByCategory(AQI_CATEGORIES.MODERATE),
  "Unhealthy for Sensitive Groups": getColorByCategory(AQI_CATEGORIES.UNHEALTHY_SENSITIVE),
  "Unhealthy": getColorByCategory(AQI_CATEGORIES.UNHEALTHY),
  "Very Unhealthy": getColorByCategory(AQI_CATEGORIES.VERY_UNHEALTHY),
  "Hazardous": getColorByCategory(AQI_CATEGORIES.HAZARDOUS)
};

// Legacy functions - now using standardized system
export const getCategoryColor = (category: string): string => {
  return getColorByCategory(category);
};

export const getRiskColor = (riskScore: number): string => {
  return getColorByRiskScore(normalizeRiskScore(riskScore));
};

export const getRiskLabel = (riskScore: number): string => {
  const normalizedScore = normalizeRiskScore(riskScore);
  return getCategoryByRiskScore(normalizedScore);
};

export const getAqiDescription = (aqiLevel: AqiLevel): string => {
  const category = normalizeCategory(aqiLevel);
  return getStandardizedAqiDescription(category);
};

// Keep existing normalization function for backward compatibility
export const CATEGORY_NORMALIZATION: Record<string, string> = {
  "Good": "good",
  "Moderate": "moderate", 
  "Unhealthy for Sensitive Groups": "unhealthy-sensitive",
  "Unhealthy": "unhealthy",
  "Very Unhealthy": "very-unhealthy",
  "Hazardous": "hazardous"
};

export const normalizeCategoryLabel = (category: string): string => {
  return CATEGORY_NORMALIZATION[category] || category.toLowerCase().replace(/\s+/g, "-");
};

// Keep existing AQI thresholds for pollutant calculations
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

export function getAqiLevelForPollutant(pollutant: Pollutant, value: number): AqiLevel {
  const thresholds = AQI_THRESHOLDS[pollutant];
  if (!thresholds) return "moderate";
  
  for (const [threshold, level] of thresholds) {
    if (value <= threshold) {
      return level as AqiLevel;
    }
  }
  
  return "hazardous";
}
