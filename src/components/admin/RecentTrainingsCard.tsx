
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { MoreHorizontal, Eye, Trash2, BarChart3, CheckCircle2, Radio } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { modelApi } from "@/lib/api";
import { Pollutant } from "@/lib/types";
import { ModelStatus } from "@/lib/model-utils";

export interface TrainingRecord {
  id: string;
  region: string;
  pollutant: Pollutant;
  date: string;
  status: ModelStatus;
  frequency?: string;
  periods?: number;
  accuracy_mae?: number;
  accuracy_rmse?: number;
}

interface RecentTrainingsCardProps {
  recentTrainings: TrainingRecord[];
  formatters: {
    formatDate: (date: string) => string;
    getRegionLabel: (region: string) => string;
    getPollutantDisplay: (pollutant: string) => string;
    getFrequencyDisplay: (frequency: string) => string;
  };
  isLoading: boolean;
  onModelDeleted: () => void;
  onViewDetails: (modelId: string) => void;
  modelsToCompare: string[];
  onToggleCompare: (modelId: string) => void;
  onSelectForPreview: (modelId: string, selected: boolean) => void;
  selectedPreviewModel: string | null;
}

const RecentTrainingsCard: React.FC<RecentTrainingsCardProps> = ({
  recentTrainings,
  formatters,
  isLoading,
  onModelDeleted,
  onViewDetails,
  modelsToCompare,
  onToggleCompare,
  onSelectForPreview,
  selectedPreviewModel
}) => {
  const deleteModel = async (modelId: string) => {
    try {
      const response = await modelApi.delete(modelId);
      if (response.success) {
        toast.success("Model deleted successfully");
        onModelDeleted();
      } else {
        console.error("Failed to delete model:", response.error);
        toast.error("Failed to delete model");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Error deleting model");
    }
  };

  const getStatusBadge = (status: ModelStatus) => {
    const variants: Record<ModelStatus, "default" | "secondary" | "destructive" | "outline"> = {
      "complete": "default",
      "training": "secondary", 
      "failed": "destructive",
      "pending": "outline"
    };
    
    const labels: Record<ModelStatus, string> = {
      "complete": "Complete",
      "training": "Training",
      "failed": "Failed", 
      "pending": "Pending"
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Model Trainings</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton columns={6} rows={5} />
        ) : recentTrainings.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Pollutant</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Trained</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrainings.map((training) => (
                  <TableRow 
                    key={training.id}
                    className={selectedPreviewModel === training.id ? "bg-muted/50" : ""}
                  >
                    <TableCell className="font-medium">
                      {formatters.getRegionLabel(training.region)}
                    </TableCell>
                    <TableCell>
                      {formatters.getPollutantDisplay(training.pollutant)}
                    </TableCell>
                    <TableCell>
                      {training.frequency ? formatters.getFrequencyDisplay(training.frequency) : "N/A"}
                    </TableCell>
                    <TableCell>
                      {formatters.formatDate(training.date)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(training.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => onViewDetails(training.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onSelectForPreview(
                              training.id, 
                              selectedPreviewModel !== training.id
                            )}
                          >
                            {selectedPreviewModel === training.id ? (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Selected for Preview
                              </>
                            ) : (
                              <>
                                <Radio className="mr-2 h-4 w-4" />
                                Select for Preview
                              </>
                            )}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => onToggleCompare(training.id)}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {modelsToCompare.includes(training.id) ? 'Remove from' : 'Add to'} Comparison
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => deleteModel(training.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Model
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No models have been trained yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTrainingsCard;
