
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect, useRef } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Create a hook to handle API request cancellation on component unmount
export function useApiRequest() {
  const controllerRef = useRef<AbortController | null>(null);
  
  useEffect(() => {
    return () => {
      // Cancel any ongoing requests when component unmounts
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);
  
  const createSignal = () => {
    // Clean up previous controller if exists
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    
    // Create new controller
    controllerRef.current = new AbortController();
    return controllerRef.current.signal;
  };
  
  return { createSignal };
}

// Debounce function to prevent too many API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Add performance monitoring helper
export function measurePerformance(operationName: string, callback: () => void) {
  const startTime = performance.now();
  callback();
  const endTime = performance.now();
  console.log(`[Performance] ${operationName} took ${(endTime - startTime).toFixed(2)}ms`);
}
