import { useState } from "react";
import { usePlans, type Plan } from "@/hooks/useSubscription";
import { useOwnerSubscription } from "@/hooks/useOwnerSubscription";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, Crown, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  { label: "Pedidos/mês", value: "Ilimitados" },
  { label: "Produtos", value: "Ilimitados" },
  { label: "Gateways", value: "5+" },
  { label: "Admins", value: "Ilimitados" },
];

const extraBadges = ["Analytics", "RBAC", "Multi-gateway", "UTM"];

export default function AdminPlans() {
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: sub, isLoading: subLoading } = useOwnerSubscription();
  const queryClient = useQueryClient();

  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    cycle: Cycle;
    plan: Plan | null;
    loading: boolean;
    qrCode: string | null;
    qrImage: string | null;
    txid: string | null;
    copied: boolean;
  }>({
    open: false,
    cycle: "monthly",
    plan: null,
    loading: false,
    qrCode: null,
    qrImage: null,
    txid: null,
    copied: false,
  });

  const isLoading = plansLoading || subLoading;
  const plan = plans?.[0];
  const cycles: Cycle[] = ["monthly", "semiannual", "annual"];

  const handleAcquire = async (selectedPlan: Plan, cycle: Cycle) => {
    setPaymentModal({
      open: true,
      cycle,
      plan: selectedPlan,
      loading: true,
      qrCode: null,
      qrImage: null,
      txid: null,
      copied: false,
    });

    try {
      const amount = getPrice(selectedPlan, cycle);

      // 1. Generate invoice
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const invoiceRes = await supabase.functions.invoke("owner-efi-charge", {
        body: {
          action: "generate_invoice",
          amount,
          plan_id: selectedPlan.id,
          billing_cycle: cycle,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (invoiceRes.error || !invoiceRes.data?.success) {
        throw new Error(invoiceRes.data?.error || "Erro ao gerar fatura");
      }

      const invoiceId = invoiceRes.data.invoice.id;

      // 2. Create PIX charge
      const chargeRes = await supabase.functions.invoke("owner-efi-charge", {
        body: {
          action: "create_charge",
          amount,
          description: `Plano ${selectedPlan.name} - ${cycleLabels[cycle]}`,
          invoice_id: invoiceId,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (chargeRes.error || !chargeRes.data?.success) {
        throw new Error(chargeRes.data?.error || "Erro ao criar cobrança PIX");
      }

      // Cycle will only change when payment is confirmed via webhook

      setPaymentModal((prev) => ({
        ...prev,
        loading: false,
        qrCode: chargeRes.data.qr_code,
        qrImage: chargeRes.data.qr_image,
        txid: chargeRes.data.txid,
      }));
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento");
      setPaymentModal((prev) => ({ ...prev, open: false, loading: false }));
    }
  };

  const handleCopy = () => {
    if (paymentModal.qrCode) {
      navigator.clipboard.writeText(paymentModal.qrCode);
      setPaymentModal((prev) => ({ ...prev, copied: true }));
      toast.success("Código PIX copiado!");
      setTimeout(() => setPaymentModal((prev) => ({ ...prev, copied: false })), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plano e Assinatura</h1>
          <p className="text-muted-foreground text-sm mt-1">Escolha o ciclo ideal para sua operação</p>
        </div>
        {sub?.plan && (
          <Badge variant="outline" className="text-xs px-3 py-1.5 rounded-full border-primary/30 text-primary font-medium self-start">
            Plano atual: {sub.plan.name} ({cycleLabels[sub.billing_cycle as Cycle]})
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
            const isCurrent = sub?.plan_id === plan.id && sub?.billing_cycle === c;
            const isRecommended = c === "semiannual";

            return (
              <motion.div
                key={c}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`relative bg-card rounded-2xl border-2 overflow-hidden flex flex-col ${
                  isRecommended ? "border-primary shadow-md" : "border-border/50"
                }`}
              >
                {isRecommended && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                      Recomendado
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className={`absolute top-3 ${isRecommended ? 'left-3' : 'right-3'} z-10`}>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      Atual
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Crown className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-base">{cycleLabels[c]}</h3>
                      <p className="text-[11px] text-muted-foreground">{cycleKey[c]}</p>
                    </div>
                  </div>

                  <div className="mt-4 mb-1">
                    <span className="text-3xl font-black text-foreground">{formatBRL(total)}</span>
                    <span className="text-sm text-muted-foreground ml-1">{cycleSuffix[c]}</span>
                  </div>

                  {savings > 0 ? (
                    <p className="text-xs text-primary font-semibold mb-2">
                      {savings}% de desconto · Base: {formatBRL(getMonthlyBase(plan))}/mês
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-2">Plano mensal sem desconto</p>
                  )}

                  <p className="text-xs text-muted-foreground mb-4">
                    {savings > 0
                      ? `Plano ${cycleLabels[c].toLowerCase()} com ${savings}% de desconto`
                      : plan.description || "Acesso completo a todas as funcionalidades"}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {statsItems.map(s => (
                      <div key={s.label} className="bg-muted/50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                        <p className="text-sm font-bold text-foreground">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-5 flex-1">
                    {((plan.features_json || []) as string[]).map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/80">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-5">
                    {extraBadges.map(b => (
                      <span key={b} className="text-[11px] font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>

                  {isCurrent ? (
                    <div className="w-full rounded-xl h-10 font-semibold mt-auto flex items-center justify-center bg-primary/10 text-primary text-sm">
                      ✓ Ciclo ativo
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleAcquire(plan, c)}
                      className="w-full mt-auto rounded-xl h-10 font-semibold"
                      variant={isRecommended ? "default" : "outline"}
                    >
                      {sub?.plan_id === plan.id ? "Alterar ciclo" : "Adquirir"}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum plano configurado</p>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={paymentModal.open} onOpenChange={(open) => setPaymentModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {paymentModal.plan
                ? `${paymentModal.plan.name} — ${cycleLabels[paymentModal.cycle]}`
                : "Pagamento"}
            </DialogTitle>
          </DialogHeader>

          {paymentModal.loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando cobrança PIX…</p>
            </div>
          ) : paymentModal.qrImage || paymentModal.qrCode ? (
            <div className="flex flex-col items-center gap-4 py-3">
              {/* Amount */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Valor a pagar</p>
                <p className="text-xl font-black text-foreground">
                  {paymentModal.plan ? formatBRL(getPrice(paymentModal.plan, paymentModal.cycle)) : "—"}
                </p>
              </div>

              {/* QR Code Image */}
              {paymentModal.qrImage && (
                <div className="bg-white p-2 rounded-xl border inline-flex items-center justify-center">
                  <img
                    src={paymentModal.qrImage}
                    alt="QR Code PIX"
                    className="w-40 h-40 max-w-full object-contain"
                  />
                </div>
              )}

              {/* Copy paste */}
              {paymentModal.qrCode && (
                <div className="w-full space-y-2">
                  <p className="text-xs text-muted-foreground text-center font-medium">PIX Copia e Cola</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 bg-muted/50 rounded-lg px-3 py-2.5 text-[10px] text-foreground/70 truncate font-mono overflow-hidden">
                      {paymentModal.qrCode}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5"
                      onClick={handleCopy}
                    >
                      {paymentModal.copied ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-500" /> Copiado</>
                      ) : (
                        <><Copy className="w-4 h-4" /> Copiar</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground text-center leading-relaxed max-w-xs">
                Após o pagamento, sua assinatura será atualizada automaticamente. O ciclo passa a valer imediatamente.
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Não foi possível gerar o QR Code. Tente novamente.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}