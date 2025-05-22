
import * as React from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RangeOption {
  value: number;
  label: string;
}

interface ForecastRangeSelectorProps {
  mode: "periods" | "daterange";
  periods: number;
  startDate?: Date;
  endDate?: Date;
  frequency: string;
  periodOptions: Record<string, number[]>;
  onModeChange: (mode: "periods" | "daterange") => void;
  onPeriodsChange: (value: number) => void;
  onStartDateChange: (date?: Date) => void;
  onEndDateChange: (date?: Date) => void;
}

export function ForecastRangeSelector({
  mode,
  periods,
  startDate,
  endDate,
  frequency,
  periodOptions,
  onModeChange,
  onPeriodsChange,
  onStartDateChange,
  onEndDateChange
}: ForecastRangeSelectorProps) {
  const formatFrequencyLabel = (freq: string, count: number) => {
    switch (freq) {
      case "D":
        return `${count} day${count !== 1 ? 's' : ''}`;
      case "W":
        return `${count} week${count !== 1 ? 's' : ''}`;
      case "M":
        return `${count} month${count !== 1 ? 's' : ''}`;
      case "Y":
        return `${count} year${count !== 1 ? 's' : ''}`;
      default:
        return `${count} period${count !== 1 ? 's' : ''}`;
    }
  };

  const handleTabChange = (value: string) => {
    onModeChange(value as "periods" | "daterange");
  };

  return (
    <Tabs value={mode} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid grid-cols-2 h-9">
        <TabsTrigger value="periods" className="text-xs">Periods</TabsTrigger>
        <TabsTrigger value="daterange" className="text-xs">Date Range</TabsTrigger>
      </TabsList>
      
      <TabsContent value="periods" className="pt-2">
        {frequency === "D" ? (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs">{formatFrequencyLabel(frequency, periods)}</span>
              <span className="text-xs">
                {formatFrequencyLabel(frequency, Math.max(...(periodOptions[frequency] || [365])))}
              </span>
            </div>
            <Slider 
              value={[periods]} 
              min={Math.min(...(periodOptions[frequency] || [7]))} 
              max={Math.max(...(periodOptions[frequency] || [365]))} 
              step={1} 
              onValueChange={(value) => onPeriodsChange(value[0])} 
              className="py-1"
            />
          </div>
        ) : (
          <Select 
            value={periods.toString()} 
            onValueChange={(val) => onPeriodsChange(parseInt(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select periods" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions[frequency]?.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {formatFrequencyLabel(frequency, option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </TabsContent>
      
      <TabsContent value="daterange" className="pt-2 space-y-2">
        <div className="grid gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-full text-sm",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal w-full text-sm",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
                disabled={(date) => 
                  (startDate ? date < startDate : false)
                }
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </TabsContent>
    </Tabs>
  );
}
