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
  const { user, isAdmin } = useUserStore();

  // Mobile view uses Sheet component
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-10">
            <Menu size={24} />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view uses SidebarComponent directly
  return <DesktopSidebar />;
};

// Mobile sidebar content
const MobileSidebarContent: React.FC = () => {
  const location = useLocation();
  const { user, isAdmin, logout } = useUserStore();
  
  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Logo */}
      <div className="p-6 flex items-center justify-center bg-sidebar border-b border-sidebar-border">
        <img 
          src="/lovable-uploads/a95d6ea6-5b37-4d78-aa50-114b5e7537d2.png" 
          alt="AirQ Logo" 
          className="h-10 object-contain"
        />
      </div>
      
      {/* Navigation Items */}
      <div className="flex-1 overflow-auto py-4">
        <div className="px-4 py-2">
          <p className="text-sm font-semibold text-sidebar-foreground/80 mb-4 uppercase tracking-wide">
            Navigation
          </p>
          <NavigationLinks location={location} isAdmin={isAdmin} mobile />
        </div>
      </div>
      
      {/* User Profile */}
      {user && (
        <div className="p-6 border-t border-sidebar-border bg-sidebar/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-sidebar-border">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{user.email}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {isAdmin ? "Administrator" : "User"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-9 w-9 p-0 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut size={18} />
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
    <SidebarComponent variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4 flex items-center">
        <div className="flex justify-start w-full">
          <img 
            src="/lovable-uploads/a95d6ea6-5b37-4d78-aa50-114b5e7537d2.png" 
            alt="AirQ Logo" 
            className={cn(
              "object-contain transition-all duration-300",
              isCollapsed ? "h-8 w-8" : "h-8"
            )}
          />
        </div>

        <div className="absolute top-4 right-0 transform translate-x-1/2 z-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={toggleSidebar}
                className="h-7 w-7 rounded-full bg-background shadow-sm border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-primary"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                <span className="sr-only">
                  {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
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
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <NavigationLinks location={location} isAdmin={isAdmin} collapsed={isCollapsed} />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

// Navigation links component for reuse
const NavigationLinks: React.FC<{ 
  location: ReturnType<typeof useLocation>;
  isAdmin: boolean;
  collapsed?: boolean;
  mobile?: boolean;
}> = ({ location, isAdmin, collapsed = false, mobile = false }) => {
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
    
    if (mobile) {
      return (
        <Link 
          key={item.path}
          to={item.path}
          className={cn(
            "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
          )}
        >
          <div className={cn(
            "flex items-center justify-center",
            isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/70"
          )}>
            {item.icon}
          </div>
          <span className="text-base font-medium">{item.name}</span>
        </Link>
      );
    }
    
    if (collapsed) {
      return (
        <Tooltip key={item.path}>
          <TooltipTrigger asChild>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.name} isActive={isActive}>
                <Link to={item.path}>
                  {item.icon}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
          <Link to={item.path}>
            {item.icon}
            <span>{item.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  if (mobile) {
    return (
      <div className="space-y-2">
        {navItems.map(renderNavLink)}
        
        {isAdmin && (
          <>
            <div className="my-4">
              <Separator className="bg-sidebar-border" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-sidebar-foreground/80 mb-3 uppercase tracking-wide px-4">
                Admin
              </p>
              {adminItems.map(renderNavLink)}
            </div>
          </>
        )}
      </div>
    );
  }

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
  
  if (isCollapsed) {
    return (
      <SidebarFooter className="p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-full group"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="group-hover:text-black transition-colors">
                      {getUserInitials(user)}
                    </AvatarFallback>
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
            <Button 
              variant="ghost" 
              className="p-0 h-10 w-10 rounded-full group"
            >
              <Avatar>
                <AvatarFallback className="group-hover:text-black transition-colors">
                  {getUserInitials(user)}
                </AvatarFallback>
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
