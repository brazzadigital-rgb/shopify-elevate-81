import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Truck, DollarSign, ShoppingCart, Package, Clock, Target } from "lucide-react";

export default function AdminReports() {
  const { data: sellers = [] } = useQuery({
    queryKey: ["report-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sellers").select("*").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["report-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ["report-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("commissions").select("*, sellers(name)");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["report-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, total, seller_id, status, created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["report-products-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, supplier_id, is_active");
      if (error) throw error;
      return data;
    },
  });

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Seller stats
  const sellerStats = sellers.map(s => {
    const sellerOrders = orders.filter(o => o.seller_id === s.id);
    const totalSold = sellerOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const sellerComms = commissions.filter(c => c.seller_id === s.id);
    const totalComm = sellerComms.reduce((sum, c) => sum + Number(c.commission_amount), 0);
    const ticket = sellerOrders.length > 0 ? totalSold / sellerOrders.length : 0;
    return { ...s, totalSold, orderCount: sellerOrders.length, totalComm, ticket };
  });

  // Supplier stats
  const supplierStats = suppliers.map(s => {
    const prodCount = products.filter(p => p.supplier_id === s.id && p.is_active).length;
    return { ...s, prodCount, shippingDays: s.shipping_days || 0 };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Relatórios de Performance</h1>
        <p className="text-sm text-muted-foreground font-sans">Visão geral da equipe e fornecedores</p>
      </div>

      {/* Global metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Users className="w-5 h-5 text-accent" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-sans">Vendedores Ativos</p>
                <p className="text-xl font-display font-bold">{sellers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Truck className="w-5 h-5 text-accent" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-sans">Fornecedores Ativos</p>
                <p className="text-xl font-display font-bold">{suppliers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-sans">Comissões Pagas</p>
                <p className="text-xl font-display font-bold">{formatCurrency(commissions.filter(c => c.payment_status === "paid").reduce((s, c) => s + Number(c.commission_amount), 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-warning" /></div>
              <div>
                <p className="text-xs text-muted-foreground font-sans">Total Pedidos</p>
                <p className="text-xl font-display font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seller performance */}
      <div>
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-accent" /> Performance dos Vendedores</h2>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Vendedor</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Total Vendido</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Pedidos</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Ticket Médio</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Comissão Acum.</th>
              </tr>
            </thead>
            <tbody>
              {sellerStats.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum vendedor ativo</td></tr>
              ) : sellerStats.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{formatCurrency(s.totalSold)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{s.orderCount}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{formatCurrency(s.ticket)}</td>
                  <td className="px-4 py-3 font-semibold text-accent">{formatCurrency(s.totalComm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier performance */}
      <div>
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-accent" /> Performance dos Fornecedores</h2>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm font-sans">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fornecedor</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Produtos Ativos</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Prazo Envio</th>
              </tr>
            </thead>
            <tbody>
              {supplierStats.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum fornecedor ativo</td></tr>
              ) : supplierStats.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.trade_name}</td>
                  <td className="px-4 py-3">{s.prodCount}</td>
                  <td className="px-4 py-3">{s.shippingDays > 0 ? `${s.shippingDays} dias` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
