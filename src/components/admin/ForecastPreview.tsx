import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { format, parseISO } from "date-fns";
import { Pollutant, AqiLevel } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download, GitCompare, Info } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AqiBadge } from "@/components/ui/aqi-badge";
import { 
  Table, 
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { AQI_THRESHOLDS, getAqiDescription } from "@/lib/aqi-utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  standardizeAqiDataPoint,
  getColorByRiskScore,
  getCategoryByRiskScore,
  AQI_CATEGORIES,
  getPollutantDisplayName
} from "@/lib/aqi-standardization";

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
  modelId?: string; // Add modelId prop to support preview by model ID
}

const ForecastPreview: React.FC<ForecastPreviewProps> = ({
  data,
  region,
  pollutant,
  frequency = "D",
  formatters,
  modelId, // New prop
}) => {
  // Format X-axis labels based on frequency
  const formatXAxisLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    
    switch (frequency) {
      case "D":
      case "daily":
        return format(date, 'MMM dd');
      case "W":
      case "weekly":
        return `Week ${format(date, 'w')}`;
      case "M":
      case "monthly":
        return format(date, 'MMM yyyy');
      case "Y":
      case "yearly":
        return format(date, 'yyyy');
      default:
        return format(date, 'MMM dd');
    }
  };
  
  // Format data for chart with AQI standardization
  const chartData = data.map(point => {
    const standardized = standardizeAqiDataPoint(point);
    return {
      ...point,
      date: formatXAxisLabel(point.ds),
      value: Number(point.yhat.toFixed(2)),
      lower: Number(point.yhat_lower.toFixed(2)),
      upper: Number(point.yhat_upper.toFixed(2)),
      category: standardized.category,
      riskScore: standardized.riskScore,
      color: standardized.color,
    };
  });

  // Enhanced tooltip showing both risk score and AQI category
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-background border rounded-md p-3 shadow-md min-w-[200px]">
          <p className="font-medium mb-2">{data.date}</p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pollutant:</span>
              <span className="text-sm font-medium">{getPollutantDisplayName(pollutant)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Level:</span>
              <span className="text-sm">{data.value} μg/m³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Range:</span>
              <span className="text-sm">{data.lower} - {data.upper} μg/m³</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">🎯 Risk Score:</span>
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: data.color }}
                ></div>
                <span className="text-sm font-medium">{data.riskScore}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">🏷 AQI Category:</span>
              <span className="text-sm font-medium">{data.category}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Get pollutant unit for display
  const getPollutantUnit = (pollutantCode: string): string => {
    // Most air pollutants are measured in µg/m³
    return "µg/m³";
  };
  
  // Get the dominant AQI category from the forecast data
  const getDominantCategory = (): AqiLevel | null => {
    if (!data || data.length === 0) return null;
    
    const categoryCounts: Record<string, number> = {};
    
    data.forEach(item => {
      if (item.category) {
        const category = item.category.toLowerCase();
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    let dominantCategory = null;
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = category;
      }
    }
    
    return dominantCategory as AqiLevel || null;
  };
  
  // Calculate the average predicted value
  const averagePrediction = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, point) => acc + point.yhat, 0);
    return Number((sum / data.length).toFixed(2));
  }, [data]);

  // Get thresholds for current pollutant
  const pollutantThresholds = useMemo(() => {
    return AQI_THRESHOLDS[pollutant] || [];
  }, [pollutant]);
  
  const dominantCategory = getDominantCategory();
  
  // Handle CSV download
  const downloadCSV = () => {
    try {
      // Create CSV content
      const headers = ["Date", "Forecast", "Lower Bound", "Upper Bound", "Category"];
      const rows = data.map(d => [
        format(parseISO(d.ds), 'yyyy-MM-dd'),
        d.yhat.toFixed(2),
        d.yhat_lower.toFixed(2),
        d.yhat_upper.toFixed(2),
        d.category || "Unknown"
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
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <CardTitle>Forecast Preview</CardTitle>
            {dominantCategory && (
              <AqiBadge level={dominantCategory} />
            )}
          </div>
          <CardDescription>
            {data.length}-period forecast for {formatters.getPollutantDisplay(pollutant)} in {formatters.getRegionLabel(region)}
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Info className="mr-2 h-4 w-4" />
                AQI Guide
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>AQI Categories for {formatters.getPollutantDisplay(pollutant)}</SheetTitle>
                <SheetDescription>
                  Reference values for air quality categories
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Range (µg/m³)</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pollutantThresholds.map((threshold, index) => {
                      const [value, category] = threshold;
                      const prevValue = index > 0 ? pollutantThresholds[index-1][0] : 0;
                      const aqiLevel = category as AqiLevel;
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {prevValue} - {value === Infinity ? "∞" : value}
                          </TableCell>
                          <TableCell>
                            <AqiBadge level={aqiLevel} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {dominantCategory && (
                  <div className="mt-6 p-4 rounded-md bg-gray-50 border">
                    <h4 className="text-sm font-medium mb-1">Current Forecast</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      Average predicted value: <strong>{averagePrediction} µg/m³</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getAqiDescription(dominantCategory)}
                    </p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
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
        </div>
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
              <Tooltip content={<CustomTooltip />} />
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
        <div className="flex flex-col space-y-4 mt-4">
          <div className="flex justify-center space-x-4">
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

          {/* AQI Categories Legend */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {[1, 2, 3, 4, 5, 6].map((score) => (
              <div key={score} className="flex items-center space-x-1">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: getColorByRiskScore(score) }}
                ></div>
                <span className="text-xs">{getCategoryByRiskScore(score)}</span>
              </div>
            ))}
          </div>
          
          {dominantCategory && (
            <div className="p-3 rounded-md bg-gray-50 border">
              <p className="text-xs leading-relaxed">
                <span className="font-medium">Air Quality Forecast: </span>
                {getAqiDescription(dominantCategory)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastPreview;
