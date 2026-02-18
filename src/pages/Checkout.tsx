import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Check, CreditCard, QrCode, FileText, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

type Step = "identification" | "address" | "shipping" | "payment";
const steps: { key: Step; label: string }[] = [
  { key: "identification", label: "Identificação" },
  { key: "address", label: "Endereço" },
  { key: "shipping", label: "Entrega" },
  { key: "payment", label: "Pagamento" },
];

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { getSetting, isEnabled } = useStoreSettings();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>("identification");
  const [placing, setPlacing] = useState(false);

  const [form, setForm] = useState({
    name: "", email: user?.email || "", phone: "",
    street: "", number: "", complement: "", neighborhood: "", city: "", state: "", zip_code: "",
    shipping_option: "standard",
    payment_method: "pix",
  });

  const upd = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const stepIndex = steps.findIndex(s => s.key === currentStep);

  const pixDiscount = parseInt(getSetting("pix_discount_percent", "5"));
  const shippingCost = form.shipping_option === "express" ? 29.90 : (subtotal >= parseFloat(getSetting("free_shipping_min_value", "199")) ? 0 : 19.90);
  const paymentDiscount = form.payment_method === "pix" && isEnabled("pix_enabled") ? subtotal * (pixDiscount / 100) : 0;
  const total = subtotal + shippingCost - paymentDiscount;
  const maxInstallments = parseInt(getSetting("max_installments", "12"));

  const nextStep = () => {
    const i = stepIndex;
    if (i < steps.length - 1) setCurrentStep(steps[i + 1].key);
  };
  const prevStep = () => {
    const i = stepIndex;
    if (i > 0) setCurrentStep(steps[i - 1].key);
  };

  const canProceed = () => {
    switch (currentStep) {
      case "identification": return form.name && form.email && form.phone;
      case "address": return form.street && form.number && form.neighborhood && form.city && form.state && form.zip_code;
      case "shipping": return true;
      case "payment": return true;
      default: return false;
    }
  };

  const placeOrder = async () => {
    if (!user) { toast({ title: "Faça login para finalizar", variant: "destructive" }); return; }
    setPlacing(true);

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      order_number: orderNumber,
      status: "pending",
      subtotal,
      shipping_cost: shippingCost,
      discount: paymentDiscount,
      total,
      payment_method: form.payment_method,
      payment_status: "pending",
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      shipping_address: {
        street: form.street, number: form.number, complement: form.complement,
        neighborhood: form.neighborhood, city: form.city, state: form.state, zip_code: form.zip_code,
      },
    }).select("id").single();

    if (error || !order) {
      toast({ title: "Erro ao criar pedido", description: error?.message, variant: "destructive" });
      setPlacing(false);
      return;
    }

    // Insert order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product?.name || "",
      variant_name: item.variant?.name || null,
      quantity: item.quantity,
      unit_price: Number(item.variant?.price ?? item.product?.price ?? 0),
      total_price: Number(item.variant?.price ?? item.product?.price ?? 0) * item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);
    await clearCart();
    setPlacing(false);

    toast({ title: `Pedido ${orderNumber} criado com sucesso! 🎉` });
    navigate(`/conta/pedidos`);
  };

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Carrinho vazio</h1>
        <p className="text-muted-foreground font-sans mb-8">Adicione produtos antes de finalizar</p>
        <Button onClick={() => navigate("/")} className="rounded-xl font-sans">Voltar à loja</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12 max-w-4xl">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center gap-2">
            <button
              onClick={() => i < stepIndex && setCurrentStep(step.key)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-sans font-bold transition-all ${
                i < stepIndex ? "bg-success text-success-foreground" :
                i === stepIndex ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}
            >
              {i < stepIndex ? <Check className="w-4 h-4" /> : i + 1}
            </button>
            <span className={`font-sans text-xs hidden sm:block ${i === stepIndex ? "font-semibold" : "text-muted-foreground"}`}>
              {step.label}
            </span>
            {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < stepIndex ? "bg-success" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <Card className="border-0 shadow-premium">
                <CardHeader>
                  <CardTitle className="font-display text-xl">{steps[stepIndex].label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentStep === "identification" && (
                    <>
                      <div className="grid gap-2"><Label className="font-sans text-sm">Nome completo *</Label><Input value={form.name} onChange={e => upd("name", e.target.value)} className="h-11 rounded-xl" placeholder="Seu nome" /></div>
                      <div className="grid gap-2"><Label className="font-sans text-sm">Email *</Label><Input type="email" value={form.email} onChange={e => upd("email", e.target.value)} className="h-11 rounded-xl" placeholder="seu@email.com" /></div>
                      <div className="grid gap-2"><Label className="font-sans text-sm">Telefone *</Label><Input value={form.phone} onChange={e => upd("phone", e.target.value)} className="h-11 rounded-xl" placeholder="(11) 99999-9999" /></div>
                    </>
                  )}
                  {currentStep === "address" && (
                    <>
                      <div className="grid gap-2"><Label className="font-sans text-sm">CEP *</Label><Input value={form.zip_code} onChange={e => upd("zip_code", e.target.value)} className="h-11 rounded-xl" placeholder="00000-000" /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 grid gap-2"><Label className="font-sans text-sm">Rua *</Label><Input value={form.street} onChange={e => upd("street", e.target.value)} className="h-11 rounded-xl" /></div>
                        <div className="grid gap-2"><Label className="font-sans text-sm">Nº *</Label><Input value={form.number} onChange={e => upd("number", e.target.value)} className="h-11 rounded-xl" /></div>
                      </div>
                      <div className="grid gap-2"><Label className="font-sans text-sm">Complemento</Label><Input value={form.complement} onChange={e => upd("complement", e.target.value)} className="h-11 rounded-xl" /></div>
                      <div className="grid gap-2"><Label className="font-sans text-sm">Bairro *</Label><Input value={form.neighborhood} onChange={e => upd("neighborhood", e.target.value)} className="h-11 rounded-xl" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2"><Label className="font-sans text-sm">Cidade *</Label><Input value={form.city} onChange={e => upd("city", e.target.value)} className="h-11 rounded-xl" /></div>
                        <div className="grid gap-2"><Label className="font-sans text-sm">Estado *</Label><Input value={form.state} onChange={e => upd("state", e.target.value)} className="h-11 rounded-xl" maxLength={2} placeholder="SP" /></div>
                      </div>
                    </>
                  )}
                  {currentStep === "shipping" && (
                    <RadioGroup value={form.shipping_option} onValueChange={v => upd("shipping_option", v)} className="space-y-3">
                      <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.shipping_option === "standard" ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"}`}>
                        <RadioGroupItem value="standard" />
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold">Padrão</p>
                          <p className="font-sans text-xs text-muted-foreground">Entrega em até {getSetting("shipping_default_days", "7")} dias úteis</p>
                        </div>
                        <span className="font-sans text-sm font-bold">
                          {subtotal >= parseFloat(getSetting("free_shipping_min_value", "199")) ? "Grátis" : "R$ 19,90"}
                        </span>
                      </label>
                      <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.shipping_option === "express" ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"}`}>
                        <RadioGroupItem value="express" />
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold">Expresso</p>
                          <p className="font-sans text-xs text-muted-foreground">Entrega em até 3 dias úteis</p>
                        </div>
                        <span className="font-sans text-sm font-bold">R$ 29,90</span>
                      </label>
                    </RadioGroup>
                  )}
                  {currentStep === "payment" && (
                    <RadioGroup value={form.payment_method} onValueChange={v => upd("payment_method", v)} className="space-y-3">
                      {isEnabled("pix_enabled") && (
                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === "pix" ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"}`}>
                          <RadioGroupItem value="pix" />
                          <QrCode className="w-5 h-5 text-success" />
                          <div className="flex-1">
                            <p className="font-sans text-sm font-semibold">Pix</p>
                            <p className="font-sans text-xs text-success font-medium">{pixDiscount}% de desconto</p>
                          </div>
                        </label>
                      )}
                      {isEnabled("installments_enabled") && (
                        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === "card" ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"}`}>
                          <RadioGroupItem value="card" />
                          <CreditCard className="w-5 h-5 text-accent" />
                          <div className="flex-1">
                            <p className="font-sans text-sm font-semibold">Cartão de Crédito</p>
                            <p className="font-sans text-xs text-muted-foreground">Em até {maxInstallments}x sem juros</p>
                          </div>
                        </label>
                      )}
                      <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === "boleto" ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground/30"}`}>
                        <RadioGroupItem value="boleto" />
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-sans text-sm font-semibold">Boleto Bancário</p>
                          <p className="font-sans text-xs text-muted-foreground">Vencimento em 3 dias úteis</p>
                        </div>
                      </label>
                    </RadioGroup>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <Button variant="ghost" onClick={prevStep} disabled={stepIndex === 0} className="font-sans rounded-xl">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
                {currentStep === "payment" ? (
                  <Button onClick={placeOrder} disabled={placing} className="h-12 rounded-xl shine font-sans font-bold bg-success hover:bg-success/90 text-success-foreground px-8">
                    {placing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</> : <>Confirmar Pedido <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                ) : (
                  <Button onClick={nextStep} disabled={!canProceed()} className="h-11 rounded-xl shine font-sans font-semibold px-8">
                    Continuar <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-premium sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display text-lg font-bold">Resumo</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0">
                      <img src={item.product?.product_images?.[0]?.url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs font-medium truncate">{item.product?.name}</p>
                      <p className="font-sans text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-sans text-xs font-bold shrink-0">
                      R$ {(Number(item.variant?.price ?? item.product?.price ?? 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 font-sans text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{shippingCost === 0 ? "Grátis" : `R$ ${shippingCost.toFixed(2)}`}</span></div>
                {paymentDiscount > 0 && <div className="flex justify-between text-success"><span>Desconto Pix</span><span>-R$ {paymentDiscount.toFixed(2)}</span></div>}
              </div>
              <Separator />
              <div className="flex justify-between font-sans"><span className="font-semibold">Total</span><span className="text-xl font-bold">R$ {total.toFixed(2)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
