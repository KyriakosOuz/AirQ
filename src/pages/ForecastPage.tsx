
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { predictionApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/stores/userStore";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps
} from 'recharts';
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

// Simple health advice based on risk score and user health conditions
const getHealthAdvice = (riskScore: number, profile: any) => {
  if (!profile) {
    return "Sign in and complete your health profile for personalized recommendations.";
  }

  if (riskScore >= 3 && profile.has_asthma) {
    return "⚠️ You may experience breathing difficulty due to asthma. Consider staying indoors today.";
  }
  
  if (riskScore >= 2 && profile.has_lung_disease) {
    return "⚠️ Your lung condition may be aggravated. Limit outdoor activities and keep medication accessible.";
  }
  
  if (riskScore >= 2 && profile.has_heart_disease) {
    return "⚠️ Heart symptoms may worsen. Avoid physical exertion outdoors and monitor your symptoms closely.";
  }
  
  if (riskScore >= 3 && profile.age && profile.age > 65) {
    return "⚠️ Older adults are more sensitive to air pollution. Consider staying indoors with windows closed.";
  }
  
  if (riskScore >= 2 && profile.is_smoker) {
    return "⚠️ The combination of smoking and air pollution increases respiratory risks. Consider reducing smoking today.";
  }
  
  if (riskScore >= 1 && profile.has_diabetes) {
    return "⚠️ Air pollution may affect blood sugar levels. Monitor your glucose more frequently today.";
  }
  
  // General advice based on risk score
  switch (riskScore) {
    case 0:
      return "Air quality is good. Enjoy outdoor activities as normal.";
    case 1:
      return "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.";
    case 2:
      return "Members of sensitive groups may experience health effects. Consider reducing prolonged outdoor activities.";
    case 3:
      return "Everyone may begin to experience health effects. Limit time spent outdoors, especially if you feel symptoms.";
    case 4:
      return "Health alert: Everyone may experience more serious health effects. Avoid outdoor activities and wear a mask if going outside is necessary.";
    default:
      return "Monitor air quality and adjust activities accordingly.";
  }
};

// Custom tooltip for the forecast chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <p className="font-medium">{format(new Date(data.ds), "MMM d, yyyy")}</p>
        <p className="text-sm text-muted-foreground">{data.pollutant_display} Level: {data.yhat.toFixed(1)} μg/m³</p>
        <p className="text-sm" style={{ color: RISK_COLORS[data.risk_score] }}>
          {data.category} ({RISK_DESCRIPTIONS[data.risk_score]})
        </p>
      </div>
    );
  }
  return null;
};

// Main ForecastPage component
const ForecastPage: React.FC = () => {
  // State hooks for user inputs
  const [region, setRegion] = useState("thessaloniki");
  const [pollutant, setPollutant] = useState<Pollutant>("no2_conc");
  const [frequency, setFrequency] = useState("D"); // Default to daily
  const [periods, setPeriods] = useState(7); // Default to 7 days
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  
  // State for API data
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [currentData, setCurrentData] = useState<any>(null);
  
  // Get user profile from store
  const { profile } = useUserStore();

  // Load forecast data when component mounts
  useEffect(() => {
    loadForecastData();
  }, []); 
  
  // Function to get display name for pollutant
  const getPollutantDisplay = (pollutantCode: string): string => {
    const map: Record<string, string> = {
      "no2_conc": "NO₂",
      "o3_conc": "O₃",
      "so2_conc": "SO₂",
      "co_conc": "CO",
      "no_conc": "NO"
    };
    return map[pollutantCode] || pollutantCode;
  };
  
  // Function to load forecast data from API
  const loadForecastData = async () => {
    setLoading(true);
    try {
      const response = await predictionApi.getForecastWithRisk({
        region, 
        pollutant,
        frequency,
        periods
      });
      
      if (response.success && response.data) {
        const { forecast, current } = response.data;
        
        // Enhance forecast data with additional display properties
        const enhancedForecast = forecast.map(item => ({
          ...item,
          pollutant_display: getPollutantDisplay(pollutant)
        }));
        
        setForecastData(enhancedForecast);
        
        // Enhance current data with the pollutant display name
        if (current) {
          setCurrentData({
            ...current,
            pollutant_display: getPollutantDisplay(pollutant)
          });
        }
        
        toast.success(`Updated forecast for ${getPollutantDisplay(pollutant)} in ${region}`);
      } else {
        toast.error("Failed to load forecast data");
        console.error("Failed to load forecast:", response.error);
      }
    } catch (error) {
      toast.error("Error loading forecast data");
      console.error("Error loading forecast:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for region change
  const handleRegionChange = (value: string) => {
    setRegion(value);
  };
  
  // Handler for pollutant change
  const handlePollutantChange = (value: Pollutant) => {
    setPollutant(value);
  };
  
  // Handler for frequency change
  const handleFrequencyChange = (value: string) => {
    setFrequency(value);
    
    // Reset periods to default based on frequency
    if (value === "D") setPeriods(7);
    if (value === "W") setPeriods(4);
    if (value === "M") setPeriods(3);
  };
  
  // Get region display name (capitalize first letter)
  const getRegionDisplay = (regionValue: string): string => {
    return regionValue.charAt(0).toUpperCase() + regionValue.slice(1).replace(/-/g, " ");
  };
  
  // Get frequency display name
  const getFrequencyDisplay = (freq: string): string => {
    switch (freq) {
      case "D": return "Daily";
      case "W": return "Weekly";
      case "M": return "Monthly";
      default: return freq;
    }
  };
  
  // Get health advice for the user based on current air quality
  const getPersonalizedInsight = () => {
    if (!currentData) return "Loading personalized insights...";
    return getHealthAdvice(currentData.risk_score, profile);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Personal Air Quality Forecast</h1>
        <p className="text-muted-foreground">
          View personalized air quality forecasts with health risk assessments based on your profile.
        </p>
      </div>

      {/* Input Controls Section */}
      <Card className="overflow-hidden border-border/40 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Region Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Region</label>
              <RegionSelector value={region} onValueChange={handleRegionChange} />
            </div>
            
            {/* Pollutant Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pollutant</label>
              <PollutantSelector value={pollutant} onValueChange={handlePollutantChange} />
            </div>
            
            {/* Frequency Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency</label>
              <Select value={frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="D">Daily</SelectItem>
                  <SelectItem value="W">Weekly</SelectItem>
                  <SelectItem value="M">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Forecast Range Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Forecast Range</label>
                <span className="text-sm text-muted-foreground">
                  {periods} {frequency === "D" ? "days" : frequency === "W" ? "weeks" : "months"}
                </span>
              </div>
              <Slider
                value={[periods]}
                min={frequency === "D" ? 7 : frequency === "W" ? 4 : 3}
                max={frequency === "D" ? 365 : frequency === "W" ? 52 : 12}
                step={frequency === "D" ? 1 : 1}
                onValueChange={(value) => setPeriods(value[0])}
              />
            </div>
            
            {/* Update Button */}
            <div className="flex items-end">
              <Button 
                onClick={loadForecastData}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Update Forecast"
                )}
              </Button>
            </div>
          </div>
          
          {/* Chart Type Toggle (Line/Bar) */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm font-medium">Chart Type:</span>
            <div className="flex space-x-2">
              <Button 
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm" 
                onClick={() => setChartType("bar")}
              >
                Bar Chart
              </Button>
              <Button 
                variant={chartType === "line" ? "default" : "outline"}
                size="sm" 
                onClick={() => setChartType("line")}
              >
                Line Chart
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Data Alert */}
      {!loading && forecastData.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No forecast data available. Please update your selection and try again.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Forecast Chart Section */}
      {forecastData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {getPollutantDisplay(pollutant)} Forecast
            </CardTitle>
            <CardDescription>
              {getFrequencyDisplay(frequency)} forecast for the next {periods} {frequency === "D" ? "days" : frequency === "W" ? "weeks" : "months"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ds" 
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="yhat" name={getPollutantDisplay(pollutant)}>
                      {forecastData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk_score]} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="ds" 
                      tickFormatter={(value) => format(new Date(value), "MMM d")}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="yhat" 
                      name={getPollutantDisplay(pollutant)}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={5} 
                            fill={RISK_COLORS[payload.risk_score]} 
                            stroke="none"
                          />
                        );
                      }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
            
            {/* Risk Legend */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {RISK_COLORS.map((color, index) => (
                <div key={index} className="flex items-center space-x-1">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-xs">{RISK_DESCRIPTIONS[index]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cards Section */}
      {currentData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current AQI Summary Card */}
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
                  className="h-16 w-16 rounded-full flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: RISK_COLORS[currentData.risk_score] }}
                >
                  {currentData.risk_score}
                </div>
                <div>
                  <p className="text-xl font-semibold">{currentData.category}</p>
                  <p className="text-lg">{currentData.pollutant_display}: {currentData.yhat.toFixed(1)} μg/m³</p>
                  <p className="text-sm text-muted-foreground">
                    Your risk score: <span className="font-semibold">{currentData.risk_score}</span> - {RISK_DESCRIPTIONS[currentData.risk_score]}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-1">What this means:</h4>
                <p className="text-sm">
                  {currentData.category === "Good" && "Air quality is considered satisfactory, and air pollution poses little or no risk."}
                  {currentData.category === "Moderate" && "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution."}
                  {currentData.category === "Unhealthy for Sensitive Groups" && "Members of sensitive groups may experience health effects. The general public is less likely to be affected."}
                  {currentData.category === "Unhealthy" && "Some members of the general public may experience health effects; members of sensitive groups may experience more serious effects."}
                  {currentData.category === "Very Unhealthy" && "Health alert: The risk of health effects is increased for everyone."}
                  {currentData.category === "Hazardous" && "Health warning of emergency conditions: everyone is more likely to be affected."}
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Personalized Insight Card */}
          <Card>
            <CardHeader>
              <CardTitle>Your Personal Health Insight</CardTitle>
              <CardDescription>
                Tailored advice based on your health profile and current air quality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg">{getPersonalizedInsight()}</p>
              </div>
              
              {!profile && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Complete your health profile to get personalized air quality advice.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* AI Insights Placeholder */}
              <div className="border border-dashed border-muted-foreground/50 rounded-lg p-4 bg-background">
                <p className="italic text-muted-foreground">
                  🤖 Coming soon: AI-generated insights tailored to your health and forecast data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ForecastPage;
