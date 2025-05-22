import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircle } from "./InfoCircle";

interface ForecastControlsProps {
  region: string;
  pollutant: Pollutant;
  frequency: string;
  periods: number;
  chartType: "bar" | "line";
  loading: boolean;
  onRegionChange: (value: string) => void;
  onPollutantChange: (value: Pollutant) => void;
  onFrequencyChange: (value: string) => void;
  onPeriodsChange: (value: number) => void;
  onChartTypeChange: (type: "bar" | "line") => void;
  onUpdateForecast: () => void;
}

const ForecastControls: React.FC<ForecastControlsProps> = ({
  region,
  pollutant,
  frequency,
  periods,
  chartType,
  loading,
  onRegionChange,
  onPollutantChange,
  onFrequencyChange,
  onPeriodsChange,
  onChartTypeChange,
  onUpdateForecast,
}) => {
  
  const frequencyDisplay = {
    "D": "days",
    "W": "weeks",
    "M": "months"
  }[frequency];

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Region Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium">Region</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">Select a region to view air quality forecasts for that area</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <RegionSelector value={region} onValueChange={onRegionChange} />
          </div>
          
          {/* Pollutant Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium">Pollutant</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">Different pollutants have varying health impacts. NO₂ affects respiratory system, O₃ (ozone) can irritate airways, etc.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <PollutantSelector value={pollutant} onValueChange={onPollutantChange} />
          </div>
          
          {/* Frequency Selector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium">Frequency</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">Choose how frequently forecast data is presented: daily, weekly, or monthly intervals</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select value={frequency} onValueChange={onFrequencyChange}>
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
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium">Forecast Range</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">Adjust how far into the future you want to see forecasts</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className="text-sm text-muted-foreground">
                {periods} {frequencyDisplay}
              </span>
            </div>
            <Slider
              value={[periods]}
              min={frequency === "D" ? 7 : frequency === "W" ? 4 : 3}
              max={frequency === "D" ? 60 : frequency === "W" ? 24 : 12}
              step={1}
              onValueChange={(value) => onPeriodsChange(value[0])}
            />
          </div>
          
          {/* Update Button */}
          <div className="flex items-end">
            <Button 
              onClick={onUpdateForecast}
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
              onClick={() => onChartTypeChange("bar")}
            >
              Bar Chart
            </Button>
            <Button 
              variant={chartType === "line" ? "default" : "outline"}
              size="sm" 
              onClick={() => onChartTypeChange("line")}
            >
              Line Chart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastControls;
