import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { NotificationProvider } from "@/hooks/useNotifications";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function AdminLayout() {
  const { user, isAdmin, isLoading } = useAuth();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("admin-theme") === "dark");

  useEffect(() => {
    localStorage.setItem("admin-theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className={`${isDark ? "dark" : ""} text-foreground`}>
      <NotificationProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full overflow-x-hidden bg-background">
            <AdminSidebar />
            <SidebarInset className="flex-1 min-w-0 flex flex-col">
              <header className="h-14 flex items-center justify-between gap-4 border-b px-3 md:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                <SidebarTrigger className="text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center" />
                <div className="flex items-center gap-1">
                  <NotificationBell isAdmin />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDark(d => !d)}
                    className="text-muted-foreground min-h-[44px] min-w-[44px]"
                    aria-label="Alternar tema"
                  >
                    {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                  </Button>
                </div>
              </header>
              <main className="flex-1 p-3 md:p-6 overflow-x-hidden bg-background">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </NotificationProvider>
    </div>
  );
}
