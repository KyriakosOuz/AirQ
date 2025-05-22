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
import { AlertCircle, Clock, RefreshCw, LineChart } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FREQUENCY_OPTIONS, ModelMetadataFilters } from '@/lib/model-utils';
import { useDatasetAvailability } from '@/hooks/use-dataset-availability';
import { TrainingRecord } from './RecentTrainingsCard';

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
  frequencyOptions: typeof FREQUENCY_OPTIONS;
  availableRanges: number[];
  overwriteModel: boolean;
  setOverwriteModel: (value: boolean) => void;
  trainingError: string | null;
  modelExists?: boolean;
  isCheckingModel?: boolean;
  availableFilters?: ModelMetadataFilters | null;
  filtersLoading?: boolean;
  forecastLoading?: boolean;
  onPreviewForecast?: () => void;
  selectedPreviewModel?: TrainingRecord | null; // NEW: Add selected model prop
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
  filtersLoading = false,
  forecastLoading = false,
  onPreviewForecast,
  selectedPreviewModel = null
}) => {
  // Use our custom hook to check dataset availability
  const { isAvailable: datasetAvailable, isLoading: datasetCheckLoading } = 
    useDatasetAvailability({ region: trainRegion });

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

  // Check if training is allowed
  const isTrainingDisabled = trainLoading || isCheckingModel || 
    datasetCheckLoading || !datasetAvailable;
  
  // NEW: Determine if preview button should be enabled
  const isPreviewDisabled = trainLoading || forecastLoading || 
    (!selectedPreviewModel && !modelExists);
    
  // NEW: Get tooltip message for preview button
  const getPreviewTooltipMessage = () => {
    if (trainLoading) return "Please wait for training to complete";
    if (forecastLoading) return "Loading forecast data...";
    if (selectedPreviewModel) return `Preview forecast for ${selectedPreviewModel.pollutant} in ${selectedPreviewModel.region}`;
    if (!modelExists) return "No model available. Either select a model from the list or train a new one.";
    return "Preview forecast data for current parameters";
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
          <RegionSelector 
            value={trainRegion} 
            onValueChange={setTrainRegion}
            disabled={filtersLoading || trainLoading}
            regions={regions}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="pollutant" className="text-xs">Pollutant</Label>
          <PollutantSelector 
            value={trainPollutant} 
            onValueChange={setTrainPollutant}
            disabled={filtersLoading || trainLoading}
            pollutants={pollutants as Pollutant[]}
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="frequency" className="text-xs">Frequency</Label>
          <Select 
            value={trainFrequency} 
            onValueChange={setTrainFrequency}
            disabled={filtersLoading || trainLoading}
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
              disabled={trainLoading}
            />
          ) : (
            <Select
              value={trainPeriods.toString()}
              onValueChange={(value) => setTrainPeriods(parseInt(value))}
              disabled={trainLoading}
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
            disabled={trainLoading}
          />
        </div>
        
        {/* Dataset availability warning - Fixed alignment */}
        {!datasetAvailable && !datasetCheckLoading && (
          <Alert variant="destructive" className="py-2">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <AlertDescription className="text-xs">
                No dataset available for this region. Please upload data before training.
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {/* Display model exists warning - Fixed alignment */}
        {modelExists && !overwriteModel && (
          <Alert variant="warning" className="py-2">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <AlertDescription className="text-xs text-amber-700">
                A model with these parameters already exists. Enable "Retrain Model" to overwrite it.
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {/* Display training error if present - Fixed alignment */}
        {trainingError && (
          <Alert variant="destructive" className="py-2">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <AlertDescription className="text-xs">
                {trainingError}
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {/* Display loading indicator when checking model existence - Fixed alignment */}
        {isCheckingModel && (
          <div className="flex items-center justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
            <p className="text-xs text-muted-foreground">Checking if model exists...</p>
          </div>
        )}
        
        {/* Show loading state for dataset check - Fixed alignment */}
        {datasetCheckLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
            <p className="text-xs text-muted-foreground">Checking dataset availability...</p>
          </div>
        )}
        
        {/* NEW: Show selected model info - Fixed alignment */}
        {selectedPreviewModel && (
          <Alert variant="default" className="py-2 bg-green-50 border-green-200">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 text-green-600" />
              <AlertDescription className="text-xs text-green-700">
                Model selected: {selectedPreviewModel.pollutant} in {selectedPreviewModel.region} 
                {selectedPreviewModel.frequency ? ` (${selectedPreviewModel.frequency})` : ''}
              </AlertDescription>
            </div>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button 
          className="w-full" 
          disabled={isTrainingDisabled}
          onClick={onTrainModel}
          size="sm"
          variant={(modelExists && !overwriteModel) ? "outline" : "default"}
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
        
        {/* Show reason why button is disabled */}
        {!datasetAvailable && !datasetCheckLoading && (
          <p className="text-xs text-destructive mt-2 text-center">
            Training disabled: Dataset not available
          </p>
        )}
        
        {/* Preview Forecast Button with enhanced behavior */}
        {onPreviewForecast && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full mt-2">
                  <Button 
                    variant={selectedPreviewModel ? "success" : "outline"}
                    disabled={isPreviewDisabled}
                    onClick={onPreviewForecast}
                    className={`w-full ${selectedPreviewModel ? "bg-green-600 hover:bg-green-700" : ""}`}
                    size="sm"
                  >
                    {forecastLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : selectedPreviewModel ? (
                      <>
                        <LineChart className="mr-2 h-4 w-4" />
                        Preview Selected Model
                      </>
                    ) : (
                      <>
                        <LineChart className="mr-2 h-4 w-4" />
                        Preview Forecast
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {getPreviewTooltipMessage()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
};

export default TrainModelCard;
