
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import { Pollutant } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, GitCompare } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// Interface for forecast data point
export interface ForecastDataPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
  category?: string;
}

interface ForecastPreviewProps {
  data: ForecastDataPoint[];
  region: string;
  pollutant: Pollutant;
  frequency?: string;
  formatters: {
    getRegionLabel: (regionValue: string) => string;
    getPollutantDisplay: (pollutantCode: string) => string;
  };
}

const ForecastPreview: React.FC<ForecastPreviewProps> = ({
  data,
  region,
  pollutant,
  frequency = "D",
  formatters,
}) => {
  // Format X-axis labels based on frequency
  const formatXAxisLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    
    switch (frequency) {
      case "D":
        return format(date, 'MMM dd');
      case "W":
        return `Week ${format(date, 'w')}`;
      case "M":
        return format(date, 'MMM yyyy');
      case "Y":
        return format(date, 'yyyy');
      default:
        return format(date, 'MMM dd');
    }
  };
  
  // Format data for chart
  const chartData = data.map(point => ({
    ...point,
    date: formatXAxisLabel(point.ds),
    value: Number(point.yhat.toFixed(2)),
    lower: Number(point.yhat_lower.toFixed(2)),
    upper: Number(point.yhat_upper.toFixed(2))
  }));
  
  // Get pollutant unit for display
  const getPollutantUnit = (pollutantCode: string): string => {
    // Most air pollutants are measured in µg/m³
    return "µg/m³";
  };
  
  // Handle CSV download
  const downloadCSV = () => {
    try {
      // Create CSV content
      const headers = ["Date", "Forecast", "Lower Bound", "Upper Bound"];
      const rows = data.map(d => [
        format(parseISO(d.ds), 'yyyy-MM-dd'),
        d.yhat.toFixed(2),
        d.yhat_lower.toFixed(2),
        d.yhat_upper.toFixed(2)
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `forecast_${region}_${pollutant}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Forecast data downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download forecast data");
    }
  };
  
  // Handle comparison initiation
  const initiateComparison = () => {
    toast.info("Comparison feature will be available soon");
    // This would navigate to or open a comparison UI
  };

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Forecast Preview</CardTitle>
          <CardDescription>
            {data.length}-period forecast for {formatters.getPollutantDisplay(pollutant)} in {formatters.getRegionLabel(region)}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Options
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={downloadCSV}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={initiateComparison}>
              <GitCompare className="mr-2 h-4 w-4" />
              <span>Compare Forecast</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" />
              <YAxis 
                label={{ 
                  value: `${formatters.getPollutantDisplay(pollutant)} (${getPollutantUnit(pollutant)})`,
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value} ${getPollutantUnit(pollutant)}`, 'Value']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <defs>
                <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="upper" 
                stroke="#82ca9d" 
                fillOpacity={1}
                fill="url(#colorUpper)" 
                strokeWidth={1}
              />
              <Area 
                type="monotone" 
                dataKey="lower" 
                stroke="#8884d8" 
                fillOpacity={1}
                fill="url(#colorLower)" 
                strokeWidth={1}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                fillOpacity={1}
                fill="url(#colorValue)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-2">
          <div className="flex items-center">
            <div className="h-3 w-3 bg-[#2563eb] rounded-full mr-1"></div>
            <span className="text-xs">Forecast</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-[#82ca9d] rounded-full mr-1"></div>
            <span className="text-xs">Upper Bound</span>
          </div>
          <div className="flex items-center">
            <div className="h-3 w-3 bg-[#8884d8] rounded-full mr-1"></div>
            <span className="text-xs">Lower Bound</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastPreview;
