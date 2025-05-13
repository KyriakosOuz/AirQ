
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import ProfilePage from "./pages/ProfilePage";
import ForecastPage from "./pages/ForecastPage";
import AlertsPage from "./pages/AlertsPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth route - accessible when not logged in */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes - only accessible when logged in */}
            <Route element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/forecasts" element={<ForecastPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              
              {/* Admin route - requires admin role */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminPage />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
