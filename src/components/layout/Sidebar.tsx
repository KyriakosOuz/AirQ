
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  BarChart3,
  UserCircle,
  LineChart,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserStore } from "@/stores/userStore";
import { 
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, isAdmin, logout } = useUserStore();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    const parts = user.email.split("@");
    return parts[0].substring(0, 2).toUpperCase();
  };

  // Mobile view uses Sheet component
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu size={24} />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view uses SidebarProvider component
  return (
    <SidebarProvider defaultOpen={true}>
      <DesktopSidebar />
    </SidebarProvider>
  );
};

// Mobile sidebar content
const MobileSidebarContent: React.FC = () => {
  const location = useLocation();
  const { user, isAdmin, logout } = useUserStore();
  
  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <img 
          src="/lovable-uploads/a95d6ea6-5b37-4d78-aa50-114b5e7537d2.png" 
          alt="AirQ Logo" 
          className="h-8 object-contain"
        />
      </div>
      
      <Separator className="bg-sidebar-border" />
      
      {/* Navigation Items */}
      <div className="flex-1 overflow-auto py-2">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-sidebar-foreground/70 mb-2">Main Navigation</p>
          <NavigationLinks location={location} isAdmin={isAdmin} />
        </div>
      </div>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {isAdmin ? "Administrator" : "User"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 w-8 p-0"
            >
              <LogOut size={16} />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Desktop sidebar
const DesktopSidebar: React.FC = () => {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <SidebarComponent>
      <SidebarHeader className="flex items-center justify-between p-4">
        <div className="flex items-center overflow-hidden">
          <img 
            src="/lovable-uploads/a95d6ea6-5b37-4d78-aa50-114b5e7537d2.png" 
            alt="AirQ Logo" 
            className={cn(
              "object-contain transition-all duration-300",
              isCollapsed ? "h-8 w-8" : "h-8"
            )}
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={toggleSidebar}
          className="ml-auto h-8 w-8 p-0 text-sidebar-foreground"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span className="sr-only">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </span>
        </Button>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarNavigation />
      </SidebarContent>
      
      <UserProfileFooter />
    </SidebarComponent>
  );
};

// Sidebar navigation groups
const SidebarNavigation: React.FC = () => {
  const location = useLocation();
  const { isAdmin } = useUserStore();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <TooltipProvider delayDuration={300}>
              <NavigationLinks location={location} isAdmin={isAdmin} collapsed={isCollapsed} />
            </TooltipProvider>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
};

// Navigation links component for reuse
const NavigationLinks: React.FC<{ 
  location: ReturnType<typeof useLocation>;
  isAdmin: boolean;
  collapsed?: boolean;
}> = ({ location, isAdmin, collapsed = false }) => {
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

  const renderNavLink = (item: typeof navItems[0]) => {
    const isActive = location.pathname === item.path;
    
    if (collapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>
            <Link
              to={item.path}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                "relative"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-sm" />
              )}
              {item.icon}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.name}</TooltipContent>
        </Tooltip>
      );
    }
    
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
        >
          <Link to={item.path} className="relative">
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-r-sm" />
            )}
            {item.icon}
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      {navItems.map(renderNavLink)}
      
      {isAdmin && (
        <>
          {!collapsed && <Separator className="my-2 bg-sidebar-border" />}
          {adminItems.map(renderNavLink)}
        </>
      )}
    </>
  );
};

// User profile footer
const UserProfileFooter: React.FC = () => {
  const { user, isAdmin, logout } = useUserStore();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  if (!user) return null;
  
  const getUserInitials = () => {
    if (!user.email) return "U";
    const parts = user.email.split("@");
    return parts[0].substring(0, 2).toUpperCase();
  };
  
  if (isCollapsed) {
    return (
      <SidebarFooter className="p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  {user.email}
                  <p className="text-xs font-normal text-muted-foreground">
                    {isAdmin ? "Administrator" : "User"}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="right">Account</TooltipContent>
        </Tooltip>
      </SidebarFooter>
    );
  }
  
  return (
    <SidebarFooter className="p-4 border-t border-sidebar-border">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {user.email}
              <p className="text-xs font-normal text-muted-foreground">
                {isAdmin ? "Administrator" : "User"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{user.email}</p>
          <p className="text-xs text-sidebar-foreground/70 truncate">
            {isAdmin ? "Administrator" : "User"}
          </p>
        </div>
      </div>
    </SidebarFooter>
  );
};

// Helper function to get user initials
function getUserInitials(user: any): string {
  if (!user?.email) return "U";
  const parts = user.email.split("@");
  return parts[0].substring(0, 2).toUpperCase();
}
