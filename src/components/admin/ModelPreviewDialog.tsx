
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ForecastPreview from "./ForecastPreview";
import { Forecast, ModelDetails, Pollutant } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ModelPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  model: ModelDetails | null;
  forecast: Forecast[] | null;
  isLoading: boolean;
  error: string | null;
  formatters: {
    getRegionLabel: (region: string) => string;
    getPollutantDisplay: (pollutant: string) => string;
    getFrequencyDisplay: (frequency: string) => string;
  };
}

const ModelPreviewDialog: React.FC<ModelPreviewDialogProps> = ({
  isOpen,
  onClose,
  model,
  forecast,
  isLoading,
  error,
  formatters
}) => {
  if (!model) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Forecast for {formatters.getPollutantDisplay(model.pollutant)} in {formatters.getRegionLabel(model.region)}
          </DialogTitle>
          <DialogDescription>
            {formatters.getFrequencyDisplay(model.frequency)} forecast for the next {model.forecast_periods} periods
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Generating forecast preview...</p>
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isLoading && !error && forecast && (
          <ForecastPreview
            data={forecast}
            region={model.region}
            pollutant={model.pollutant as Pollutant}
            frequency={model.frequency}
            formatters={formatters}
          />
        )}
        
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModelPreviewDialog;
