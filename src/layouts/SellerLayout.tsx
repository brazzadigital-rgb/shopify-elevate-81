import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellerLayout() {
  const { user, isSeller, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isSeller)) {
      navigate("/auth?redirect=/vendedor");
    }
  }, [user, isSeller, isLoading, navigate]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!user || !isSeller) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-lg">Painel do Vendedor</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="rounded-xl font-sans text-xs">
              Ver loja
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl h-8 w-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-6xl">
        <Outlet />
      </main>
    </div>
  );
}
