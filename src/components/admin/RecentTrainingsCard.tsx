
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pollutant } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Eye, BarChart2, CheckCircle2, Clock, AlertTriangle, LineChart, ChevronUp, ChevronDown, Info, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { modelApi } from "@/lib/api";
import { toast } from "@/components/ui/sonner";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Training record definition for model data
export interface TrainingRecord {
  id: string;
  region: string;
  pollutant: Pollutant;
  date: string;
  status: "complete" | "in-progress" | "failed" | "ready";
  frequency?: string;
  periods?: number;
  accuracy_mae?: number;
  accuracy_rmse?: number;
}

// Props for RecentTrainingsCard component
interface RecentTrainingsCardProps {
  recentTrainings: TrainingRecord[];
  formatters: {
    formatDate: (dateString?: string) => string;
    getRegionLabel: (regionValue: string) => string;
    getPollutantDisplay: (pollutantCode: string) => string;
    getFrequencyDisplay?: (freqCode: string) => string;
  };
  isLoading: boolean;
  onModelDeleted: () => void;
  onViewDetails: (modelId: string) => void;
  onPreviewForecast: (modelId: string, periods?: number) => void; // Updated type definition
  modelsToCompare: string[];
  onToggleCompare: (modelId: string) => void;
}

const RecentTrainingsCard: React.FC<RecentTrainingsCardProps> = ({
  recentTrainings,
  formatters,
  isLoading,
  onModelDeleted,
  onViewDetails,
  onPreviewForecast,
  modelsToCompare = [],
  onToggleCompare
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="mr-1 h-3 w-3" /> Complete</Badge>;
      case "in-progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="mr-1 h-3 w-3 animate-spin" /> Training</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="mr-1 h-3 w-3" /> Failed</Badge>;
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
                              {onToggleCompare && (
                                <TableHead className="w-10"></TableHead>
                              )}
                              <TableHead>Pollutant</TableHead>
                              <TableHead>Frequency</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Metrics</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead className="w-[150px]">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {modelsByRegion[region].map((model) => (
                              <TableRow key={model.id} className={cn(model.status === "failed" && "bg-red-50/30")}>
                                {onToggleCompare && (
                                  <TableCell>
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
                                  {model.frequency ? formatters.getFrequencyDisplay?.(model.frequency) : "N/A"}
                                  {model.periods && <span className="text-xs text-muted-foreground ml-1">({model.periods})</span>}
                                </TableCell>
                                <TableCell>{getStatusBadge(model.status)}</TableCell>
                                <TableCell>{getAccuracyMetrics(model)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatters.formatDate(model.date)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    {onPreviewForecast && (
                                      <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => onPreviewForecast(model.id, model.periods || 6)}
                                        disabled={!isModelViewable(model.status)}
                                        title="Preview forecast"
                                      >
                                        <Eye size={16} />
                                      </Button>
                                    )}
                                    
                                    {onViewDetails && (
                                      <Button 
                                        variant="outline" 
                                        size="icon"
                                        onClick={() => onViewDetails(model.id)}
                                        disabled={!isModelViewable(model.status)}
                                        title="View model details"
                                      >
                                        <Info size={16} />
                                      </Button>
                                    )}
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="icon"
                                          disabled={deletingId === model.id}
                                          title="Delete model"
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
                      {onToggleCompare && (
                        <TableHead className="w-10"></TableHead>
                      )}
                      <TableHead>Region</TableHead>
                      <TableHead>Pollutant</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrainings.map((model) => (
                      <TableRow key={model.id} className={cn(model.status === "failed" && "bg-red-50/30")}>
                        {onToggleCompare && (
                          <TableCell>
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
                          {model.frequency ? formatters.getFrequencyDisplay?.(model.frequency) : "N/A"}
                          {model.periods && <span className="text-xs text-muted-foreground ml-1">({model.periods})</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(model.status)}</TableCell>
                        <TableCell>{getAccuracyMetrics(model)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatters.formatDate(model.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {onPreviewForecast && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => onPreviewForecast(model.id, model.periods || 6)}
                                disabled={!isModelViewable(model.status)}
                                title="Preview forecast"
                              >
                                <Eye size={16} />
                              </Button>
                            )}
                            
                            {onViewDetails && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => onViewDetails(model.id)}
                                disabled={!isModelViewable(model.status)}
                                title="View model details"
                              >
                                <Info size={16} />
                              </Button>
                            )}
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  disabled={deletingId === model.id}
                                  title="Delete model"
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
