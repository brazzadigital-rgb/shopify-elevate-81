import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import StoreLayout from "./layouts/StoreLayout";
import Index from "./pages/Index";
import ProductPage from "./pages/Product";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Collections from "./pages/admin/Collections";
import StoreSettings from "./pages/admin/StoreSettings";
import Placeholder from "./pages/admin/Placeholder";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Store routes with shared layout */}
            <Route element={<StoreLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/produto/:slug" element={<ProductPage />} />
              <Route path="/colecoes" element={<div className="container py-20 text-center"><h1 className="font-display text-3xl font-bold mb-2">Coleções</h1><p className="text-muted-foreground font-sans">Em breve — Fase 4</p></div>} />
              <Route path="/colecao/:slug" element={<div className="container py-20 text-center"><h1 className="font-display text-3xl font-bold mb-2">Coleção</h1><p className="text-muted-foreground font-sans">Em breve — Fase 4</p></div>} />
              <Route path="/ofertas" element={<div className="container py-20 text-center"><h1 className="font-display text-3xl font-bold mb-2">Ofertas</h1><p className="text-muted-foreground font-sans">Em breve</p></div>} />
              <Route path="/contato" element={<div className="container py-20 text-center"><h1 className="font-display text-3xl font-bold mb-2">Contato</h1><p className="text-muted-foreground font-sans">Em breve — Fase 4</p></div>} />
              <Route path="/faq" element={<div className="container py-20 text-center"><h1 className="font-display text-3xl font-bold mb-2">FAQ</h1><p className="text-muted-foreground font-sans">Em breve — Fase 4</p></div>} />
            </Route>

            {/* Auth */}
            <Route path="/auth" element={<Auth />} />

            {/* Admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="produtos" element={<Products />} />
              <Route path="colecoes" element={<Collections />} />
              <Route path="configuracoes" element={<StoreSettings />} />
              <Route path="pedidos" element={<Placeholder />} />
              <Route path="clientes" element={<Placeholder />} />
              <Route path="cupons" element={<Placeholder />} />
              <Route path="secoes" element={<Placeholder />} />
              <Route path="relatorios" element={<Placeholder />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
