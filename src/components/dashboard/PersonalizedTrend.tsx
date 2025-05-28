
import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PersonalizedData {
  labels: string[];
  values: number[];
  deltas: (number | null)[];
  unit: string;
}

interface PersonalizedTrendProps {
  data: PersonalizedData;
}

export const PersonalizedTrend: React.FC<PersonalizedTrendProps> = ({ data }) => {
  // Add defensive validation to ensure all required arrays exist
  console.log("PersonalizedTrend received data:", data);
  
  // Validate arrays and provide fallbacks
  const validLabels = Array.isArray(data?.labels) ? data.labels : [];
  const validValues = Array.isArray(data?.values) ? data.values : [];
  const validDeltas = Array.isArray(data?.deltas) ? data.deltas : [];
  const unit = data?.unit || 'μg/m³';

  // Check if we have valid data
  if (validLabels.length === 0 || validValues.length === 0) {
    return (
      <DashboardCard
        title="Your Pollution Trend"
        description="Personalized historical data for your region"
      >
        <div className="h-32 flex items-center justify-center text-muted-foreground">
          <p>No trend data available at the moment.</p>
        </div>
      </DashboardCard>
    );
  }

  const chartData = validLabels.map((label, index) => ({
    year: label,
    value: validValues[index] || 0,
    delta: validDeltas[index] || null
  }));

  const lastDelta = validDeltas.length > 0 ? validDeltas[validDeltas.length - 1] : null;
  const isPositive = lastDelta && lastDelta > 0;

  return (
    <DashboardCard
      title="Your Pollution Trend"
      description="Personalized historical data for your region"
      headerAction={
        lastDelta && (
          <Badge variant={isPositive ? "destructive" : "success"} className="text-xs">
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}{lastDelta.toFixed(1)} {unit} vs last year
          </Badge>
        )
      }
    >
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="year" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip 
              formatter={(value) => [`${value} ${unit}`, 'Average']}
            />
            <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};
