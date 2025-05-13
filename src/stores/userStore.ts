
import { create } from 'zustand'
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { persist } from 'zustand/middleware';
import { aqiLevelLabels } from '@/lib/types';

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
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      recommendations: [],
      riskLevel: null,
      updateUser: (user) => set({ user }),
      updateProfile: (profile) => set({ profile }),
      updateRecommendations: (recommendations) => set({ recommendations }),
      updateRiskLevel: (riskLevel) => set({ riskLevel }),
      
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
