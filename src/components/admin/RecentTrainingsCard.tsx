
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Clock, Trash2, Search, ArrowDownAZ, ArrowUpAZ, ChevronDown, BadgeCheck, Info } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { modelApi } from "@/lib/api";

// Interface for a training record
export interface TrainingRecord {
  id: string;            // Added model ID for deletion
  region: string;
  pollutant: string;
  date: string; // ISO string
  status: "complete" | "in-progress" | "failed";
  frequency?: string; // Optional: frequency used (D, W, M, Y)
  periods?: number;   // Optional: number of future periods
  datasetSize?: string; // Optional: size of dataset used for training
  accuracy_mae?: number; // Added: Mean Absolute Error
  accuracy_rmse?: number; // Added: Root Mean Squared Error
}

interface RecentTrainingsCardProps {
  recentTrainings: TrainingRecord[];
  formatters: {
    getRegionLabel: (regionValue: string) => string;
    getPollutantDisplay: (pollutantCode: string) => string;
    formatDate: (dateString?: string) => string;
  };
  isLoading?: boolean;
  onModelDeleted?: () => void; // Callback for when a model is deleted
}

type SortOption = "newest" | "oldest" | "region-asc" | "region-desc";

const RecentTrainingsCard: React.FC<RecentTrainingsCardProps> = ({
  recentTrainings,
  formatters,
  isLoading = false,
  onModelDeleted
}) => {
  // State for confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);
  
  // State for search and sort
  const [searchText, setSearchText] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  
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

  // Get accuracy class based on value
  const getAccuracyClass = (value: number | undefined): string => {
    if (value === undefined) return "text-gray-500";
    if (value < 5) return "text-green-600";
    if (value < 10) return "text-yellow-600";
    return "text-red-600";
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

  // Helper function for status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle size={14} className="mr-1" />;
      case "in-progress":
        return <Clock size={14} className="mr-1" />;
      case "failed":
        return <AlertCircle size={14} className="mr-1" />;
      default:
        return null;
    }
  };

  // Handle model deletion
  const handleDeleteConfirm = async () => {
    if (!modelToDelete) return;
    
    try {
      const response = await modelApi.delete(modelToDelete);
      if (response.success) {
        toast.success("Model deleted successfully");
        if (onModelDeleted) {
          onModelDeleted();
        }
      } else {
        toast.error(response.error || "Failed to delete model");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("An error occurred while deleting the model");
    }
    
    setDeleteDialogOpen(false);
    setModelToDelete(null);
  };

  // Handle delete button click
  const handleDeleteClick = (id: string) => {
    setModelToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Get sort option label
  const getSortOptionLabel = (option: SortOption): string => {
    switch (option) {
      case "newest": return "Newest First";
      case "oldest": return "Oldest First";
      case "region-asc": return "Region A–Z";
      case "region-desc": return "Region Z–A";
      default: return "Sort By";
    }
  };

  // Filter and sort trainings
  const filteredAndSortedTrainings = useMemo(() => {
    // First filter by search text
    const filtered = searchText.trim() === "" 
      ? recentTrainings
      : recentTrainings.filter(training => 
          formatters.getRegionLabel(training.region)
            .toLowerCase()
            .includes(searchText.toLowerCase()));
    
    // Then sort based on sortOption
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "region-asc":
          return formatters.getRegionLabel(a.region).localeCompare(formatters.getRegionLabel(b.region));
        case "region-desc":
          return formatters.getRegionLabel(b.region).localeCompare(formatters.getRegionLabel(a.region));
        default:
          return 0;
      }
    });
  }, [recentTrainings, searchText, sortOption, formatters]);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle>Recent Model Trainings</CardTitle>
          <CardDescription>Recently trained forecasting models</CardDescription>
          
          {/* Filter and Sort Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by region name..."
                className="pl-9"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-shrink-0 min-w-[140px] justify-between">
                  {getSortOptionLabel(sortOption)}
                  <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption("newest")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("oldest")}>
                  <Clock className="mr-2 h-4 w-4" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("region-asc")}>
                  <ArrowDownAZ className="mr-2 h-4 w-4" />
                  Region A–Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("region-desc")}>
                  <ArrowUpAZ className="mr-2 h-4 w-4" />
                  Region Z–A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {isLoading ? (
              <TableSkeleton columns={7} rows={3} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Pollutant</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Forecast Range</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        Accuracy
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">MAE: Mean Absolute Error</p>
                            <p className="text-xs">RMSE: Root Mean Square Error</p>
                            <p className="text-xs mt-1">Lower values indicate better accuracy</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTrainings.length > 0 ? (
                    filteredAndSortedTrainings.map((training, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatters.getRegionLabel(training.region)}</TableCell>
                        <TableCell>{formatters.getPollutantDisplay(training.pollutant)}</TableCell>
                        <TableCell>{getFrequencyLabel(training.frequency)}</TableCell>
                        <TableCell>{getForecastRange(training.frequency, training.periods)}</TableCell>
                        <TableCell>
                          {training.accuracy_mae !== undefined || training.accuracy_rmse !== undefined ? (
                            <div className="space-y-1">
                              {training.accuracy_mae !== undefined && (
                                <div className="flex items-center">
                                  <Badge variant="outline" className="py-0 h-5 text-xs font-normal">
                                    <BadgeCheck className="mr-1 h-3 w-3" />
                                    <span className={getAccuracyClass(training.accuracy_mae)}>
                                      MAE: {training.accuracy_mae.toFixed(2)}
                                    </span>
                                  </Badge>
                                </div>
                              )}
                              {training.accuracy_rmse !== undefined && (
                                <div className="flex items-center">
                                  <Badge variant="outline" className="py-0 h-5 text-xs font-normal">
                                    <BadgeCheck className="mr-1 h-3 w-3" />
                                    <span className={getAccuracyClass(training.accuracy_rmse)}>
                                      RMSE: {training.accuracy_rmse.toFixed(2)}
                                    </span>
                                  </Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>{formatters.formatDate(training.date)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={getBadgeStyle(training.status)}
                          >
                            {getStatusIcon(training.status)}
                            {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteClick(training.id)}
                          >
                            <span className="sr-only">Delete</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                        {searchText.trim() !== "" ? "No models match your search" : "No recent model trainings"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Model</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this model? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default RecentTrainingsCard;
