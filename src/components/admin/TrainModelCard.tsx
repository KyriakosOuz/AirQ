
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { RegionSelector } from "@/components/ui/region-selector";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, RefreshCw, LineChart, Info, Sliders } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pollutant } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrainingRecord } from "./RecentTrainingsCard";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Interface for form data
interface TrainModelFormData {
  region: string;
  pollutant: Pollutant;
  frequency: string;
  periods: number;
  overwrite: boolean;
  useCustomRange: boolean;
}

// Interface for metadata filters from API
interface ModelMetadataFilters {
  available: Array<{
    region: string;
    pollutant: string;
    frequency: string;
  }>;
}

// Frequency option type
interface FrequencyOption {
  value: string;
  label: string;
  ranges: number[];
  minPeriod: number;
  maxPeriod: number;
}

// Props for the TrainModelCard component
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
  frequencyOptions: Array<FrequencyOption>;
  availableRanges: number[];
  overwriteModel: boolean;
  setOverwriteModel: (overwrite: boolean) => void;
  trainingError: string | null;
  modelExists: boolean;
  isCheckingModel: boolean;
  availableFilters: ModelMetadataFilters | null;
  filtersLoading: boolean;
  forecastLoading: boolean;
  onPreviewForecast: () => void;
  selectedModel?: TrainingRecord | null;
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
  onPreviewForecast,
  selectedModel
}) => {
  // State for custom period input
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [customPeriodValue, setCustomPeriodValue] = useState<string>(trainPeriods.toString());

  // Find the current frequency option
  const currentFrequencyOption = React.useMemo(() => {
    return frequencyOptions.find(opt => opt.value === trainFrequency) || frequencyOptions[0];
  }, [frequencyOptions, trainFrequency]);
  
  // Get available regions and pollutants from filters
  const availableRegions = React.useMemo(() => {
    if (!availableFilters) return [];
    
    const regions = new Set<string>();
    availableFilters.available.forEach(item => {
      regions.add(item.region);
    });
    
    return Array.from(regions);
  }, [availableFilters]);
  
  const availablePollutants = React.useMemo(() => {
    if (!availableFilters) return [];
    
    const pollutants = new Set<string>();
    availableFilters.available.forEach(item => {
      pollutants.add(item.pollutant);
    });
    
    return Array.from(pollutants) as Pollutant[];
  }, [availableFilters]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTrainModel();
  };

  // Handle custom period input change
  const handleCustomPeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomPeriodValue(value);
    
    if (value && !isNaN(Number(value))) {
      const numValue = parseInt(value, 10);
      if (numValue >= currentFrequencyOption.minPeriod && 
          numValue <= currentFrequencyOption.maxPeriod) {
        setTrainPeriods(numValue);
      }
    }
  };

  // Toggle between preset and custom period input
  const handleToggleCustomRange = (checked: boolean) => {
    setUseCustomRange(checked);
    if (!checked) {
      // When switching back to preset, set value to closest available preset
      const closestPreset = findClosestPreset(trainPeriods, availableRanges);
      setTrainPeriods(closestPreset);
      setCustomPeriodValue(closestPreset.toString());
    }
  };

  // Find closest preset value to current custom value
  const findClosestPreset = (value: number, presets: number[]): number => {
    if (presets.length === 0) return value;
    return presets.reduce((prev, curr) => {
      return (Math.abs(curr - value) < Math.abs(prev - value)) ? curr : prev;
    });
  };

  // When frequency changes, update periods to a valid value for that frequency
  React.useEffect(() => {
    if (!useCustomRange && availableRanges.length > 0) {
      setTrainPeriods(availableRanges[0]);
      setCustomPeriodValue(availableRanges[0].toString());
    } else if (useCustomRange) {
      // Validate current period is within new frequency's range
      const newFrequencyOption = frequencyOptions.find(opt => opt.value === trainFrequency);
      if (newFrequencyOption) {
        if (trainPeriods < newFrequencyOption.minPeriod) {
          setTrainPeriods(newFrequencyOption.minPeriod);
          setCustomPeriodValue(newFrequencyOption.minPeriod.toString());
        } else if (trainPeriods > newFrequencyOption.maxPeriod) {
          setTrainPeriods(newFrequencyOption.maxPeriod);
          setCustomPeriodValue(newFrequencyOption.maxPeriod.toString());
        }
      }
    }
  }, [trainFrequency, availableRanges, useCustomRange, frequencyOptions]);
  
  // Show selected model info if available
  const showSelectedModelInfo = selectedModel && selectedModel.status === "complete";
  
  // Determine if preview button should be enabled
  const isPreviewEnabled = selectedModel 
    ? selectedModel.status === "complete"  // For selected model: only if complete
    : modelExists && !trainLoading && !forecastLoading;  // For form params: if model exists and not loading
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Train Forecasting Model</CardTitle>
        <CardDescription>Create and train a new forecasting model for air quality prediction</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Selected Model Info */}
          {showSelectedModelInfo && (
            <Alert variant="default" className="bg-blue-50 mb-4">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Selected Model</AlertTitle>
              <AlertDescription className="text-xs">
                You've selected a model: {selectedModel.region} / {selectedModel.pollutant} / {selectedModel.frequency}
              </AlertDescription>
            </Alert>
          )}

          {/* Region Selection */}
          <div className="space-y-2">
            <Label htmlFor="region-selector">Region</Label>
            <RegionSelector 
              value={trainRegion} 
              onValueChange={setTrainRegion}
              disabled={trainLoading || filtersLoading}
              regions={availableRegions}
            />
          </div>
          
          {/* Pollutant Selection */}
          <div className="space-y-2">
            <Label htmlFor="pollutant-selector">Pollutant</Label>
            <PollutantSelector
              value={trainPollutant}
              onValueChange={setTrainPollutant}
              disabled={trainLoading || filtersLoading}
              pollutants={availablePollutants}
            />
          </div>
          
          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Forecast Frequency</Label>
            <Select 
              value={trainFrequency} 
              onValueChange={setTrainFrequency}
              disabled={trainLoading}
            >
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              How often the forecast values will be calculated
            </p>
          </div>
          
          {/* Custom Range Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox 
              id="custom-range"
              checked={useCustomRange}
              onCheckedChange={handleToggleCustomRange}
              disabled={trainLoading}
            />
            <Label 
              htmlFor="custom-range" 
              className="text-sm font-normal cursor-pointer"
            >
              Use custom period range
            </Label>
          </div>

          {/* Periods Selection - Conditional Rendering */}
          {!useCustomRange ? (
            // Dropdown for preset periods
            <div className="space-y-2">
              <Label htmlFor="periods">Forecast Periods</Label>
              <Select 
                value={trainPeriods.toString()} 
                onValueChange={(value) => setTrainPeriods(Number(value))}
                disabled={trainLoading}
              >
                <SelectTrigger id="periods">
                  <SelectValue placeholder="Select number of periods" />
                </SelectTrigger>
                <SelectContent>
                  {availableRanges.map(range => (
                    <SelectItem key={range} value={range.toString()}>
                      {range} {trainFrequency === "daily" ? "days" : 
                              trainFrequency === "weekly" ? "weeks" : 
                              trainFrequency === "monthly" ? "months" : "years"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                The number of future time periods to forecast
              </p>
            </div>
          ) : (
            // Input for custom period range
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="custom-periods">Custom Forecast Periods</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>Valid range for {currentFrequencyOption.label}: 
                        {currentFrequencyOption.minPeriod} - {currentFrequencyOption.maxPeriod} {
                          trainFrequency === "daily" ? "days" : 
                          trainFrequency === "weekly" ? "weeks" : 
                          trainFrequency === "monthly" ? "months" : "years"
                        }
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  id="custom-periods"
                  type="number"
                  value={customPeriodValue}
                  onChange={handleCustomPeriodChange}
                  className="w-full"
                  min={currentFrequencyOption.minPeriod}
                  max={currentFrequencyOption.maxPeriod}
                  disabled={trainLoading}
                />
                <span className="text-sm">
                  {trainFrequency === "daily" ? "days" : 
                   trainFrequency === "weekly" ? "weeks" : 
                   trainFrequency === "monthly" ? "months" : "years"}
                </span>
              </div>
              {parseInt(customPeriodValue) < currentFrequencyOption.minPeriod || 
               parseInt(customPeriodValue) > currentFrequencyOption.maxPeriod ? (
                <p className="text-xs text-destructive mt-1">
                  Value must be between {currentFrequencyOption.minPeriod} and {currentFrequencyOption.maxPeriod}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  The number of future time periods to forecast
                </p>
              )}
            </div>
          )}
          
          {/* Model Already Exists Warning */}
          {modelExists && !overwriteModel && (
            <Alert variant="warning" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Model Already Exists</AlertTitle>
              <AlertDescription className="text-xs">
                A model with these parameters already exists. 
                Use "Retrain Model" option below to overwrite it.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Alert */}
          {trainingError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Training Error</AlertTitle>
              <AlertDescription className="text-xs">
                {trainingError}
              </AlertDescription>
            </Alert>
          )}
          
          <Separator className="my-4" />
          
          {/* Overwrite Option */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="overwrite" className="text-sm font-medium">
                Retrain Model
              </Label>
              <p className="text-xs text-muted-foreground">
                Overwrite existing model if one exists
              </p>
            </div>
            <Switch
              id="overwrite"
              checked={overwriteModel}
              onCheckedChange={setOverwriteModel}
              disabled={trainLoading}
            />
          </div>
          
        </CardContent>
        <CardFooter className="flex flex-col">
          {/* Train Model Button */}
          <Button 
            type="submit" 
            disabled={trainLoading || isCheckingModel || 
              (useCustomRange && (
                parseInt(customPeriodValue) < currentFrequencyOption.minPeriod || 
                parseInt(customPeriodValue) > currentFrequencyOption.maxPeriod ||
                !customPeriodValue
              ))
            }
            className="w-full"
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
          
          {/* Preview Forecast Button with enhanced behavior */}
          {onPreviewForecast && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full mt-2">
                    <Button 
                      variant="outline" 
                      disabled={!isPreviewEnabled}
                      onClick={onPreviewForecast}
                      className="w-full"
                      size="sm"
                      type="button"
                    >
                      {forecastLoading ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
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
                  {trainLoading ? (
                    "Please wait for training to complete"
                  ) : forecastLoading ? (
                    "Loading forecast data..."
                  ) : selectedModel ? (
                    "Preview forecast for selected model"
                  ) : !modelExists ? (
                    "No model available yet. Train a model first."
                  ) : (
                    "Preview forecast data for current parameters"
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default TrainModelCard;
