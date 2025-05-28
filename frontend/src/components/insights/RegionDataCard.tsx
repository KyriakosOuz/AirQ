
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Database, ChevronRight } from "lucide-react";
import { Pollutant } from "@/lib/types";

interface RegionDataCardProps {
  region: string;
  pollutants: string[];
  yearRange: { min: number; max: number };
  totalDatasets: number;
  onExploreRegion: (region: string) => void;
  onSelectPollutant: (region: string, pollutant: Pollutant) => void;
  isSelected?: boolean;
}

export const RegionDataCard: React.FC<RegionDataCardProps> = ({
  region,
  pollutants,
  yearRange,
  totalDatasets,
  onExploreRegion,
  onSelectPollutant,
  isSelected = false
}) => {
  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  const completeness = Math.min(100, (totalDatasets / (pollutants.length * 4)) * 100); // Assuming max 4 years per pollutant

  return (
    <Card className={`hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {getRegionDisplayName(region)}
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {yearRange.min}-{yearRange.max}
              </div>
              <div className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {totalDatasets} datasets
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">Data Completeness</div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className="text-xs font-medium">{Math.round(completeness)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Available Pollutants */}
        <div>
          <div className="text-sm font-medium mb-2">Available Pollutants</div>
          <div className="flex flex-wrap gap-2">
            {pollutants.map(pollutant => (
              <Button
                key={pollutant}
                variant="secondary"
                size="sm"
                className="h-7 px-2 text-xs hover:bg-primary hover:text-primary-foreground"
                onClick={() => onSelectPollutant(region, pollutant as Pollutant)}
              >
                {getPollutantDisplayName(pollutant)}
              </Button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1" 
            onClick={() => onExploreRegion(region)}
          >
            Explore Region
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
