
import * as React from "react";
import { format, parseISO } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";
import { aqiChartConfig } from "@/lib/chart-config";

interface ForecastDataPoint {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  region: string;
  pollutant: string;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data, region, pollutant }) => {
  // Format data for the chart
  const chartData = React.useMemo(
    () =>
      data.map((item) => ({
        ...item,
        date: format(parseISO(item.ds), "MMM dd"),
        forecast: item.yhat,
        lower: item.yhat_lower,
        upper: item.yhat_upper,
      })),
    [data]
  );

  // Get pollutant display name
  const getDisplayName = (pollutantCode: string) => {
    const map: Record<string, string> = {
      no2_conc: "NO₂",
      o3_conc: "O₃",
      so2_conc: "SO₂",
      pm10_conc: "PM10",
      pm25_conc: "PM2.5",
      co_conc: "CO",
    };
    return map[pollutantCode] || pollutantCode;
  };

  const pollutantDisplay = getDisplayName(pollutant);
  const regionDisplay = region.charAt(0).toUpperCase() + region.slice(1).replace("-", " ");

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Forecast: {pollutantDisplay} in {regionDisplay}</CardTitle>
        <CardDescription>
          Predicted pollutant levels for the next 6 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ChartContainer 
            config={{
              forecast: {
                label: "Forecast",
                color: "#8884d8",
              },
              confidence: {
                label: "Confidence Interval",
                color: "#82ca9d",
              },
            }}
          >
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.05} />
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
                  style: { fontSize: '12px', fill: 'var(--muted-foreground)' }
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    formatter={(value: any, name: string) => {
                      if (name === "Forecast" || name === "Lower Bound" || name === "Upper Bound") {
                        return [`${parseFloat(value).toFixed(2)} µg/m³`, name];
                      }
                      return [value, name];
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
                fill="url(#colorConfidence)"
              />
              <Area
                type="monotone"
                dataKey="forecast"
                name="Forecast"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#colorForecast)"
              />
              <Area
                type="monotone"
                dataKey="lower"
                name="Lower Bound"
                stroke="transparent"
                fillOpacity={0.2}
                fill="url(#colorConfidence)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastChart;
