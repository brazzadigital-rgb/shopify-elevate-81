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
import { cn } from "@/lib/utils";

type Cycle = "monthly" | "semiannual" | "annual";

const cycleLabels: Record<Cycle, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual" };
const cycleSuffix: Record<Cycle, string> = { monthly: "/mês", semiannual: "/semestre", annual: "/ano" };
const planIcons = [Zap, Crown, Sparkles];

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Planos e Assinatura</h1>
          <p className="text-muted-foreground text-sm mt-1">Escolha o plano ideal para sua operação</p>
        </div>
        {sub?.plan && (
          <Badge variant="outline" className="text-sm px-3 py-1.5 rounded-full border-primary/30 text-primary font-medium self-start">
            Plano atual: {sub.plan.name}
          </Badge>
        )}
      </div>

      {/* Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-2xl p-1.5" style={{ background: "hsl(var(--admin-surface))", border: "1px solid hsl(var(--admin-border-subtle))" }}>
          {(["monthly", "semiannual", "annual"] as Cycle[]).map((c) => {
            const active = cycle === c;
            return (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "relative px-5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                  active ? "text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="cycle-bg"
                    className="absolute inset-0 rounded-xl bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {cycleLabels[c]}
                  {c !== "monthly" && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", active ? "bg-white/20" : "bg-primary/10 text-primary")}>
                      -{getSavings((plans || [])[1] || { monthly_price: 99, semiannual_price: 499, annual_price: 899 } as any, c)}%
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[480px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {(plans || []).map((plan, idx) => {
            const isHighlighted = !!plan.highlight_badge;
            const isCurrent = sub?.plan_id === plan.id && sub?.billing_cycle === cycle;
            const price = getPrice(plan, cycle);
            const features = (plan.features_json || []) as string[];
            const Icon = planIcons[idx] || Zap;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "relative rounded-[22px] p-[1px] transition-shadow duration-300",
                  isHighlighted
                    ? "bg-gradient-to-b from-primary/60 to-primary/20 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/15"
                    : "hover:shadow-lg"
                )}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full shadow-md font-semibold">
                      ✨ {plan.highlight_badge}
                    </Badge>
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-[21px] p-6 md:p-8 flex flex-col h-full",
                    isHighlighted ? "bg-card" : "bg-card border border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isHighlighted ? "bg-primary/10" : "bg-muted")}>
                      <Icon className={cn("w-5 h-5", isHighlighted ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <span className="text-4xl font-extrabold text-foreground">{price.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cycleSuffix[cycle]}</span>
                  </div>

                  <div className="flex-1 space-y-3 mb-8">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", isHighlighted ? "bg-primary/10" : "bg-muted")}>
                          <Check className={cn("w-3 h-3", isHighlighted ? "text-primary" : "text-muted-foreground")} />
                        </div>
                        <span className="text-sm text-foreground/80">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={cn(
                      "w-full rounded-xl h-12 font-semibold text-sm",
                      isHighlighted ? "" : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                    variant={isHighlighted ? "default" : "secondary"}
                    disabled={isCurrent}
                    onClick={() => !isCurrent && setConfirmPlan(plan)}
                  >
                    {isCurrent ? "Plano atual" : "Escolher plano"}
                  </Button>
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
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-semibold">{confirmPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ciclo</span>
                <span className="font-semibold">{cycleLabels[cycle]}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-semibold">R$ {getPrice(confirmPlan, cycle).toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Próxima renovação</span>
                <span className="font-semibold">{new Date(periodEnd(cycle)).toLocaleDateString("pt-BR")}</span>
              </div>
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
