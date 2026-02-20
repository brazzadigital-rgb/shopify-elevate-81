import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Link2, ShoppingBag, Users, Coins, Wallet,
  Tag, FolderOpen, UserCircle, HelpCircle, LogOut, Store, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/vendedor" },
  { label: "Meus Links", icon: Link2, path: "/vendedor/links" },
  { label: "Minhas Vendas", icon: ShoppingBag, path: "/vendedor/vendas" },
  { label: "Meus Clientes", icon: Users, path: "/vendedor/clientes" },
  { label: "Comissões", icon: Coins, path: "/vendedor/comissoes" },
  { label: "Saques", icon: Wallet, path: "/vendedor/saques" },
  { label: "Cupons", icon: Tag, path: "/vendedor/cupons" },
  { label: "Materiais", icon: FolderOpen, path: "/vendedor/materiais" },
  { label: "Perfil", icon: UserCircle, path: "/vendedor/perfil" },
  { label: "Suporte", icon: HelpCircle, path: "/vendedor/suporte" },
];

export default function SellerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/vendedor") return location.pathname === "/vendedor";
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/60 backdrop-blur-md min-h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
          <Store className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-base">Painel Vendedor</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const active = isActive(item.path);
          return (
            <motion.button
              key={item.path}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-sans transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 rounded-xl text-sm font-sans text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <Store className="w-4 h-4" /> Ver loja
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 rounded-xl text-sm font-sans text-muted-foreground hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" /> Sair
        </Button>
      </div>
    </aside>
  );
}
