
import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

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

  // Add defensive validation to ensure forecast is an array
  console.log("ForecastPreview received forecast data:", forecast, "Type:", typeof forecast, "Is Array:", Array.isArray(forecast));
  
  // Validate that forecast is an array, provide fallback
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

  const chartData = validForecast.map(item => ({
    date: new Date(item.ds).toLocaleDateString('en-US', { weekday: 'short' }),
    value: item.yhat,
    category: item.category
  }));

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                formatter={(value) => [`${value} μg/m³`, 'Pollution Level']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-wrap gap-1">
          {validForecast.slice(0, 7).map((item, index) => (
            <Badge 
              key={index}
              variant="outline"
              className={getCategoryColor(item.category)}
            >
              {item.category}
            </Badge>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
};
