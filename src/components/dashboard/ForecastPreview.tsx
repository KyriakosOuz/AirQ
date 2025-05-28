
import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Dot } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { getColorByCategory, normalizeCategory, AQI_CATEGORIES } from '@/lib/aqi-standardization';
import { format, parseISO } from 'date-fns';

interface ForecastData {
  ds: string;
  yhat: number;
  category: string;
}

interface ForecastPreviewProps {
  forecast: ForecastData[];
}

export const ForecastPreview: React.FC<ForecastPreviewProps> = ({ forecast }) => {
  const navigate = useNavigate();

  console.log("ForecastPreview received forecast data:", forecast, "Type:", typeof forecast, "Is Array:", Array.isArray(forecast));
  
  const validForecast = Array.isArray(forecast) ? forecast : [];
  
  if (validForecast.length === 0) {
    return (
      <DashboardCard
        title="7-Day Forecast"
        description="Upcoming air quality predictions"
        headerAction={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/forecasts')}
            className="text-xs"
          >
            View Full Forecast
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        }
      >
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          <p>No forecast data available at the moment.</p>
        </div>
      </DashboardCard>
    );
  }

  // Prepare chart data with standardized categories
  const chartData = validForecast.map((item, index) => {
    const normalizedCategory = normalizeCategory(item.category);
    return {
      date: format(parseISO(item.ds), 'EEE'),
      fullDate: format(parseISO(item.ds), 'MMM dd'),
      value: Number(item.yhat.toFixed(1)),
      category: normalizedCategory,
      color: getColorByCategory(normalizedCategory),
      dayIndex: index
    };
  });

  // Calculate trend
  const firstValue = validForecast[0]?.yhat || 0;
  const lastValue = validForecast[validForecast.length - 1]?.yhat || 0;
  const trend = lastValue - firstValue;
  const isImproving = trend < 0; // Lower pollution is better

  // Get most common category
  const categoryCounts = validForecast.reduce((acc, item) => {
    const normalized = normalizeCategory(item.category);
    acc[normalized] = (acc[normalized] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const dominantCategory = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || AQI_CATEGORIES.MODERATE;

  // Custom dot component for the line chart
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return (
      <Dot 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={payload.color}
        stroke="#fff"
        strokeWidth={1}
      />
    );
  };

  // Enhanced tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md">
          <p className="font-medium">{data.fullDate}</p>
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm">{data.value} μg/m³</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{data.category}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardCard
      title="7-Day Forecast"
      description="Upcoming air quality predictions"
      headerAction={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/forecasts')}
          className="text-xs"
        >
          View Full Forecast
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={<CustomDot />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Daily Cards */}
        <div className="grid grid-cols-7 gap-1">
          {chartData.map((item, index) => (
            <div 
              key={index}
              className="text-center p-2 rounded-md border bg-card"
            >
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {item.date}
              </div>
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-xs font-medium">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Row */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline"
              style={{ 
                backgroundColor: `${getColorByCategory(dominantCategory)}20`,
                borderColor: getColorByCategory(dominantCategory),
                color: getColorByCategory(dominantCategory)
              }}
            >
              Mostly {dominantCategory}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {isImproving ? (
              <>
                <TrendingDown className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Improving</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-3 w-3 text-orange-600" />
                <span className="text-orange-600">Worsening</span>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardCard>
  );
};
