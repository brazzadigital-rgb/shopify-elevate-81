import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import SellerSidebar from "@/components/seller/SellerSidebar";
import SellerMobileNav from "@/components/seller/SellerMobileNav";

export default function SellerLayout() {
  const { user, isSeller, isLoading, sellerId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sellerStatus, setSellerStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/auth?redirect=/vendedor");
    } else if (!isSeller) {
      navigate("/");
    }
  }, [user, isSeller, isLoading, navigate]);

  useEffect(() => {
    if (!sellerId) { setCheckingStatus(false); return; }
    const check = async () => {
      const { data } = await supabase.from("sellers").select("seller_status").eq("id", sellerId).maybeSingle();
      setSellerStatus((data as any)?.seller_status || null);
      setCheckingStatus(false);
    };
    check();
  }, [sellerId]);

  useEffect(() => {
    if (checkingStatus || !sellerStatus) return;
    if (sellerStatus !== "approved" && location.pathname !== "/vendedor/pendente") {
      navigate("/vendedor/pendente");
    }
  }, [sellerStatus, checkingStatus, location.pathname, navigate]);

  if (isLoading || checkingStatus) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  );

  if (!user || !isSeller) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <SellerMobileNav />
        <main className="flex-1 px-4 lg:px-8 py-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
