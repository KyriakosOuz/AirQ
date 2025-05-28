
import { useState, useEffect } from 'react';
import { modelApi } from '@/lib/api';
import { Pollutant } from '@/lib/types';
import { toast } from '@/components/ui/sonner';

interface UseModelExistsProps {
  region: string;
  pollutant: Pollutant;
  frequency: string;
  skip?: boolean;
}

export function useModelExists({ region, pollutant, frequency, skip = false }: UseModelExistsProps) {
  const [modelExists, setModelExists] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  // Check if model exists whenever any of the parameters change
  useEffect(() => {
    if (skip || !region || !pollutant || !frequency) {
      return;
    }

    const checkModelExists = async () => {
      setIsChecking(true);
      setCheckError(null);
      
      try {
        const response = await modelApi.checkExists({
          region,
          pollutant,
          frequency
        });
        
        if (response.success && response.data) {
          setModelExists(response.data.exists);
          console.log(`Model exists check: ${response.data.exists}`);
        } else {
          setCheckError(response.error || "Failed to check if model exists");
          console.error("Failed to check if model exists:", response.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setCheckError(errorMessage);
        console.error("Error checking if model exists:", errorMessage);
      } finally {
        setIsChecking(false);
      }
    };

    checkModelExists();
  }, [region, pollutant, frequency, skip]);

  // Function to perform an on-demand check (for use in button click handlers)
  const checkExists = async (): Promise<boolean> => {
    if (!region || !pollutant || !frequency) {
      return false;
    }
    
    setIsChecking(true);
    setCheckError(null);
    
    try {
      const response = await modelApi.checkExists({
        region,
        pollutant,
        frequency
      });
      
      if (response.success && response.data) {
        const exists = response.data.exists;
        setModelExists(exists);
        console.log(`Model exists check: ${exists}`);
        return exists;
      } else {
        setCheckError(response.error || "Failed to check if model exists");
        console.error("Failed to check if model exists:", response.error);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setCheckError(errorMessage);
      console.error("Error checking if model exists:", errorMessage);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  return { modelExists, isChecking, checkError, checkExists };
}
