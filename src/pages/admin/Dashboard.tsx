import { useEffect, useState } from "react";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Plus, Upload, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { formatBRL } from "@/lib/exportCsv";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: any[];
  dailyRevenue: { date: string; revenue: number }[];
  ordersByStatus: { name: string; value: number }[];
}

const STATUS_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--admin-success))",
  "hsl(var(--admin-warning))",
  "hsl(var(--admin-danger))",
  "hsl(var(--muted-foreground))",
];

function KpiCard({ title, value, icon: Icon, trend, trendLabel, loading, delay }: {
  title: string; value: string | number; icon: any; trend?: number; trendLabel?: string; loading: boolean; delay: number;
}) {
  const isPositive = (trend ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08, duration: 0.35 }}
      className="admin-card p-5 flex flex-col gap-3"
    >
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium" style={{ color: `hsl(var(--admin-text-secondary))` }}>{title}</span>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(--primary) / 0.08)` }}>
              <Icon className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-success" : "text-destructive"}`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
              {trendLabel && <span className="text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>{trendLabel}</span>}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0,
    pendingOrders: 0, lowStockProducts: 0, recentOrders: [], dailyRevenue: [], ordersByStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const from = thirtyDaysAgo.toISOString();

      const [products, orders, profiles, pendingRes, lowStockRes, recentRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, status, created_at").gte("created_at", from),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }).lt("stock", 5).eq("is_active", true),
        supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const ordersData = orders.data || [];
      const totalRevenue = ordersData.reduce((s, o) => s + Number(o.total), 0);

      // Daily revenue
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
      const dailyRevenue = days.map(d => {
        const key = format(d, "yyyy-MM-dd");
        const dayOrders = ordersData.filter(o => format(new Date(o.created_at), "yyyy-MM-dd") === key);
        return { date: format(d, "dd/MM"), revenue: dayOrders.reduce((s, o) => s + Number(o.total), 0) };
      });

      // Orders by status
      const statusMap: Record<string, number> = {};
      ordersData.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
      const ordersByStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      setStats({
        totalProducts: products.count || 0,
        totalOrders: ordersData.length,
        totalRevenue,
        totalCustomers: profiles.count || 0,
        pendingOrders: pendingRes.count || 0,
        lowStockProducts: lowStockRes.count || 0,
        recentOrders: recentRes.data || [],
        dailyRevenue,
        ordersByStatus,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const kpis = [
    { title: "Receita (30d)", value: formatBRL(stats.totalRevenue), icon: DollarSign, trend: 8.5, trendLabel: "vs mês anterior" },
    { title: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, trend: 12.3, trendLabel: "vs mês anterior" },
    { title: "Ticket Médio", value: formatBRL(stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0), icon: TrendingUp },
    { title: "Produtos", value: stats.totalProducts, icon: Package },
    { title: "Clientes", value: stats.totalCustomers, icon: Users },
    { title: "Pendentes", value: stats.pendingOrders, icon: Clock },
  ];

  const statusLabel: Record<string, string> = {
    pending: "Pendente", processing: "Processando", completed: "Concluído",
    shipped: "Enviado", cancelled: "Cancelado", delivered: "Entregue",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: `hsl(var(--admin-text-secondary))` }}>Visão geral da sua loja nos últimos 30 dias</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/admin/produtos/novo")} className="admin-card flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:shadow-md transition-shadow" style={{ cursor: "pointer" }}>
            <Plus className="w-4 h-4 text-primary" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.title} {...kpi} loading={loading} delay={i} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="admin-card p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-base">Receita Diária</h3>
              <p className="text-xs mt-0.5" style={{ color: `hsl(var(--admin-text-secondary))` }}>Últimos 30 dias</p>
            </div>
          </div>
          <div className="h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center"><Skeleton className="h-full w-full rounded-xl" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyRevenue}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--admin-border))" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--admin-text-secondary))" tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} stroke="hsl(var(--admin-text-secondary))" tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--admin-border))", boxShadow: "var(--admin-shadow-md)" }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGradient)" name="Receita" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Orders by Status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="admin-card p-6"
        >
          <h3 className="font-semibold text-base mb-4">Pedidos por Status</h3>
          {loading ? (
            <Skeleton className="h-[200px] w-full rounded-xl" />
          ) : stats.ordersByStatus.length > 0 ? (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {stats.ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-sm" style={{ color: `hsl(var(--admin-text-secondary))` }}>Sem dados</p>
            </div>
          )}
          {stats.ordersByStatus.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {stats.ordersByStatus.map((s, i) => (
                <span key={s.name} className="flex items-center gap-1.5 text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
                  {statusLabel[s.name] || s.name} ({s.value})
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="admin-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Últimos Pedidos</h3>
            <button onClick={() => navigate("/admin/pedidos")} className="text-xs font-medium text-primary hover:underline">Ver todos</button>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
          ) : stats.recentOrders.length > 0 ? (
            <div className="space-y-2">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.customer_name || `#${order.order_number}`}</p>
                      <p className="text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>#{order.order_number}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold">{formatBRL(Number(order.total))}</p>
                    <span className={`admin-status-pill text-[10px] mt-1 ${
                      order.status === "completed" || order.status === "delivered" ? "admin-status-success" :
                      order.status === "pending" ? "admin-status-warning" :
                      order.status === "cancelled" ? "admin-status-danger" : "admin-status-info"
                    }`}>
                      {statusLabel[order.status] || order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm" style={{ color: `hsl(var(--admin-text-secondary))` }}>Nenhum pedido recente</p>
            </div>
          )}
        </motion.div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="admin-card p-6"
        >
          <h3 className="font-semibold text-base mb-4">Alertas & Atalhos</h3>
          <div className="space-y-3">
            {stats.pendingOrders > 0 && (
              <div
                onClick={() => navigate("/admin/pedidos")}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                style={{ background: `hsl(var(--admin-warning) / 0.08)` }}
              >
                <Clock className="w-5 h-5" style={{ color: `hsl(var(--admin-warning))` }} />
                <div>
                  <p className="text-sm font-medium">{stats.pendingOrders} pedido(s) pendente(s)</p>
                  <p className="text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>Aguardando processamento</p>
                </div>
              </div>
            )}
            {stats.lowStockProducts > 0 && (
              <div
                onClick={() => navigate("/admin/produtos")}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                style={{ background: `hsl(var(--admin-danger) / 0.08)` }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: `hsl(var(--admin-danger))` }} />
                <div>
                  <p className="text-sm font-medium">{stats.lowStockProducts} produto(s) com estoque baixo</p>
                  <p className="text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>Menos de 5 unidades</p>
                </div>
              </div>
            )}
            {stats.pendingOrders === 0 && stats.lowStockProducts === 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `hsl(var(--admin-success) / 0.08)` }}>
                <TrendingUp className="w-5 h-5" style={{ color: `hsl(var(--admin-success))` }} />
                <p className="text-sm font-medium" style={{ color: `hsl(var(--admin-success))` }}>Tudo em dia! Nenhum alerta ativo.</p>
              </div>
            )}
            
            <div className="pt-2 border-t" style={{ borderColor: `hsl(var(--admin-border-subtle))` }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: `hsl(var(--admin-text-secondary))` }}>Atalhos Rápidos</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Novo Produto", icon: Plus, path: "/admin/produtos/novo" },
                  { label: "Ver Pedidos", icon: ShoppingCart, path: "/admin/pedidos" },
                ].map(shortcut => (
                  <button
                    key={shortcut.label}
                    onClick={() => navigate(shortcut.path)}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-[12px] font-medium hover:bg-muted/40 transition-colors text-left"
                    style={{ border: `1px solid hsl(var(--admin-border-subtle))` }}
                  >
                    <shortcut.icon className="w-3.5 h-3.5 text-primary" />
                    {shortcut.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
