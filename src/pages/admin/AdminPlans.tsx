import { useState } from "react";
import { usePlans, useSubscription, type Plan } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Cycle = "monthly" | "semiannual" | "annual";
const cycleLabels: Record<Cycle, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual" };
const planIcons = [Zap, Crown, Sparkles];

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getPrice(plan: Plan, cycle: Cycle) {
  if (cycle === "semiannual") return plan.semiannual_price;
  if (cycle === "annual") return plan.annual_price;
  return plan.monthly_price;
}

function getSavings(plan: Plan, cycle: Cycle) {
  if (cycle === "monthly") return 0;
  const monthlyTotal = plan.monthly_price * (cycle === "semiannual" ? 6 : 12);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos e Assinatura</h1>
          <p className="text-muted-foreground text-sm mt-1">Escolha o plano ideal para sua operação</p>
        </div>
        {sub?.plan && (
          <Badge variant="outline" className="text-xs px-3 py-1.5 rounded-full border-primary/30 text-primary font-medium self-start">
            Plano atual: {sub.plan.name}
          </Badge>
        )}
      </div>

      {/* Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl p-1 gap-1 bg-muted/50 border border-border/50">
          {(["monthly", "semiannual", "annual"] as Cycle[]).map(c => {
            const active = cycle === c;
            return (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-card text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cycleLabels[c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-[420px] rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {(plans || []).map((plan, idx) => {
            const isHighlighted = !!plan.highlight_badge;
            const isCurrent = sub?.plan_id === plan.id && sub?.billing_cycle === cycle;
            const price = getPrice(plan, cycle);
            const savings = getSavings(plan, cycle);
            const features = (plan.features_json || []) as string[];
            const Icon = planIcons[idx] || Zap;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <div className={`relative bg-card rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isHighlighted ? "border-primary/30 shadow-md" : "border-border/50"
                }`}>
                  {isHighlighted && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/60 to-primary" />
                  )}
                  {isHighlighted && plan.highlight_badge && (
                    <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10 mt-3">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-3 py-1 rounded-full shadow-md font-semibold">
                        ✨ {plan.highlight_badge}
                      </Badge>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Plano Atual
                      </span>
                    </div>
                  )}

                  <div className="p-6 pb-2 pt-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isHighlighted ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground">{formatBRL(price)}</span>
                      <span className="text-muted-foreground text-sm">/{cycleLabels[cycle].toLowerCase()}</span>
                    </div>
                    {savings > 0 && (
                      <span className="text-xs font-semibold text-primary mt-1 inline-block">
                        Economia de {savings}%
                      </span>
                    )}
                  </div>

                  <div className="p-6 pt-4">
                    <ul className="space-y-2.5 mb-6">
                      {features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-2.5 text-sm text-foreground/80">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isHighlighted ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <Check className={`w-3 h-3 ${isHighlighted ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full rounded-xl h-11 font-semibold text-sm"
                      variant={isHighlighted ? "default" : "secondary"}
                      disabled={isCurrent}
                      onClick={() => !isCurrent && setConfirmPlan(plan)}
                    >
                      {isCurrent ? "Plano atual" : "Escolher plano"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={!!confirmPlan} onOpenChange={() => setConfirmPlan(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar plano</DialogTitle>
            <DialogDescription>Revise os detalhes antes de confirmar.</DialogDescription>
          </DialogHeader>
          {confirmPlan && (
            <div className="space-y-3 py-2">
              {[
                { label: "Plano", value: confirmPlan.name },
                { label: "Ciclo", value: cycleLabels[cycle] },
                { label: "Valor", value: formatBRL(getPrice(confirmPlan, cycle)) },
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
