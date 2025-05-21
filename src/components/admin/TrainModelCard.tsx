
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FrequencyOption {
  value: string;
  label: string;
  ranges: number[];
}

interface FilterMetadata {
  available: Array<{
    region: string;
    pollutant: string;
    frequency: string;
  }>;
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
  modelExists?: boolean;
  isCheckingModel?: boolean;
  availableFilters?: FilterMetadata | null;
  filtersLoading?: boolean;
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
  trainingError,
  modelExists = false,
  isCheckingModel = false,
  availableFilters = null,
  filtersLoading = false
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

  // Extract unique regions, pollutants, and frequencies from available filters
  const extractUniqueValues = () => {
    if (!availableFilters || !availableFilters.available) {
      return {
        regions: [],
        pollutants: [],
        frequencies: []
      };
    }

    const regions = [...new Set(availableFilters.available.map(item => item.region))];
    const pollutants = [...new Set(availableFilters.available.map(item => item.pollutant))];
    const frequencies = [...new Set(availableFilters.available.map(item => item.frequency))];

    return { regions, pollutants, frequencies };
  };

  const { regions, pollutants, frequencies } = extractUniqueValues();
  
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
          <RegionSelector 
            value={trainRegion} 
            onValueChange={setTrainRegion}
            disabled={filtersLoading}
            regions={regions}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="pollutant" className="text-xs">Pollutant</Label>
          <PollutantSelector 
            value={trainPollutant} 
            onValueChange={setTrainPollutant}
            disabled={filtersLoading}
            pollutants={pollutants as Pollutant[]}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="frequency" className="text-xs">Frequency</Label>
          <Select 
            value={trainFrequency} 
            onValueChange={setTrainFrequency}
            disabled={filtersLoading}
          >
            <SelectTrigger id="frequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {(frequencies.length > 0 
                ? frequencyOptions.filter(opt => frequencies.includes(opt.value)) 
                : frequencyOptions
              ).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Label htmlFor="periods" className="text-xs">Forecast Period</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full p-0">
                      <AlertCircle className="h-3 w-3" />
                      <span className="sr-only">Info</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      The number of time periods to forecast into the future.
                      Larger values may decrease accuracy but provide longer-term predictions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
            Forecasting {trainPeriods} {trainFrequency === "daily" ? "days" : 
                         trainFrequency === "weekly" ? "weeks" : 
                         trainFrequency === "monthly" ? "months" : "years"} ahead
          </p>
        </div>
        
        {/* Retrain Option */}
        <div className="flex items-center justify-between space-x-2 pt-2 pb-1">
          <div className="space-y-0.5">
            <Label 
              htmlFor="retrain" 
              className={`text-xs ${modelExists ? "font-semibold text-amber-600" : ""}`}
            >
              Retrain Model
              {modelExists && " (Recommended)"}
            </Label>
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
        
        {/* Display model exists warning */}
        {modelExists && !overwriteModel && (
          <Alert variant="warning" className="py-2 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-700">
              A model with these parameters already exists. Enable "Retrain Model" to overwrite it.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Display training error if present */}
        {trainingError && (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {trainingError}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Display loading indicator when checking model existence */}
        {isCheckingModel && (
          <div className="flex items-center justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
            <p className="text-xs text-muted-foreground">Checking if model exists...</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          disabled={trainLoading || isCheckingModel}
          onClick={onTrainModel}
          size="sm"
          variant={modelExists && !overwriteModel ? "outline" : "default"}
        >
          {trainLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Training...
            </>
          ) : isCheckingModel ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : overwriteModel ? "Retrain Model" : "Train Model"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrainModelCard;
