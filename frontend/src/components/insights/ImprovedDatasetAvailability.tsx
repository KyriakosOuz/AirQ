
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Database, Search, Filter, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RegionDataCard } from "./RegionDataCard";
import { QuickStartSection } from "./QuickStartSection";
import { Pollutant } from "@/lib/types";
import { toast } from "sonner";

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

interface ImprovedDatasetAvailabilityProps {
  data: DatasetAvailabilityMatrix;
  onRegionSelect: (region: string) => void;
  onPollutantSelect: (region: string, pollutant: Pollutant) => void;
  onQuickStart: (region: string, pollutant: Pollutant, year: number, tab: string) => void;
  selectedRegion?: string;
}

export const ImprovedDatasetAvailability: React.FC<ImprovedDatasetAvailabilityProps> = ({
  data,
  onRegionSelect,
  onPollutantSelect,
  onQuickStart,
  selectedRegion
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [pollutantFilter, setPollutantFilter] = useState<string>("all");

  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleQuickStart = (option: any) => {
    onQuickStart(option.region, option.pollutant, option.year, option.tab);
    toast.success(`Loading ${option.title}...`);
  };

  // Get all unique pollutants for filter
  const allPollutants = Array.from(
    new Set(data.availability.flatMap(region => region.pollutants))
  );

  // Filter regions based on search and pollutant filter
  const filteredRegions = data.availability.filter(region => {
    const matchesSearch = getRegionDisplayName(region.region)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesPollutant = pollutantFilter === "all" || 
      region.pollutants.includes(pollutantFilter);
    
    return matchesSearch && matchesPollutant;
  });

  // Sort regions by total datasets (most complete first)
  const sortedRegions = [...filteredRegions].sort((a, b) => b.totalDatasets - a.totalDatasets);

  return (
    <div className="space-y-6">
      {/* Quick Start Section */}
      <QuickStartSection onQuickStart={handleQuickStart} />

      {/* Main Dataset Browser */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Browse Available Datasets
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Explore air quality data across {data.totalRegions} regions spanning {data.yearRange.max - data.yearRange.min + 1} years
              </p>
            </div>
            
            {/* Summary Stats */}
            <div className="flex gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {data.availability.reduce((sum, r) => sum + r.totalDatasets, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Datasets</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{data.totalRegions}</div>
                <div className="text-xs text-muted-foreground">Regions</div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search regions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={pollutantFilter} onValueChange={setPollutantFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by pollutant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pollutants</SelectItem>
                  {allPollutants.map(pollutant => (
                    <SelectItem key={pollutant} value={pollutant}>
                      {pollutant.replace('_conc', '').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters Applied */}
          {(searchTerm || pollutantFilter !== "all") && (
            <div className="flex items-center gap-2 pb-2">
              <span className="text-sm text-muted-foreground">Filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  "{searchTerm}"
                </Badge>
              )}
              {pollutantFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {pollutantFilter.replace('_conc', '').toUpperCase()}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setPollutantFilter("all");
                }}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Showing {sortedRegions.length} of {data.availability.length} regions
            </div>
          </div>

          {/* Region Cards Grid */}
          {sortedRegions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedRegions.map((regionData) => (
                <RegionDataCard
                  key={regionData.region}
                  region={regionData.region}
                  pollutants={regionData.pollutants}
                  yearRange={{
                    min: Math.min(...regionData.availableYears),
                    max: Math.max(...regionData.availableYears)
                  }}
                  totalDatasets={regionData.totalDatasets}
                  onExploreRegion={onRegionSelect}
                  onSelectPollutant={onPollutantSelect}
                  isSelected={selectedRegion === regionData.region}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No regions found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setPollutantFilter("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
