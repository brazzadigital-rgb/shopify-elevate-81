import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerSubscription } from "@/hooks/useOwnerSubscription";
import { CreditCard, CalendarClock, CheckCircle2, Clock, AlertTriangle, Ban, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "Ativa", color: "bg-emerald-500/10 text-emerald-400", icon: CheckCircle2 },
  trialing: { label: "Teste", color: "bg-blue-500/10 text-blue-400", icon: Clock },
  past_due: { label: "Inadimplente", color: "bg-amber-500/10 text-amber-400", icon: AlertTriangle },
  canceled: { label: "Cancelada", color: "bg-slate-500/10 text-slate-400", icon: XCircle },
  suspended: { label: "Suspensa", color: "bg-red-500/10 text-red-400", icon: Ban },
};

const cycleLabels: Record<string, string> = {
  monthly: "Mensal",
  semiannual: "Semestral",
  annual: "Anual",
};

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function OwnerSubscription() {
  const { data: sub, isLoading } = useOwnerSubscription();

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Assinatura</h1>
          <p className="text-slate-400 text-sm mt-1">Detalhes da assinatura do sistema</p>
        </div>
        <Skeleton className="h-64 bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  const status = sub?.status || "active";
  const sc = statusConfig[status] || statusConfig.active;
  const StatusIcon = sc.icon;
  const planName = sub?.plan?.name || "Sem plano";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Assinatura</h1>
        <p className="text-slate-400 text-sm mt-1">Detalhes da assinatura do sistema</p>
      </div>

      <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            Assinatura Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl bg-slate-800/40 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Plano</p>
              <p className="text-lg font-bold text-white">{planName}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Ciclo</p>
              <p className="text-lg font-bold text-white">{cycleLabels[sub?.billing_cycle] || "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Status</p>
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4" />
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${sc.color}`}>
                  {sc.label}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Início do período</p>
              <p className="text-sm font-semibold text-white">
                {sub?.current_period_start ? format(new Date(sub.current_period_start), "dd/MM/yyyy", { locale: ptBR }) : "—"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Fim do período</p>
              <p className="text-sm font-semibold text-white">
                {sub?.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR }) : "—"}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Renovação automática</p>
              <p className="text-sm font-semibold text-white">{sub?.auto_renew ? "Sim" : "Não"}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
              <RefreshCw className="w-4 h-4 mr-2" />
              Trocar Plano
            </Button>
            <Button variant="outline" className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800">
              Cancelar Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
