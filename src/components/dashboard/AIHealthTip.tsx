
import React from 'react';
import { DashboardCard } from './DashboardCard';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles } from 'lucide-react';
import { parseBoldText } from '@/lib/ai-tip-formatter';

interface AITipData {
  tip: string;
  riskLevel: string;
  personalized: boolean;
}

interface AIHealthTipProps {
  data: AITipData;
}

export const AIHealthTip: React.FC<AIHealthTipProps> = ({ data }) => {
  const getRiskLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = parseBoldText(text);
    return (
      <span className="text-sm leading-relaxed">
        {parts.map((part, index) => (
          part.bold ? (
            <strong key={index}>{part.text}</strong>
          ) : (
            <span key={index}>{part.text}</span>
          )
        ))}
      </span>
    );
  };

  const formatTipContent = (tip: string) => {
    // Split by numbered items and render as list
    const items = tip.split(/\d+\.\s*/).filter(item => item.trim());
    
    return (
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
              {index + 1}
            </span>
            {renderFormattedText(item.trim())}
          </li>
        ))}
      </ol>
    );
  };

  return (
    <DashboardCard
      title="AI Health Tip of the Day"
      description={data.personalized ? "Personalized advice based on your profile" : "General health advice"}
      headerAction={
        <div className="flex items-center gap-2">
          {data.personalized && (
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Personalized
            </Badge>
          )}
          <Badge className={getRiskLevelColor(data.riskLevel)}>
            {data.riskLevel}
          </Badge>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-blue-600">
          <Brain className="h-4 w-4" />
          <span className="text-sm font-medium">AI Recommendation</span>
        </div>
        {formatTipContent(data.tip)}
      </div>
    </DashboardCard>
  );
};
