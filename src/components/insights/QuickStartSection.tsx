
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, Calendar, Trophy } from "lucide-react";
import { Pollutant } from "@/lib/types";

interface QuickStartOption {
  title: string;
  description: string;
  region: string;
  pollutant: Pollutant;
  year: number;
  tab: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface QuickStartSectionProps {
  onQuickStart: (option: QuickStartOption) => void;
}

export const QuickStartSection: React.FC<QuickStartSectionProps> = ({
  onQuickStart
}) => {
  const quickStartOptions: QuickStartOption[] = [
    {
      title: "Thessaloniki NO₂ Trends",
      description: "View historical NO₂ concentration patterns",
      region: "thessaloniki",
      pollutant: "no2_conc",
      year: 2023,
      tab: "trend",
      icon: TrendingUp,
      badge: "Popular"
    },
    {
      title: "Seasonal O₃ Patterns",
      description: "Explore ozone seasonality in Kalamaria",
      region: "kalamaria",
      pollutant: "o3_conc",
      year: 2023,
      tab: "seasonality",
      icon: Calendar
    },
    {
      title: "Most Polluted Areas",
      description: "Compare regions by NO₂ levels",
      region: "thessaloniki",
      pollutant: "no2_conc",
      year: 2023,
      tab: "top-polluted",
      icon: Trophy
    }
  ];

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Start
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Jump right into exploring popular data combinations
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickStartOptions.map((option, index) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-white hover:shadow-md transition-all"
                onClick={() => onQuickStart(option)}
              >
                <div className="flex items-center justify-between w-full">
                  <IconComponent className="h-5 w-5 text-primary" />
                  {option.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {option.badge}
                    </Badge>
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{option.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
