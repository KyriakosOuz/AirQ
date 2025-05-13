
import { create } from 'zustand';
import { UserProfile, UserRole } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

type UserState = {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  setRole: (role: UserRole | null) => void;
  logout: () => void;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<boolean>;
};

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: null,
  role: null,
  isAdmin: false,
  isAuthenticated: false,
  
  setUser: (user) => set(() => ({ 
    user,
    isAuthenticated: !!user
  })),
  
  setToken: (token) => set(() => ({ token })),
  
  setRole: (role) => set(() => ({ 
    role,
    isAdmin: role === 'admin'
  })),
  
  logout: async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // Reset local state
    set({
      user: null,
      token: null,
      role: null,
      isAdmin: false,
      isAuthenticated: false
    });
  },
  
  updateProfile: async (profileData) => {
    const { user } = get();
    
    if (!user) return false;
    
    try {
      // Update the profiles table in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          age: profileData.age,
          has_asthma: profileData.has_asthma,
          is_smoker: profileData.is_smoker,
          has_heart_disease: profileData.has_heart_disease,
          // Add other profile fields as needed
        })
        .eq('user_id', user.id);
        
      if (error) {
        console.error("Error updating profile:", error);
        return false;
      }
      
      // Update local state
      set({
        user: {
          ...user,
          ...profileData
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error in updateProfile:", error);
      return false;
    }
  }
}));
