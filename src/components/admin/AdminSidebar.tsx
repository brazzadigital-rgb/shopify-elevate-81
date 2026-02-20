import { useState, useEffect } from "react";
import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Users, Tag, Image, Settings, LogOut, ShoppingBag,
  Truck, UserCheck, Shield, Percent, TrendingUp, Columns3, Layout, CalendarRange,
  DollarSign, BarChart3, ArrowDownCircle, CreditCard, Wallet, FileSpreadsheet, Wrench, Activity, Bell, Layers,
  ChevronDown
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SidebarPlanWidget } from "@/components/admin/SidebarPlanWidget";

const mainMenu = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Templates Variações", url: "/admin/templates-variacoes", icon: Layers },
  { title: "Coleções", url: "/admin/colecoes", icon: FolderOpen },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart, badgeKey: "orders" as const },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Cupons", url: "/admin/cupons", icon: Tag },
  { title: "Notificações", url: "/admin/notificacoes", icon: Bell, badgeKey: "notifications" as const },
  { title: "Seções da Home", url: "/admin/secoes", icon: Image },
  { title: "Pagamentos", url: "/admin/pagamentos", icon: CreditCard },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

const appearanceMenu = [
  { title: "Home Templates", url: "/admin/home-templates", icon: Layout },
  { title: "Estilos de Header", url: "/admin/header-styles", icon: Settings },
  { title: "Header", url: "/admin/header", icon: Settings },
  { title: "Banners", url: "/admin/banners", icon: Image },
  { title: "Painéis Promo", url: "/admin/paineis-promo", icon: Columns3 },
  { title: "Identidade Visual", url: "/admin/aparencia", icon: Settings },
];

const financialMenu = [
  { title: "Visão Geral", url: "/admin/financeiro", icon: DollarSign },
  { title: "Vendas", url: "/admin/financeiro/vendas", icon: ShoppingCart },
  { title: "Produtos", url: "/admin/financeiro/produtos", icon: Package },
  { title: "Custos e Margem", url: "/admin/financeiro/custos", icon: BarChart3 },
  { title: "Comissões", url: "/admin/financeiro/comissoes", icon: Percent },
  { title: "Reembolsos", url: "/admin/financeiro/reembolsos", icon: ArrowDownCircle },
  { title: "Conciliação", url: "/admin/financeiro/conciliacao", icon: CreditCard },
  { title: "Fluxo de Caixa", url: "/admin/financeiro/fluxo-caixa", icon: Wallet },
  { title: "Relatórios", url: "/admin/financeiro/relatorios", icon: FileSpreadsheet },
  { title: "Configurações", url: "/admin/financeiro/configuracoes", icon: Wrench },
];

const marketingMenu = [
  { title: "Vitrines & Temporadas", url: "/admin/vitrines", icon: CalendarRange },
  { title: "Rastreamento", url: "/admin/rastreamento", icon: Activity },
];

const usersMenu = [
  { title: "Vendedores", url: "/admin/vendedores", icon: UserCheck },
  { title: "Fornecedores", url: "/admin/fornecedores", icon: Truck },
  { title: "Logística", url: "/admin/logistica", icon: Truck },
  { title: "Funções e Permissões", url: "/admin/funcoes", icon: Shield },
  { title: "Comissões", url: "/admin/comissoes", icon: Percent },
  { title: "Relatórios", url: "/admin/relatorios", icon: TrendingUp },
];

type MenuItem = { title: string; url: string; icon: any; badgeKey?: "orders" | "notifications" };

function MenuGroup({ label, items, badges, defaultOpen = false }: { label: string; items: MenuItem[]; badges?: Record<string, number>; defaultOpen?: boolean }) {
  const location = useLocation();
  const hasActiveChild = items.some(item => 
    item.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.url)
  );
  const [isOpen, setIsOpen] = useState(defaultOpen || hasActiveChild);

  return (
    <SidebarGroup>
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center justify-between w-full px-3 py-2.5 mb-0.5 rounded-lg hover:bg-muted/30 transition-colors group"
      >
        <SidebarGroupLabel className="text-foreground/70 uppercase text-[11px] tracking-[0.1em] font-bold pointer-events-none">
          {label}
        </SidebarGroupLabel>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-foreground/40 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const count = item.badgeKey && badges ? badges[item.badgeKey] || 0 : 0;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-150 text-[13px] font-medium"
                      activeClassName="bg-primary/8 text-primary font-semibold"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.title}</span>
                      {count > 0 && (
                        <span className="ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const { signOut } = useAuth();
  const { getSetting } = useStoreSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const [pendingOrders, setPendingOrders] = useState(0);
  const [seenOrders, setSeenOrders] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingOrders(count || 0);
    };
    fetchPending();

    const channel = supabase
      .channel("sidebar-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchPending();
        if (!location.pathname.startsWith("/admin/pedidos")) {
          setSeenOrders(false);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin/pedidos")) {
      setSeenOrders(true);
    }
  }, [location.pathname]);

  const badges = { orders: seenOrders ? 0 : pendingOrders, notifications: unreadCount };
  const logoUrl = getSetting("logo_url");

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar
      className="border-r-0"
      style={{
        background: `hsl(var(--admin-surface))`,
        borderRight: `1px solid hsl(var(--admin-border-subtle))`,
      }}
    >
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-bold">A</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">Admin</span>
            <span className="text-[10px] text-muted-foreground font-medium">Painel de Gestão</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 space-y-1 overflow-y-auto">
        <MenuGroup label="Menu" items={mainMenu} badges={badges} defaultOpen />
        <MenuGroup label="Marketing" items={marketingMenu} />
        <MenuGroup label="Financeiro" items={financialMenu} />
        <MenuGroup label="Aparência" items={appearanceMenu} />
        <MenuGroup label="Usuários e Operações" items={usersMenu} />
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1" style={{ borderTop: `1px solid hsl(var(--admin-border-subtle))` }}>
        <SidebarPlanWidget />
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-150 w-full text-[13px] font-medium"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ver Loja</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-150 w-full text-[13px] font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
