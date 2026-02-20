import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { usePlans, type Plan } from "@/hooks/useSubscription";
import { useOwnerSubscription } from "@/hooks/useOwnerSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Star, Sparkles, Crown, Pencil, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Cycle = "monthly" | "semiannual" | "annual";
const cycleLabels: Record<Cycle, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual" };
const planIcons: Record<string, any> = { Basic: Star, Premium: Sparkles, Master: Crown };

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function OwnerPlans() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const { data: plans, isLoading } = usePlans();
  const { data: sub } = useOwnerSubscription();
  const qc = useQueryClient();
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMonthly, setEditMonthly] = useState("");
  const [editSemiannual, setEditSemiannual] = useState("");
  const [editAnnual, setEditAnnual] = useState("");
  const [editFeatures, setEditFeatures] = useState("");
  const [editBadge, setEditBadge] = useState("");

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setEditName(plan.name);
    setEditDescription(plan.description || "");
    setEditMonthly(String(plan.monthly_price));
    setEditSemiannual(String(plan.semiannual_price));
    setEditAnnual(String(plan.annual_price));
    setEditFeatures((plan.features_json || []).join("\n"));
    setEditBadge(plan.highlight_badge || "");
  };

  const handleSave = async () => {
    if (!editPlan) return;
    setSaving(true);
    try {
      const features = editFeatures.split("\n").map(f => f.trim()).filter(Boolean);
      const { error } = await supabase.from("plans").update({
        name: editName,
        description: editDescription || null,
        monthly_price: parseFloat(editMonthly) || 0,
        semiannual_price: parseFloat(editSemiannual) || 0,
        annual_price: parseFloat(editAnnual) || 0,
        features_json: features,
        highlight_badge: editBadge || null,
      }).eq("id", editPlan.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano atualizado com sucesso!");
      setEditPlan(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar plano");
    } finally {
      setSaving(false);
    }
  };

  const getPrice = (plan: Plan) => {
    if (cycle === "annual") return plan.annual_price;
    if (cycle === "semiannual") return plan.semiannual_price;
    return plan.monthly_price;
  };

  const getSavings = (plan: Plan) => {
    if (cycle === "monthly") return 0;
    const monthly = plan.monthly_price;
    const price = getPrice(plan);
    const months = cycle === "annual" ? 12 : 6;
    return Math.round(((monthly * months - price) / (monthly * months)) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planos</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os planos disponíveis no sistema</p>
        </div>
        {sub?.plan && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs px-3 py-1.5 rounded-full font-medium self-start">
            Plano atual: {sub.plan.name}
          </Badge>
        )}
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
          {plans?.map((plan: Plan, i: number) => {
            const PlanIcon = planIcons[plan.name] || Star;
            const price = getPrice(plan);
            const savings = getSavings(plan);
            const isCurrent = sub?.plan_id === plan.id;
            const isHighlighted = !!plan.highlight_badge;
            const features = Array.isArray(plan.features_json) ? plan.features_json : [];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className={`relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isHighlighted ? "border-emerald-200 shadow-md" : "border-slate-100"
                }`}>
                  {isHighlighted && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                  )}

                  {/* Edit button */}
                  <button
                    onClick={() => openEdit(plan)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-xl bg-slate-50 hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors z-10"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {isCurrent && (
                    <div className="absolute top-3 left-3">
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
                    {plan.description && (
                      <p className="text-xs text-slate-400 mb-4">{plan.description}</p>
                    )}
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
                    <ul className="space-y-2.5 mb-4">
                      {features.map((f: string, fi: number) => (
                        <li key={fi} className="flex items-start gap-2.5 text-sm text-slate-600">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editPlan} onOpenChange={() => setEditPlan(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Editar Plano</DialogTitle>
            <DialogDescription>Altere as informações e valores do plano.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Nome</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Descrição</label>
              <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Badge de destaque</label>
              <Input value={editBadge} onChange={e => setEditBadge(e.target.value)} placeholder="Ex: Mais popular" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Mensal (R$)</label>
                <Input type="number" step="0.01" value={editMonthly} onChange={e => setEditMonthly(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Semestral (R$)</label>
                <Input type="number" step="0.01" value={editSemiannual} onChange={e => setEditSemiannual(e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Anual (R$)</label>
                <Input type="number" step="0.01" value={editAnnual} onChange={e => setEditAnnual(e.target.value)} className="rounded-xl" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Funcionalidades (uma por linha)</label>
              <Textarea value={editFeatures} onChange={e => setEditFeatures(e.target.value)} rows={6} className="rounded-xl text-sm" />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditPlan(null)} className="rounded-xl">
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white">
              <Save className="w-4 h-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
