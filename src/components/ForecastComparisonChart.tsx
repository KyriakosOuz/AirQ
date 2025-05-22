
import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Forecast, Pollutant } from "@/lib/types";

interface RegionForecast {
  region: string;
  forecasts: Forecast[];
  color: string;
}

interface ForecastComparisonChartProps {
  data: RegionForecast[];
  pollutant: Pollutant;
}

const CHART_COLORS = [
  "#8884d8", // purple
  "#82ca9d", // green
  "#ffc658", // yellow
  "#ff8042", // orange
  "#0088fe", // blue
  "#00C49F", // teal
  "#FFBB28", // amber
  "#FF8042", // coral
];

export function ForecastComparisonChart({ data, pollutant }: ForecastComparisonChartProps) {
  // Merge and format data for the chart
  const chartData = React.useMemo(() => {
    if (!data.length) return [];
    
    // Find all unique dates across all regions
    const allDates = new Set<string>();
    data.forEach(regionData => {
      regionData.forecasts.forEach(f => {
        allDates.add(f.ds);
      });
    });
    
    // Create chart data points for each date
    return Array.from(allDates).sort().map(date => {
      const dataPoint: Record<string, any> = {
        date: format(parseISO(date), "MMM dd"),
        rawDate: date,
      };
      
      // Add values for each region
      data.forEach(regionData => {
        const forecast = regionData.forecasts.find(f => f.ds === date);
        if (forecast) {
          dataPoint[regionData.region] = typeof forecast.yhat === 'number' ? 
            Number(forecast.yhat.toFixed(2)) : 0;
        }
      });
      
      return dataPoint;
    });
  }, [data]);

  // Get pollutant display name
  const getPollutantDisplay = (pollutantCode: Pollutant) => {
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

  // Get region display name
  const getRegionDisplay = (regionValue: string): string => {
    return regionValue.charAt(0).toUpperCase() + regionValue.slice(1).replace(/-/g, " ");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Comparison: {getPollutantDisplay(pollutant)}</CardTitle>
        <CardDescription>
          Forecast comparison across {data.length} regions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AspectRatio ratio={16/9} className="bg-background">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
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
                  value: `${getPollutantDisplay(pollutant)} (µg/m³)`, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { 
                    fontSize: '12px', 
                    fill: 'var(--muted-foreground)',
                    textAnchor: 'middle'
                  }
                }}
              />
              <Tooltip
                formatter={(value: any, name: string) => {
                  const formattedValue = typeof value === 'number' ? 
                    `${parseFloat(value.toString()).toFixed(2)} µg/m³` : 
                    '-- µg/m³';
                  return [formattedValue, getRegionDisplay(name)];
                }}
              />
              <Legend 
                formatter={(value) => getRegionDisplay(value)} 
                wrapperStyle={{ paddingTop: '10px' }}
              />
              {data.map((region, index) => (
                <Line
                  key={region.region}
                  type="monotone"
                  dataKey={region.region}
                  stroke={region.color || CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </AspectRatio>
      </CardContent>
    </Card>
  );
}
