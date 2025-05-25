
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Pollutant } from "@/lib/types";

interface TrendTabProps {
  region: string;
  pollutant: Pollutant;
  data: any[];
  loading: boolean;
  error?: string;
  dataUnit: string;
}

const chartConfig = {
  trend: {
    label: "Trend",
    color: "hsl(var(--primary))",
  },
};

export const TrendTab: React.FC<TrendTabProps> = ({
  region,
  pollutant,
  data,
  loading,
  error,
  dataUnit
}) => {
  const getPollutantDisplayName = (pollutant: Pollutant) => {
    if (pollutant === "pollution") return "Combined Pollution Index";
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

  const getRegionDisplayName = (region: string) => {
    return region.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {getPollutantDisplayName(pollutant)} Trend in {getRegionDisplayName(region)}
        </CardTitle>
        <CardDescription>
          Yearly average concentrations over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading trend data...</p>
            </div>
          </div>
        ) : error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis label={{ value: dataUnit, angle: -90, position: 'insideLeft' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--color-trend)" 
                  strokeWidth={2} 
                  dot={{ fill: "var(--color-trend)" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No trend data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
