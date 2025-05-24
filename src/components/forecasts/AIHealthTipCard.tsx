
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, AlertCircle, Info } from "lucide-react";
import FormattedAITip from "./FormattedAITip";

interface AIHealthTipCardProps {
  tip: string | null;
  riskLevel: string | null;
  personalized: boolean;
  loading: boolean;
  error: string | null;
}

// Risk level color mapping
const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel?.toLowerCase()) {
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    case "moderate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "severe":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const AIHealthTipCard: React.FC<AIHealthTipCardProps> = ({
  tip,
  riskLevel,
  personalized,
  loading,
  error
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-8 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Health Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load AI health tips: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!tip) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Health Recommendation
          </CardTitle>
          <CardDescription>
            Select forecast parameters and update to get AI-generated health tips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Update the forecast to view personalized AI health recommendations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Health Recommendation
          </CardTitle>
          {riskLevel && (
            <Badge 
              variant="outline" 
              className={getRiskLevelColor(riskLevel)}
            >
              {riskLevel} Risk
            </Badge>
          )}
        </div>
        <CardDescription>
          AI-powered health guidance based on forecast conditions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormattedAITip tipText={tip} />
        
        {!personalized && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Tip based on general guidance (no profile info set). Complete your health profile for personalized recommendations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AIHealthTipCard;
