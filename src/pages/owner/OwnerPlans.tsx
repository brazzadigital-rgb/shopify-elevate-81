import { useState } from "react";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Planos</h1>
        <p className="text-slate-400 text-sm mt-1">Escolha o plano ideal para o seu sistema</p>
      </div>

      {/* Cycle selector */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-xl bg-slate-50 p-1 gap-1 border border-slate-100">
          {(["monthly", "semiannual", "annual"] as Cycle[]).map(c => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                cycle === c
                  ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {cycleLabels[c]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
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
                <div className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isHighlighted
                    ? "border-emerald-200 shadow-md"
                    : "border-slate-100"
                }`}>
                  {isHighlighted && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  )}
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        Plano Atual
                      </span>
                    </div>
                  )}

                  <div className="p-6 pb-2 pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isHighlighted ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                      }`}>
                        <PlanIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                        {isHighlighted && (
                          <span className="text-[10px] font-bold uppercase text-emerald-600">
                            {plan.highlight_badge}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-800">{formatBRL(price)}</span>
                      <span className="text-slate-400 text-sm">/{cycleLabels[cycle].toLowerCase()}</span>
                    </div>
                    {savings > 0 && (
                      <span className="text-xs font-semibold text-emerald-600 mt-1 inline-block">
                        Economia de {savings}%
                      </span>
                    )}
                  </div>

                  <div className="p-6 pt-4">
                    <ul className="space-y-2.5 mb-6">
                      {features.map((f: string, fi: number) => (
                        <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full h-11 rounded-xl font-semibold ${
                        isCurrent
                          ? "bg-slate-100 text-slate-400 cursor-default"
                          : isHighlighted
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? "Plano atual" : "Selecionar plano"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
