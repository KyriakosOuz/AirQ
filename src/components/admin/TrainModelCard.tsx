
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
