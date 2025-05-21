import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define the ModelDetails interface here to avoid conflicts
export interface ModelDetails {
  id: string;
  region: string;
  pollutant: string;
  frequency: string;
  forecast_periods: number;
  created_at: string;
  trained_by?: string;
  status: "complete" | "ready" | "in-progress" | "failed"; // Using string literals
  accuracy_mae?: number;
  accuracy_rmse?: number;
  model_type?: string;
}

interface ModelDetailsViewProps {
  model: ModelDetails;
  formatters: {
    formatDate: (dateString?: string) => string;
    getRegionLabel: (regionValue: string) => string;
    getPollutantDisplay: (pollutantCode: string) => string;
    getFrequencyDisplay?: (freqCode: string) => string;
  };
}

const ModelDetailsView: React.FC<ModelDetailsViewProps> = ({ model, formatters }) => {
  const { formatDate, getRegionLabel, getPollutantDisplay, getFrequencyDisplay } = formatters;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-2">Model Information</h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="py-2 font-medium">Region</TableCell>
                  <TableCell className="py-2">{getRegionLabel(model.region)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 font-medium">Pollutant</TableCell>
                  <TableCell className="py-2">{getPollutantDisplay(model.pollutant)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 font-medium">Frequency</TableCell>
                  <TableCell className="py-2">{getFrequencyDisplay(model.frequency)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 font-medium">Forecast Periods</TableCell>
                  <TableCell className="py-2">{model.forecast_periods}</TableCell>
                </TableRow>
                {model.model_type && (
                  <TableRow>
                    <TableCell className="py-2 font-medium">Model Type</TableCell>
                    <TableCell className="py-2">{model.model_type}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-2">Training Details</h3>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="py-2 font-medium">Trained On</TableCell>
                  <TableCell className="py-2">{formatDate(model.created_at)}</TableCell>
                </TableRow>
                {model.trained_by && (
                  <TableRow>
                    <TableCell className="py-2 font-medium">Trained By</TableCell>
                    <TableCell className="py-2">{model.trained_by}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="py-2 font-medium">Status</TableCell>
                  <TableCell className="py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      model.status === 'complete' || model.status === 'ready' ? 'bg-green-100 text-green-800' : 
                      model.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {model.status === 'complete' || model.status === 'ready' ? 'Ready' : 
                       model.status === 'in-progress' ? 'Training' : 
                       'Failed'}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 font-medium">
                    <div className="flex items-center space-x-1">
                      <span>MAE</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              Mean Absolute Error - Average absolute difference between predictions and actual values. Lower is better.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    {model.accuracy_mae !== undefined ? 
                      model.accuracy_mae.toFixed(2) : 
                      <span className="text-muted-foreground text-xs">Not available</span>
                    }
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="py-2 font-medium">
                    <div className="flex items-center space-x-1">
                      <span>RMSE</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 text-muted-foreground ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs">
                              Root Mean Square Error - Square root of the average of squared differences between predictions and actual values. More sensitive to outliers. Lower is better.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className="py-2">
                    {model.accuracy_rmse !== undefined ? 
                      model.accuracy_rmse.toFixed(2) : 
                      <span className="text-muted-foreground text-xs">Not available</span>
                    }
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Separator />
      
      <div className="text-sm text-muted-foreground">
        <div className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <p>
            This model will be used for all {getPollutantDisplay(model.pollutant)} forecasts in {getRegionLabel(model.region)} with {getFrequencyDisplay(model.frequency).toLowerCase()} frequency.
          </p>
        </div>
        {model.accuracy_mae !== undefined && model.accuracy_rmse !== undefined && (
          <p className="mt-2 ml-6">
            Based on the error metrics (MAE: {model.accuracy_mae.toFixed(2)}, RMSE: {model.accuracy_rmse.toFixed(2)}), this model has 
            {model.accuracy_mae < 10 ? ' excellent ' : model.accuracy_mae < 20 ? ' good ' : ' moderate '}
            accuracy for forecasting {getPollutantDisplay(model.pollutant)} levels.
          </p>
        )}
      </div>
    </div>
  );
};

export default ModelDetailsView;
