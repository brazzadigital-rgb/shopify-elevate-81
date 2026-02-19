import {
  LayoutDashboard, Package, FolderOpen, ShoppingCart, Users, Tag, Image, Settings, BarChart3, LogOut, ShoppingBag,
  Truck, UserCheck, Shield, Percent, TrendingUp
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";

const mainMenu = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Produtos", url: "/admin/produtos", icon: Package },
  { title: "Coleções", url: "/admin/colecoes", icon: FolderOpen },
  { title: "Pedidos", url: "/admin/pedidos", icon: ShoppingCart },
  { title: "Clientes", url: "/admin/clientes", icon: Users },
  { title: "Cupons", url: "/admin/cupons", icon: Tag },
  { title: "Seções da Home", url: "/admin/secoes", icon: Image },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

const appearanceMenu = [
  { title: "Header", url: "/admin/header", icon: Settings },
  { title: "Banners", url: "/admin/banners", icon: Image },
  { title: "Identidade Visual", url: "/admin/aparencia", icon: Settings },
];

const usersMenu = [
  { title: "Vendedores", url: "/admin/vendedores", icon: UserCheck },
  { title: "Fornecedores", url: "/admin/fornecedores", icon: Truck },
  { title: "Funções e Permissões", url: "/admin/funcoes", icon: Shield },
  { title: "Comissões", url: "/admin/comissoes", icon: Percent },
  { title: "Relatórios", url: "/admin/relatorios", icon: TrendingUp },
];

const linkClass = "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200 font-sans text-sm font-medium";
const activeClass = "bg-accent/10 text-accent font-bold border border-accent/20";

function MenuGroup({ label, items }: { label: string; items: typeof mainMenu }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/30 uppercase text-[10px] tracking-widest font-sans font-bold mb-2">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/admin"}
                  className={linkClass}
                  activeClassName={activeClass}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  <span>{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center glow-orange">
            <span className="text-lg">🐆</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-bold text-sidebar-foreground uppercase">Admin</span>
            <span className="text-[10px] text-accent font-sans font-bold uppercase tracking-wider">Painel de Gestão</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 space-y-4">
        <MenuGroup label="Menu" items={mainMenu} />
        <MenuGroup label="Aparência" items={appearanceMenu} />
        <MenuGroup label="Usuários e Operações" items={usersMenu} />
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/40 hover:text-accent hover:bg-sidebar-accent transition-all duration-200 w-full font-sans text-sm mb-1"
        >
          <ShoppingBag className="w-[18px] h-[18px]" />
          <span>Ver Loja</span>
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/40 hover:text-destructive hover:bg-sidebar-accent transition-all duration-200 w-full font-sans text-sm"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Sair</span>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
