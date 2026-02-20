import { usePlans, type Plan } from "@/hooks/useSubscription";
import { useOwnerSubscription, useOwnerInvoices } from "@/hooks/useOwnerSubscription";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Crown, ShoppingCart, Package, Truck, MapPin, BarChart3, Star, Zap, Headphones, Receipt, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Cycle = "monthly" | "semiannual" | "annual";
const cycleLabels: Record<Cycle, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual" };
const cycleSuffix: Record<Cycle, string> = { monthly: "/mês", semiannual: "/6 meses", annual: "/12 meses" };

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getPrice(plan: Plan, cycle: Cycle) {
  if (cycle === "semiannual") return plan.semiannual_price;
  if (cycle === "annual") return plan.annual_price;
  return plan.monthly_price;
}

function getSavings(plan: Plan, cycle: Cycle) {
  if (cycle === "monthly") return 0;
  const months = cycle === "semiannual" ? 6 : 12;
  const monthlyTotal = plan.monthly_price * months;
  const cyclePrice = getPrice(plan, cycle);
  return Math.round(((monthlyTotal - cyclePrice) / monthlyTotal) * 100);
}

function getSavingsAmount(plan: Plan, cycle: Cycle) {
  if (cycle === "monthly") return 0;
  const months = cycle === "semiannual" ? 6 : 12;
  const monthlyTotal = plan.monthly_price * months;
  return monthlyTotal - getPrice(plan, cycle);
}

const featureIcons = [
  Zap, Package, Truck, MapPin, BarChart3, Star, Zap, Headphones,
];

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: "Ativa", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  trial: { label: "Teste", color: "bg-amber-50 text-amber-700 border-amber-200" },
  suspended: { label: "Suspensa", color: "bg-red-50 text-red-700 border-red-200" },
  canceled: { label: "Cancelada", color: "bg-slate-100 text-slate-500 border-slate-200" },
};

const invoiceStatusMap: Record<string, { label: string; color: string }> = {
  paid: { label: "Pago", color: "text-emerald-600" },
  pending: { label: "Pendente", color: "text-amber-600" },
  overdue: { label: "Atrasado", color: "text-red-600" },
};

export default function AdminSubscription() {
  const { data: sub, isLoading: subLoading } = useOwnerSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: invoices, isLoading: invoicesLoading } = useOwnerInvoices();

  const isLoading = subLoading || plansLoading;
  const plan = sub?.plan as Plan | undefined;
  const cycle = (sub?.billing_cycle || "monthly") as Cycle;
  const allPlans = plans || [];
  const currentPlan = allPlans[0];
  const cycles: Cycle[] = ["monthly", "semiannual", "annual"];
  const status = statusMap[sub?.status || "active"] || statusMap.active;
  const savings = plan ? getSavings(plan, cycle) : 0;

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try { return format(new Date(d), "dd/MM/yy", { locale: ptBR }); } catch { return "—"; }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assinatura</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu plano e pagamentos</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Subscription Status Card */}
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{cycleLabels[cycle]}</h3>
                  <p className="text-xs text-muted-foreground">Status da assinatura</p>
                </div>
              </div>
              <Badge className={`${status.color} border text-xs px-3 py-1 rounded-full font-medium`}>
                {status.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> Valor
                </p>
                <p className="text-lg font-black text-foreground mt-0.5">
                  {plan ? formatBRL(getPrice(plan, cycle)) : "—"}
                  <span className="text-xs font-normal text-muted-foreground">{cycleSuffix[cycle]?.replace("/", "/")}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Receipt className="w-3 h-3" /> Último Pag.
                </p>
                <p className="text-lg font-bold text-foreground mt-0.5">{formatDate(sub?.current_period_start)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Receipt className="w-3 h-3" /> Vencimento
                </p>
                <p className="text-lg font-bold text-foreground mt-0.5">{formatDate(sub?.current_period_end)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Desconto
                </p>
                <p className="text-lg font-bold text-primary mt-0.5">{savings > 0 ? `${savings}%` : "—"}</p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          {plan && (plan.features_json as string[] || []).length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground">Seu Plano Inclui</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {((plan.features_json || []) as string[]).map((f, i) => {
                  const Icon = featureIcons[i % featureIcons.length];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-primary/60 flex-shrink-0" />
                      <span className="text-sm text-foreground/80">{f}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan Cards */}
          {currentPlan && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground">Planos Disponíveis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cycles.map((c, idx) => {
                  const total = getPrice(currentPlan, c);
                  const savingsPercent = getSavings(currentPlan, c);
                  const savingsAmt = getSavingsAmount(currentPlan, c);
                  const isCurrent = sub?.billing_cycle === c;
                  const isPopular = c === "semiannual";

                  return (
                    <motion.div
                      key={c}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className={`relative bg-card rounded-2xl border-2 p-5 flex flex-col ${
                        isCurrent ? "border-primary shadow-md" : isPopular ? "border-primary/40" : "border-border/50"
                      }`}
                    >
                      {isPopular && !isCurrent && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                            ✨ Mais Popular
                          </span>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-3 right-4 z-10">
                          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground whitespace-nowrap">
                            ✓ Atual
                          </span>
                        </div>
                      )}

                      <h4 className="font-bold text-foreground text-center mt-1">{cycleLabels[c]}</h4>
                      <div className="text-center mt-2 mb-1">
                        <span className="text-2xl font-black text-foreground">{formatBRL(total)}</span>
                        <p className="text-xs text-muted-foreground">{cycleSuffix[c]}</p>
                      </div>

                      {savingsPercent > 0 && (
                        <div className="mx-auto mb-3">
                          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            ↗ {savingsPercent}% off · Economia de {formatBRL(savingsAmt)}
                          </span>
                        </div>
                      )}

                      <div className="space-y-2 flex-1 mt-2">
                        {((currentPlan.features_json || []) as string[]).map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-foreground/70">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        {isCurrent ? (
                          <div className="w-full rounded-xl h-10 font-semibold flex items-center justify-center bg-primary/10 text-primary text-sm border border-primary/20">
                            ✓ Plano Selecionado
                          </div>
                        ) : (
                          <Button
                            className="w-full rounded-xl h-10 text-sm font-semibold"
                            variant={isPopular ? "default" : "outline"}
                            onClick={() => window.location.href = "/admin/planos"}
                          >
                            › Mudar para {cycleLabels[c]}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-card rounded-2xl border border-border/50 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-foreground">Histórico de Pagamentos</h3>
            </div>

            {invoicesLoading ? (
              <Skeleton className="h-24 rounded-xl" />
            ) : invoices && invoices.length > 0 ? (
              <div className="divide-y divide-border/30">
                {invoices.slice(0, 10).map((inv: any) => {
                  const st = invoiceStatusMap[inv.status] || invoiceStatusMap.pending;
                  return (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatBRL(inv.amount)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</p>
                      </div>
                      <span className={`text-xs font-semibold ${st.color}`}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CreditCard className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum pagamento registrado</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
