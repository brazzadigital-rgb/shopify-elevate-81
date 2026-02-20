import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Search, ChevronRight } from "lucide-react";
import { NotificationProvider } from "@/hooks/useNotifications";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";
import { useSystemSuspension } from "@/hooks/useSystemSuspension";
import { SystemSuspendedBanner } from "@/components/owner/SystemSuspendedBanner";

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/produtos": "Produtos",
  "/admin/colecoes": "Coleções",
  "/admin/pedidos": "Pedidos",
  "/admin/clientes": "Clientes",
  "/admin/cupons": "Cupons",
  "/admin/notificacoes": "Notificações",
  "/admin/secoes": "Seções da Home",
  "/admin/pagamentos": "Pagamentos",
  "/admin/configuracoes": "Configurações",
  "/admin/banners": "Banners",
  "/admin/aparencia": "Identidade Visual",
  "/admin/header": "Header",
  "/admin/header-styles": "Estilos de Header",
  "/admin/home-templates": "Home Templates",
  "/admin/paineis-promo": "Painéis Promo",
  "/admin/vitrines": "Vitrines & Temporadas",
  "/admin/rastreamento": "Rastreamento",
  "/admin/templates-variacoes": "Templates de Variações",
  "/admin/vendedores": "Vendedores",
  "/admin/fornecedores": "Fornecedores",
  "/admin/logistica": "Logística",
  "/admin/funcoes": "Funções e Permissões",
  "/admin/comissoes": "Comissões",
  "/admin/relatorios": "Relatórios",
  "/admin/financeiro": "Financeiro",
  "/admin/financeiro/vendas": "Vendas",
  "/admin/financeiro/produtos": "Produtos Financeiro",
  "/admin/financeiro/custos": "Custos e Margem",
  "/admin/financeiro/comissoes": "Comissões Financeiro",
  "/admin/financeiro/reembolsos": "Reembolsos",
  "/admin/financeiro/conciliacao": "Conciliação",
  "/admin/financeiro/fluxo-caixa": "Fluxo de Caixa",
  "/admin/financeiro/relatorios": "Relatórios Financeiro",
  "/admin/financeiro/configuracoes": "Config. Financeiro",
  "/admin/planos": "Planos e Assinatura",
};

function getBreadcrumbs(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let currentPath = "";
  for (const part of parts) {
    currentPath += `/${part}`;
    const title = routeTitles[currentPath];
    if (title) {
      crumbs.push({ label: title, path: currentPath });
    }
  }
  return crumbs;
}

export default function AdminLayout() {
  const { user, isAdmin, isLoading } = useAuth();
  const [isDark, setIsDark] = useState(() => localStorage.getItem("admin-theme") === "dark");
  const location = useLocation();
  const { isSuspended } = useSystemSuspension();

  useEffect(() => {
    localStorage.setItem("admin-theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
  if (isSuspended) return <SystemSuspendedBanner />;

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const pageTitle = routeTitles[location.pathname] || "Admin";

  return (
    <div className={`admin-panel ${isDark ? "dark" : ""} text-foreground`}>
      <NotificationProvider>
        <SidebarProvider>
          <div className="min-h-screen flex w-full overflow-x-hidden" style={{ background: `hsl(var(--admin-bg))` }}>
            <AdminSidebar />
            <SidebarInset className="flex-1 min-w-0 flex flex-col">
              {/* Premium Topbar */}
              <header
                className="h-16 flex items-center justify-between gap-4 px-4 md:px-8 sticky top-0 z-10"
                style={{
                  background: `hsl(var(--admin-surface) / 0.8)`,
                  backdropFilter: "blur(12px)",
                  borderBottom: `1px solid hsl(var(--admin-border-subtle))`,
                }}
              >
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="text-muted-foreground min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl hover:bg-muted/50 transition-colors" />
                  
                  {/* Breadcrumbs */}
                  <nav className="hidden md:flex items-center gap-1.5 text-sm">
                    {breadcrumbs.map((crumb, i) => (
                      <span key={crumb.path} className="flex items-center gap-1.5">
                        {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
                        <span className={i === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                          {crumb.label}
                        </span>
                      </span>
                    ))}
                  </nav>
                  
                  {/* Mobile title */}
                  <h1 className="md:hidden font-semibold text-sm truncate">{pageTitle}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <NotificationBell isAdmin />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDark(d => !d)}
                    className="text-muted-foreground rounded-xl h-10 w-10"
                    aria-label="Alternar tema"
                  >
                    {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
                  </Button>
                </div>
              </header>
              
              {/* Main Content */}
              <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-[1600px] mx-auto"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </NotificationProvider>
    </div>
  );
}
