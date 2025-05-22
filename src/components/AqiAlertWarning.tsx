
import React from "react";
import { format, parseISO, isBefore, addDays } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Forecast, AqiLevel, stringToAqiLevel, aqiLevelLabels } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AqiBadge } from "@/components/ui/aqi-badge";

interface AqiAlertWarningProps {
  forecasts: Forecast[];
  pollutant: string;
  region: string;
  daysToCheck?: number;
}

export function AqiAlertWarning({ 
  forecasts, 
  pollutant, 
  region, 
  daysToCheck = 7 
}: AqiAlertWarningProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  // Helper to check if a date is within the specified number of days
  const isWithinDays = (dateStr: string, days: number): boolean => {
    const date = parseISO(dateStr);
    const today = new Date();
    const futureLimit = addDays(today, days);
    return isBefore(date, futureLimit) && !isBefore(date, today);
  };

  // Filter forecasts to find ones with concerning AQI levels
  const concerningForecasts = React.useMemo(() => {
    if (!forecasts?.length) return [];
    
    return forecasts
      .filter(f => {
        const aqiLevel = stringToAqiLevel(f.category || "");
        // Filter forecasts with unhealthy or worse AQI within the specified number of days
        return ["unhealthy-sensitive", "unhealthy", "very-unhealthy", "hazardous"].includes(aqiLevel) && 
               isWithinDays(f.ds, daysToCheck);
      })
      .sort((a, b) => new Date(a.ds).getTime() - new Date(b.ds).getTime());
  }, [forecasts, daysToCheck]);

  // Get the highest AQI level from concerning forecasts
  const highestAqiLevel = React.useMemo((): AqiLevel => {
    if (!concerningForecasts.length) return "good";
    
    const aqiLevels = concerningForecasts.map(f => stringToAqiLevel(f.category || ""));
    const aqiSeverity = {
      "hazardous": 5,
      "very-unhealthy": 4,
      "unhealthy": 3,
      "unhealthy-sensitive": 2,
      "moderate": 1,
      "good": 0
    };
    
    let highest: AqiLevel = "good";
    let highestSeverity = -1;
    
    aqiLevels.forEach(level => {
      if (aqiSeverity[level] > highestSeverity) {
        highest = level;
        highestSeverity = aqiSeverity[level];
      }
    });
    
    return highest;
  }, [concerningForecasts]);

  // Get pollutant display name
  const getPollutantDisplay = (pollutantCode: string): string => {
    const map: Record<string, string> = {
      "no2_conc": "NO₂",
      "o3_conc": "O₃",
      "so2_conc": "SO₂",
      "pm10_conc": "PM10",
      "pm25_conc": "PM2.5",
      "co_conc": "CO",
      "no_conc": "NO",
    };
    return map[pollutantCode] || pollutantCode;
  };

  // Get region display name
  const getRegionDisplay = (regionValue: string): string => {
    return regionValue.charAt(0).toUpperCase() + regionValue.slice(1).replace(/-/g, " ");
  };

  if (!concerningForecasts.length) return null;

  // Determine alert variant based on AQI level
  const getAlertVariant = () => {
    switch (highestAqiLevel) {
      case "unhealthy-sensitive":
        return "warning";
      case "unhealthy":
      case "very-unhealthy":
      case "hazardous":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <>
      <Alert variant={getAlertVariant()} className={`
        ${highestAqiLevel === "unhealthy-sensitive" ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800" : ""}
        ${["unhealthy", "very-unhealthy", "hazardous"].includes(highestAqiLevel) ? "bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-800" : ""}
      `}>
        {highestAqiLevel === "unhealthy-sensitive" ? (
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
        <AlertDescription className={`
          ${highestAqiLevel === "unhealthy-sensitive" ? "text-amber-800 dark:text-amber-300" : ""}
          ${["unhealthy", "very-unhealthy", "hazardous"].includes(highestAqiLevel) ? "text-red-800 dark:text-red-300" : ""}
        `}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="font-medium">Air Quality Warning:</span> {getPollutantDisplay(pollutant)} levels in {getRegionDisplay(region)} will reach {aqiLevelLabels[highestAqiLevel]} in the next {daysToCheck} days.
            </div>
            <Button 
              size="sm"
              variant={highestAqiLevel === "unhealthy-sensitive" ? "outline" : "destructive"} 
              className={`
                ${highestAqiLevel === "unhealthy-sensitive" ? "border-amber-300 text-amber-800 hover:bg-amber-100" : ""}
                ${["unhealthy", "very-unhealthy", "hazardous"].includes(highestAqiLevel) ? "" : ""}
              `}
              onClick={() => setShowDetails(true)}
            >
              View Details
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Air Quality Forecast Warning</DialogTitle>
            <DialogDescription>
              Upcoming days with poor air quality in {getRegionDisplay(region)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The following days are forecasted to have {highestAqiLevel === "unhealthy-sensitive" ? "potentially unsafe" : "unsafe"} levels of {getPollutantDisplay(pollutant)}:
            </p>
            <div className="grid gap-2">
              {concerningForecasts.map((forecast, index) => {
                const aqiLevel = stringToAqiLevel(forecast.category || "moderate");
                return (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                    <div className="flex items-center gap-2">
                      <AqiBadge level={aqiLevel} className="h-8 w-8" />
                      <div>
                        <div className="font-medium">{format(parseISO(forecast.ds), "EEEE, MMMM d")}</div>
                        <div className="text-xs text-muted-foreground">
                          {forecast.yhat.toFixed(1)} µg/m³ - {aqiLevelLabels[aqiLevel]}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-2">
              <p className="text-sm font-medium">Recommendations:</p>
              <ul className="text-sm text-muted-foreground list-disc pl-5 pt-1 space-y-1">
                {highestAqiLevel === "unhealthy-sensitive" && (
                  <>
                    <li>Sensitive individuals should limit outdoor activities</li>
                    <li>Keep windows closed during peak hours</li>
                    <li>Consider using air purifiers indoors</li>
                  </>
                )}
                {["unhealthy", "very-unhealthy", "hazardous"].includes(highestAqiLevel) && (
                  <>
                    <li>Everyone should reduce outdoor activities</li>
                    <li>Wear N95 masks when outdoors if possible</li>
                    <li>Keep windows closed and use air purifiers</li>
                    <li>Follow local health department advisories</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
