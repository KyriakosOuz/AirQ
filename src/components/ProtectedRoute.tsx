
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireAdmin = false
}) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  // Log authentication state for debugging
  console.log("Auth state:", { 
    isAuthenticated, isAdmin, isLoading, path: location.pathname 
  });
  
  // Show loading indicator while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    console.log("Not authenticated, redirecting to /auth from:", location.pathname);
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check admin access if required
  if (requireAdmin && !isAdmin) {
    console.log("Admin access required but user is not admin, redirecting to /");
    return <Navigate to="/" replace />;
  }

  // User is authenticated (and has admin access if required)
  return <>{children}</>;
};

export default ProtectedRoute;
