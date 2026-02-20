import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, ShoppingBag, Clock, Target, Percent, ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";

interface SellerData {
  id: string; name: string; commission_rate: number; monthly_goal: number; referral_code: string;
}

export default function SellerDashboard() {
  const { sellerId } = useAuth();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [stats, setStats] = useState({ totalSales: 0, totalCommission: 0, pendingCommission: 0, availableCommission: 0, orderCount: 0, conversionRate: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const load = async () => {
      const [sellerRes, commissionsRes, ordersRes, clicksRes] = await Promise.all([
        supabase.from("sellers").select("id, name, commission_rate, monthly_goal, referral_code").eq("id", sellerId).maybeSingle(),
        supabase.from("commissions").select("*").eq("seller_id", sellerId),
        supabase.from("orders").select("id, order_number, total, status, created_at, customer_name").eq("seller_id", sellerId).order("created_at", { ascending: false }).limit(5),
        supabase.from("seller_link_clicks").select("id, converted").eq("seller_id", sellerId),
      ]);
      
      const s = sellerRes.data as SellerData | null;
      setSeller(s);
      
      const comms = (commissionsRes.data as any[]) || [];
      const totalSales = comms.reduce((a, c) => a + Number(c.sale_amount), 0);
      const totalCommission = comms.reduce((a, c) => a + Number(c.commission_amount), 0);
      const pendingCommission = comms.filter(c => c.payment_status === "pending").reduce((a, c) => a + Number(c.commission_amount), 0);
      const paidCommission = comms.filter(c => c.payment_status === "paid").reduce((a, c) => a + Number(c.commission_amount), 0);
      
      const clicks = (clicksRes.data as any[]) || [];
      const conversions = clicks.filter(c => c.converted).length;
      const conversionRate = clicks.length > 0 ? (conversions / clicks.length) * 100 : 0;
      
      setStats({ totalSales, totalCommission, pendingCommission, availableCommission: totalCommission - paidCommission - pendingCommission, orderCount: (ordersRes.data || []).length, conversionRate });
      setRecentOrders((ordersRes.data as any[]) || []);
      setLoading(false);
    };
    load();
  }, [sellerId]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!seller) return <p className="text-center py-20 text-muted-foreground">Vendedor não encontrado.</p>;

  const kpis = [
    { label: "Total vendido", value: fmt(stats.totalSales), icon: ShoppingBag, color: "text-primary" },
    { label: "Comissão gerada", value: fmt(stats.totalCommission), icon: DollarSign, color: "text-emerald-600" },
    { label: "Disponível", value: fmt(stats.availableCommission), icon: TrendingUp, color: "text-blue-600" },
    { label: "Em análise", value: fmt(stats.pendingCommission), icon: Clock, color: "text-amber-600" },
    { label: "Pedidos", value: stats.orderCount.toString(), icon: Target, color: "text-purple-600" },
    { label: "Conversão", value: `${stats.conversionRate.toFixed(1)}%`, icon: Percent, color: "text-rose-600" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Olá, {seller.name}! 👋</h1>
        <p className="text-sm text-muted-foreground font-sans mt-1">Acompanhe suas vendas e comissões</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground font-sans">{kpi.label}</span>
                </div>
                <p className="text-xl font-bold font-display">{kpi.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent orders */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans font-medium">Últimas vendas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground font-sans text-sm">Nenhuma venda ainda</p>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium font-sans">{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{o.customer_name || "Cliente"} · {new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fmt(Number(o.total))}</p>
                    <Badge variant="secondary" className="text-xs mt-0.5">{o.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
