
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoCircle } from "./InfoCircle";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ForecastControlsProps {
  region: string;
  pollutant: Pollutant;
  frequency: string;
  periods: number;
  chartType: "bar" | "line";
  loading: boolean;
  forecastMode: "periods" | "daterange";
  startDate: Date | undefined;
  endDate: Date | undefined;
  onRegionChange: (value: string) => void;
  onPollutantChange: (value: Pollutant) => void;
  onFrequencyChange: (value: string) => void;
  onPeriodsChange: (value: number) => void;
  onChartTypeChange: (type: "bar" | "line") => void;
  onForecastModeChange: (mode: "periods" | "daterange") => void;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onUpdateForecast: () => void;
}

const ForecastControls: React.FC<ForecastControlsProps> = ({
  region,
  pollutant,
  frequency,
  periods,
  chartType,
  loading,
  forecastMode,
  startDate,
  endDate,
  onRegionChange,
  onPollutantChange,
  onFrequencyChange,
  onPeriodsChange,
  onChartTypeChange,
  onForecastModeChange,
  onStartDateChange,
  onEndDateChange,
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
          
          {/* Forecast Mode Toggle */}
          <div className="space-y-2 col-span-1 lg:col-span-2">
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium">Forecast Mode</label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-[200px] text-xs">Choose between predicting a number of periods or a specific date range</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Tabs 
              value={forecastMode} 
              onValueChange={(value) => onForecastModeChange(value as "periods" | "daterange")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="periods">Periods</TabsTrigger>
                <TabsTrigger value="daterange">Date Range</TabsTrigger>
              </TabsList>
            </Tabs>
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
        
        {/* Show different controls based on the forecast mode */}
        {forecastMode === "periods" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Start Date Picker */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium">Start Date</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">Select the start date for your forecast range</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={onStartDateChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* End Date Picker */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium">End Date</label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-[200px] text-xs">Select the end date for your forecast range</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={onEndDateChange}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        
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
