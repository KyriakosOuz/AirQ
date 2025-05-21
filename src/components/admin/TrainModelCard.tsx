// Import required packages and components
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pollutant } from "@/lib/types";
import { RegionSelector } from "@/components/ui/region-selector";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { AlertCircle, Clock, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Updated interface for the frequency option
export interface FrequencyOption {
  value: string;
  label: string;
  ranges: number[]; // Array of available ranges
}

// Interface for ModelMetadataFilters
interface ModelMetadataFilters {
  available: Array<{
    region: string;
    pollutant: string;
    frequency: string;
  }>;
}

// Interface for TrainModelCard props
interface TrainModelCardProps {
  trainRegion: string;
  setTrainRegion: (region: string) => void;
  trainPollutant: Pollutant;
  setTrainPollutant: (pollutant: Pollutant) => void;
  trainFrequency: string;
  setTrainFrequency: (frequency: string) => void;
  trainPeriods: number;
  setTrainPeriods: (periods: number) => void;
  trainLoading: boolean;
  onTrainModel: () => void;
  frequencyOptions: FrequencyOption[];
  availableRanges: number[];
  overwriteModel: boolean;
  setOverwriteModel: (value: boolean) => void;
  trainingError: string | null;
  modelExists: boolean;
  isCheckingModel: boolean;
  availableFilters: ModelMetadataFilters | null;
  filtersLoading: boolean;
  forecastLoading: boolean;
  onPreviewForecast: (modelId: string, periods?: number) => void; // Updated type definition
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
  modelExists,
  isCheckingModel,
  availableFilters,
  filtersLoading,
  forecastLoading,
  onPreviewForecast
}) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Train New Model</CardTitle>
        <CardDescription>
          Select parameters and start training a new forecast model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableFilters && availableFilters.available.length === 0 && !filtersLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Datasets Available</AlertTitle>
            <AlertDescription>
              Please upload datasets to train a model.
            </AlertDescription>
          </Alert>
        )}
        
        {trainingError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Training Error</AlertTitle>
            <AlertDescription>
              {trainingError}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <RegionSelector value={trainRegion} onValueChange={setTrainRegion} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pollutant">Pollutant</Label>
          <PollutantSelector value={trainPollutant} onValueChange={setTrainPollutant} />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select onValueChange={setTrainFrequency} defaultValue={trainFrequency}>
            <SelectTrigger className="w-full">
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
          <Label htmlFor="periods">Forecast Periods</Label>
          <Select onValueChange={(value) => setTrainPeriods(parseInt(value))} defaultValue={trainPeriods.toString()}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select periods" />
            </SelectTrigger>
            <SelectContent>
              {availableRanges.map((range) => (
                <SelectItem key={range} value={range.toString()}>
                  {range} periods
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="overwrite">Retrain Model</Label>
          <Switch id="overwrite" checked={overwriteModel} onCheckedChange={setOverwriteModel} />
        </div>
        
        {modelExists && !overwriteModel && (
          <Alert variant="warning">
            <Info className="h-4 w-4" />
            <AlertTitle>Model Exists</AlertTitle>
            <AlertDescription>
              A model with these parameters already exists. Enable "Retrain Model" to overwrite it.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={onTrainModel} 
          disabled={trainLoading || isCheckingModel || filtersLoading || (modelExists && !overwriteModel)}
        >
          {trainLoading ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Training...
            </>
          ) : isCheckingModel ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Checking Model...
            </>
          ) : "Train Model"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TrainModelCard;
