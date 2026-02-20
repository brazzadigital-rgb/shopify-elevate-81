import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useOwnerSubscription } from "@/hooks/useOwnerSubscription";
import { CreditCard, CalendarClock, CheckCircle2, Clock, AlertTriangle, Ban, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string; bgClass: string; icon: any }> = {
  active:    { label: "Ativa",        bgClass: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
  trialing:  { label: "Teste",        bgClass: "bg-blue-50 text-blue-700 border-blue-100", icon: Clock },
  past_due:  { label: "Inadimplente", bgClass: "bg-amber-50 text-amber-700 border-amber-100", icon: AlertTriangle },
  canceled:  { label: "Cancelada",    bgClass: "bg-slate-50 text-slate-600 border-slate-200", icon: XCircle },
  suspended: { label: "Suspensa",     bgClass: "bg-red-50 text-red-700 border-red-100", icon: Ban },
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
  const navigate = useNavigate();

  const status = sub?.status || "active";
  const sc = statusConfig[status] || statusConfig.active;
  const StatusIcon = sc.icon;
  const planName = sub?.plan?.name || "Sem plano";

  const fields = [
    { label: "Plano", value: planName },
    { label: "Ciclo", value: cycleLabels[sub?.billing_cycle] || "—" },
    { label: "Início do período", value: sub?.current_period_start ? format(new Date(sub.current_period_start), "dd/MM/yyyy", { locale: ptBR }) : "—" },
    { label: "Fim do período", value: sub?.current_period_end ? format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR }) : "—" },
    { label: "Renovação automática", value: sub?.auto_renew ? "Sim" : "Não" },
    { label: "Gateway", value: sub?.gateway || "Efí" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Assinatura</h1>
        <p className="text-slate-400 text-sm mt-1">Detalhes da assinatura do sistema</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Assinatura Atual</h3>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border mt-1 ${sc.bgClass}`}>
                  <StatusIcon className="w-3 h-3" />
                  {sc.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {fields.map(f => (
                <div key={f.label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">{f.label}</p>
                  <p className="text-sm font-semibold text-slate-800">{f.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                onClick={() => navigate("/owner/plans")}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Trocar Plano
              </Button>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50">
                Cancelar Assinatura
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
