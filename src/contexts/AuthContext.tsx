
import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserProfile, UserRole } from "@/lib/types";
import { getToken, removeToken } from "@/lib/api";
import { useUserStore } from "@/stores/userStore";

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

  // Mock authentication function - in real app would use Supabase
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Mock credentials for demo purposes only
      if (email === "user@example.com" && password === "password") {
        const mockUser = {
          id: "user-123",
          email: "user@example.com",
        };
        const mockToken = "mock-jwt-token";
        const mockRole = "authenticated" as UserRole;
        
        setUserToken(mockToken);
        setUser(mockUser);
        setRole(mockRole);
        
        // Store token in localStorage
        localStorage.setItem("air_quality_token", mockToken);
        
        toast.success("Login successful!");
        return true;
      }
      
      if (email === "admin@example.com" && password === "password") {
        const mockUser = {
          id: "admin-123",
          email: "admin@example.com",
        };
        const mockToken = "mock-admin-jwt-token";
        const mockRole = "admin" as UserRole;
        
        setUserToken(mockToken);
        setUser(mockUser);
        setRole(mockRole);
        
        // Store token in localStorage
        localStorage.setItem("air_quality_token", mockToken);
        
        toast.success("Admin login successful!");
        return true;
      }
      
      toast.error("Invalid credentials");
      return false;
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during login");
      return false;
    }
  };

  const logout = () => {
    storeLogout();
    navigate("/auth");
    toast.success("Logged out successfully");
  };

  // Check for existing auth on mount
  useEffect(() => {
    const token = getToken();
    if (token && !user) {
      // In a real app, this would verify the token with the backend
      // For demo purposes, we'll just set some mock data
      const mockUser = { id: "user-from-storage", email: "user@example.com" };
      const mockRole: UserRole = "authenticated";
      
      setUserToken(token);
      setUser(mockUser);
      setRole(mockRole);
    }
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
