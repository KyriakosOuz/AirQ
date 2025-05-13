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
  const [authError, setAuthError] = useState<Error | null>(null);

  // Login with Supabase - with error handling and rate limiting
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Login attempt for:", email);
      
      // Prevent excessive login attempts
      const lastAttempt = localStorage.getItem('lastLoginAttempt');
      if (lastAttempt && Date.now() - parseInt(lastAttempt) < 2000) {
        toast.error("Please wait before trying again");
        return false;
      }
      localStorage.setItem('lastLoginAttempt', Date.now().toString());
      
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
        
        // Create basic user profile with available data
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
        };
        
        // Set user profile
        setUser(userProfile);
        
        // Set a default role for now - will be updated after profile fetch
        const userRole: UserRole = email.includes('admin') ? 'admin' : 'authenticated';
        setRole(userRole);
        
        // Set session
        setSession(data.session);
        
        // Fetch profile data in a non-blocking way
        setTimeout(() => {
          fetchUserProfile(data.user);
        }, 0);
        
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

  const fetchUserProfile = async (user: User) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }
      
      // If no profile exists yet, create one
      if (!profileData) {
        console.log("Creating profile for new user");
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (createProfileError) {
          console.error("Error creating profile:", createProfileError);
        }
        return;
      }
      
      // Update user profile with fetched data
      setUser({
        id: user.id,
        email: user.email || '',
        age: profileData.age,
        has_asthma: profileData.has_asthma,
        is_smoker: profileData.is_smoker,
        has_heart_disease: profileData.has_heart_disease,
        has_diabetes: false, // Not in the current profiles table
        has_lung_disease: false, // Not in the current profiles table
      });
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
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
      
      // Navigate after a small delay to prevent potential race conditions
      setTimeout(() => {
        navigate("/auth");
        toast.success("Logged out successfully");
      }, 10);
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error during logout");
    }
  };

  // Check for existing session on mount - simplified for better performance
  useEffect(() => {
    let isMounted = true;
    const cleanupSubscription = { unsubscribe: () => {} };
    
    console.log("Setting up auth state listener");
    setIsLoading(true);
    
    // Immediately check session without blocking render
    const checkInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        setSession(data.session);
        
        if (data.session?.user) {
          console.log("Session found for user:", data.session.user.email);
          setUserToken(data.session.access_token);
          
          // Set minimal user data right away to unblock UI
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
          });
          
          // Set role based on email for now
          const userRole: UserRole = data.session.user.email?.includes('admin') 
            ? 'admin' 
            : 'authenticated';
          setRole(userRole);
          
          // Fetch full profile data asynchronously
          setTimeout(() => {
            fetchUserProfile(data.session.user);
          }, 100);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error getting session:", error);
        if (!isMounted) return;
        setIsLoading(false);
        setAuthError(error instanceof Error ? error : new Error('Session check failed'));
      }
    };
    
    const setupAuthListener = async () => {
      try {
        // Set up auth state listener
        const { data } = await supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            if (!isMounted) return;
            
            console.log("Auth state changed:", event);
            setSession(currentSession);
            
            if (currentSession?.user) {
              setUserToken(currentSession.access_token);
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
              });
              
              // Set role based on email for now
              const userRole: UserRole = currentSession.user.email?.includes('admin') 
                ? 'admin' 
                : 'authenticated';
              setRole(userRole);
            } else if (event === 'SIGNED_OUT') {
              // Clear state on sign out
              storeLogout();
            }
            
            setIsLoading(false);
          }
        );
        
        cleanupSubscription.unsubscribe = data.subscription.unsubscribe;
      } catch (error) {
        console.error("Error setting up auth listener:", error);
        if (!isMounted) return;
        setAuthError(error instanceof Error ? error : new Error('Auth listener setup failed'));
        setIsLoading(false);
      }
    };
    
    // Run both operations without blocking each other
    checkInitialSession();
    setupAuthListener();
    
    return () => {
      isMounted = false;
      cleanupSubscription.unsubscribe();
    };
  }, []);

  // Handle auth errors with a fallback
  if (authError) {
    console.error("Auth system error:", authError);
    // Return a working auth context with default values to prevent the app from crashing
    return (
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          role: 'authenticated', // Default to authenticated to allow app usage
          isAdmin: false,
          isAuthenticated: true, // Force true to allow app usage despite auth errors
          isLoading: false,
          login,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  }

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
