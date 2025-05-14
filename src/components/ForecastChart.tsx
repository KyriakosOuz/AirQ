
import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { aqiChartConfig } from "@/lib/chart-config";
import { Forecast } from "@/lib/types";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

interface ForecastChartProps {
  data: Forecast[];
  region: string;
  pollutant: string;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data, region, pollutant }) => {
  // Format data for the chart based on frequency
  const chartData = React.useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: format(parseISO(item.ds), "MMM dd"),
      value: Number(item.yhat.toFixed(2)),
      lower: Number(item.yhat_lower.toFixed(2)),
      upper: Number(item.yhat_upper.toFixed(2))
    }));
  }, [data]);

  // Get pollutant display name
  const getDisplayName = (pollutantCode: string) => {
    const map: Record<string, string> = {
      "no2_conc": "NO₂",
      "o3_conc": "O₃",
      "so2_conc": "SO₂",
      "pm10_conc": "PM10",
      "pm25_conc": "PM2.5",
      "co_conc": "CO",
      "no_conc": "NO",
    };
    return map[pollutantCode] || pollutantCode;
  };

  // Get frequency display name
  const getFrequencyDisplay = (dataPoints: Forecast[]) => {
    if (dataPoints.length < 2) return "";
    
    // Try to determine frequency from the data points
    const date1 = new Date(dataPoints[0].ds);
    const date2 = new Date(dataPoints[1].ds);
    const diffDays = Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Daily";
    if (diffDays === 7) return "Weekly";
    if (diffDays >= 28 && diffDays <= 31) return "Monthly";
    if (diffDays >= 365 && diffDays <= 366) return "Yearly";
    
    return "";
  };

  const pollutantDisplay = getDisplayName(pollutant);
  const regionDisplay = region.charAt(0).toUpperCase() + region.slice(1).replace(/-/g, " ");
  const frequencyDisplay = getFrequencyDisplay(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forecast: {pollutantDisplay} in {regionDisplay}</CardTitle>
        <CardDescription>
          {frequencyDisplay} prediction for {data.length} periods
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AspectRatio ratio={16/9} className="bg-background">
          <ChartContainer 
            config={{
              forecast: {
                label: "Forecast",
                color: "#8884d8",
              },
              upper: {
                label: "Upper Bound",
                color: "#82ca9d",
              },
              lower: {
                label: "Lower Bound",
                color: "#82ca9d",
              }
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  label={{ 
                    value: `${pollutantDisplay} (µg/m³)`, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { 
                      fontSize: '12px', 
                      fill: 'var(--muted-foreground)',
                      textAnchor: 'middle'
                    }
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent 
                      formatter={(value: any, name: string) => {
                        return [`${parseFloat(value).toFixed(2)} µg/m³`, name];
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  name="Upper Bound"
                  stroke="transparent"
                  fillOpacity={0.2}
                  fill="url(#colorUpper)"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Forecast"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#colorValue)"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  name="Lower Bound"
                  stroke="transparent"
                  fillOpacity={0.2}
                  fill="url(#colorLower)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </AspectRatio>
        <div className="flex justify-center space-x-4 mt-4">
          <div className="flex items-center">
            <div className={cn("h-3 w-3 rounded-full mr-1", "bg-[#8884d8]")}></div>
            <span className="text-xs">Forecast</span>
          </div>
          <div className="flex items-center">
            <div className={cn("h-3 w-3 rounded-full mr-1", "bg-[#82ca9d]")}></div>
            <span className="text-xs">Confidence Interval</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastChart;
