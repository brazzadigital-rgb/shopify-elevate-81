import { useState } from "react";
import { usePlans, useSubscription, type Plan } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Cycle = "monthly" | "semiannual" | "annual";
const cycleLabels: Record<Cycle, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual" };

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getPrice(plan: Plan, cycle: Cycle) {
  if (cycle === "semiannual") return plan.semiannual_price;
  if (cycle === "annual") return plan.annual_price;
  return plan.monthly_price;
}

function getMonthlyEquivalent(plan: Plan, cycle: Cycle) {
  if (cycle === "semiannual") return plan.semiannual_price / 6;
  if (cycle === "annual") return plan.annual_price / 12;
  return plan.monthly_price;
}

function getSavings(plan: Plan, cycle: Cycle) {
  if (cycle === "monthly") return 0;
  const months = cycle === "semiannual" ? 6 : 12;
  const monthlyTotal = plan.monthly_price * months;
  const cyclePrice = getPrice(plan, cycle);
  return Math.round(((monthlyTotal - cyclePrice) / monthlyTotal) * 100);
}

function periodEnd(cycle: Cycle) {
  const d = new Date();
  if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
  else if (cycle === "semiannual") d.setMonth(d.getMonth() + 6);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export default function AdminPlans() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: sub, isLoading: subLoading } = useSubscription();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!confirmPlan || !user) return;
    setSaving(true);
    try {
      if (sub) {
        const { error } = await supabase.from("subscriptions").update({
          plan_id: confirmPlan.id,
          billing_cycle: cycle,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd(cycle),
        }).eq("id", sub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert({
          user_id: user.id,
          plan_id: confirmPlan.id,
          billing_cycle: cycle,
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd(cycle),
        });
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success("Plano atualizado com sucesso!");
      setConfirmPlan(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar plano");
    } finally {
      setSaving(false);
    }
  };

  const isLoading = plansLoading || subLoading;
  const plan = plans?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano e Assinatura</h1>
          <p className="text-muted-foreground text-sm mt-1">Escolha o ciclo ideal para sua operação</p>
        </div>
        {sub?.plan && (
          <Badge variant="outline" className="text-xs px-3 py-1.5 rounded-full border-primary/30 text-primary font-medium self-start">
            Plano atual: {sub.plan.name} ({cycleLabels[sub.billing_cycle]})
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-[500px] rounded-2xl" />
      ) : plan ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-card rounded-2xl border border-border/50 overflow-hidden max-w-2xl mx-auto">
            <div className="h-1.5 bg-gradient-to-r from-primary/60 to-primary" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                  {plan.highlight_badge && (
                    <span className="text-[10px] font-bold uppercase text-primary">{plan.highlight_badge}</span>
                  )}
                </div>
              </div>

              {plan.description && (
                <p className="text-sm text-muted-foreground mb-8">{plan.description}</p>
              )}

              {/* Cycle pricing cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {(["monthly", "semiannual", "annual"] as Cycle[]).map(c => {
                  const active = cycle === c;
                  const savings = getSavings(plan, c);
                  const total = getPrice(plan, c);
                  const monthly = getMonthlyEquivalent(plan, c);
                  const isCurrent = sub?.plan_id === plan.id && sub?.billing_cycle === c;

                  return (
                    <button
                      key={c}
                      onClick={() => setCycle(c)}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        active
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:border-border bg-card"
                      }`}
                    >
                      {savings > 0 && (
                        <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                          -{savings}%
                        </span>
                      )}
                      {isCurrent && (
                        <span className="absolute -top-2.5 left-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          Atual
                        </span>
                      )}
                      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        {cycleLabels[c]}
                      </p>
                      <p className="text-2xl font-black text-foreground">{formatBRL(total)}</p>
                      {c !== "monthly" && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          ≈ {formatBRL(monthly)}/mês
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Features */}
              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Funcionalidades incluídas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {((plan.features_json || []) as string[]).map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/80">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <Button
                className="w-full rounded-xl h-12 font-semibold"
                disabled={sub?.plan_id === plan.id && sub?.billing_cycle === cycle}
                onClick={() => setConfirmPlan(plan)}
              >
                {sub?.plan_id === plan.id && sub?.billing_cycle === cycle
                  ? "Ciclo atual"
                  : `Assinar ${cycleLabels[cycle].toLowerCase()} — ${formatBRL(getPrice(plan, cycle))}`}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum plano configurado</p>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirmPlan} onOpenChange={() => setConfirmPlan(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar assinatura</DialogTitle>
            <DialogDescription>Revise os detalhes antes de confirmar.</DialogDescription>
          </DialogHeader>
          {confirmPlan && (
            <div className="space-y-3 py-2">
              {[
                { label: "Plano", value: confirmPlan.name },
                { label: "Ciclo", value: cycleLabels[cycle] },
                { label: "Valor", value: formatBRL(getPrice(confirmPlan, cycle)) },
                { label: "Equivalente/mês", value: formatBRL(getMonthlyEquivalent(confirmPlan, cycle)) },
                { label: "Economia", value: getSavings(confirmPlan, cycle) > 0 ? `${getSavings(confirmPlan, cycle)}%` : "—" },
                { label: "Próxima renovação", value: new Date(periodEnd(cycle)).toLocaleDateString("pt-BR") },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmPlan(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleConfirm} disabled={saving} className="rounded-xl">{saving ? "Salvando..." : "Confirmar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
