
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

interface CacheState {
  cache: Record<string, CacheEntry>;
  setCache: <T>(key: string, data: T, ttl?: number) => void;
  getCache: <T>(key: string) => T | null;
  clearCache: (key?: string) => void;
  isExpired: (key: string) => boolean;
}

export const useCacheStore = create<CacheState>()(
  persist(
    (set, get) => ({
      cache: {},
      
      setCache: (key, data, ttl) => {
        const now = Date.now();
        const expiresAt = ttl ? now + ttl : undefined;
        
        set(state => ({
          cache: {
            ...state.cache,
            [key]: {
              data,
              timestamp: now,
              expiresAt
            }
          }
        }));
      },
      
      getCache: (key) => {
        const entry = get().cache[key];
        if (!entry) return null;
        
        // Check if expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          get().clearCache(key);
          return null;
        }
        
        return entry.data;
      },
      
      clearCache: (key) => {
        if (key) {
          set(state => {
            const newCache = { ...state.cache };
            delete newCache[key];
            return { cache: newCache };
          });
        } else {
          set({ cache: {} });
        }
      },
      
      isExpired: (key) => {
        const entry = get().cache[key];
        if (!entry) return true;
        if (!entry.expiresAt) return false;
        return Date.now() > entry.expiresAt;
      }
    }),
    {
      name: 'app-cache-storage',
      // Only persist non-sensitive data
      partialize: (state) => ({
        cache: Object.fromEntries(
          Object.entries(state.cache).filter(([key]) => 
            !key.includes('sensitive') && !key.includes('auth')
          )
        )
      }),
    }
  )
);

// Clear session cache when the app starts (optional)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Cache will be cleared when browser closes due to sessionStorage
    console.log('App closing, cache will be cleared');
  });
}
