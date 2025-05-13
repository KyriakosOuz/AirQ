
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegionSelector } from "@/components/ui/region-selector";
import { PollutantSelector } from "@/components/ui/pollutant-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { datasetApi, modelApi } from "@/lib/api";
import { Alert, Pollutant, Dataset } from "@/lib/types";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileSpreadsheet, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminPage: React.FC = () => {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [uploadRegion, setUploadRegion] = useState("thessaloniki");
  const [uploadYear, setUploadYear] = useState<number>(2023);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [trainRegion, setTrainRegion] = useState("thessaloniki");
  const [trainPollutant, setTrainPollutant] = useState<Pollutant>("NO2");
  const [trainLoading, setTrainLoading] = useState(false);
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [dataPreview, setDataPreview] = useState<{columns: string[], rows: Record<string, any>[]} | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Load datasets when component mounts
  useEffect(() => {
    fetchDatasets();
  }, []);
  
  const fetchDatasets = async () => {
    setDatasetsLoading(true);
    try {
      const response = await datasetApi.list();
      if (response.success && response.data) {
        setDatasets(response.data);
      } else {
        toast.error("Failed to fetch datasets");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch datasets");
    } finally {
      setDatasetsLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileInput(e.target.files[0]);
    }
  };
  
  const uploadDataset = async () => {
    if (!fileInput) {
      toast.error("Please select a file to upload");
      return;
    }
    
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInput);
      formData.append('region', uploadRegion);
      formData.append('year', uploadYear.toString());
      
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
        toast.error(response.error || "Failed to upload dataset");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload dataset");
    } finally {
      setUploadLoading(false);
    }
  };
  
  const trainModel = async () => {
    setTrainLoading(true);
    try {
      const response = await modelApi.train({
        pollutant: trainPollutant,
        region: trainRegion,
      });
      
      if (response.success) {
        toast.success(`Model trained for ${trainPollutant} in ${trainRegion}`);
      } else {
        toast.error(response.error || "Failed to train model");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to train model");
    } finally {
      setTrainLoading(false);
    }
  };
  
  const previewDataset = async (datasetId: string) => {
    setPreviewLoading(true);
    try {
      const response = await datasetApi.preview(datasetId);
      
      if (response.success && response.data) {
        setSelectedDataset(datasetId);
        setDataPreview(response.data);
      } else {
        toast.error(response.error || "Failed to preview dataset");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to preview dataset");
    } finally {
      setPreviewLoading(false);
    }
  };
  
  const deleteDataset = async (datasetId: string) => {
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
        toast.error(response.error || "Failed to delete dataset");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete dataset");
    }
  };
  
  // Format file size helper
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Format date helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  // Get region label from value
  const getRegionLabel = (regionValue: string): string => {
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
  };

  // Get dataset name from dataset object
  const getDatasetName = (dataset: Dataset): string => {
    return dataset.name || `${getRegionLabel(dataset.region)}-${dataset.year}.csv`;
  };

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
                {uploadLoading ? "Uploading..." : "Upload Dataset"}
              </Button>
            </CardFooter>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Available Datasets</CardTitle>
                <CardDescription>
                  Select a dataset to preview or manage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {datasetsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2">Loading datasets...</p>
                  </div>
                ) : datasets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead>Year</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datasets.map((dataset) => (
                          <TableRow key={dataset.id}>
                            <TableCell className="font-medium">{getDatasetName(dataset)}</TableCell>
                            <TableCell>{getRegionLabel(dataset.region)}</TableCell>
                            <TableCell>{dataset.year}</TableCell>
                            <TableCell>{formatFileSize(dataset.size)}</TableCell>
                            <TableCell>{formatDate(dataset.uploadedAt)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => previewDataset(dataset.id)}
                                >
                                  <Eye size={16} />
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
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2">No datasets uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {selectedDataset && dataPreview && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>
                    {datasets.find(d => d.id === selectedDataset) ? getDatasetName(datasets.find(d => d.id === selectedDataset)!) : 'Dataset Preview'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {previewLoading ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                      <p className="mt-2">Loading preview...</p>
                    </div>
                  ) : (
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
                          {dataPreview.rows.map((row, idx) => (
                            <TableRow key={idx}>
                              {dataPreview.columns.map((column) => (
                                <TableCell key={`${idx}-${column}`}>{row[column]}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <p className="mt-2 text-right text-xs text-muted-foreground">Showing first 5 rows</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="training">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Train Forecast Model</CardTitle>
                <CardDescription>
                  Start model training for a specific pollutant in a region
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Region</Label>
                  <RegionSelector value={trainRegion} onValueChange={setTrainRegion} />
                </div>
                <div className="space-y-2">
                  <Label>Pollutant</Label>
                  <PollutantSelector value={trainPollutant} onValueChange={setTrainPollutant} />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={trainModel} 
                  disabled={trainLoading}
                  className="w-full"
                >
                  {trainLoading ? "Training..." : "Start Training"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Training Information</CardTitle>
                <CardDescription>
                  Details about the model training process
                </CardDescription>
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
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Thessaloniki Center</TableCell>
                          <TableCell>NO2</TableCell>
                          <TableCell>May 12, 2024</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Complete
                            </Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Kalamaria</TableCell>
                          <TableCell>O3</TableCell>
                          <TableCell>May 10, 2024</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Complete
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
