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
import { Check, Crown, Pencil, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

export default function OwnerPlans() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const { data: plans, isLoading } = usePlans();
  const { data: sub } = useOwnerSubscription();
  const qc = useQueryClient();
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

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

  const plan = plans?.[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plano</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie o plano e valores do sistema</p>
        </div>
        {sub?.plan && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs px-3 py-1.5 rounded-full font-medium self-start">
            Ativo: {sub.plan.name}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-[500px] rounded-2xl" />
      ) : plan ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden max-w-2xl mx-auto">
            {/* Top gradient bar */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600" />

            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{plan.name}</h2>
                    {plan.highlight_badge && (
                      <span className="text-[10px] font-bold uppercase text-emerald-600">{plan.highlight_badge}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(plan)}
                  className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-emerald-50 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {plan.description && (
                <p className="text-sm text-slate-400 mb-8">{plan.description}</p>
              )}

              {/* Cycle pricing cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {(["monthly", "semiannual", "annual"] as Cycle[]).map(c => {
                  const active = cycle === c;
                  const savings = getSavings(plan, c);
                  const total = getPrice(plan, c);
                  const monthly = getMonthlyEquivalent(plan, c);

                  return (
                    <button
                      key={c}
                      onClick={() => setCycle(c)}
                      className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 ${
                        active
                          ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      }`}
                    >
                      {savings > 0 && (
                        <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                          -{savings}%
                        </span>
                      )}
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {cycleLabels[c]}
                      </p>
                      <p className="text-2xl font-black text-slate-800">{formatBRL(total)}</p>
                      {c !== "monthly" && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          ≈ {formatBRL(monthly)}/mês
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Features */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                  Funcionalidades incluídas
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {((plan.features_json || []) as string[]).map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-sm text-slate-600">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-sm text-slate-400">Nenhum plano configurado</p>
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
              <Input value={editBadge} onChange={e => setEditBadge(e.target.value)} placeholder="Ex: Plano Completo" className="rounded-xl" />
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
