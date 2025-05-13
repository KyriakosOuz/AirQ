
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Pollutant } from "@/lib/types";
import { Play, Loader, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

interface TrainModelCardProps {
  trainRegion: string;
  setTrainRegion: (value: string) => void;
  trainPollutant: Pollutant;
  setTrainPollutant: (value: Pollutant) => void;
  trainFrequency: string;
  setTrainFrequency: (value: string) => void;
  trainPeriods: number;
  setTrainPeriods: (value: number) => void;
  trainLoading: boolean;
  onTrainModel: () => void;
  overrideYears: boolean;
  setOverrideYears: (value: boolean) => void;
  startYear: number;
  setStartYear: (value: number) => void;
  endYear: number;
  setEndYear: (value: number) => void;
}

const TrainModelCard: React.FC<TrainModelCardProps> = ({
  trainRegion,
  setTrainRegion,
  trainPollutant,
  setTrainPollutant,
  trainFrequency,
  setTrainFrequency,
  trainPeriods,
  setTrainPeriods,
  trainLoading,
  onTrainModel,
  overrideYears,
  setOverrideYears,
  startYear,
  setStartYear,
  endYear,
  setEndYear,
}) => {
  // Frequency options mapping
  const frequencyOptions = [
    { value: "D", label: "Daily" },
    { value: "W", label: "Weekly" },
    { value: "M", label: "Monthly" },
    { value: "Y", label: "Yearly" }
  ];

  // Update periods when frequency changes to provide smart defaults
  useEffect(() => {
    const defaultPeriods = {
      "D": 365,  // days in a year
      "W": 52,   // weeks in a year
      "M": 12,   // months in a year
      "Y": 2     // years
    };
    setTrainPeriods(defaultPeriods[trainFrequency as keyof typeof defaultPeriods]);
  }, [trainFrequency, setTrainPeriods]);

  // Generate year options for dropdowns
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 25 }, (_, i) => currentYear - 24 + i);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Train Forecast Model</CardTitle>
        <CardDescription>
          Start model training for a specific pollutant in a region
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Region</Label>
          <RegionSelector value={trainRegion} onValueChange={setTrainRegion} />
        </div>
        <div className="space-y-2">
          <Label>Pollutant</Label>
          <PollutantSelector value={trainPollutant} onValueChange={setTrainPollutant} />
        </div>
        <div className="space-y-2">
          <Label>Forecast Frequency</Label>
          <Select value={trainFrequency} onValueChange={setTrainFrequency}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {frequencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label>Number of Future Periods</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Periods info</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>e.g. 365 for days, 52 for weeks, 12 for months, 2 for years</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input 
            type="number" 
            min={1} 
            max={1000} 
            value={trainPeriods} 
            onChange={(e) => setTrainPeriods(parseInt(e.target.value) || 365)} 
          />
        </div>
        
        {/* Override Training Years Section */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="override-years" className="cursor-pointer">Override Training Years</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <span className="sr-only">Override years info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Limit the data used for training to a specific year range</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch 
              id="override-years" 
              checked={overrideYears} 
              onCheckedChange={setOverrideYears}
            />
          </div>
          
          {overrideYears && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-year">Start Year</Label>
                <Select value={startYear.toString()} onValueChange={(value) => setStartYear(parseInt(value))}>
                  <SelectTrigger id="start-year">
                    <SelectValue placeholder="Select start year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={`start-${year}`} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-year">End Year</Label>
                <Select value={endYear.toString()} onValueChange={(value) => setEndYear(parseInt(value))}>
                  <SelectTrigger id="end-year">
                    <SelectValue placeholder="Select end year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.filter(year => year >= startYear).map((year) => (
                      <SelectItem key={`end-${year}`} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onTrainModel} 
          disabled={trainLoading}
          className="w-full"
        >
          {trainLoading ? (
            <>
              <Loader size={20} className="mr-2 animate-spin" />
              Training...
            </>
          ) : (
            <>
              <Play size={20} className="mr-2" />
              Start Training
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrainModelCard;
