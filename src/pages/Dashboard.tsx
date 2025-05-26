import React from "react";
import { useCachedDashboardOverview } from "@/hooks/useCachedDashboardOverview";
import { TodaysAirQuality } from "@/components/dashboard/TodaysAirQuality";
import { ForecastPreview } from "@/components/dashboard/ForecastPreview";
import { PersonalizedTrend } from "@/components/dashboard/PersonalizedTrend";
import { AIHealthTip } from "@/components/dashboard/AIHealthTip";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";
import ErrorBoundary from "@/components/ErrorBoundary";

const Dashboard: React.FC = () => {
  const { data, loading, error, refetch } = useCachedDashboardOverview();

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Dashboard updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground">Loading your personalized air quality overview...</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Loading skeletons */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground text-red-600">
            Error loading dashboard: {error}
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your personalized air quality overview.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Air Quality - spans 1 column */}
        <div className="lg:col-span-1">
          <ErrorBoundary>
            <TodaysAirQuality
              pollutants={data.current.pollutants}
              aqiCategory={data.current.aqi_category}
              region={data.region}
            />
          </ErrorBoundary>
        </div>

        {/* 7-Day Forecast - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <ForecastPreview forecast={data.forecast} />
          </ErrorBoundary>
        </div>

        {/* Personalized Trend - spans 1 column */}
        <div className="lg:col-span-1">
          <ErrorBoundary>
            <PersonalizedTrend data={data.personalized} />
          </ErrorBoundary>
        </div>

        {/* AI Health Tip - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ErrorBoundary>
            <AIHealthTip data={data.ai_tip} />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
