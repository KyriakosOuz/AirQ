
import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

const AppLayout: React.FC = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <SidebarInset className="flex-1">
          <div className="p-4 h-full">
            {children || <Outlet />}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
