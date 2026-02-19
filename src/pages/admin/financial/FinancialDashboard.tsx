import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useFinancialFilters } from "@/hooks/useFinancialFilters";
import { PeriodFilter } from "@/components/admin/financial/PeriodFilter";
import { KpiCard } from "@/components/admin/financial/KpiCard";
import { formatBRL, formatPercent } from "@/lib/exportCsv";
import {
  DollarSign, ShoppingCart, TrendingUp, Package, Tag, Truck, ReceiptText,
  ArrowDownCircle, Percent, CreditCard, BarChart3
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { format, eachDayOfInterval } from "date-fns";

interface DailyStat {
  date: string;
  revenue: number;
  orders: number;
}

const PIE_COLORS = ["hsl(var(--accent))", "hsl(var(--primary))", "hsl(var(--muted-foreground))"];

export default function FinancialDashboard() {
  const filters = useFinancialFilters("30d");
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    grossRevenue: 0, netRevenue: 0, orderCount: 0, avgTicket: 0,
    itemsSold: 0, discountsGiven: 0, shippingCharged: 0, cogs: 0,
    grossProfit: 0, grossMargin: 0, refundsTotal: 0, refundsCount: 0,
    feesTotal: 0, operationalProfit: 0,
  });
  const [dailyData, setDailyData] = useState<DailyStat[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { from, to } = filters.dateRange;

      const [ordersRes, itemsRes, refundsRes, transRes] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", from).lte("created_at", to),
        supabase.from("order_items").select("*, orders!inner(created_at, status, payment_status)").gte("orders.created_at", from).lte("orders.created_at", to),
        supabase.from("refunds").select("*").gte("created_at", from).lte("created_at", to),
        supabase.from("financial_transactions").select("*").gte("created_at", from).lte("created_at", to),
      ]);

      const orders = ordersRes.data || [];
      const items = itemsRes.data || [];
      const refunds = refundsRes.data || [];
      const transactions = transRes.data || [];

      const paidOrders = orders.filter(o => o.payment_status === "paid" || o.status === "completed");
      const grossRevenue = paidOrders.reduce((s, o) => s + Number(o.total), 0);
      const refundsTotal = refunds.reduce((s, r) => s + Number(r.amount), 0);
      const discountsGiven = paidOrders.reduce((s, o) => s + Number(o.discount), 0);
      const netRevenue = grossRevenue - refundsTotal - discountsGiven;
      const shippingCharged = paidOrders.reduce((s, o) => s + Number(o.shipping_cost || o.shipping_price || 0), 0);
      const itemsSold = items.reduce((s, i) => s + Number(i.quantity), 0);
      const feesTotal = transactions.reduce((s, t) => s + Number(t.fees), 0);

      // COGS estimation from cost_price
      let cogs = 0;
      for (const item of items) {
        if (item.product_id) {
          const { data: prod } = await supabase.from("products").select("cost_price").eq("id", item.product_id).single();
          if (prod?.cost_price) cogs += Number(prod.cost_price) * Number(item.quantity);
        }
      }

      const grossProfit = netRevenue - cogs;
      const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
      const operationalProfit = grossProfit - feesTotal;

      setKpis({
        grossRevenue, netRevenue,
        orderCount: paidOrders.length,
        avgTicket: paidOrders.length > 0 ? grossRevenue / paidOrders.length : 0,
        itemsSold, discountsGiven, shippingCharged, cogs,
        grossProfit, grossMargin, refundsTotal, refundsCount: refunds.length,
        feesTotal, operationalProfit,
      });

      // Daily data
      const days = eachDayOfInterval({ start: filters.dateRange.fromDate, end: filters.dateRange.toDate });
      const daily = days.map(d => {
        const key = format(d, "yyyy-MM-dd");
        const dayOrders = paidOrders.filter(o => format(new Date(o.created_at), "yyyy-MM-dd") === key);
        return { date: format(d, "dd/MM"), revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0), orders: dayOrders.length };
      });
      setDailyData(daily);

      // Payment methods
      const methodMap: Record<string, number> = {};
      paidOrders.forEach(o => {
        const m = o.payment_method || "Não informado";
        methodMap[m] = (methodMap[m] || 0) + Number(o.total);
      });
      setPaymentMethods(Object.entries(methodMap).map(([name, value]) => ({ name, value })));

      setLoading(false);
    };
    fetch();
  }, [filters.dateRange]);

  const cards = [
    { title: "Receita Bruta", value: formatBRL(kpis.grossRevenue), icon: DollarSign, color: "text-emerald-600" },
    { title: "Receita Líquida", value: formatBRL(kpis.netRevenue), icon: TrendingUp, color: "text-accent" },
    { title: "Nº Pedidos", value: kpis.orderCount, icon: ShoppingCart, color: "text-primary" },
    { title: "Ticket Médio", value: formatBRL(kpis.avgTicket), icon: ReceiptText, color: "text-accent" },
    { title: "Itens Vendidos", value: kpis.itemsSold, icon: Package, color: "text-primary" },
    { title: "Descontos", value: formatBRL(kpis.discountsGiven), icon: Tag, color: "text-amber-600" },
    { title: "Frete Cobrado", value: formatBRL(kpis.shippingCharged), icon: Truck, color: "text-primary" },
    { title: "COGS", value: formatBRL(kpis.cogs), icon: BarChart3, color: "text-muted-foreground" },
    { title: "Lucro Bruto", value: formatBRL(kpis.grossProfit), icon: TrendingUp, color: "text-emerald-600" },
    { title: "Margem Bruta", value: formatPercent(kpis.grossMargin), icon: Percent, color: "text-emerald-600" },
    { title: "Reembolsos", value: `${formatBRL(kpis.refundsTotal)} (${kpis.refundsCount})`, icon: ArrowDownCircle, color: "text-destructive" },
    { title: "Taxas", value: formatBRL(kpis.feesTotal), icon: CreditCard, color: "text-muted-foreground" },
    { title: "Lucro Operacional", value: formatBRL(kpis.operationalProfit), icon: DollarSign, color: "text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Visão Geral Financeira</h1>
          <p className="text-muted-foreground text-sm">Indicadores e métricas do período</p>
        </div>
        <PeriodFilter {...filters} />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c, i) => (
          <KpiCard key={c.title} {...c} index={i} />
        ))}
      </div>

      {/* Gráfico Receita Diária */}
      <Card className="shadow-premium border-0">
        <CardHeader><CardTitle className="font-display text-lg">Receita Diária</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Receita" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pedidos por dia */}
        <Card className="shadow-premium border-0">
          <CardHeader><CardTitle className="font-display text-lg">Pedidos por Dia</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pedidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Métodos de pagamento */}
        <Card className="shadow-premium border-0">
          <CardHeader><CardTitle className="font-display text-lg">Métodos de Pagamento</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              {paymentMethods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentMethods} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                      {paymentMethods.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">Sem dados no período</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
