
import React from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, MapPin, Calendar, Atom } from "lucide-react";
import { Pollutant } from "@/lib/types";

interface CurrentSelectionBreadcrumbProps {
  region?: string;
  year?: number;
  pollutant?: Pollutant;
  startDate?: Date;
  endDate?: Date;
}

export const CurrentSelectionBreadcrumb: React.FC<CurrentSelectionBreadcrumbProps> = ({
  region,
  year,
  pollutant,
  startDate,
  endDate
}) => {
  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getPollutantDisplayName = (pollutant: Pollutant) => {
    const pollutantNames: Record<Pollutant, string> = {
      pollution: "Combined Pollution Index",
      no2_conc: "NO₂",
      o3_conc: "O₃", 
      co_conc: "CO",
      no_conc: "NO",
      so2_conc: "SO₂"
    };
    return pollutantNames[pollutant] || pollutant;
  };

  const formatDateRange = (start?: Date, end?: Date) => {
    if (!start || !end) return null;
    
    const startStr = start.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    const endStr = end.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    return `${startStr} - ${endStr}`;
  };

  // Don't show breadcrumb if no meaningful selection is made
  if (!region && !year && !pollutant) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-4">
      <span className="text-sm font-medium text-muted-foreground">Currently Exploring:</span>
      
      <div className="flex items-center gap-1">
        {region && (
          <>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {getRegionDisplayName(region)}
            </Badge>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </>
        )}
        
        {(year || (startDate && endDate)) && (
          <>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {year || formatDateRange(startDate, endDate)}
            </Badge>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </>
        )}
        
        {pollutant && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Atom className="h-3 w-3" />
            {getPollutantDisplayName(pollutant)}
          </Badge>
        )}
      </div>
    </div>
  );
};
