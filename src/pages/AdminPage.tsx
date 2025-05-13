
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

const AdminPage: React.FC = () => {
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [uploadRegion, setUploadRegion] = useState("thessaloniki");
  const [uploadYear, setUploadYear] = useState<number>(2023);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [trainRegion, setTrainRegion] = useState("thessaloniki");
  const [trainPollutant, setTrainPollutant] = useState<Pollutant>("NO2");
  const [trainLoading, setTrainLoading] = useState(false);
  
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [dataPreview, setDataPreview] = useState<any[] | null>(null);
  
  // Initialize with mock datasets
  useEffect(() => {
    const mockDatasets: Dataset[] = [
      {
        id: "ds-1",
        name: "Thessaloniki-2023.csv",
        region: "thessaloniki",
        year: 2023,
        uploadedAt: "2024-04-15T10:30:00Z",
        size: 1254678,
      },
      {
        id: "ds-2",
        name: "Kalamaria-2023.csv",
        region: "kalamaria",
        year: 2023,
        uploadedAt: "2024-04-16T14:20:00Z",
        size: 1124780,
      },
      {
        id: "ds-3",
        name: "Panorama-2023.csv",
        region: "panorama",
        year: 2023,
        uploadedAt: "2024-04-18T09:15:00Z",
        size: 1023456,
      },
    ];
    
    setDatasets(mockDatasets);
  }, []);
  
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
      // In real app:
      // const formData = new FormData();
      // formData.append('file', fileInput);
      // formData.append('region', uploadRegion);
      // formData.append('year', uploadYear.toString());
      // const response = await datasetApi.upload(formData);
      
      // For demo, simulate successful upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newDataset: Dataset = {
        id: `ds-${Date.now()}`,
        name: fileInput.name,
        region: uploadRegion,
        year: uploadYear,
        uploadedAt: new Date().toISOString(),
        size: fileInput.size,
      };
      
      setDatasets(prev => [newDataset, ...prev]);
      setFileInput(null);
      
      // Reset file input
      const fileInputElement = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInputElement) {
        fileInputElement.value = '';
      }
      
      toast.success("Dataset uploaded successfully");
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
      // In real app:
      // const response = await modelApi.train({
      //   pollutant: trainPollutant,
      //   region: trainRegion,
      // });
      
      // For demo, simulate training
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Model trained for ${trainPollutant} in ${trainRegion}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to train model");
    } finally {
      setTrainLoading(false);
    }
  };
  
  const previewDataset = async (datasetId: string) => {
    try {
      // In real app:
      // const response = await datasetApi.preview(datasetId);
      // if (response.success) {
      //   setDataPreview(response.data);
      // }
      
      // For demo, generate mock data preview
      const mockPreview = [
        { year: 2023, month: 1, NO2: 115, O3: 42, SO2: 22, region: datasets.find(d => d.id === datasetId)?.region || "" },
        { year: 2023, month: 2, NO2: 110, O3: 45, SO2: 20, region: datasets.find(d => d.id === datasetId)?.region || "" },
        { year: 2023, month: 3, NO2: 105, O3: 50, SO2: 18, region: datasets.find(d => d.id === datasetId)?.region || "" },
        { year: 2023, month: 4, NO2: 95, O3: 55, SO2: 16, region: datasets.find(d => d.id === datasetId)?.region || "" },
        { year: 2023, month: 5, NO2: 85, O3: 65, SO2: 14, region: datasets.find(d => d.id === datasetId)?.region || "" },
      ];
      
      setSelectedDataset(datasetId);
      setDataPreview(mockPreview);
    } catch (error) {
      console.error(error);
      toast.error("Failed to preview dataset");
    }
  };
  
  const deleteDataset = async (datasetId: string) => {
    try {
      // In real app:
      // const response = await datasetApi.delete(datasetId);
      
      // For demo, remove from local state
      setDatasets(prev => prev.filter(dataset => dataset.id !== datasetId));
      
      if (selectedDataset === datasetId) {
        setSelectedDataset(null);
        setDataPreview(null);
      }
      
      toast.success("Dataset deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete dataset");
    }
  };
  
  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Format date helper
  const formatDate = (dateString: string): string => {
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
                  File must follow the format: year,month,NO2,O3,SO2,region
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
                {datasets.length > 0 ? (
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
                            <TableCell className="font-medium">{dataset.name}</TableCell>
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
                    {datasets.find(d => d.id === selectedDataset)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead>
                          <TableHead>Month</TableHead>
                          <TableHead>NO2</TableHead>
                          <TableHead>O3</TableHead>
                          <TableHead>SO2</TableHead>
                          <TableHead>Region</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataPreview.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{row.year}</TableCell>
                            <TableCell>{row.month}</TableCell>
                            <TableCell>{row.NO2}</TableCell>
                            <TableCell>{row.O3}</TableCell>
                            <TableCell>{row.SO2}</TableCell>
                            <TableCell>{getRegionLabel(row.region)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
