
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserProfile, UserRole } from "@/lib/types";
import { getToken, removeToken } from "@/lib/api";
import { useUserStore } from "@/stores/userStore";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { 
    user, 
    token, 
    role, 
    isAdmin, 
    isAuthenticated, 
    setUser, 
    setToken: setUserToken, 
    setRole, 
    logout: storeLogout 
  } = useUserStore();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Login with Supabase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Login attempt for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error("Login error:", error);
        toast.error(error.message);
        return false;
      }
      
      if (data && data.session) {
        console.log("Login successful, setting token");
        // Store the token from Supabase
        setUserToken(data.session.access_token);
        
        // Get user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
        }
        
        // If no profile exists yet, create one
        if (!profileData) {
          console.log("Creating profile for new user");
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            
          if (createProfileError) {
            console.error("Error creating profile:", createProfileError);
          }
        }
        
        // Create user profile with Supabase data
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          // Add profile data if available
          ...(profileData && {
            age: profileData.age,
            hasAsthma: profileData.has_asthma,
            isSmoker: profileData.is_smoker,
            hasHeartIssues: profileData.has_heart_disease,
            hasDiabetes: false, // Not in the current profiles table
            hasLungDisease: false, // Not in the current profiles table
          }),
        };
        
        // Set user profile
        setUser(userProfile);
        
        // Set role (assuming a default role for now)
        // In a real app, you'd fetch this from a specific roles table or user metadata
        const userRole: UserRole = email.includes('admin') ? 'admin' : 'authenticated';
        setRole(userRole);
        
        // Set session
        setSession(data.session);
        
        toast.success("Login successful!");
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Unexpected login error:", error);
      toast.error("An unexpected error occurred during login");
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out...");
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        toast.error("Error during logout");
        return;
      }
      
      // Clear local state
      storeLogout();
      setSession(null);
      navigate("/auth");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error during logout");
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    console.log("Setting up auth state listener");
    setIsLoading(true);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession ? "session exists" : "no session");
        setSession(currentSession);
        
        if (currentSession?.user) {
          console.log("User authenticated:", currentSession.user.email);
          setUserToken(currentSession.access_token);
          
          // Fetch user profile data in a non-blocking way
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', currentSession.user.id)
                .maybeSingle();
              
              // Create user profile
              const userProfile: UserProfile = {
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                // Add profile data if available
                ...(profileData && {
                  age: profileData.age,
                  hasAsthma: profileData.has_asthma,
                  isSmoker: profileData.is_smoker,
                  hasHeartIssues: profileData.has_heart_disease,
                  hasDiabetes: false,
                  hasLungDisease: false,
                }),
              };
              
              setUser(userProfile);
              
              // Set role based on email for now
              const userRole: UserRole = currentSession.user.email?.includes('admin') 
                ? 'admin' 
                : 'authenticated';
              setRole(userRole);
            } catch (error) {
              console.error("Error fetching profile on auth state change:", error);
            }
          }, 0);
        } else {
          // Clear state on sign out
          storeLogout();
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    const fetchInitialSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        setSession(initialSession);
        
        if (initialSession?.user && !user) {
          console.log("Initial session found for user:", initialSession.user.email);
          setUserToken(initialSession.access_token);
          
          // Fetch user profile data
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', initialSession.user.id)
              .maybeSingle();
            
            // Create user profile
            const userProfile: UserProfile = {
              id: initialSession.user.id,
              email: initialSession.user.email || '',
              // Add profile data if available
              ...(profileData && {
                age: profileData.age,
                hasAsthma: profileData.has_asthma,
                isSmoker: profileData.is_smoker,
                hasHeartIssues: profileData.has_heart_disease,
                hasDiabetes: false,
                hasLungDisease: false,
              }),
            };
            
            setUser(userProfile);
            
            // Set role based on email for now
            const userRole: UserRole = initialSession.user.email?.includes('admin') 
              ? 'admin' 
              : 'authenticated';
            setRole(userRole);
          } catch (error) {
            console.error("Error fetching profile on init:", error);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting session:", error);
        setIsLoading(false);
      }
    };
    
    fetchInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAdmin,
        isAuthenticated,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
