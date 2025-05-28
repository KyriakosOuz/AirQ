
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, MinusCircle, Database, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pollutant } from "@/lib/types";

interface DatasetAvailability {
  region: string;
  availableYears: number[];
  pollutants: string[];
  totalDatasets: number;
}

interface DatasetAvailabilityMatrix {
  availability: DatasetAvailability[];
  totalRegions: number;
  yearRange: { min: number; max: number };
  lastUpdated: string;
}

interface DatasetAvailabilityTableProps {
  data: DatasetAvailabilityMatrix;
  onRegionYearSelect: (region: string, year: number) => void;
  onPollutantSelect: (region: string, pollutant: Pollutant) => void;
  selectedRegion?: string;
  selectedYear?: number;
  selectedPollutant?: Pollutant;
}

export const DatasetAvailabilityTable: React.FC<DatasetAvailabilityTableProps> = ({
  data,
  onRegionYearSelect,
  onPollutantSelect,
  selectedRegion,
  selectedYear,
  selectedPollutant
}) => {
  const years = Array.from(
    { length: data.yearRange.max - data.yearRange.min + 1 },
    (_, i) => data.yearRange.min + i
  );

  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isDataAvailable = (region: string, year: number) => {
    const regionData = data.availability.find(r => r.region === region);
    return regionData?.availableYears.includes(year) || false;
  };

  const getRegionPollutants = (region: string) => {
    const regionData = data.availability.find(r => r.region === region);
    return regionData?.pollutants || [];
  };

  const mapToPollutantType = (pollutant: string): Pollutant => {
    return pollutant as Pollutant;
  };

  const getPollutantDisplayName = (pollutant: string) => {
    const names: Record<string, string> = {
      'no2_conc': 'NO₂',
      'o3_conc': 'O₃',
      'co_conc': 'CO',
      'no_conc': 'NO',
      'so2_conc': 'SO₂'
    };
    return names[pollutant] || pollutant.replace('_conc', '').toUpperCase();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Available Datasets
            </CardTitle>
            <CardDescription>
              Click on regions/years to explore data, or select specific pollutants for detailed analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {data.totalRegions} Regions
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {data.yearRange.max - data.yearRange.min + 1} Years
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-6 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Data Available</span>
            </div>
            <div className="flex items-center gap-2">
              <MinusCircle className="h-4 w-4 text-gray-400" />
              <span className="text-sm">No Data</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Click available datasets to explore • Click pollutant badges for specific analysis
            </div>
          </div>

          {/* Availability Matrix Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Region</TableHead>
                  <TableHead className="text-center min-w-48">Available Pollutants</TableHead>
                  {years.map(year => (
                    <TableHead key={year} className="text-center min-w-16">
                      {year}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">Total</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px] text-xs">
                            Total datasets = Years with data × Number of pollutants for this region
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.availability.map((regionData) => (
                  <TableRow key={regionData.region}>
                    <TableCell className="font-medium">
                      {getRegionDisplayName(regionData.region)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {getRegionPollutants(regionData.region).map(pollutant => (
                          <Button
                            key={pollutant}
                            variant={selectedRegion === regionData.region && selectedPollutant === pollutant ? "default" : "secondary"}
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => onPollutantSelect(regionData.region, mapToPollutantType(pollutant))}
                          >
                            {getPollutantDisplayName(pollutant)}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                    {years.map(year => {
                      const hasData = isDataAvailable(regionData.region, year);
                      const isSelected = selectedRegion === regionData.region && selectedYear === year;
                      
                      return (
                        <TableCell key={year} className="text-center p-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={isSelected ? "default" : "ghost"}
                                  size="sm"
                                  className={cn(
                                    "h-8 w-8 p-0",
                                    hasData 
                                      ? "hover:bg-green-100 hover:text-green-800" 
                                      : "cursor-not-allowed opacity-50"
                                  )}
                                  disabled={!hasData}
                                  onClick={() => hasData && onRegionYearSelect(regionData.region, year)}
                                >
                                  {hasData ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <MinusCircle className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {hasData 
                                  ? `Click to explore ${getRegionDisplayName(regionData.region)} data for ${year}`
                                  : `No data available for ${getRegionDisplayName(regionData.region)} in ${year}`
                                }
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="cursor-help">
                              {regionData.totalDatasets}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[200px] text-xs">
                              {regionData.availableYears.length} years × {regionData.pollutants.length} pollutants = {regionData.totalDatasets} total datasets
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.availability.reduce((sum, r) => sum + r.totalDatasets, 0)}
              </div>
              <div className="text-sm text-blue-600">Total Datasets</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.totalRegions}</div>
              <div className="text-sm text-green-600">Regions Covered</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.yearRange.max - data.yearRange.min + 1}
              </div>
              <div className="text-sm text-purple-600">Years of Data</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
