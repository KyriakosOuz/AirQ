
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegionSelector } from "@/components/ui/region-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { datasetApi, DatasetPreviewResponse } from "@/lib/api";
import { Dataset } from "@/lib/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Eye, FileSpreadsheet, Trash2 } from "lucide-react";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useApiRequest, debounce, measurePerformance, getErrorMessage } from "@/lib/utils";
import ModelTrainingTab from "@/components/admin/ModelTrainingTab";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Constants to prevent re-renders
const INITIAL_REGION = "thessaloniki";
const INITIAL_YEAR = 2023;

const AdminPage: React.FC = () => {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [uploadRegion, setUploadRegion] = useState(INITIAL_REGION);
  const [uploadYear, setUploadYear] = useState<number>(INITIAL_YEAR);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [dataPreview, setDataPreview] = useState<DatasetPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const { createSignal } = useApiRequest();
  
  // Use memoized functions for event handlers to prevent unnecessary re-renders
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileInput(e.target.files[0]);
    }
  }, []);
  
  // Debounced fetch to prevent multiple rapid calls
  const debouncedFetchDatasets = useCallback(
    debounce(() => {
      fetchDatasets();
    }, 300),
    []
  );
  
  const fetchDatasets = useCallback(async () => {
    if (datasetsLoading) return; // Prevent multiple simultaneous requests
    
    setDatasetsLoading(true);
    try {
      measurePerformance("fetchDatasets", async () => {
        const response = await datasetApi.list();
        if (response.success && response.data) {
          setDatasets(response.data);
        } else {
          console.error("Failed to fetch datasets:", response.error);
          toast.error(getErrorMessage(response.error));
          // Keep old data on error to prevent UI flickering
        }
      });
    } finally {
      setDatasetsLoading(false);
    }
  }, [datasetsLoading]);
  
  // Load datasets when component mounts, but with a slight delay to prioritize UI rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDatasets();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [fetchDatasets]);
  
  const uploadDataset = async () => {
    if (!fileInput) {
      toast.error("Please select a file to upload");
      return;
    }
    
    setUploadLoading(true);
    try {
      // Create a new FormData instance
      const formData = new FormData();
      
      // Append the file with the correct field name 'file'
      formData.append('file', fileInput);
      
      // Append the region and year as strings (important for FormData)
      formData.append('region', uploadRegion);
      formData.append('year', uploadYear.toString());
      
      // Log the FormData content for debugging
      console.log('FormData:', {
        file: fileInput.name,
        region: uploadRegion,
        year: uploadYear
      });
      
      const response = await datasetApi.upload(formData);
      
      if (response.success && response.data) {
        toast.success("Dataset uploaded successfully");
        // Refresh dataset list
        fetchDatasets();
        // Reset form
        setFileInput(null);
        
        // Reset file input
        const fileInputElement = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInputElement) {
          fileInputElement.value = '';
        }
      } else {
        console.error("Upload failed:", response.error);
        toast.error(getErrorMessage(response.error));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploadLoading(false);
    }
  };
  
  const previewDataset = useCallback(async (datasetId: string) => {
    if (previewLoading) return; // Prevent multiple clicks
    
    setPreviewLoading(true);
    setSelectedDataset(datasetId);
    
    try {
      const response = await datasetApi.preview(datasetId);
      
      if (response.success && response.data) {
        // Check if both columns and preview exist and are arrays
        if (response.data.columns && response.data.preview && 
            Array.isArray(response.data.columns) && Array.isArray(response.data.preview)) {
          setDataPreview(response.data);
        } else {
          console.error("Invalid preview data format:", response.data);
          toast.error("Preview data has invalid format");
          setDataPreview(null);
        }
      } else {
        toast.error(getErrorMessage(response.error));
        setDataPreview(null);
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [previewLoading]);
  
  const deleteDataset = useCallback(async (datasetId: string) => {
    try {
      const response = await datasetApi.delete(datasetId);
      
      if (response.success) {
        // Remove from local state
        setDatasets(prev => prev.filter(dataset => dataset.id !== datasetId));
        
        if (selectedDataset === datasetId) {
          setSelectedDataset(null);
          setDataPreview(null);
        }
        
        toast.success("Dataset deleted successfully");
      } else {
        toast.error(getErrorMessage(response.error));
      }
    } catch (error) {
      console.error("Delete dataset error:", error);
      toast.error(getErrorMessage(error));
    }
  }, [selectedDataset]);
  
  // Memoize helpers to prevent recreating on each render
  const formatters = useMemo(() => ({
    // Format date helper
    formatDate: (dateString?: string): string => {
      if (!dateString) return 'Unknown';
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    
    // Get region label from value
    getRegionLabel: (regionValue: string): string => {
      const regionMap: Record<string, string> = {
        "thessaloniki": "Thessaloniki Center",
        "kalamaria": "Kalamaria",
        "pavlos-melas": "Pavlos Melas",
        "neapoli-sykies": "Neapoli-Sykies",
        "ampelokipoi-menemeni": "Ampelokipoi-Menemeni",
        "panorama": "Panorama",
        "pylaia-chortiatis": "Pylaia-Chortiatis",
      };
      
      return regionMap[regionValue] || regionValue;
    },
    
    // Get dataset name from dataset object
    getDatasetName: (dataset: Dataset): string => {
      return dataset.name || `${formatters.getRegionLabel(dataset.region)}-${dataset.year}.csv`;
    },
    
    // Get pollutant display name
    getPollutantDisplay: (pollutantCode: string): string => {
      const map: Record<string, string> = {
        no2_conc: "NO₂",
        o3_conc: "O₃",
        so2_conc: "SO₂",
        pm10_conc: "PM10",
        pm25_conc: "PM2.5",
        co_conc: "CO",
      };
      return map[pollutantCode] || pollutantCode;
    }
  }), []);
  
  // Group datasets by region
  const datasetsByRegion = useMemo(() => {
    const grouped: Record<string, Dataset[]> = {};
    
    datasets.forEach(dataset => {
      const regionKey = dataset.region || 'unknown';
      if (!grouped[regionKey]) {
        grouped[regionKey] = [];
      }
      grouped[regionKey].push(dataset);
    });
    
    // Sort regions alphabetically
    return Object.keys(grouped).sort().reduce((acc, region) => {
      acc[region] = grouped[region].sort((a, b) => b.year - a.year);
      return acc;
    }, {} as Record<string, Dataset[]>);
  }, [datasets]);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage datasets and train forecasting models.
        </p>
      </div>
      
      <Tabs defaultValue="datasets">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="datasets">Manage Datasets</TabsTrigger>
          <TabsTrigger value="training">Model Training</TabsTrigger>
        </TabsList>
        
        <TabsContent value="datasets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Dataset</CardTitle>
              <CardDescription>
                Upload CSV file with pollutant data for a specific region and year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <RegionSelector value={uploadRegion} onValueChange={setUploadRegion} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input 
                    id="year"
                    type="number"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(parseInt(e.target.value))}
                    min={2000}
                    max={2030}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file-upload">CSV File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  File must follow the format: timestamp,NO2,O3,SO2,region
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={uploadDataset} 
                disabled={uploadLoading || !fileInput}
                className="w-full"
              >
                {uploadLoading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                    Uploading...
                  </>
                ) : "Upload Dataset"}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Available Datasets</CardTitle>
                  <CardDescription>
                    Select a dataset to preview or manage
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchDatasets()}
                  disabled={datasetsLoading}
                >
                  {datasetsLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                  ) : "Refresh"}
                </Button>
              </CardHeader>
              <CardContent>
                {datasetsLoading && datasets.length === 0 ? (
                  <TableSkeleton columns={4} rows={3} />
                ) : Object.keys(datasetsByRegion).length > 0 ? (
                  <Accordion type="multiple" defaultValue={Object.keys(datasetsByRegion)}>
                    {Object.keys(datasetsByRegion).map((region) => (
                      <AccordionItem key={region} value={region}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center space-x-2">
                            <span>{formatters.getRegionLabel(region)}</span>
                            <Badge variant="outline">
                              {datasetsByRegion[region].length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Year</TableHead>
                                  <TableHead>Uploaded</TableHead>
                                  <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {datasetsByRegion[region].map((dataset) => (
                                  <TableRow key={dataset.id}>
                                    <TableCell className="font-medium">{formatters.getDatasetName(dataset)}</TableCell>
                                    <TableCell>{dataset.year}</TableCell>
                                    <TableCell>{formatters.formatDate(dataset.created_at)}</TableCell>
                                    <TableCell>
                                      <div className="flex space-x-2">
                                        <Button 
                                          variant="outline" 
                                          size="icon"
                                          onClick={() => previewDataset(dataset.id)}
                                          disabled={previewLoading && selectedDataset === dataset.id}
                                        >
                                          {previewLoading && selectedDataset === dataset.id ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></span>
                                          ) : (
                                            <Eye size={16} />
                                          )}
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="icon"
                                          onClick={() => deleteDataset(dataset.id)}
                                        >
                                          <Trash2 size={16} className="text-destructive" />
                                        </Button>
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
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2">No datasets uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {selectedDataset && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>
                    {datasets.find(d => d.id === selectedDataset) ? 
                      formatters.getDatasetName(datasets.find(d => d.id === selectedDataset)!) : 
                      'Dataset Preview'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {previewLoading ? (
                    <TableSkeleton columns={5} rows={5} />
                  ) : dataPreview && dataPreview.columns && dataPreview.preview && 
                      Array.isArray(dataPreview.columns) && Array.isArray(dataPreview.preview) ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {dataPreview.columns.map((column) => (
                              <TableHead key={column}>{column}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dataPreview.preview.map((row, idx) => (
                            <TableRow key={idx}>
                              {dataPreview.columns.map((column) => (
                                <TableCell key={`${idx}-${column}`}>{row[column]}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      <p>No preview data available</p>
                    </div>
                  )}
                  {dataPreview && dataPreview.preview && Array.isArray(dataPreview.preview) && (
                    <p className="mt-2 text-right text-xs text-muted-foreground">Showing first {dataPreview.preview.length} rows</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="training">
          <ModelTrainingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
