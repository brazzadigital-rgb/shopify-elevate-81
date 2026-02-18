import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import StoreLayout from "./layouts/StoreLayout";
import Index from "./pages/Index";
import ProductPage from "./pages/Product";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Collections from "./pages/admin/Collections";
import StoreSettings from "./pages/admin/StoreSettings";
import Placeholder from "./pages/admin/Placeholder";
import AccountLayout from "./pages/account/AccountLayout";
import Orders from "./pages/account/Orders";
import OrderDetail from "./pages/account/OrderDetail";
import Favorites from "./pages/account/Favorites";
import Addresses from "./pages/account/Addresses";
import ProfileData from "./pages/account/ProfileData";

const queryClient = new QueryClient();

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="container py-20 text-center">
    <h1 className="font-display text-3xl font-bold mb-2">{title}</h1>
    <p className="text-muted-foreground font-sans">Em breve</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<StoreLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/produto/:slug" element={<ProductPage />} />
                <Route path="/carrinho" element={<CartPage />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/colecoes" element={<PlaceholderPage title="Coleções" />} />
                <Route path="/colecao/:slug" element={<PlaceholderPage title="Coleção" />} />
                <Route path="/ofertas" element={<PlaceholderPage title="Ofertas" />} />
                <Route path="/contato" element={<PlaceholderPage title="Contato" />} />
                <Route path="/faq" element={<PlaceholderPage title="FAQ" />} />
                <Route path="/conta" element={<AccountLayout />}>
                  <Route index element={<Orders />} />
                  <Route path="pedidos" element={<Orders />} />
                  <Route path="pedidos/:id" element={<OrderDetail />} />
                  <Route path="favoritos" element={<Favorites />} />
                  <Route path="enderecos" element={<Addresses />} />
                  <Route path="dados" element={<ProfileData />} />
                </Route>
              </Route>
              <Route path="/auth" element={<Auth />} />
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
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
