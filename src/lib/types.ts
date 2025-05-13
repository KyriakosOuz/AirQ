
// Add the created_at field to the Dataset interface
export interface Dataset {
  id: string;
  name?: string;
  region: string;
  year: number;
  created_at?: string;
}

// Define the Region type
export interface Region {
  id?: string;
  value: string;
  label: string;
}

// Define the pollutant types
export type Pollutant = "NO2" | "O3" | "PM10" | "PM25" | "SO2" | "CO";

// Define the AQI levels
export type AqiLevel = "good" | "moderate" | "unhealthy-sensitive" | "unhealthy" | "very-unhealthy" | "hazardous";

// Map AQI levels to display labels
export const aqiLevelLabels: Record<AqiLevel, string> = {
  "good": "Good",
  "moderate": "Moderate",
  "unhealthy-sensitive": "Unhealthy for Sensitive Groups",
  "unhealthy": "Unhealthy",
  "very-unhealthy": "Very Unhealthy",
  "hazardous": "Hazardous"
};

// Helper function to convert string to AQI level
export const stringToAqiLevel = (value: string): AqiLevel => {
  if (Object.keys(aqiLevelLabels).includes(value as AqiLevel)) {
    return value as AqiLevel;
  }
  return "moderate"; // Default fallback
};

// User profile types
export type UserRole = "user" | "admin" | "researcher";

export interface UserProfile {
  id: string;
  email: string;
  age?: number;
  has_asthma?: boolean;
  has_lung_disease?: boolean;
  has_heart_disease?: boolean;
  has_diabetes?: boolean;
  is_smoker?: boolean;
  role: UserRole;
}

// Alert type for notifications
export interface Alert {
  id: string;
  user_id: string;
  region: string;
  pollutant: Pollutant;
  threshold: string;
  created_at?: string;
}

// Health tip types
export interface HealthTip {
  tip: string;
  severity: AqiLevel;
  personalized?: boolean;
  risk_level?: string;
}

// Chart data types
export interface TrendChart {
  labels: string[];
  values: number[];
  deltas: number[];
}

export interface SeasonalityChart {
  labels: string[];
  values: number[];
}

// Forecast data types
export interface Forecast {
  ds: string;
  yhat: number;
  category: string;
}

