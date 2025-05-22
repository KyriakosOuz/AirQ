
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/auth-header';
import { ApiResponse } from '@/lib/api';

interface DatasetAvailabilityProps {
  region: string;
}

interface DatasetAvailabilityResponse {
  available: boolean;
}

export function useDatasetAvailability({ region }: DatasetAvailabilityProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAvailability() {
      if (!region) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetchWithAuth(
          `/datasets/check-availability/?region=${region}`
        );
        
        const responseData = await response.json();
        
        if (response.ok && responseData) {
          setIsAvailable(responseData.available);
        } else {
          console.error("Failed to check dataset availability:", responseData.error || "Unknown error");
          setError(responseData.error || "Failed to check dataset availability");
          // Default to true in case of error to prevent blocking training
          setIsAvailable(true);
        }
      } catch (err) {
        console.error("Error checking dataset availability:", err);
        setError("Error checking dataset availability");
        // Default to true in case of error to prevent blocking training
        setIsAvailable(true);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAvailability();
  }, [region]);
  
  return { isAvailable, isLoading, error };
}
