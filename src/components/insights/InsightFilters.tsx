
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

// Helper components
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
  year,
  disabled = false,
  onDateChange 
}: { 
  label: string;
  tooltip: string;
  date: Date | undefined;
  year?: number;
  disabled?: boolean;
  onDateChange: (date: Date | undefined) => void;
}) => {
  // For seasonality tab, constrain dates to the selected year
  const getDisabledDates = (date: Date) => {
    if (year) {
      return date.getFullYear() !== year;
    }
    return date > new Date();
  };

  return (
    <div className="space-y-2">
      <LabelWithTooltip label={label} tooltip={tooltip} />
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
            onSelect={onDateChange}
            disabled={getDisabledDates}
            initialFocus
            className="p-3"
            weekStartsOn={1}
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
  const years = Array.from({ length: 8 }, (_, i) => 2017 + i); // 2017-2024

  // Determine which filters to show based on active tab
  const showRegion = activeTab === "trend" || activeTab === "seasonality";
  const showPollutant = true; // All tabs use pollutant
  const showYear = activeTab === "seasonality"; // Only seasonality needs year selector
  const showDateRange = activeTab === "seasonality"; // Only seasonality has date picker
  const showSingleDate = activeTab === "top-polluted"; // Top polluted uses single date

  return (
    <div className="space-y-4">
      {/* Tab-specific filter descriptions */}
      {activeTab === "trend" && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Annual Trend:</strong> Shows historical data across all available years for the selected region and pollutant.
          </p>
        </div>
      )}
      
      {activeTab === "seasonality" && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Seasonality:</strong> Shows seasonal patterns for a specific year. Select region, pollutant, year, and optionally narrow down to specific dates.
          </p>
        </div>
      )}
      
      {activeTab === "top-polluted" && (
        <div className="p-3 bg-purple-50 rounded-lg">
          <p className="text-sm text-purple-800">
            <strong>Top Polluted Areas:</strong> Compares all regions for a specific pollutant and date/period.
          </p>
        </div>
      )}

      {/* Main filters */}
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

      {/* Date controls for seasonality tab */}
      {showDateRange && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Date Range (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                label="From Date"
                tooltip={`Select start date within ${year} for seasonal analysis`}
                date={startDate}
                year={year}
                onDateChange={onStartDateChange || (() => {})}
                disabled={loading}
              />
              
              <DatePickerField
                label="To Date"
                tooltip={`Select end date within ${year} for seasonal analysis`}
                date={endDate}
                year={year}
                disabled={loading || !startDate}
                onDateChange={onEndDateChange || (() => {})}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single date picker for top polluted tab */}
      {showSingleDate && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <DatePickerField
              label="Select Date"
              tooltip="Choose a specific date to compare pollution levels across all regions"
              date={startDate}
              onDateChange={onStartDateChange || (() => {})}
              disabled={loading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
