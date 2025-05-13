
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useUserStore } from "@/stores/userStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  requireAdmin = false
}) => {
  const location = useLocation();
  const { isAuthenticated, isAdmin } = useUserStore();

  // Check authentication
  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check admin access if required
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated (and has admin access if required)
  return <>{children}</>;
};

export default ProtectedRoute;
