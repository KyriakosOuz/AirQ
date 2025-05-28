
import React from 'react';
import { Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLoadingProgress } from '@/hooks/useLoadingProgress';

export const DashboardLoadingSpinner: React.FC = () => {
  const { progress, message, timeRemaining } = useLoadingProgress(12000);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Air Quality Dashboard</h1>
        <p className="text-muted-foreground">Loading your personalized air quality overview...</p>
      </div>
      
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-6 max-w-md w-full animate-scale-in">
          {/* Spinning loader icon */}
          <div className="relative">
            <Loader className="h-12 w-12 text-primary animate-spin" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
          </div>
          
          {/* Progress information */}
          <div className="w-full space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground animate-fade-in">
                {message}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round(progress)}% complete • {timeRemaining}s remaining
              </p>
            </div>
            
            {/* Progress bar */}
            <Progress 
              value={progress} 
              className="w-full h-2 bg-muted animate-fade-in" 
            />
          </div>
          
          {/* Loading dots animation */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
