
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Pollutant } from "@/lib/types";
import { AlertCircle, Clock, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FrequencyOption {
  value: string;
  label: string;
  ranges: number[];
}

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
  frequencyOptions: FrequencyOption[];
  availableRanges: number[];
  overwriteModel: boolean;
  setOverwriteModel: (value: boolean) => void;
  trainingError: string | null;
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
  frequencyOptions,
  availableRanges,
  overwriteModel,
  setOverwriteModel,
  trainingError
}) => {
  // Helper to get the frequency display label
  const getFrequencyLabel = (value: string): string => {
    const option = frequencyOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Format period label based on frequency
  const formatPeriodLabel = (period: number, frequency: string): string => {
    const freqOption = frequencyOptions.find(f => f.value === frequency);
    if (!freqOption) return `${period}`;
    
    return `${period} ${freqOption.label.toLowerCase()}${period !== 1 ? 's' : ''}`;
  };
  
  return (
    <Card className="h-full overflow-auto">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg">
          <Clock className="mr-2 h-4 w-4" />
          Train Model
        </CardTitle>
        <CardDescription className="text-xs">
          Create a new forecasting model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="region" className="text-xs">Region</Label>
          <RegionSelector value={trainRegion} onValueChange={setTrainRegion} />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="pollutant" className="text-xs">Pollutant</Label>
          <PollutantSelector value={trainPollutant} onValueChange={setTrainPollutant} />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="frequency" className="text-xs">Frequency</Label>
          <Select value={trainFrequency} onValueChange={setTrainFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {frequencyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label} ({option.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="periods" className="text-xs">Forecast Period</Label>
            <span className="text-xs text-muted-foreground">
              {formatPeriodLabel(trainPeriods, trainFrequency)}
            </span>
          </div>
          
          {availableRanges.length > 5 ? (
            <Slider
              id="periods" 
              min={Math.min(...availableRanges)}
              max={Math.max(...availableRanges)}
              step={1}
              value={[trainPeriods]}
              onValueChange={(values) => setTrainPeriods(values[0])}
              className="py-2"
            />
          ) : (
            <Select
              value={trainPeriods.toString()}
              onValueChange={(value) => setTrainPeriods(parseInt(value))}
            >
              <SelectTrigger id="period-range">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {availableRanges.map((range) => (
                  <SelectItem key={range} value={range.toString()}>
                    {formatPeriodLabel(range, trainFrequency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <p className="text-xs text-muted-foreground">
            Forecasting {trainPeriods} {trainFrequency === "D" ? "days" : 
                          trainFrequency === "W" ? "weeks" : 
                          trainFrequency === "M" ? "months" : "years"} ahead
          </p>
        </div>
        
        {/* New Retrain Option */}
        <div className="flex items-center justify-between space-x-2 pt-2 pb-1">
          <div className="space-y-0.5">
            <Label htmlFor="retrain" className="text-xs">Retrain Model</Label>
            <p className="text-[10px] text-muted-foreground">
              Overwrite existing model if it already exists
            </p>
          </div>
          <Switch
            id="retrain"
            checked={overwriteModel}
            onCheckedChange={setOverwriteModel}
          />
        </div>
        
        {/* Display training error if present */}
        {trainingError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {trainingError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={trainLoading}
          onClick={onTrainModel}
          size="sm"
        >
          {trainLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Training...
            </>
          ) : overwriteModel ? "Retrain Model" : "Train Model"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrainModelCard;
