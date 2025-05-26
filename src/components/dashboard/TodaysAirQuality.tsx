import React from 'react';
import { DashboardCard } from './DashboardCard';
import { AqiBadge } from '@/components/ui/aqi-badge';
import { Badge } from '@/components/ui/badge';
import { formatPollutantName } from '@/lib/utils';
import { Clock } from 'lucide-react';
interface TodaysAirQualityProps {
  pollutants: {
    [key: string]: number;
  };
  aqiCategory: string;
  region: string;
}
export const TodaysAirQuality: React.FC<TodaysAirQualityProps> = ({
  pollutants,
  aqiCategory,
  region
}) => {
  const formatRegionName = (region: string) => {
    return region.charAt(0).toUpperCase() + region.slice(1).replace('-', ' ');
  };
  return <DashboardCard title="Today's Air Quality" description={`Current conditions in ${formatRegionName(region)}`} headerAction={<div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-xs">Updated 5 min ago</span>
        </div>}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">AQI Status</span>
          <AqiBadge level={aqiCategory.toLowerCase().replace(/\s+/g, '-') as any} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(pollutants).map(([pollutant, value]) => <div key={pollutant} className="flex flex-col p-3 border rounded-lg">
              <span className="text-xs font-medium text-muted-foreground">
                {formatPollutantName(pollutant)}
              </span>
              <span className="text-lg font-bold">
                {value.toFixed(1)} <span className="text-xs font-normal">μg/m³</span>
              </span>
            </div>)}
        </div>
      </div>
    </DashboardCard>;
};