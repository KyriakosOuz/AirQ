
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Calendar, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth, addDays } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";

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

const DatePickerField = ({ 
  label, 
  tooltip, 
  date,
  frequency,
  onDateChange 
}: { 
  label: string;
  tooltip: string;
  date: Date | undefined;
  frequency: string;
  onDateChange: (date: Date | undefined) => void;
}) => {
  // Date format based on frequency
  const getDateFormat = (selectedDate: Date) => {
    switch (frequency) {
      case "W":
        return `Week of ${format(startOfWeek(selectedDate), "MMM d, yyyy")}`;
      case "M":
        return format(selectedDate, "MMMM yyyy");
      default:
        return format(selectedDate, "PPP");
    }
  };

  // Handle date selection based on frequency
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onDateChange(undefined);
      return;
    }

    switch (frequency) {
      case "W":
        onDateChange(startOfWeek(selectedDate));
        break;
      case "M":
        onDateChange(startOfMonth(selectedDate));
        break;
      default:
        onDateChange(selectedDate);
        break;
    }
  };

  return (
    <div className="space-y-2">
      <LabelWithTooltip 
        label={label} 
        tooltip={tooltip} 
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {date ? getDateFormat(date) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            weekStartsOn={1} // Start week on Monday
            modifiersStyles={{
              selected: {
                backgroundColor: "var(--color-primary)",
                color: "white",
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const ForecastControls: React.FC<ForecastControlsProps> = ({
  region,
  pollutant,
  frequency,
  chartType,
  loading,
  startDate,
  endDate,
  onRegionChange,
  onPollutantChange,
  onFrequencyChange,
  onChartTypeChange,
  onStartDateChange,
  onEndDateChange,
  onUpdateForecast,
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-6">
          {/* Core controls - Region, Pollutant, Update button */}
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
            
            {/* Update button */}
            <div className="flex items-end">
              <Button 
                onClick={onUpdateForecast}
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>Update Forecast</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator className="my-1" />
          
          {/* Date Range Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date picker */}
            <DatePickerField
              label="Start Date"
              tooltip="Select the start date for your forecast range" 
              date={startDate}
              frequency={frequency}
              onDateChange={onStartDateChange}
            />
            
            {/* End Date picker */}
            <DatePickerField
              label="End Date"
              tooltip="Select the end date for your forecast range" 
              date={endDate}
              frequency={frequency}
              onDateChange={onEndDateChange}
            />
          </div>
          
          <Separator className="my-1" />
          
          {/* Additional controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastControls;
