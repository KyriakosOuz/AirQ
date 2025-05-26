
import { useState, useEffect } from 'react';

interface LoadingProgressState {
  progress: number;
  message: string;
  timeRemaining: number;
}

const loadingMessages = [
  "Fetching your personalized air quality data...",
  "Analyzing current pollution levels...",
  "Processing 7-day forecasts...",
  "Generating AI health recommendations..."
];

export const useLoadingProgress = (maxDuration: number = 12000) => {
  const [state, setState] = useState<LoadingProgressState>({
    progress: 0,
    message: loadingMessages[0],
    timeRemaining: maxDuration / 1000
  });

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / maxDuration) * 100, 100);
      const remaining = Math.max(0, Math.ceil((maxDuration - elapsed) / 1000));
      
      // Change message based on progress
      let messageIndex = 0;
      if (progress >= 75) messageIndex = 3;
      else if (progress >= 50) messageIndex = 2;
      else if (progress >= 25) messageIndex = 1;
      
      setState({
        progress,
        message: loadingMessages[messageIndex],
        timeRemaining: remaining
      });

      if (elapsed >= maxDuration) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [maxDuration]);

  return state;
};
