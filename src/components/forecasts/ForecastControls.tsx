
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Calendar, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

// Helper components for better organization
const LabelWithTooltip = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <div className="flex items-center gap-1">
    <label className="text-sm font-medium">{label}</label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span><Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="w-[200px] text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

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
  const isMobile = useIsMobile();
  
  // Get display text for the frequency
  const frequencyDisplay = {
    "D": "days",
    "W": "weeks",
    "M": "months"
  }[frequency];

  // Minimum and maximum values for the slider based on frequency
  const sliderMin = frequency === "D" ? 7 : frequency === "W" ? 4 : 3;
  const sliderMax = frequency === "D" ? 60 : frequency === "W" ? 24 : 12;

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-6">
          {/* Main controls section - always visible */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Region selector */}
            <div className="space-y-2">
              <LabelWithTooltip 
                label="Region" 
                tooltip="Select a region to view air quality forecasts for that area" 
              />
              <RegionSelector value={region} onValueChange={onRegionChange} />
            </div>
            
            {/* Pollutant selector */}
            <div className="space-y-2">
              <LabelWithTooltip
                label="Pollutant"
                tooltip="Different pollutants have varying health impacts. NO₂ affects respiratory system, O₃ (ozone) can irritate airways, etc."
              />
              <PollutantSelector value={pollutant} onValueChange={onPollutantChange} />
            </div>
            
            {/* Update button - moved to top level for better visibility */}
            <div className="flex items-end">
              <Button 
                onClick={onUpdateForecast}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Update Forecast</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator className="my-1" />
          
          {/* Mode selector tabs */}
          <div className="space-y-2">
            <LabelWithTooltip 
              label="Forecast Mode" 
              tooltip="Choose between predicting a number of periods or a specific date range"
            />
            <RadioGroup 
              value={forecastMode} 
              onValueChange={(value) => onForecastModeChange(value as "periods" | "daterange")}
              className="flex space-x-1"
            >
              <div className="flex items-center space-x-2 rounded-md border px-3 py-2 flex-1">
                <RadioGroupItem value="periods" id="periods" />
                <label htmlFor="periods" className="text-sm font-medium cursor-pointer">Simple (Periods)</label>
              </div>
              <div className="flex items-center space-x-2 rounded-md border px-3 py-2 flex-1">
                <RadioGroupItem value="daterange" id="daterange" />
                <label htmlFor="daterange" className="text-sm font-medium cursor-pointer">Advanced (Date Range)</label>
              </div>
            </RadioGroup>
          </div>
          
          <Separator className="my-1" />
          
          {/* Mode-specific controls */}
          {forecastMode === "periods" ? (
            <div className="space-y-6">
              {/* Frequency toggle group */}
              <div className="space-y-2">
                <LabelWithTooltip 
                  label="Frequency" 
                  tooltip="Choose how frequently forecast data is presented"
                />
                <ToggleGroup type="single" value={frequency} onValueChange={onFrequencyChange} className="justify-start">
                  <ToggleGroupItem value="D" size="sm">Daily</ToggleGroupItem>
                  <ToggleGroupItem value="W" size="sm">Weekly</ToggleGroupItem>
                  <ToggleGroupItem value="M" size="sm">Monthly</ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              {/* Forecast range slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <LabelWithTooltip 
                    label="Forecast Range" 
                    tooltip="Adjust how far into the future you want to see forecasts" 
                  />
                  <span className="text-sm text-muted-foreground">
                    {periods} {frequencyDisplay}
                  </span>
                </div>
                <div className="px-1 py-2">
                  <Slider
                    value={[periods]}
                    min={sliderMin}
                    max={sliderMax}
                    step={1}
                    onValueChange={(value) => onPeriodsChange(value[0])}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date Range Picker - Start Date */}
              <div className="space-y-2">
                <LabelWithTooltip 
                  label="Start Date" 
                  tooltip="Select the start date for your forecast range" 
                />
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
              
              {/* Date Range Picker - End Date */}
              <div className="space-y-2">
                <LabelWithTooltip 
                  label="End Date" 
                  tooltip="Select the end date for your forecast range" 
                />
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
          
          <Separator className="my-1" />
          
          {/* Chart type selection */}
          <div className="space-y-2">
            <LabelWithTooltip 
              label="Chart Type" 
              tooltip="Choose between bar chart or line chart visualization" 
            />
            <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && onChartTypeChange(value as "bar" | "line")} className="justify-start">
              <ToggleGroupItem value="bar" size="sm">Bar Chart</ToggleGroupItem>
              <ToggleGroupItem value="line" size="sm">Line Chart</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastControls;
