import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerSubscription, useOwnerInvoices } from "@/hooks/useOwnerSubscription";
import { usePlans } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  CreditCard, CalendarClock, AlertTriangle, CheckCircle2, Clock, XCircle,
  Receipt, RefreshCw, Ban, Play, Loader2, TrendingUp, TrendingDown,
  Activity, Eye, Send, X, ArrowUpRight, ArrowDownRight, DollarSign,
  BarChart3, Zap
} from "lucide-react";
import { format, differenceInDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

/* ─── Status mapping ─── */
const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  active:    { label: "Ativo",         color: "#34d399", bg: "rgba(52,211,153,0.08)", icon: CheckCircle2 },
  trialing:  { label: "Teste",         color: "#60a5fa", bg: "rgba(96,165,250,0.08)", icon: Clock },
  past_due:  { label: "Inadimplente",  color: "#fbbf24", bg: "rgba(251,191,36,0.08)", icon: AlertTriangle },
  canceled:  { label: "Cancelada",     color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: XCircle },
  suspended: { label: "Suspenso",      color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: Ban },
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

/* ─── Animated counter ─── */
function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    const duration = 800;
    const start = display;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (value - start) * eased);
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);
  return <span>{prefix}{formatBRL(display)}</span>;
}

/* ─── Period selector ─── */
const periods = [
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
  { key: "12m", label: "12 meses" },
];

/* ─── Custom tooltip ─── */
function ChartTooltipCustom({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-slate-800">
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function OwnerDashboard() {
  const { data: sub, isLoading: subLoading } = useOwnerSubscription();
  const { data: invoices, isLoading: invLoading } = useOwnerInvoices();
  const { data: plans } = usePlans();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const status = sub?.status || "active";
  const sc = statusConfig[status] || statusConfig.active;
  const StatusIcon = sc.icon;

  const pendingInvoices = invoices?.filter((i: any) => i.status === "pending") || [];
  const paidInvoices = invoices?.filter((i: any) => i.status === "paid") || [];

  const nextRenewal = sub?.current_period_end
    ? format(new Date(sub.current_period_end), "dd MMM yyyy", { locale: ptBR })
    : "—";

  const daysUntilRenewal = sub?.current_period_end
    ? differenceInDays(new Date(sub.current_period_end), new Date())
    : null;

  const planName = sub?.plan?.name || "Sem plano";
  const isLoading = subLoading || invLoading;

  const receivedLast30 = paidInvoices
    .filter((i: any) => i.paid_at && differenceInDays(new Date(), new Date(i.paid_at)) <= 30)
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  const totalReceived = paidInvoices.reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  /* ─── Chart mock data (derived from invoices) ─── */
  const revenueChartData = (() => {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const result: { date: string; receita: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const key = format(d, days > 90 ? "MMM yy" : "dd/MM", { locale: ptBR });
      const dayPaid = paidInvoices
        .filter((inv: any) => inv.paid_at && format(new Date(inv.paid_at), "yyyy-MM-dd") === format(d, "yyyy-MM-dd"))
        .reduce((s: number, inv: any) => s + Number(inv.amount), 0);
      result.push({ date: key, receita: dayPaid });
    }
    if (days > 90) {
      const grouped: Record<string, number> = {};
      result.forEach(r => { grouped[r.date] = (grouped[r.date] || 0) + r.receita; });
      return Object.entries(grouped).map(([date, receita]) => ({ date, receita }));
    }
    return result;
  })();

  const paymentChartData = (() => {
    if (!invoices?.length) return [];
    const last6 = invoices.slice(0, 12);
    return last6.reverse().map((inv: any) => ({
      date: format(new Date(inv.due_at), "dd/MM", { locale: ptBR }),
      aprovado: inv.status === "paid" ? Number(inv.amount) : 0,
      falha: inv.status !== "paid" ? Number(inv.amount) : 0,
    }));
  })();

  const invokeAction = async (action: string, extra?: any) => {
    setActionLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke("owner-efi-charge", {
        body: { action, ...extra },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Ação executada com sucesso" });
        qc.invalidateQueries({ queryKey: ["owner-subscription"] });
        qc.invalidateQueries({ queryKey: ["owner-invoices"] });
        qc.invalidateQueries({ queryKey: ["owner-audit-logs"] });
        qc.invalidateQueries({ queryKey: ["system-suspended"] });
      } else {
        toast({ title: "Erro", description: data?.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /* ─── Card animation variants ─── */
  const cardVariant = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [.22,1,.36,1] as [number,number,number,number] } },
  });

  /* ─── KPIS ─── */
  const kpis = [
    {
      label: "Receita Total",
      value: isLoading ? null : totalReceived,
      formatted: isLoading ? null : formatBRL(totalReceived),
      icon: DollarSign,
      trend: "+12%",
      trendUp: true,
      color: "#34d399",
    },
    {
      label: "Assinatura",
      value: null,
      formatted: isLoading ? null : `${planName}`,
      icon: StatusIcon,
      badge: sc.label,
      badgeColor: sc.color,
      badgeBg: sc.bg,
      color: sc.color,
    },
    {
      label: "Próxima Cobrança",
      value: null,
      formatted: isLoading ? null : nextRenewal,
      icon: CalendarClock,
      sub: daysUntilRenewal !== null && daysUntilRenewal >= 0 ? `em ${daysUntilRenewal} dias` : "",
      color: "#60a5fa",
    },
    {
      label: "Faturas Pendentes",
      value: null,
      formatted: isLoading ? null : String(pendingInvoices.length),
      icon: Receipt,
      sub: pendingInvoices.length > 0
        ? formatBRL(pendingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0))
        : "Nenhuma",
      color: pendingInvoices.length > 0 ? "#fbbf24" : "#94a3b8",
    },
    {
      label: "Status do Sistema",
      value: null,
      formatted: null,
      icon: Activity,
      badge: sc.label,
      badgeColor: sc.color,
      badgeBg: sc.bg,
      color: sc.color,
      isBigBadge: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* ─── Page title ─── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Visão geral financeira e operacional</p>
      </div>

      {/* ═══════ CAMADA 1 — KPIs ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} {...cardVariant(i)}>
            <div
              className="group relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-default overflow-hidden"
              style={{
                background: "linear-gradient(135deg, hsl(220 15% 13%) 0%, hsl(220 15% 10%) 100%)",
                border: "1px solid hsl(220 10% 18%)",
              }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 50% 0%, ${kpi.color}10 0%, transparent 70%)` }}
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{kpi.label}</span>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: `${kpi.color}15` }}
                  >
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>

                {kpi.formatted === null && !kpi.isBigBadge ? (
                  <Skeleton className="h-7 w-24 bg-slate-800 rounded-lg" />
                ) : kpi.isBigBadge ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-sm font-bold px-3 py-1.5 rounded-full"
                      style={{ color: kpi.badgeColor, background: kpi.badgeBg }}
                    >
                      {kpi.badge}
                    </span>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-white tracking-tight">{kpi.formatted}</p>
                )}

                {kpi.badge && !kpi.isBigBadge && (
                  <span
                    className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-2"
                    style={{ color: kpi.badgeColor, background: kpi.badgeBg }}
                  >
                    {kpi.badge}
                  </span>
                )}

                {kpi.trend && (
                  <div className="flex items-center gap-1 mt-2">
                    {kpi.trendUp ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`text-xs font-semibold ${kpi.trendUp ? "text-emerald-400" : "text-red-400"}`}>
                      {kpi.trend}
                    </span>
                    <span className="text-[10px] text-slate-600 ml-0.5">vs período anterior</span>
                  </div>
                )}

                {kpi.sub && (
                  <p className="text-[11px] text-slate-500 mt-1.5">{kpi.sub}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ═══════ CAMADA 2 — GRÁFICOS ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart — 2 cols */}
        <motion.div className="lg:col-span-2" {...cardVariant(5)}>
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, hsl(220 15% 13%) 0%, hsl(220 15% 10%) 100%)",
              border: "1px solid hsl(220 10% 18%)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white">Receita</h3>
                <p className="text-xs text-slate-500 mt-0.5">Pagamentos recebidos no período</p>
              </div>
              <div className="flex gap-1 rounded-xl p-1" style={{ background: "hsl(220 15% 8%)" }}>
                {periods.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      period === p.key
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 18%)" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip content={<ChartTooltipCustom />} />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    name="Receita"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#34d399", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Payment status chart — 1 col */}
        <motion.div {...cardVariant(6)}>
          <div
            className="rounded-2xl p-6 h-full"
            style={{
              background: "linear-gradient(135deg, hsl(220 15% 13%) 0%, hsl(220 15% 10%) 100%)",
              border: "1px solid hsl(220 10% 18%)",
            }}
          >
            <div className="mb-6">
              <h3 className="text-base font-semibold text-white">Pagamentos</h3>
              <p className="text-xs text-slate-500 mt-0.5">Aprovados vs falhas</p>
            </div>

            {/* Big status badge */}
            <div className="flex justify-center mb-5">
              <div
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl"
                style={{ background: sc.bg, border: `1px solid ${sc.color}30` }}
              >
                <StatusIcon className="w-5 h-5" style={{ color: sc.color }} />
                <span className="text-lg font-bold" style={{ color: sc.color }}>{sc.label}</span>
              </div>
            </div>

            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentChartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 18%)" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltipCustom />} />
                  <Bar dataKey="aprovado" name="Aprovado" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="falha" name="Falha" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════ CAMADA 3 — FATURAS + AÇÕES ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent invoices — 3 cols */}
        <motion.div className="lg:col-span-3" {...cardVariant(7)}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(220 15% 13%) 0%, hsl(220 15% 10%) 100%)",
              border: "1px solid hsl(220 10% 18%)",
            }}
          >
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Faturas Recentes</h3>
                <p className="text-xs text-slate-500 mt-0.5">Últimos registros de cobrança</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white text-xs"
                onClick={() => navigate("/owner/invoices")}
              >
                Ver todas <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="px-6 pb-6 space-y-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 bg-slate-800/60 rounded-xl" />)}
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="px-4 pb-4">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  <span className="col-span-2">Valor</span>
                  <span className="col-span-2">Status</span>
                  <span className="col-span-2 hidden sm:block">Método</span>
                  <span className="col-span-3">Vencimento</span>
                  <span className="col-span-3 text-right">Ações</span>
                </div>
                <div className="space-y-1.5">
                  {invoices.slice(0, 6).map((inv: any) => (
                    <div
                      key={inv.id}
                      className="grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-xl transition-colors duration-150 hover:bg-white/[0.03]"
                    >
                      <span className="col-span-2 text-sm font-semibold text-white">
                        {formatBRL(Number(inv.amount))}
                      </span>
                      <span className="col-span-2">
                        <span
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                          style={{
                            color: inv.status === "paid" ? "#34d399" : inv.status === "pending" ? "#fbbf24" : "#94a3b8",
                            background: inv.status === "paid" ? "rgba(52,211,153,0.08)" : inv.status === "pending" ? "rgba(251,191,36,0.08)" : "rgba(148,163,184,0.08)",
                          }}
                        >
                          {inv.status === "paid" ? "Pago" : inv.status === "pending" ? "Pendente" : inv.status}
                        </span>
                      </span>
                      <span className="col-span-2 hidden sm:block text-xs text-slate-500">
                        {inv.payment_method || "Pix"}
                      </span>
                      <span className="col-span-3 text-xs text-slate-400">
                        {format(new Date(inv.due_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                      <span className="col-span-3 flex justify-end gap-1">
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {inv.status === "pending" && (
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-blue-500/5 transition-colors">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-6 pb-8 text-center">
                <Receipt className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Nenhuma fatura encontrada</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick actions — 2 cols */}
        <motion.div className="lg:col-span-2" {...cardVariant(8)}>
          <div
            className="rounded-2xl p-6 h-full"
            style={{
              background: "linear-gradient(135deg, hsl(220 15% 13%) 0%, hsl(220 15% 10%) 100%)",
              border: "1px solid hsl(220 10% 18%)",
            }}
          >
            <div className="mb-5">
              <h3 className="text-base font-semibold text-white">Ações Rápidas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Gerencie seu sistema</p>
            </div>

            {/* Alerts */}
            {status === "past_due" && (
              <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)" }}>
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300/80 leading-relaxed">Pagamento em atraso. Regularize para evitar suspensão do sistema.</p>
              </div>
            )}
            {status === "suspended" && (
              <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)" }}>
                <Ban className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-300/80 leading-relaxed">Sistema suspenso por inadimplência.</p>
              </div>
            )}

            <div className="space-y-2.5">
              {[
                {
                  label: "Gerar Nova Cobrança",
                  icon: Receipt,
                  action: () => invokeAction("generate_invoice", { amount: sub?.plan?.monthly_price || 0 }),
                  loading: actionLoading === "generate_invoice",
                  loadingKey: "generate_invoice",
                  style: "default",
                },
                {
                  label: "Alterar Plano",
                  icon: RefreshCw,
                  action: () => navigate("/owner/plans"),
                  style: "default",
                },
                {
                  label: "Pagamentos",
                  icon: CreditCard,
                  action: () => navigate("/owner/invoices"),
                  style: "default",
                },
                ...(status !== "suspended"
                  ? [{
                      label: "Suspender Sistema",
                      icon: Ban,
                      action: () => invokeAction("suspend_system"),
                      loading: actionLoading === "suspend_system",
                      loadingKey: "suspend_system",
                      style: "danger" as const,
                    }]
                  : [{
                      label: "Reativar Sistema",
                      icon: Play,
                      action: () => invokeAction("reactivate_system"),
                      loading: actionLoading === "reactivate_system",
                      loadingKey: "reactivate_system",
                      style: "success" as const,
                    }]
                ),
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  disabled={btn.loading}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    btn.style === "danger"
                      ? "text-red-400/80 hover:bg-red-500/5 hover:text-red-400"
                      : btn.style === "success"
                      ? "text-emerald-400/80 hover:bg-emerald-500/5 hover:text-emerald-400"
                      : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                  }`}
                  style={{ border: "1px solid hsl(220 10% 16%)" }}
                >
                  {btn.loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <btn.icon className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{btn.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
