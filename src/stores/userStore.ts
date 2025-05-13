
import { create } from 'zustand'
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { persist } from 'zustand/middleware';
import { aqiLevelLabels } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface UserState {
  user: User | null;
  profile: UserProfile | null;
  recommendations: string[];
  riskLevel: string | null;
  updateUser: (user: User | null) => void;
  updateProfile: (profile: UserProfile | null) => void;
  updateRecommendations: (recommendations: string[]) => void;
  updateRiskLevel: (riskLevel: string | null) => void;
  getSensitiveStatus: () => boolean;
  getPersonalization: () => string;
  // Add missing functions
  isAdmin: boolean;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      recommendations: [],
      riskLevel: null,
      isAdmin: false, // Add isAdmin property
      updateUser: (user) => set({ 
        user,
        // Update isAdmin when user changes
        isAdmin: get().profile?.role === 'admin' || false
      }),
      updateProfile: (profile) => set({ 
        profile,
        // Update isAdmin when profile changes
        isAdmin: profile?.role === 'admin' || false
      }),
      updateRecommendations: (recommendations) => set({ recommendations }),
      updateRiskLevel: (riskLevel) => set({ riskLevel }),
      
      // Add logout function
      logout: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, profile: null, recommendations: [], riskLevel: null });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
      
      // Check if user has any health conditions that make them sensitive to air pollution
      getSensitiveStatus: () => {
        const profile = get().profile;
        if (!profile) return false;
        
        return (
          profile.has_asthma === true || 
          profile.has_lung_disease === true || 
          profile.has_heart_disease === true ||
          profile.has_diabetes === true ||
          (profile.age !== undefined && profile.age !== null && profile.age > 65)
        );
      },
      
      // Get personalization summary for the user
      getPersonalization: () => {
        const profile = get().profile;
        if (!profile) return "Not personalized";
        
        const conditions = [];
        
        if (profile.has_asthma) conditions.push("asthma");
        if (profile.is_smoker) conditions.push("smoker");
        if (profile.has_heart_disease) conditions.push("heart disease");
        if (profile.has_diabetes) conditions.push("diabetes");
        if (profile.has_lung_disease) conditions.push("lung disease");
        
        if (conditions.length === 0) {
          return profile.age ? `Personalized for age ${profile.age}` : "Basic personalization";
        }
        
        return `Personalized for ${conditions.join(', ')}${profile.age ? ` and age ${profile.age}` : ''}`;
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ 
        // Only persist these fields
        user: state.user,
        profile: state.profile
      }),
    }
  )
);
