
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface InsightSummaryProps {
  data: any[];
  chartType: 'trend' | 'seasonal' | 'top-polluted';
  pollutant: string;
  region?: string;
  year?: number;
  dataUnit: string;
}

export const InsightSummary: React.FC<InsightSummaryProps> = ({
  data,
  chartType,
  pollutant,
  region,
  year,
  dataUnit
}) => {
  if (!data || data.length === 0) return null;

  const generateTrendInsights = () => {
    const values = data.map(d => d.value);
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = lastValue > firstValue ? 'increasing' : lastValue < firstValue ? 'decreasing' : 'stable';
    
    return {
      summary: `${pollutant.replace('_conc', '').toUpperCase()} levels in ${region} showed a ${trend} trend in ${year}.`,
      details: [
        `Average concentration: ${avgValue.toFixed(1)} ${dataUnit}`,
        `Peak level: ${maxValue.toFixed(1)} ${dataUnit}`,
        `Lowest level: ${minValue.toFixed(1)} ${dataUnit}`,
        `Overall change: ${((lastValue - firstValue) / firstValue * 100).toFixed(1)}%`
      ],
      icon: trend === 'increasing' ? TrendingUp : trend === 'decreasing' ? TrendingDown : CheckCircle,
      color: trend === 'increasing' ? 'text-red-500' : trend === 'decreasing' ? 'text-green-500' : 'text-blue-500'
    };
  };

  const generateSeasonalInsights = () => {
    const values = data.map(d => d.value);
    const monthNames = data.map(d => d.month);
    const maxIndex = values.indexOf(Math.max(...values));
    const minIndex = values.indexOf(Math.min(...values));
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    
    return {
      summary: `Seasonal patterns show ${pollutant.replace('_conc', '').toUpperCase()} peaks in ${monthNames[maxIndex]} and lowest levels in ${monthNames[minIndex]}.`,
      details: [
        `Annual average: ${avgValue.toFixed(1)} ${dataUnit}`,
        `Highest month: ${monthNames[maxIndex]} (${values[maxIndex].toFixed(1)} ${dataUnit})`,
        `Lowest month: ${monthNames[minIndex]} (${values[minIndex].toFixed(1)} ${dataUnit})`,
        `Seasonal variation: ${((Math.max(...values) - Math.min(...values)) / avgValue * 100).toFixed(1)}%`
      ],
      icon: AlertTriangle,
      color: 'text-amber-500'
    };
  };

  const generateTopPollutedInsights = () => {
    const sortedData = [...data].sort((a, b) => b.value - a.value);
    const topRegion = sortedData[0];
    const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
    const variance = data.reduce((sum, d) => sum + Math.pow(d.value - avgValue, 2), 0) / data.length;
    
    return {
      summary: `${topRegion.name} has the highest ${pollutant.replace('_conc', '').toUpperCase()} levels among all regions in ${year}.`,
      details: [
        `Most polluted: ${topRegion.name} (${topRegion.value.toFixed(1)} ${dataUnit})`,
        `Regional average: ${avgValue.toFixed(1)} ${dataUnit}`,
        `Total regions analyzed: ${data.length}`,
        `Concentration spread: ${Math.sqrt(variance).toFixed(1)} ${dataUnit} std dev`
      ],
      icon: AlertTriangle,
      color: 'text-red-500'
    };
  };

  const insights = chartType === 'trend' ? generateTrendInsights() :
                  chartType === 'seasonal' ? generateSeasonalInsights() :
                  generateTopPollutedInsights();

  const IconComponent = insights.icon;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <IconComponent className={`h-5 w-5 ${insights.color}`} />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium mb-3">{insights.summary}</p>
        <ul className="space-y-1">
          {insights.details.map((detail, index) => (
            <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-1 bg-current rounded-full"></span>
              {detail}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
