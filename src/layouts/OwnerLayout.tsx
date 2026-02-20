import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const routeTitles: Record<string, string> = {
  "/owner": "Dashboard",
  "/owner/subscription": "Assinatura",
  "/owner/plans": "Planos",
  "/owner/invoices": "Faturas",
  "/owner/audit": "Auditoria",
  "/owner/settings": "Configurações",
};

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let currentPath = "";
  for (const part of parts) {
    currentPath += `/${part}`;
    const title = routeTitles[currentPath];
    if (title) crumbs.push({ label: title, path: currentPath });
  }
  return crumbs;
}

export default function OwnerLayout() {
  const { user, isOwner, isLoading } = useOwnerAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full bg-slate-800" />
          <Skeleton className="h-4 w-3/4 bg-slate-800" />
          <Skeleton className="h-4 w-1/2 bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/owner/login" replace />;
  if (!isOwner) return <Navigate to="/owner/login" replace />;

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const pageTitle = routeTitles[location.pathname] || "Owner";

  return (
    <div className="text-foreground">
      <SidebarProvider>
        <div className="min-h-screen flex w-full overflow-x-hidden bg-slate-950">
          <OwnerSidebar />
          <SidebarInset className="flex-1 min-w-0 flex flex-col">
            <header
              className="h-16 flex items-center justify-between gap-4 px-4 md:px-8 sticky top-0 z-10"
              style={{
                background: "hsl(220 15% 8% / 0.85)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid hsl(220 10% 18%)",
              }}
            >
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-slate-400 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors" />
                <nav className="hidden md:flex items-center gap-1.5 text-sm">
                  {breadcrumbs.map((crumb, i) => (
                    <span key={crumb.path} className="flex items-center gap-1.5">
                      {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                      <span className={i === breadcrumbs.length - 1 ? "font-semibold text-white" : "text-slate-500"}>
                        {crumb.label}
                      </span>
                    </span>
                  ))}
                </nav>
                <h1 className="md:hidden font-semibold text-sm text-white truncate">{pageTitle}</h1>
              </div>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="max-w-[1400px] mx-auto"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
