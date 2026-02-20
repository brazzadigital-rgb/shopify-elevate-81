import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Link2, ShoppingBag, Users, Coins, Wallet,
  Tag, FolderOpen, UserCircle, HelpCircle, LogOut, Store, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

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

export default function SellerMobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/vendedor") return location.pathname === "/vendedor";
    return location.pathname.startsWith(path);
  };

  const go = (path: string) => { navigate(path); setOpen(false); };

  return (
    <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Store className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold text-sm">Painel Vendedor</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-base">Painel Vendedor</span>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {menu.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => go(item.path)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-sans transition-all",
                    active
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-border p-3 space-y-1 mt-auto">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 rounded-xl text-sm" onClick={() => go("/")}>
              <Store className="w-4 h-4" /> Ver loja
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 rounded-xl text-sm text-destructive" onClick={signOut}>
              <LogOut className="w-4 h-4" /> Sair
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
