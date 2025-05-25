
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Pollutant } from "@/lib/types";

interface TopPollutedTabProps {
  pollutant: Pollutant;
  year: number;
  data: any[];
  loading: boolean;
  error?: string;
  dataUnit: string;
}

const chartConfig = {
  regions: {
    label: "Regions",
    color: "hsl(var(--chart-3))",
  },
};

export const TopPollutedTab: React.FC<TopPollutedTabProps> = ({
  pollutant,
  year,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Most Polluted Regions for {getPollutantDisplayName(pollutant)} ({year})
        </CardTitle>
        <CardDescription>
          Regions with highest average concentrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading top polluted data...</p>
            </div>
          </div>
        ) : error ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={data} 
                margin={{ top: 10, right: 15, left: 50, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" label={{ value: dataUnit, position: 'insideBottom', offset: -5 }} />
                <YAxis dataKey="name" type="category" width={150} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-regions)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[600px] flex items-center justify-center text-muted-foreground">
            No top polluted regions data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};
