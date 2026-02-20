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
import { Check, Crown, Pencil, Save, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Cycle = "monthly" | "semiannual" | "annual";

const cycleLabels: Record<Cycle, string> = { monthly: "Mensal", semiannual: "Semestral", annual: "Anual" };
const cycleSuffix: Record<Cycle, string> = { monthly: "/mês", semiannual: "/6 meses", annual: "/12 meses" };
const cycleKey: Record<Cycle, string> = { monthly: "monthly", semiannual: "semiannual", annual: "annual" };

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getPrice(plan: Plan, cycle: Cycle) {
  if (cycle === "semiannual") return plan.semiannual_price;
  if (cycle === "annual") return plan.annual_price;
  return plan.monthly_price;
}

function getMonthlyBase(plan: Plan) {
  return plan.monthly_price;
}

function getSavings(plan: Plan, cycle: Cycle) {
  if (cycle === "monthly") return 0;
  const months = cycle === "semiannual" ? 6 : 12;
  const monthlyTotal = plan.monthly_price * months;
  const cyclePrice = getPrice(plan, cycle);
  return Math.round(((monthlyTotal - cyclePrice) / monthlyTotal) * 100);
}

const statsItems = [
  { label: "Pedidos/mês", value: "∞" },
  { label: "Produtos", value: "∞" },
  { label: "Categorias", value: "∞" },
  { label: "Usuários", value: "∞" },
];

const extraBadges = ["Analytics", "Domínio", "Suporte VIP", "API"];

export default function OwnerPlans() {
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
  const cycles: Cycle[] = ["monthly", "semiannual", "annual"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planos</h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os ciclos e valores do plano</p>
        </div>
        {sub?.plan && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs px-3 py-1.5 rounded-full font-medium self-start">
            Ativo: {sub.plan.name}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-[520px] rounded-2xl" />)}
        </div>
      ) : plan ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cycles.map((c, idx) => {
            const savings = getSavings(plan, c);
            const total = getPrice(plan, c);
            const isDefault = c === "semiannual";

            return (
              <motion.div
                key={c}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`relative bg-white rounded-2xl border-2 overflow-hidden flex flex-col ${
                  isDefault ? "border-emerald-400 shadow-md" : "border-slate-100"
                }`}
              >
                {/* Default badge */}
                {isDefault && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500 text-white">
                      Padrão
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Crown className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{cycleLabels[c]}</h3>
                      <p className="text-[11px] text-slate-400">{cycleKey[c]}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-4 mb-1">
                    <span className="text-3xl font-black text-slate-800">{formatBRL(total)}</span>
                    <span className="text-sm text-slate-400 ml-1">{cycleSuffix[c]}</span>
                  </div>

                  {/* Savings */}
                  {savings > 0 ? (
                    <p className="text-xs text-emerald-600 font-semibold mb-2">
                      {savings}% de desconto · Base: {formatBRL(getMonthlyBase(plan))}/mês
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mb-2">Plano mensal sem desconto</p>
                  )}

                  {/* Description */}
                  {plan.description && (
                    <p className="text-xs text-slate-400 mb-4">
                      {savings > 0
                        ? `Plano ${cycleLabels[c].toLowerCase()} com ${savings}% de desconto`
                        : plan.description}
                    </p>
                  )}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {statsItems.map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-slate-400 font-medium">{s.label}</p>
                        <p className="text-sm font-bold text-slate-700">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-5 flex-1">
                    {((plan.features_json || []) as string[]).map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Extra badges */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {extraBadges.map(b => (
                      <span key={b} className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-10 text-sm"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Editar
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
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
