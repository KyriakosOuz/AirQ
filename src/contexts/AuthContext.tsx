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

  // Login with Supabase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast.error(error.message);
        return false;
      }
      
      if (data && data.session) {
        // Store the token from Supabase
        setUserToken(data.session.access_token);
        
        // Get user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
          
        if (profileError) {
          console.error("Error fetching profile:", profileError);
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
      console.error(error);
      toast.error("An error occurred during login");
      return false;
    }
  };

  const logout = async () => {
    try {
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
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
      }
    );

    // Check for existing session - FIX: properly handle Promise
    try {
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        
        if (initialSession?.user && !user) {
          setUserToken(initialSession.access_token);
          
          // Fetch user profile data
          supabase
            .from('profiles')
            .select('*')
            .eq('user_id', initialSession.user.id)
            .maybeSingle()
            .then(({ data: profileData }) => {
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
            })
            .catch((error) => {
              console.error("Error fetching profile on init:", error);
            });
        }
      }).catch(error => {
        console.error("Error getting session:", error);
      });
    } catch (error) {
      console.error("Error in session initialization:", error);
    }

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
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
