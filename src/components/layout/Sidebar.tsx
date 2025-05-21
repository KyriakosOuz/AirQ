
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  BarChart3,
  UserCircle,
  LineChart,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserStore } from "@/stores/userStore";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = React.useState(isMobile);
  const { user, isAdmin, logout } = useUserStore();

  // Toggle sidebar on mobile
  React.useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <Home size={20} />,
    },
    {
      name: "Insights",
      path: "/insights",
      icon: <BarChart3 size={20} />,
    },
    {
      name: "Health Profile",
      path: "/profile",
      icon: <UserCircle size={20} />,
    },
    {
      name: "Forecasts",
      path: "/forecasts",
      icon: <LineChart size={20} />,
    },
    {
      name: "AQI Alerts",
      path: "/alerts",
      icon: <Bell size={20} />,
    }
  ];

  // Admin nav items
  const adminItems = [
    {
      name: "Admin Panel",
      path: "/admin",
      icon: <Settings size={20} />,
    },
  ];

  return (
    <aside
      className={cn(
        "bg-sidebar h-screen border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("p-4 flex items-center", collapsed && "justify-center")}>
        <div className="flex items-center">
          {collapsed ? (
            <img 
              src="/lovable-uploads/a95d6ea6-5b37-4d78-aa50-114b5e7537d2.png" 
              alt="AirQ Logo" 
              className="w-8 h-8 object-contain"
            />
          ) : (
            <img 
              src="/lovable-uploads/a95d6ea6-5b37-4d78-aa50-114b5e7537d2.png" 
              alt="AirQ Logo" 
              className="h-8 object-contain"
            />
          )}
          {!collapsed && (
            <h1 className="ml-2 font-bold text-lg">AirQ</h1>
          )}
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? ">" : "<"}
          </Button>
        )}
      </div>

      <nav className="flex-1 mt-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md transition-colors",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
              >
                <span>{item.icon}</span>
                {!collapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            </li>
          ))}

          {isAdmin &&
            adminItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md transition-colors",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center"
                  )}
                >
                  <span>{item.icon}</span>
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            ))}
        </ul>
      </nav>

      {user && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn("flex items-center", collapsed && "justify-center w-full")}
              onClick={logout}
            >
              <LogOut size={20} />
              {!collapsed && <span className="ml-2">Logout</span>}
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
};
