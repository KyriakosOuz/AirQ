
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import AlertsPage from "./pages/AlertsPage";
import NotFound from "./pages/NotFound";
import ForecastPage from "./pages/ForecastPage";
import { AuthProvider } from "./contexts/AuthContext";

import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Insights />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/forecast"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ForecastPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AlertsPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ProfilePage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <AdminPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
