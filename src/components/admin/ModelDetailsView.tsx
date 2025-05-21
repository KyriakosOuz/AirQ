
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, RefreshCw, AlertCircle, AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ModelDetails {
  id: string;
  region: string;
  pollutant: string;
  frequency: string;
  forecast_periods: number;
  created_at: string;
  trained_by?: string;
  status: string;
  accuracy_mae?: number;
  accuracy_rmse?: number;
  model_type?: string;
}

interface ModelDetailsViewProps {
  model: ModelDetails;
  formatters: {
    formatDate: (date?: string) => string;
    getRegionLabel: (region: string) => string;
    getPollutantDisplay: (pollutant: string) => string;
    getFrequencyDisplay: (frequency: string) => string;
  };
}

const ModelDetailsView: React.FC<ModelDetailsViewProps> = ({ model, formatters }) => {
  // Get status display badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="mr-1 h-3 w-3" /> Complete
          </Badge>
        );
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> Training
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="mr-1 h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render accuracy metric with tooltip
  const renderMetric = (label: string, value?: number, description?: string) => {
    if (value === undefined) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center space-y-1 p-3 bg-muted/30 rounded-md">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xl font-semibold">{value.toFixed(2)}</span>
              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="max-w-xs text-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="details">Model Details</TabsTrigger>
        <TabsTrigger value="metrics">Accuracy Metrics</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Region</span>
                <p className="font-medium">{formatters.getRegionLabel(model.region)}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Pollutant</span>
                <p className="font-medium">{formatters.getPollutantDisplay(model.pollutant)}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Frequency</span>
                <p className="font-medium">{formatters.getFrequencyDisplay(model.frequency)}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Forecast Periods</span>
                <p className="font-medium">{model.forecast_periods}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Model Type</span>
                <p className="font-medium">{model.model_type || "Prophet"}</p>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Status</span>
                <div>{getStatusBadge(model.status)}</div>
              </div>
              
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Created At</span>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                  <p className="font-medium">{formatters.formatDate(model.created_at)}</p>
                </div>
              </div>
              
              {model.trained_by && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Trained By</span>
                  <p className="font-medium">{model.trained_by}</p>
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <Button className="w-full" onClick={() => window.location.href = `/forecast?region=${model.region}&pollutant=${model.pollutant}`}>
                View in Forecast
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="metrics">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {renderMetric(
                  "Mean Absolute Error",
                  model.accuracy_mae,
                  "Average magnitude of errors in units. Lower values indicate better accuracy."
                )}
                
                {renderMetric(
                  "Root Mean Squared Error",
                  model.accuracy_rmse,
                  "Standard deviation of prediction errors. More weight to larger errors."
                )}
              </div>
              
              <div className="space-y-1 pt-2">
                <p className="text-sm font-medium">What do these metrics mean?</p>
                <p className="text-xs text-muted-foreground">
                  <strong>MAE (Mean Absolute Error):</strong> The average absolute difference between 
                  predicted and actual values. Lower values indicate better accuracy.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>RMSE (Root Mean Squared Error):</strong> The square root of the average squared 
                  differences between predicted and actual values. Penalizes large errors more heavily.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ModelDetailsView;
