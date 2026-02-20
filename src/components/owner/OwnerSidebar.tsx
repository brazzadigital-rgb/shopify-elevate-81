import { useState } from "react";
import {
  LayoutDashboard, CreditCard, FileText, Receipt, Shield, Settings, LogOut, ChevronDown
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useOwnerAuth } from "@/hooks/useOwnerAuth";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const mainMenu = [
  { title: "Dashboard", url: "/owner", icon: LayoutDashboard },
  { title: "Assinatura", url: "/owner/subscription", icon: CreditCard },
  { title: "Planos", url: "/owner/plans", icon: FileText },
  { title: "Faturas", url: "/owner/invoices", icon: Receipt },
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

  return (
    <Sidebar
      className="border-r-0"
      style={{
        background: "linear-gradient(180deg, hsl(220 15% 12%) 0%, hsl(220 15% 8%) 100%)",
        borderRight: "1px solid hsl(220 10% 18%)",
      }}
    >
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white tracking-wide">Owner Portal</span>
            <span className="text-[10px] text-slate-400 font-medium">Sistema de Gestão</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2 space-y-1 overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 uppercase text-[11px] tracking-[0.1em] font-bold px-3">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/owner"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-150 text-[13px] font-medium"
                      activeClassName="bg-amber-500/10 text-amber-400 font-semibold"
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1" style={{ borderTop: "1px solid hsl(220 10% 18%)" }}>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all duration-150 w-full text-[13px] font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
