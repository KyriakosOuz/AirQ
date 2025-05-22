
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/stores/userStore";
import {
  ChevronDown,
  LayoutDashboard,
  BarChart2,
  Settings,
  Bell,
  LogOut,
  UserRound,
  ArrowUpRight,
  CalendarDays
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { profile } = useUserStore();
  const isAdmin = profile?.role === "admin";

  // Function to check if a route is active
  const isRouteActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            AirQuality Dashboard
          </h2>
          <div className="space-y-1">
            <Button
              variant={isRouteActive("/dashboard") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              variant={isRouteActive("/insights") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/insights">
                <BarChart2 className="mr-2 h-4 w-4" />
                Insights
              </Link>
            </Button>
            <Button
              variant={isRouteActive("/forecast") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/forecast">
                <CalendarDays className="mr-2 h-4 w-4" />
                Forecast
              </Link>
            </Button>
          </div>
        </div>

        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <div className="space-y-1">
            <Button
              variant={isRouteActive("/alerts") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/alerts">
                <Bell className="mr-2 h-4 w-4" />
                Alerts
              </Link>
            </Button>
            <Button
              variant={isRouteActive("/profile") ? "secondary" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/profile">
                <UserRound className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            {isAdmin && (
              <Button
                variant={isRouteActive("/admin") ? "secondary" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link to="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Panel
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
