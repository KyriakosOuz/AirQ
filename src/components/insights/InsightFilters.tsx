
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  getValidEndDates, 
  isValidEndDate, 
  getFrequencyAdjustedDate,
  getTodayModifiers,
  getTodayStyles 
} from "@/lib/date-picker-utils";

interface InsightFiltersProps {
  activeTab: string;
  region: string;
  pollutant: Pollutant;
  year: number;
  startDate?: Date;
  endDate?: Date;
  onRegionChange: (value: string) => void;
  onPollutantChange: (value: Pollutant) => void;
  onYearChange: (value: string) => void;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  loading?: boolean;
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
  otherDate,
  isEndDate = false,
  disabled = false,
  onDateChange 
}: { 
  label: string;
  tooltip: string;
  date: Date | undefined;
  otherDate?: Date | undefined;
  isEndDate?: boolean;
  disabled?: boolean;
  onDateChange: (date: Date | undefined) => void;
}) => {
  const today = new Date();
  
  // Handle date selection
  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
  };

  // Get disabled dates function
  const getDisabledDates = (date: Date) => {
    if (isEndDate && otherDate) {
      // For end date, disable dates before start date
      return date < otherDate;
    }
    // For start date, disable future dates
    return date > today;
  };

  // Get modifiers for today highlighting
  const todayModifiers = getTodayModifiers(date, today);
  const todayStyles = getTodayStyles();

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
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={getDisabledDates}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            weekStartsOn={1}
            modifiers={todayModifiers}
            modifiersStyles={todayStyles}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export const InsightFilters: React.FC<InsightFiltersProps> = ({
  activeTab,
  region,
  pollutant,
  year,
  startDate,
  endDate,
  onRegionChange,
  onPollutantChange,
  onYearChange,
  onStartDateChange,
  onEndDateChange,
  loading = false
}) => {
  const years = Array.from({ length: 9 }, (_, i) => 2015 + i);

  // Determine which filters to show based on active tab
  const showRegion = activeTab === "trend" || activeTab === "seasonality";
  const showPollutant = true; // All tabs use pollutant
  const showYear = activeTab === "top-polluted";
  const showDateRange = activeTab === "trend";

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {showRegion && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Region</CardTitle>
            </CardHeader>
            <CardContent>
              <RegionSelector 
                value={region} 
                onValueChange={onRegionChange}
                disabled={loading}
              />
            </CardContent>
          </Card>
        )}
        
        {showPollutant && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pollutant</CardTitle>
            </CardHeader>
            <CardContent>
              <PollutantSelector 
                value={pollutant} 
                onValueChange={onPollutantChange}
                disabled={loading}
              />
            </CardContent>
          </Card>
        )}
        
        {showYear && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Year</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={year.toString()} 
                onValueChange={onYearChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((yearOption) => (
                    <SelectItem key={yearOption} value={yearOption.toString()}>
                      {yearOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Date range picker for Annual Trend tab */}
      {showDateRange && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                label="From Date"
                tooltip="Select the start date for the trend analysis"
                date={startDate}
                onDateChange={onStartDateChange || (() => {})}
                disabled={loading}
              />
              
              <DatePickerField
                label="To Date"
                tooltip="Select the end date for the trend analysis"
                date={endDate}
                otherDate={startDate}
                isEndDate={true}
                disabled={loading || !startDate}
                onDateChange={onEndDateChange || (() => {})}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
