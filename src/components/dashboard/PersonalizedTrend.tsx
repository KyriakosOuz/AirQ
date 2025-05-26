
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
  const chartData = data.labels.map((label, index) => ({
    year: label,
    value: data.values[index],
    delta: data.deltas[index]
  }));

  const lastDelta = data.deltas[data.deltas.length - 1];
  const isPositive = lastDelta && lastDelta > 0;

  return (
    <DashboardCard
      title="Your Pollution Trend"
      description="Personalized historical data for your region"
      headerAction={
        lastDelta && (
          <Badge variant={isPositive ? "destructive" : "success"} className="text-xs">
            {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {isPositive ? '+' : ''}{lastDelta.toFixed(1)} {data.unit} vs last year
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
              formatter={(value) => [`${value} ${data.unit}`, 'Average']}
            />
            <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  );
};
