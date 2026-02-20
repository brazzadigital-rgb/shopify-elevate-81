import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerSubscription, useOwnerInvoices } from "@/hooks/useOwnerSubscription";
import { usePlans } from "@/hooks/useSubscription";
import {
  CreditCard, CalendarClock, AlertTriangle, CheckCircle2, Clock, XCircle,
  Receipt, RefreshCw, Ban, Play
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Ativa", color: "text-emerald-400 bg-emerald-500/10", icon: CheckCircle2 },
  trialing: { label: "Teste", color: "text-blue-400 bg-blue-500/10", icon: Clock },
  past_due: { label: "Inadimplente", color: "text-amber-400 bg-amber-500/10", icon: AlertTriangle },
  canceled: { label: "Cancelada", color: "text-slate-400 bg-slate-500/10", icon: XCircle },
  suspended: { label: "Suspensa", color: "text-red-400 bg-red-500/10", icon: Ban },
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function OwnerDashboard() {
  const { data: sub, isLoading: subLoading } = useOwnerSubscription();
  const { data: invoices, isLoading: invLoading } = useOwnerInvoices();
  const { data: plans } = usePlans();

  const status = sub?.status || "active";
  const sc = statusConfig[status] || statusConfig.active;
  const StatusIcon = sc.icon;

  const pendingInvoices = invoices?.filter((i: any) => i.status === "pending") || [];
  const paidInvoices = invoices?.filter((i: any) => i.status === "paid") || [];

  const nextRenewal = sub?.current_period_end
    ? format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR })
    : "—";

  const daysUntilRenewal = sub?.current_period_end
    ? differenceInDays(new Date(sub.current_period_end), new Date())
    : null;

  const planName = sub?.plan?.name || "Sem plano";
  const isLoading = subLoading || invLoading;

  const receivedLast30 = paidInvoices
    .filter((i: any) => differenceInDays(new Date(), new Date(i.paid_at)) <= 30)
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Visão geral do sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Status da Assinatura",
            value: isLoading ? null : sc.label,
            icon: StatusIcon,
            accent: sc.color,
            sub: planName,
          },
          {
            label: "Próxima Renovação",
            value: isLoading ? null : nextRenewal,
            icon: CalendarClock,
            accent: "text-blue-400 bg-blue-500/10",
            sub: daysUntilRenewal !== null ? `${daysUntilRenewal} dias restantes` : "",
          },
          {
            label: "Faturas Pendentes",
            value: isLoading ? null : String(pendingInvoices.length),
            icon: Receipt,
            accent: pendingInvoices.length > 0 ? "text-amber-400 bg-amber-500/10" : "text-slate-400 bg-slate-500/10",
            sub: pendingInvoices.length > 0
              ? formatBRL(pendingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0))
              : "Nenhuma pendente",
          },
          {
            label: "Recebido (30 dias)",
            value: isLoading ? null : formatBRL(receivedLast30),
            icon: CreditCard,
            accent: "text-emerald-400 bg-emerald-500/10",
            sub: `${paidInvoices.length} faturas pagas`,
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                    {kpi.value === null ? (
                      <Skeleton className="h-7 w-24 bg-slate-800" />
                    ) : (
                      <p className="text-xl font-bold text-white">{kpi.value}</p>
                    )}
                    <p className="text-xs text-slate-500">{kpi.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.accent}`}>
                    <kpi.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Invoices + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent invoices */}
        <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white">Últimas Faturas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 bg-slate-800" />)}
              </div>
            ) : invoices && invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40">
                    <div>
                      <p className="text-sm font-medium text-white">{formatBRL(Number(inv.amount))}</p>
                      <p className="text-xs text-slate-400">
                        Vence em {format(new Date(inv.due_at), "dd/MM/yyyy")}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                      inv.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                      "bg-slate-500/10 text-slate-400"
                    }`}>
                      {inv.status === "paid" ? "Pago" : inv.status === "pending" ? "Pendente" : inv.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">Nenhuma fatura encontrada</p>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Quick Actions */}
        <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-white">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {status === "past_due" && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-300">Sistema com pagamento em atraso. Regularize para evitar suspensão.</p>
              </div>
            )}
            {status === "suspended" && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <Ban className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">Sistema suspenso por inadimplência.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <Receipt className="w-4 h-4 mr-2" />
                Nova Fatura
              </Button>
              <Button variant="outline" className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Trocar Plano
              </Button>
              {status !== "suspended" ? (
                <Button variant="outline" className="h-11 rounded-xl border-red-900/30 text-red-400 hover:bg-red-500/5">
                  <Ban className="w-4 h-4 mr-2" />
                  Suspender
                </Button>
              ) : (
                <Button variant="outline" className="h-11 rounded-xl border-emerald-900/30 text-emerald-400 hover:bg-emerald-500/5">
                  <Play className="w-4 h-4 mr-2" />
                  Reativar
                </Button>
              )}
              <Button variant="outline" className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <CreditCard className="w-4 h-4 mr-2" />
                Pagamentos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
