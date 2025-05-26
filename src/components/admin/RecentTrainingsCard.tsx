
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Eye, Info, RefreshCw, Trash2 } from "lucide-react";
import { Pollutant } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { modelApi } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export interface TrainingRecord {
  id: string;
  region: string;
  pollutant: Pollutant;
  date: string;
  status: "complete" | "ready" | "in-progress" | "failed";
  frequency?: string;
  periods?: number;
  accuracy_mae?: number;
  accuracy_rmse?: number;
}

interface RecentTrainingsCardProps {
  recentTrainings: TrainingRecord[];
  formatters: {
    formatDate: (date?: string) => string;
    getRegionLabel: (region: string) => string;
    getPollutantDisplay: (pollutant: string) => string;
    getFrequencyDisplay: (frequency: string) => string;
  };
  isLoading: boolean;
  onModelDeleted: () => void;
  onViewDetails?: (modelId: string) => void;
  modelsToCompare?: string[];
  onToggleCompare?: (modelId: string) => void;
  onSelectForPreview?: (modelId: string, selected: boolean) => void; // NEW: Add handler for preview selection
  selectedPreviewModel?: string | null; // NEW: Track which model is selected for preview
}

const RecentTrainingsCard: React.FC<RecentTrainingsCardProps> = ({
  recentTrainings,
  formatters,
  isLoading,
  onModelDeleted,
  onViewDetails,
  modelsToCompare = [],
  onToggleCompare,
  onSelectForPreview,  // NEW: Handler for preview selection
  selectedPreviewModel = null  // NEW: ID of model selected for preview
}) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Group models by region
  const modelsByRegion = React.useMemo(() => {
    const grouped: Record<string, TrainingRecord[]> = {};
    
    recentTrainings.forEach(model => {
      const regionKey = model.region || 'unknown';
      if (!grouped[regionKey]) {
        grouped[regionKey] = [];
      }
      grouped[regionKey].push(model);
    });
    
    // Sort regions alphabetically
    return Object.keys(grouped).sort().reduce((acc, region) => {
      acc[region] = grouped[region].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return acc;
    }, {} as Record<string, TrainingRecord[]>);
  }, [recentTrainings]);

  // NEW: Handle model selection for preview
  const handlePreviewSelect = (modelId: string, checked: boolean) => {
    if (onSelectForPreview) {
      onSelectForPreview(modelId, checked);
    }
  };

  // Handle model deletion
  const handleDeleteModel = async (modelId: string) => {
    setDeletingId(modelId);
    try {
      const response = await modelApi.delete(modelId);
      if (response.success) {
        toast.success("Model deleted successfully");
        onModelDeleted();
      } else {
        toast.error(response.error || "Failed to delete model");
      }
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Failed to delete model");
    } finally {
      setDeletingId(null);
    }
  };

  // Get status display badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
      case "ready":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="mr-1 h-3 w-3" /> Complete</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><RefreshCw className="mr-1 h-3 w-3 animate-spin" /> Training</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to check if a model is viewable (status is complete or ready)
  const isModelViewable = (status: string) => {
    return status === "complete" || status === "ready";
  };

  // Get accuracy metrics display
  const getAccuracyMetrics = (model: TrainingRecord) => {
    if (!model.accuracy_mae && !model.accuracy_rmse) return "Not available";
    
    return (
      <div className="flex flex-col space-y-1">
        {model.accuracy_mae !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-1 text-xs">
                  <span className="font-medium">MAE:</span>
                  <span>{model.accuracy_mae.toFixed(2)}</span>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="max-w-xs text-xs">
                  Mean Absolute Error: Average magnitude of errors in units.
                  Lower values indicate better accuracy.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {model.accuracy_rmse !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-1 text-xs">
                  <span className="font-medium">RMSE:</span>
                  <span>{model.accuracy_rmse.toFixed(2)}</span>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="max-w-xs text-xs">
                  Root Mean Squared Error: Standard deviation of prediction errors.
                  More weight to larger errors.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };
  
  // NEW: Render preview checkbox
  const renderPreviewCheckbox = (model: TrainingRecord) => {
    if (!onSelectForPreview) return null;
    
    const isSelected = selectedPreviewModel === model.id;
    const isViewable = isModelViewable(model.status);
    
    return (
      <div className="flex items-center justify-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={(checked) => handlePreviewSelect(model.id, checked === true)}
                  disabled={!isViewable}
                  className={cn(
                    isSelected && "border-green-500 bg-green-500 text-primary-foreground",
                    "rounded-full"
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isViewable 
                ? (isSelected 
                    ? "Unselect model for preview" 
                    : "Select this model for preview")
                : "Only completed models can be previewed"
              }
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };
  
  // Render loading skeleton
  if (isLoading && recentTrainings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Trainings</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton columns={5} rows={3} />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trained Models</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grouped" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="grouped">By Region</TabsTrigger>
            <TabsTrigger value="flat">All Models</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grouped">
            {Object.keys(modelsByRegion).length > 0 ? (
              <Accordion type="multiple" defaultValue={[Object.keys(modelsByRegion)[0]]}>
                {Object.keys(modelsByRegion).map((region) => (
                  <AccordionItem key={region} value={region}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center space-x-2">
                        <span>{formatters.getRegionLabel(region)}</span>
                        <Badge variant="outline">
                          {modelsByRegion[region].length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {onSelectForPreview && (
                                <TableHead className="w-10 text-center">Preview</TableHead>
                              )}
                              {onToggleCompare && (
                                <TableHead className="w-10 text-center">Compare</TableHead>
                              )}
                              <TableHead>Pollutant</TableHead>
                              <TableHead>Frequency</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Metrics</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {modelsByRegion[region].map((model) => (
                              <TableRow key={model.id} className={cn(
                                model.status === "failed" && "bg-red-50/30",
                                selectedPreviewModel === model.id && "bg-green-50/40"
                              )}>
                                {onSelectForPreview && (
                                  <TableCell className="text-center">
                                    {renderPreviewCheckbox(model)}
                                  </TableCell>
                                )}
                                {onToggleCompare && (
                                  <TableCell className="text-center">
                                    <Checkbox 
                                      checked={modelsToCompare.includes(model.id)}
                                      onCheckedChange={() => onToggleCompare(model.id)}
                                      disabled={!isModelViewable(model.status)}
                                    />
                                  </TableCell>
                                )}
                                <TableCell className="font-medium">
                                  {formatters.getPollutantDisplay(model.pollutant)}
                                </TableCell>
                                <TableCell>
                                  {model.frequency ? formatters.getFrequencyDisplay(model.frequency) : "N/A"}
                                  {model.periods && <span className="text-xs text-muted-foreground ml-1">({model.periods})</span>}
                                </TableCell>
                                <TableCell>{getStatusBadge(model.status)}</TableCell>
                                <TableCell>{getAccuracyMetrics(model)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatters.formatDate(model.date)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {onViewDetails && (
                                      <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => onViewDetails(model.id)}
                                        disabled={!isModelViewable(model.status)}
                                      >
                                        <Eye size={16} />
                                      </Button>
                                    )}
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="icon"
                                          disabled={deletingId === model.id}
                                        >
                                          {deletingId === model.id ? (
                                            <RefreshCw size={16} className="animate-spin text-destructive" />
                                          ) : (
                                            <Trash2 size={16} className="text-destructive" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Model</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this model?
                                            This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteModel(model.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No trained models available</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="flat">
            {recentTrainings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {onSelectForPreview && (
                        <TableHead className="w-10 text-center">Preview</TableHead>
                      )}
                      {onToggleCompare && (
                        <TableHead className="w-10 text-center">Compare</TableHead>
                      )}
                      <TableHead>Region</TableHead>
                      <TableHead>Pollutant</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrainings.map((model) => (
                      <TableRow key={model.id} className={cn(
                        model.status === "failed" && "bg-red-50/30",
                        selectedPreviewModel === model.id && "bg-green-50/40"
                      )}>
                        {onSelectForPreview && (
                          <TableCell className="text-center">
                            {renderPreviewCheckbox(model)}
                          </TableCell>
                        )}
                        {onToggleCompare && (
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={modelsToCompare.includes(model.id)}
                              onCheckedChange={() => onToggleCompare(model.id)}
                              disabled={!isModelViewable(model.status)}
                            />
                          </TableCell>
                        )}
                        <TableCell>{formatters.getRegionLabel(model.region)}</TableCell>
                        <TableCell className="font-medium">
                          {formatters.getPollutantDisplay(model.pollutant)}
                        </TableCell>
                        <TableCell>
                          {model.frequency ? formatters.getFrequencyDisplay(model.frequency) : "N/A"}
                          {model.periods && <span className="text-xs text-muted-foreground ml-1">({model.periods})</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(model.status)}</TableCell>
                        <TableCell>{getAccuracyMetrics(model)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatters.formatDate(model.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {onViewDetails && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => onViewDetails(model.id)}
                                disabled={!isModelViewable(model.status)}
                              >
                                <Eye size={16} />
                              </Button>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  disabled={deletingId === model.id}
                                >
                                  {deletingId === model.id ? (
                                    <RefreshCw size={16} className="animate-spin text-destructive" />
                                  ) : (
                                    <Trash2 size={16} className="text-destructive" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Model</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this model?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteModel(model.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No trained models available</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RecentTrainingsCard;
