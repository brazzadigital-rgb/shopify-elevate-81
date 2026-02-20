import {
  LayoutDashboard, CreditCard, FileText, Receipt, Shield, Settings, LogOut,
  Lock, Activity
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const mainMenu = [
  { title: "Dashboard", url: "/owner", icon: LayoutDashboard },
  { title: "Assinatura", url: "/owner/subscription", icon: CreditCard },
  { title: "Planos", url: "/owner/plans", icon: FileText },
  { title: "Faturas", url: "/owner/invoices", icon: Receipt },
];

const systemMenu = [
  { title: "Auditoria", url: "/owner/audit", icon: Shield },
  { title: "Configurações", url: "/owner/settings", icon: Settings },
];

export function OwnerSidebar() {
  const { signOut } = useOwnerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/owner/login");
  };

  const isActive = (url: string) =>
    url === "/owner" ? location.pathname === "/owner" : location.pathname.startsWith(url);

  const renderItem = (item: typeof mainMenu[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === "/owner"}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
            isActive(item.url)
              ? "text-white"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
          }`}
          activeClassName="bg-gradient-to-r from-amber-500/10 to-amber-500/5 text-amber-300 font-semibold shadow-sm"
          style={isActive(item.url) ? { border: "1px solid rgba(251,191,36,0.08)" } : undefined}
        >
          <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
          <span className="truncate">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      className="border-r-0"
      style={{
        background: "linear-gradient(180deg, hsl(220 14% 11%) 0%, hsl(220 15% 8%) 100%)",
        borderRight: "1px solid hsl(220 10% 15%)",
      }}
    >
      <SidebarHeader className="p-5 pb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              boxShadow: "0 4px 14px rgba(245,158,11,0.25)",
            }}
          >
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white tracking-wide">Owner</span>
            <span className="text-[10px] text-slate-500 font-medium">Painel de Controle</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-1 space-y-5 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 uppercase text-[10px] tracking-[0.15em] font-bold px-3 mb-1">
            Financeiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainMenu.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 uppercase text-[10px] tracking-[0.15em] font-bold px-3 mb-1">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {systemMenu.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3" style={{ borderTop: "1px solid hsl(220 10% 15%)" }}>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/[0.04] transition-all duration-200 w-full text-[13px] font-medium"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
