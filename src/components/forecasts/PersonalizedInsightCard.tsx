
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoCircle } from "./InfoCircle";
import FormattedAITip from "./FormattedAITip";
import { 
  standardizeAqiDataPoint,
  AQI_CATEGORIES
} from "@/lib/aqi-standardization";

// Simple health advice based on standardized risk score and user health conditions
const getHealthAdvice = (riskScore: number, category: string, profile: any) => {
  if (!profile) {
    return "Sign in and complete your health profile for personalized recommendations.";
  }

  if (riskScore >= 4 && profile.has_asthma) {
    return "⚠️ You may experience breathing difficulty due to asthma. Consider staying indoors today.";
  }
  
  if (riskScore >= 3 && profile.has_lung_disease) {
    return "⚠️ Your lung condition may be aggravated. Limit outdoor activities and keep medication accessible.";
  }
  
  if (riskScore >= 3 && profile.has_heart_disease) {
    return "⚠️ Heart symptoms may worsen. Avoid physical exertion outdoors and monitor your symptoms closely.";
  }
  
  if (riskScore >= 4 && profile.age && profile.age > 65) {
    return "⚠️ Older adults are more sensitive to air pollution. Consider staying indoors with windows closed.";
  }
  
  if (riskScore >= 3 && profile.is_smoker) {
    return "⚠️ The combination of smoking and air pollution increases respiratory risks. Consider reducing smoking today.";
  }
  
  if (riskScore >= 2 && profile.has_diabetes) {
    return "⚠️ Air pollution may affect blood sugar levels. Monitor your glucose more frequently today.";
  }
  
  // General advice based on standardized categories
  switch (category) {
    case AQI_CATEGORIES.GOOD:
      return "Air quality is good. Enjoy outdoor activities as normal.";
    case AQI_CATEGORIES.MODERATE:
      return "Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.";
    case AQI_CATEGORIES.UNHEALTHY_SENSITIVE:
      return "Members of sensitive groups may experience health effects. Consider reducing prolonged outdoor activities.";
    case AQI_CATEGORIES.UNHEALTHY:
      return "Everyone may begin to experience health effects. Limit time spent outdoors, especially if you feel symptoms.";
    case AQI_CATEGORIES.VERY_UNHEALTHY:
      return "Health alert: Everyone may experience more serious health effects. Avoid outdoor activities and wear a mask if going outside is necessary.";
    case AQI_CATEGORIES.HAZARDOUS:
      return "Health emergency: Everyone should avoid all outdoor activities. Stay indoors with air purification if possible.";
    default:
      return "Monitor air quality and adjust activities accordingly.";
  }
};

interface PersonalizedInsightCardProps {
  currentData: any | null;
  profile: any;
  loading: boolean;
}

const PersonalizedInsightCard: React.FC<PersonalizedInsightCardProps> = ({ 
  currentData, 
  profile,
  loading
}) => {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!currentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Personal Health Insight</CardTitle>
          <CardDescription>
            No data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Update the forecast to view personalized health insights.</p>
        </CardContent>
      </Card>
    );
  }
  
  // Standardize the current data
  const standardizedData = standardizeAqiDataPoint(currentData);
  
  // Mock AI tip for demonstration
  const mockAITip = `🟡 **Moderate Risk**

AI Health Recommendations
Based on your health profile and forecasted air quality in Thessaloniki

1. Limit outdoor activities during peak sun hours (10am–4pm).
2. Wear a properly-fitted N95 mask if you go outside.
3. Stay hydrated and avoid dehydrating beverages.
4. Consult your doctor if symptoms worsen.
5. Monitor daily air quality reports.

- Keep rescue medication accessible if you have respiratory conditions
- Consider using an air purifier indoors
- Avoid vigorous exercise outdoors

**Important:** These recommendations are AI-generated based on your profile and should not replace professional medical advice.`;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Personal Health Insight</CardTitle>
        <CardDescription>
          Tailored advice based on your health profile and current air quality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg transition-all hover:bg-muted/80">
          <p className="text-lg">{getHealthAdvice(standardizedData.riskScore, standardizedData.category, profile)}</p>
        </div>
        
        {!profile && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <span>Complete your health profile to get personalized air quality advice.</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/profile')}
                className="ml-2"
              >
                Update Profile
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Protective Actions */}
        {standardizedData.riskScore >= 3 && (
          <Card className="border-dashed border-muted-foreground/30 bg-background/80">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-base flex items-center gap-1">
                <InfoCircle className="h-4 w-4 text-blue-500" />
                Recommended Protective Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {standardizedData.riskScore >= 4 && (
                  <>
                    <li>Limit outdoor activities, especially during peak pollution hours</li>
                    <li>Keep windows closed if possible</li>
                    <li>Consider using an air purifier indoors</li>
                  </>
                )}
                <li>Stay hydrated</li>
                <li>Monitor your symptoms</li>
                {(profile?.has_asthma || profile?.has_lung_disease) && (
                  <li>Keep rescue medication accessible</li>
                )}
                {standardizedData.riskScore >= 5 && (
                  <li>Wear a N95 mask when outdoors</li>
                )}
                {standardizedData.riskScore >= 6 && (
                  <li>Avoid all outdoor activities - health emergency conditions</li>
                )}
              </ul>
            </CardContent>
          </Card>
        )}
        
        {/* AI Insights with FormattedAITip */}
        <Card className="border-dashed border-purple-300 bg-purple-50/50">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-base flex items-center gap-2">
              🤖 AI-Generated Health Insights
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <FormattedAITip tipText={mockAITip} />
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default PersonalizedInsightCard;
