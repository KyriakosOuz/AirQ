// Core data types
export type Pollutant = "NO2" | "O3" | "SO2";

export type Region = string;

export type AqiLevel = 
  | "good" 
  | "moderate" 
  | "unhealthy-sensitive" 
  | "unhealthy" 
  | "very-unhealthy"
  | "hazardous";

export type UserRole = "authenticated" | "admin" | "user";

// Data models
export interface UserProfile {
  id: string;
  email: string;
  age?: number;
  has_asthma?: boolean;
  is_smoker?: boolean;
  has_heart_disease?: boolean;
  has_diabetes?: boolean;
  has_lung_disease?: boolean;
  role?: UserRole; // Add role field to support isAdmin
}

// Update trend chart interface to match API response
export interface TrendChart {
  labels: string[];
  values: number[];
  deltas: number[];
}

// Update seasonality chart interface to match API response
export interface SeasonalityChart {
  labels: string[];
  values: number[];
}

export interface Dataset {
  id: string;
  name?: string; // Making this optional since API might not return it
  region: string;
  year: number;
  uploadedAt?: string; // Making this optional since API might not return it
  size?: number; // Making this optional since API might not return it
  file_url?: string; // Adding this from API response
}

export interface Alert {
  id: string;
  userId: string;
  region: string;
  pollutant: Pollutant;
  threshold: string; // Updated to string to match backend (e.g., "Good", "Moderate", etc.)
  active: boolean;
  createdAt: string;
}

export interface DataPoint {
  year: number;
  month: number;
  value: number;
  region: string;
}

export interface PollutantData {
  pollutant: Pollutant;
  data: DataPoint[];
}

// Update Forecast to include derived properties
export interface Forecast {
  ds: string; // date
  yhat: number; // predicted value
  category: string; // AQI category from backend
  // Derived properties for chart display
  yhat_lower?: number; // lower bound - to be derived
  yhat_upper?: number; // upper bound - to be derived
}

export interface RegionForecast {
  region: string;
  forecasts: Forecast[];
}

export interface HealthTip {
  tip: string;
  riskLevel: AqiLevel;
  personalized: boolean;
}

// New interface to match backend trend data response
export interface TrendChart {
  labels: string[];
  values: number[];
  deltas: number[];
}

// New interface to match backend seasonality data response
export interface SeasonalityChart {
  labels: string[];
  values: number[];
}

export interface InsightSummary {
  trend: {
    year: number;
    value: number;
  }[];
  seasonality: {
    month: number;
    value: number;
  }[];
  topPolluted: {
    region: string;
    value: number;
  }[];
}

export interface RiskTimelinePoint {
  date: string;
  risk: number;
  aqi: AqiLevel;
}

// Common select options
export const POLLUTANT_OPTIONS = [
  { value: "NO2", label: "Nitrogen Dioxide (NO₂)" },
  { value: "O3", label: "Ozone (O₃)" },
  { value: "SO2", label: "Sulfur Dioxide (SO₂)" },
];

// Helper functions for AQI
export const getAqiLevelFromValue = (value: number, pollutant: Pollutant): AqiLevel => {
  // These are placeholder thresholds - should be replaced with actual EPA or EU standards
  switch (pollutant) {
    case "NO2":
      if (value <= 50) return "good";
      if (value <= 100) return "moderate";
      if (value <= 150) return "unhealthy-sensitive";
      if (value <= 200) return "unhealthy";
      if (value <= 300) return "very-unhealthy";
      return "hazardous";
    case "O3":
      if (value <= 50) return "good";
      if (value <= 100) return "moderate";
      if (value <= 150) return "unhealthy-sensitive";
      if (value <= 200) return "unhealthy";
      if (value <= 300) return "very-unhealthy";
      return "hazardous";
    case "SO2":
      if (value <= 35) return "good";
      if (value <= 75) return "moderate";
      if (value <= 185) return "unhealthy-sensitive";
      if (value <= 304) return "unhealthy";
      if (value <= 604) return "very-unhealthy";
      return "hazardous";
    default:
      return "moderate";
  }
};

// String to AQI level mapping - for converting backend strings to our AQI types
export const stringToAqiLevel = (level: string): AqiLevel => {
  const mapping: Record<string, AqiLevel> = {
    "Good": "good",
    "Moderate": "moderate", 
    "Unhealthy for Sensitive Groups": "unhealthy-sensitive",
    "Unhealthy": "unhealthy",
    "Very Unhealthy": "very-unhealthy",
    "Hazardous": "hazardous"
  };
  return mapping[level] || "moderate";
};

export const aqiLevelLabels = {
  "good": "Good",
  "moderate": "Moderate",
  "unhealthy-sensitive": "Unhealthy for Sensitive Groups",
  "unhealthy": "Unhealthy",
  "very-unhealthy": "Very Unhealthy",
  "hazardous": "Hazardous"
};

export const aqiLevelDescriptions = {
  "good": "Air quality is satisfactory, and air pollution poses little or no risk.",
  "moderate": "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
  "unhealthy-sensitive": "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
  "unhealthy": "Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.",
  "very-unhealthy": "Health alert: The risk of health effects is increased for everyone.",
  "hazardous": "Health warning of emergency conditions: everyone is more likely to be affected."
};
