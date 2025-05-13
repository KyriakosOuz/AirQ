
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

/**
 * Extract error message from various error formats
 * This ensures we always have a string for toast.error() and other UI displays
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred";
  
  // If error is already a string, return it
  if (typeof error === "string") return error;
  
  // If error is a standard Error object
  if (error instanceof Error) return error.message;
  
  // If error is an object with specific API error format
  if (typeof error === "object") {
    // Check for common error message structures
    const errorObj = error as Record<string, any>;
    
    // Direct error message
    if (errorObj.message && typeof errorObj.message === "string") {
      return errorObj.message;
    }
    
    // API error detail
    if (errorObj.error && typeof errorObj.error === "string") {
      return errorObj.error;
    }
    
    // Supabase error format
    if (errorObj.error_description && typeof errorObj.error_description === "string") {
      return errorObj.error_description;
    }
    
    // Detail field commonly used in REST APIs
    if (errorObj.detail && typeof errorObj.detail === "string") {
      return errorObj.detail;
    }
    
    // If we have nested errors, try to extract them
    if (errorObj.errors && Array.isArray(errorObj.errors)) {
      return errorObj.errors.map((e: any) => 
        typeof e === "string" ? e : (e.message || JSON.stringify(e))
      ).join(", ");
    }
    
    // Last resort: convert to JSON string but make it readable
    try {
      return `Error: ${JSON.stringify(errorObj, null, 2)}`;
    } catch {
      return "Error object could not be serialized";
    }
  }
  
  // Fallback for any other type of error
  return "An unexpected error occurred";
}
