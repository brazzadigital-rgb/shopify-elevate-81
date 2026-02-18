import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { useCartSync } from "@/hooks/useCartSync";
import StoreLayout from "./layouts/StoreLayout";
import Index from "./pages/Index";
import ProductPage from "./pages/Product";
import CartPage from "./pages/Cart";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Collections from "./pages/admin/Collections";
import StoreSettings from "./pages/admin/StoreSettings";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminSections from "./pages/admin/AdminSections";
import Placeholder from "./pages/admin/Placeholder";
import AccountLayout from "./pages/account/AccountLayout";
import Orders from "./pages/account/Orders";
import OrderDetail from "./pages/account/OrderDetail";
import Favorites from "./pages/account/Favorites";
import Addresses from "./pages/account/Addresses";
import ProfileData from "./pages/account/ProfileData";
import SearchPage from "./pages/store/SearchPage";
import CollectionPage from "./pages/store/CollectionPage";
import CollectionsListPage from "./pages/store/CollectionsListPage";
import OffersPage from "./pages/store/OffersPage";
import FaqPage from "./pages/store/FaqPage";
import ContactPage from "./pages/store/ContactPage";
import PoliciesPage from "./pages/store/PoliciesPage";

const queryClient = new QueryClient();

function AppContent() {
  useCartSync();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/produto/:slug" element={<ProductPage />} />
            <Route path="/carrinho" element={<CartPage />} />
            <Route path="/busca" element={<SearchPage />} />
            <Route path="/colecoes" element={<CollectionsListPage />} />
            <Route path="/colecao/:slug" element={<CollectionPage />} />
            <Route path="/ofertas" element={<OffersPage />} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/politicas" element={<PoliciesPage />} />
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
            <Route path="pedidos" element={<AdminOrders />} />
            <Route path="clientes" element={<AdminCustomers />} />
            <Route path="cupons" element={<AdminCoupons />} />
            <Route path="secoes" element={<AdminSections />} />
            <Route path="configuracoes" element={<StoreSettings />} />
            <Route path="relatorios" element={<Placeholder />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
