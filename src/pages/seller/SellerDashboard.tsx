import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  DollarSign, TrendingUp, ShoppingBag, Target, Copy, Link as LinkIcon,
  CheckCircle, Clock, ArrowUpRight
} from "lucide-react";

interface SellerData {
  id: string;
  name: string;
  email: string;
  commission_rate: number;
  monthly_goal: number;
  referral_code: string;
  status: string;
}

interface Commission {
  id: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_status: string;
  created_at: string;
  order_id: string | null;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  customer_name: string | null;
}

export default function SellerDashboard() {
  const { user, sellerId } = useAuth();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const load = async () => {
      const [sellerRes, commissionsRes, ordersRes] = await Promise.all([
        supabase.from("sellers").select("*").eq("id", sellerId).maybeSingle(),
        supabase.from("commissions").select("*").eq("seller_id", sellerId).order("created_at", { ascending: false }).limit(50),
        supabase.from("orders").select("id, order_number, total, status, created_at, customer_name").eq("seller_id", sellerId).order("created_at", { ascending: false }).limit(20),
      ]);
      setSeller(sellerRes.data as SellerData | null);
      setCommissions((commissionsRes.data as Commission[]) || []);
      setOrders((ordersRes.data as Order[]) || []);
      setLoading(false);
    };
    load();
  }, [sellerId]);

  if (loading) return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    </div>
  );

  if (!seller) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground font-sans">
      Vendedor não encontrado.
    </div>
  );

  const totalSales = commissions.reduce((s, c) => s + Number(c.sale_amount), 0);
  const totalCommission = commissions.reduce((s, c) => s + Number(c.commission_amount), 0);
  const pendingCommission = commissions.filter(c => c.payment_status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0);
  const goalProgress = seller.monthly_goal > 0 ? Math.min((totalSales / seller.monthly_goal) * 100, 100) : 0;
  const referralLink = `${window.location.origin}/?ref=${seller.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copiado!" });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(seller.referral_code);
    toast({ title: "Código copiado!" });
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Olá, {seller.name}! 👋</h1>
        <p className="text-sm text-muted-foreground font-sans mt-1">Acompanhe suas vendas e comissões</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-sans">Pedidos</span>
            </div>
            <p className="text-2xl font-bold font-display">{orders.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs text-muted-foreground font-sans">Total vendido</span>
            </div>
            <p className="text-2xl font-bold font-display">{fmt(totalSales)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <span className="text-xs text-muted-foreground font-sans">Comissão total</span>
            </div>
            <p className="text-2xl font-bold font-display">{fmt(totalCommission)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-premium">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <span className="text-xs text-muted-foreground font-sans">A receber</span>
            </div>
            <p className="text-2xl font-bold font-display">{fmt(pendingCommission)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Goal + Referral */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Goal */}
        <Card className="border-0 shadow-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-medium flex items-center gap-2">
              <Target className="w-4 h-4" /> Meta mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm font-sans">
              <span>{fmt(totalSales)}</span>
              <span className="text-muted-foreground">{fmt(seller.monthly_goal)}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground font-sans">{goalProgress.toFixed(0)}% da meta atingida</p>
          </CardContent>
        </Card>

        {/* Referral */}
        <Card className="border-0 shadow-premium">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-medium flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Seu link de indicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="text-xs rounded-xl h-9 font-sans bg-muted/50" />
              <Button variant="outline" size="sm" onClick={copyLink} className="rounded-xl shrink-0 gap-1">
                <Copy className="w-3 h-3" /> Copiar
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-sans">Código:</span>
              <Badge variant="outline" className="font-mono text-xs cursor-pointer" onClick={copyCode}>
                {seller.referral_code}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-sans">
              Comissão: <strong>{seller.commission_rate}%</strong> sobre cada venda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="border-0 shadow-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans font-medium">Pedidos recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground font-sans text-sm">Nenhum pedido ainda</p>
          ) : (
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Pedido</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Total</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{o.order_number}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{o.customer_name || "—"}</td>
                    <td className="px-4 py-2.5">{fmt(Number(o.total))}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">
                      {new Date(o.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Commissions */}
      <Card className="border-0 shadow-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans font-medium">Comissões</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {commissions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground font-sans text-sm">Nenhuma comissão registrada</p>
          ) : (
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Data</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Venda</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Taxa</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Comissão</th>
                  <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-2.5">{fmt(Number(c.sale_amount))}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.commission_rate}%</td>
                    <td className="px-4 py-2.5 font-semibold">{fmt(Number(c.commission_amount))}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={c.payment_status === "paid" ? "default" : "secondary"} className="text-xs gap-1">
                        {c.payment_status === "paid" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {c.payment_status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
