
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

// Interface for a training record
export interface TrainingRecord {
  region: string;
  pollutant: string;
  date: string; // ISO string
  status: "complete" | "in-progress" | "failed";
  frequency?: string; // Optional: frequency used (D, W, M, Y)
  periods?: number;   // Optional: number of future periods
  datasetSize?: string; // Optional: size of dataset used for training
}

interface RecentTrainingsCardProps {
  recentTrainings: TrainingRecord[];
  formatters: {
    getRegionLabel: (regionValue: string) => string;
    getPollutantDisplay: (pollutantCode: string) => string;
    formatDate: (dateString?: string) => string;
  };
}

const RecentTrainingsCard: React.FC<RecentTrainingsCardProps> = ({
  recentTrainings,
  formatters,
}) => {
  // Helper function for badge styling
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800 border-green-200";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "";
    }
  };

  // Format frequency display
  const getFrequencyLabel = (freq?: string) => {
    if (!freq) return "Daily";
    
    const map: Record<string, string> = {
      "D": "Daily",
      "W": "Weekly", 
      "M": "Monthly",
      "Y": "Yearly"
    };
    
    return map[freq] || freq;
  };

  // Format forecast range
  const getForecastRange = (frequency?: string, periods?: number) => {
    if (!frequency || !periods) return "N/A";
    
    const unit = {
      "D": "days",
      "W": "weeks",
      "M": "months",
      "Y": "years"
    }[frequency] || "periods";
    
    return `Next ${periods} ${unit}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Information</CardTitle>
        <CardDescription>Details about the model training process</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted p-4 space-y-3">
          <div>
            <h4 className="text-sm font-medium">Model Type</h4>
            <p className="text-sm text-muted-foreground">
              Prophet (Facebook) time series forecasting model
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Training Process</h4>
            <p className="text-sm text-muted-foreground">
              The model will be trained on all available data for the selected region and pollutant.
              Training typically takes 1-2 minutes depending on data volume.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Requirements</h4>
            <p className="text-sm text-muted-foreground">
              At least 2 years of monthly data is recommended for accurate forecasts.
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Recent Model Trainings</h4>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Pollutant</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Forecast Range</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrainings.length > 0 ? (
                  recentTrainings.map((training, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatters.getRegionLabel(training.region)}</TableCell>
                      <TableCell>{formatters.getPollutantDisplay(training.pollutant)}</TableCell>
                      <TableCell>{getFrequencyLabel(training.frequency)}</TableCell>
                      <TableCell>{getForecastRange(training.frequency, training.periods)}</TableCell>
                      <TableCell>{formatters.formatDate(training.date)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getBadgeStyle(training.status)}
                        >
                          {training.status === "complete" && <CheckCircle size={14} className="mr-1" />}
                          {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      No recent model trainings
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTrainingsCard;
