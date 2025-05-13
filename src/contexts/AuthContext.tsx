import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/use-toast";
import { UserProfile, UserRole } from "@/lib/types";
import { setToken, removeToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{
    user: User | null;
    session: Session | null;
    error: Error | null;
  }>;
  signIn: (email: string, password: string) => Promise<{
    user: User | null;
    session: Session | null;
    error: Error | null;
  }>;
  signOut: () => Promise<{ error: Error | null }>;
  loading: boolean;
  saveProfile: (profile: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  signUp: async () => ({ user: null, session: null, error: null }),
  signIn: async () => ({ user: null, session: null, error: null }),
  signOut: async () => ({ error: null }),
  loading: true,
  saveProfile: async () => ({ error: null }),
  userProfile: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Toast notifications
  const { toast } = useToast();
  
  // User store from Zustand
  const updateUser = useUserStore(state => state.updateUser);
  const updateProfile = useUserStore(state => state.updateProfile);
  const userProfile = useUserStore(state => state.profile);
  
  // Add state for auth status
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state change", event, newSession?.user?.id);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      updateUser(newSession?.user ?? null);
      
      // Store the access token for API calls if available
      if (newSession?.access_token) {
        setToken(newSession.access_token);
      } else if (event === 'SIGNED_OUT') {
        removeToken();
      }
      
      // Fetch user profile on auth state change, but not immediately
      // Use setTimeout to avoid potential deadlock with Supabase real-time
      if (newSession?.user) {
        setTimeout(() => {
          fetchUserProfile(newSession.user.id);
        }, 0);
      }
    });
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      updateUser(data.session?.user ?? null);
      
      // Store the access token for API calls if available
      if (data.session?.access_token) {
        setToken(data.session.access_token);
      }
      
      if (data.session?.user) {
        fetchUserProfile(data.session.user.id);
      }
      
      setLoading(false);
      setInitialLoad(false);
    });
    
    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [updateUser]);

  // Check if user is admin when profile changes
  useEffect(() => {
    if (userProfile) {
      setIsAdmin(userProfile.role === 'admin');
    } else {
      setIsAdmin(false);
    }
  }, [userProfile]);
  
  // Fetch user profile from profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile', error);
        return;
      }
      
      if (data) {
        // Create a typed profile with all required fields
        // ensuring we have defaults for fields that might not exist in the database
        const profile: UserProfile = {
          id: data.user_id,
          email: user?.email || '',
          age: data.age,
          has_asthma: data.has_asthma || false,
          is_smoker: data.is_smoker || false,
          has_heart_disease: data.has_heart_disease || false,
          // Handle potentially missing fields with defaults
          has_diabetes: false, // Default since it's missing in DB
          has_lung_disease: false, // Default since it's missing in DB
          // Handle role with proper type casting
          role: (data.role as UserRole) || 'user'
        };
        
        updateProfile(profile);
      }
    } catch (error) {
      console.error('Error in profile fetch', error);
    }
  };
  
  // Add login function for Auth.tsx
  const login = async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      return !error;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  const saveProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error('User not authenticated') };
      }
      
      // Prepare data object with only fields that exist in the database
      const dbData = {
        user_id: user.id,
        age: profileData.age,
        has_asthma: profileData.has_asthma,
        is_smoker: profileData.is_smoker,
        has_heart_disease: profileData.has_heart_disease,
        // Note: has_diabetes and has_lung_disease are intentionally omitted since they don't exist in DB
        updated_at: new Date().toISOString(),
      };
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert(dbData);
      
      if (error) {
        console.error('Error saving profile', error);
        return { error };
      }
      
      // Update local state - we maintain all fields in the local state
      // even if some aren't in the database yet
      if (userProfile) {
        updateProfile({
          ...userProfile,
          ...profileData,
        } as UserProfile);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error in profile save', error);
      return { error: error as Error };
    }
  };
  
  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        }
      });
      
      if (error) {
        toast({
          title: "Error signing up",
          description: error.message,
          variant: "destructive",
        });
        return { user: null, session: null, error };
      }
      
      // If we have a session, store the access token
      if (data.session?.access_token) {
        setToken(data.session.access_token);
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your signup.",
        });
      }
      
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('SignUp error', error);
      return { user: null, session: null, error: error as Error };
    }
  };
  
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
        return { user: null, session: null, error };
      }
      
      // Store the access token for API calls
      if (data.session?.access_token) {
        setToken(data.session.access_token);
      }
      
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error('SignIn error', error);
      return { user: null, session: null, error: error as Error };
    }
  };
  
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error', error);
        return { error };
      }
      
      // Clear the token when signing out
      removeToken();
      
      // Clear local user state
      updateUser(null);
      updateProfile(null);
      
      return { error: null };
    } catch (error) {
      console.error('SignOut error', error);
      return { error: error as Error };
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        signUp,
        signIn,
        signOut,
        loading: loading || initialLoad,
        saveProfile,
        userProfile,
        isAuthenticated: !!session,
        isAdmin,
        isLoading: loading || initialLoad,
        login
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
