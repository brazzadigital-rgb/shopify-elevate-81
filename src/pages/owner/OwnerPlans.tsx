import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlans } from "@/hooks/useSubscription";
import { useOwnerSubscription } from "@/hooks/useOwnerSubscription";
import { Check, Star, Sparkles, Crown } from "lucide-react";
import { motion } from "framer-motion";

type Cycle = "monthly" | "semiannual" | "annual";
const cycleLabels: Record<Cycle, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual" };

const planIcons: Record<string, any> = { Basic: Star, Premium: Sparkles, Master: Crown };

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function OwnerPlans() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const { data: plans, isLoading } = usePlans();
  const { data: sub } = useOwnerSubscription();

  const getPrice = (plan: any) => {
    if (cycle === "annual") return plan.annual_price;
    if (cycle === "semiannual") return plan.semiannual_price;
    return plan.monthly_price;
  };

  const getSavings = (plan: any) => {
    if (cycle === "monthly") return 0;
    const monthly = plan.monthly_price;
    const price = getPrice(plan);
    const months = cycle === "annual" ? 12 : 6;
    return Math.round(((monthly * months - price) / (monthly * months)) * 100);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Planos</h1>
        <p className="text-slate-400 text-sm mt-1">Escolha o plano ideal para o seu sistema</p>
      </div>

      {/* Cycle Selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-slate-800/60 p-1 gap-1">
          {(["monthly", "semiannual", "annual"] as Cycle[]).map(c => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                cycle === c
                  ? "bg-amber-500 text-slate-900 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/40"
              }`}
            >
              {cycleLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 bg-slate-800 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan: any, i: number) => {
            const PlanIcon = planIcons[plan.name] || Star;
            const price = getPrice(plan);
            const savings = getSavings(plan);
            const isCurrent = sub?.plan_id === plan.id;
            const isHighlighted = plan.highlight_badge;
            const features = Array.isArray(plan.features_json) ? plan.features_json : [];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={`relative border-0 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  isHighlighted
                    ? "bg-gradient-to-b from-amber-500/10 to-slate-900/80 ring-1 ring-amber-500/30 shadow-xl shadow-amber-500/5"
                    : "bg-slate-900/60 shadow-lg"
                }`}>
                  {isHighlighted && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                  )}
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                        Plano Atual
                      </span>
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isHighlighted ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"
                      }`}>
                        <PlanIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-white">{plan.name}</CardTitle>
                        {isHighlighted && (
                          <span className="text-[10px] font-bold uppercase text-amber-400">
                            {plan.highlight_badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">{formatBRL(price)}</span>
                      <span className="text-slate-500 text-sm">/{cycleLabels[cycle].toLowerCase()}</span>
                    </div>
                    {savings > 0 && (
                      <span className="text-xs font-semibold text-emerald-400 mt-1">
                        Economia de {savings}%
                      </span>
                    )}
                  </CardHeader>
                  <CardContent className="pt-4 pb-6">
                    <ul className="space-y-2.5 mb-6">
                      {features.map((f: string, fi: number) => (
                        <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full h-11 rounded-xl font-semibold ${
                        isCurrent
                          ? "bg-slate-700 text-slate-400 cursor-default"
                          : isHighlighted
                          ? "bg-amber-500 hover:bg-amber-400 text-slate-900"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                      }`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Plano atual" : "Selecionar plano"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
