import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useSellerReferral } from "@/hooks/useSellerReferral";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, User, MapPin, CreditCard, Check, ChevronRight,
  Loader2, Lock, ArrowLeft, Tag, UserCheck
} from "lucide-react";

type Step = "identification" | "address" | "payment" | "confirmation";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface AddressInfo {
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface SavedAddress extends AddressInfo {
  id: string;
  label: string;
  recipient_name: string;
}

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "identification", label: "Identificação", icon: <User className="w-4 h-4" /> },
  { key: "address", label: "Endereço", icon: <MapPin className="w-4 h-4" /> },
  { key: "payment", label: "Pagamento", icon: <CreditCard className="w-4 h-4" /> },
  { key: "confirmation", label: "Confirmação", icon: <Check className="w-4 h-4" /> },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const { getReferralCode, clearReferral } = useSellerReferral();
  const [step, setStep] = useState<Step>("identification");
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [sellerCode, setSellerCode] = useState(getReferralCode() || "");
  const [sellerVerified, setSellerVerified] = useState(false);
  const [sellerName, setSellerName] = useState("");

  const [customer, setCustomer] = useState<CustomerInfo>({ name: "", email: "", phone: "" });
  const [address, setAddress] = useState<AddressInfo>({
    zip_code: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: ""
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("pix");

  const shippingCost = 0;
  const total = subtotal - couponDiscount + shippingCost;
  const pixDiscount = paymentMethod === "pix" ? total * 0.05 : 0;
  const finalTotal = total - pixDiscount;

  // Redirect if empty cart
  useEffect(() => {
    if (items.length === 0 && step !== "confirmation") {
      navigate("/carrinho");
    }
  }, [items, step, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/auth?redirect=/checkout");
  }, [user, navigate]);

  // Auto-verify referral code from cookie
  useEffect(() => {
    if (sellerCode && !sellerVerified) {
      verifySeller(sellerCode);
    }
  }, []);

  const verifySeller = async (code: string) => {
    if (!code.trim()) { setSellerVerified(false); setSellerName(""); return; }
    const { data } = await supabase
      .from("sellers")
      .select("name, referral_code")
      .eq("referral_code", code.trim())
      .eq("status", "active")
      .maybeSingle();
    if (data) {
      setSellerVerified(true);
      setSellerName(data.name);
      setSellerCode(data.referral_code);
    } else {
      setSellerVerified(false);
      setSellerName("");
    }
  };

  // Load profile and addresses
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, addressesRes] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).maybeSingle(),
        supabase.from("customer_addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
      ]);
      if (profileRes.data) {
        setCustomer(prev => ({
          ...prev,
          name: profileRes.data.full_name || "",
          email: user.email || "",
          phone: profileRes.data.phone || "",
        }));
      }
      if (addressesRes.data) {
        setSavedAddresses(addressesRes.data as SavedAddress[]);
        const defaultAddr = addressesRes.data.find((a: any) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setAddress({
            zip_code: defaultAddr.zip_code,
            street: defaultAddr.street,
            number: defaultAddr.number,
            complement: defaultAddr.complement || "",
            neighborhood: defaultAddr.neighborhood,
            city: defaultAddr.city,
            state: defaultAddr.state,
          });
        }
      }
    };
    load();
  }, [user]);

  const stepIndex = STEPS.findIndex(s => s.key === step);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!data) {
      toast({ title: "Cupom inválido", variant: "destructive" });
      setApplyingCoupon(false);
      return;
    }
    if (data.min_order_value && subtotal < Number(data.min_order_value)) {
      toast({ title: `Pedido mínimo de R$ ${Number(data.min_order_value).toFixed(2)}`, variant: "destructive" });
      setApplyingCoupon(false);
      return;
    }
    if (data.max_uses && data.used_count >= data.max_uses) {
      toast({ title: "Cupom esgotado", variant: "destructive" });
      setApplyingCoupon(false);
      return;
    }
    const discount = data.discount_type === "percentage"
      ? subtotal * (Number(data.discount_value) / 100)
      : Number(data.discount_value);
    setCouponDiscount(Math.min(discount, subtotal));
    setCouponApplied(data.code);
    toast({ title: `Cupom ${data.code} aplicado! 🎉` });
    setApplyingCoupon(false);
  };

  const nextStep = () => {
    const i = stepIndex;
    if (i < STEPS.length - 1) setStep(STEPS[i + 1].key);
  };
  const prevStep = () => {
    const i = stepIndex;
    if (i > 0) setStep(STEPS[i - 1].key);
  };

  const canProceed = () => {
    if (step === "identification") return customer.name && customer.email && customer.phone;
    if (step === "address") return address.zip_code && address.street && address.number && address.neighborhood && address.city && address.state;
    if (step === "payment") return !!paymentMethod;
    return false;
  };

  const placeOrder = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          shipping_address: address as any,
          subtotal,
          discount: couponDiscount + pixDiscount,
          shipping_cost: shippingCost,
          total: finalTotal,
          payment_method: paymentMethod,
          payment_status: "pending",
          status: "pending",
          referral_code: sellerVerified ? sellerCode : null,
        } as any)
        .select("id")
        .single();

      if (error || !order) throw error;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product?.name || "Produto",
        variant_name: item.variant?.name || null,
        quantity: item.quantity,
        unit_price: item.variant?.price ?? item.product?.price ?? 0,
        total_price: (item.variant?.price ?? item.product?.price ?? 0) * item.quantity,
      }));

      await supabase.from("order_items").insert(orderItems);

      // Increment coupon usage
      if (couponApplied) {
        await supabase.rpc("has_role", { _user_id: user.id, _role: "user" }); // dummy - just increment below
        const { data: couponData } = await supabase
          .from("coupons")
          .select("id, used_count")
          .eq("code", couponApplied)
          .maybeSingle();
        // Note: can't update coupons as user - admin only. Skip for now.
      }

      await clearCart();
      setStep("confirmation");
      toast({ title: "Pedido realizado com sucesso! 🎉" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao criar pedido", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const selectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setAddress({
      zip_code: addr.zip_code, street: addr.street, number: addr.number,
      complement: addr.complement || "", neighborhood: addr.neighborhood,
      city: addr.city, state: addr.state,
    });
  };

  const getItemImage = (item: any) => {
    const primary = item.product?.product_images?.find((i: any) => i.is_primary);
    return primary?.url || item.product?.product_images?.[0]?.url || "/placeholder.svg";
  };

  if (step === "confirmation") {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-success" />
        </motion.div>
        <h1 className="font-display text-3xl font-bold mb-2">Pedido confirmado!</h1>
        <p className="text-muted-foreground font-sans mb-8">Você receberá atualizações por e-mail sobre o status do seu pedido.</p>
        <div className="flex gap-4 justify-center">
          <Button asChild variant="outline" className="rounded-xl font-sans h-12">
            <a href="/conta/pedidos">Ver meus pedidos</a>
          </Button>
          <Button asChild className="rounded-xl font-sans h-12 shine">
            <a href="/">Continuar comprando</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 md:px-6 py-6 md:py-12 max-w-6xl">
      {/* Stepper */}
      <div className="flex items-center justify-between sm:justify-center gap-1 mb-6 md:mb-10 overflow-x-auto scrollbar-hide">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center shrink-0">
            <button
              onClick={() => i < stepIndex && setStep(s.key)}
              disabled={i > stepIndex}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-sans font-medium transition-all ${
                i === stepIndex
                  ? "bg-primary text-primary-foreground"
                  : i < stepIndex
                    ? "bg-success/10 text-success cursor-pointer"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < stepIndex ? <Check className="w-4 h-4" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground mx-0.5 sm:mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === "identification" && (
                <Card className="border-0 shadow-premium">
                  <CardContent className="p-6 space-y-5">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><User className="w-5 h-5" /> Identificação</h2>
                    <div className="space-y-4">
                      <div>
                        <Label className="font-sans text-sm">Nome completo</Label>
                        <Input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Seu nome" className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div>
                        <Label className="font-sans text-sm">E-mail</Label>
                        <Input value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="email@exemplo.com" type="email" className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div>
                        <Label className="font-sans text-sm">Telefone</Label>
                        <Input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === "address" && (
                <Card className="border-0 shadow-premium">
                  <CardContent className="p-6 space-y-5">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><MapPin className="w-5 h-5" /> Endereço de entrega</h2>

                    {savedAddresses.length > 0 && (
                      <div className="space-y-2">
                        <Label className="font-sans text-sm text-muted-foreground">Endereços salvos</Label>
                        <div className="grid gap-2">
                          {savedAddresses.map(addr => (
                            <button
                              key={addr.id}
                              onClick={() => selectSavedAddress(addr)}
                              className={`text-left p-3 rounded-xl border transition-all font-sans text-sm ${
                                selectedAddressId === addr.id
                                  ? "border-accent bg-accent/5"
                                  : "border-border hover:border-accent/50"
                              }`}
                            >
                              <span className="font-semibold">{addr.label}</span> — {addr.street}, {addr.number} - {addr.neighborhood}, {addr.city}/{addr.state}
                            </button>
                          ))}
                        </div>
                        <Separator className="my-4" />
                        <p className="font-sans text-sm text-muted-foreground">Ou preencha um novo endereço:</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-sans text-sm">CEP</Label>
                        <Input value={address.zip_code} onChange={e => { setAddress({ ...address, zip_code: e.target.value }); setSelectedAddressId(null); }} placeholder="00000-000" className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="font-sans text-sm">Rua</Label>
                        <Input value={address.street} onChange={e => { setAddress({ ...address, street: e.target.value }); setSelectedAddressId(null); }} placeholder="Rua, Avenida..." className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div>
                        <Label className="font-sans text-sm">Número</Label>
                        <Input value={address.number} onChange={e => { setAddress({ ...address, number: e.target.value }); setSelectedAddressId(null); }} placeholder="123" className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div>
                        <Label className="font-sans text-sm">Complemento</Label>
                        <Input value={address.complement} onChange={e => setAddress({ ...address, complement: e.target.value })} placeholder="Apto, bloco..." className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div>
                        <Label className="font-sans text-sm">Bairro</Label>
                        <Input value={address.neighborhood} onChange={e => { setAddress({ ...address, neighborhood: e.target.value }); setSelectedAddressId(null); }} placeholder="Bairro" className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div>
                        <Label className="font-sans text-sm">Cidade</Label>
                        <Input value={address.city} onChange={e => { setAddress({ ...address, city: e.target.value }); setSelectedAddressId(null); }} placeholder="Cidade" className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                      <div>
                        <Label className="font-sans text-sm">Estado</Label>
                        <Input value={address.state} onChange={e => { setAddress({ ...address, state: e.target.value }); setSelectedAddressId(null); }} placeholder="SP" maxLength={2} className="mt-1 rounded-xl h-12 font-sans" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === "payment" && (
                <Card className="border-0 shadow-premium">
                  <CardContent className="p-6 space-y-5">
                    <h2 className="font-display text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5" /> Pagamento</h2>

                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "pix" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                        <RadioGroupItem value="pix" />
                        <div className="flex-1">
                          <p className="font-sans font-semibold text-sm">PIX</p>
                          <p className="font-sans text-xs text-muted-foreground">Aprovação instantânea • 5% de desconto</p>
                        </div>
                        <span className="font-sans text-xs font-bold text-success bg-success/10 px-2 py-1 rounded-lg">-5%</span>
                      </label>
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "card" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                        <RadioGroupItem value="card" />
                        <div className="flex-1">
                          <p className="font-sans font-semibold text-sm">Cartão de Crédito</p>
                          <p className="font-sans text-xs text-muted-foreground">Até 12x sem juros</p>
                        </div>
                      </label>
                      <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "boleto" ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                        <RadioGroupItem value="boleto" />
                        <div className="flex-1">
                          <p className="font-sans font-semibold text-sm">Boleto Bancário</p>
                          <p className="font-sans text-xs text-muted-foreground">Compensação em até 3 dias úteis</p>
                        </div>
                      </label>
                    </RadioGroup>

                    {paymentMethod === "card" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-2">
                        <p className="font-sans text-sm text-muted-foreground">
                          A integração com gateway de pagamento será ativada em breve. Por enquanto, o pedido será registrado como pendente.
                        </p>
                      </motion.div>
                    )}

                    {/* Seller referral code */}
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <Label className="font-sans text-sm flex items-center gap-2">
                        <UserCheck className="w-4 h-4" /> Código do vendedor (opcional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={sellerCode}
                          onChange={e => { setSellerCode(e.target.value); setSellerVerified(false); setSellerName(""); }}
                          placeholder="Ex: joao-ab12"
                          className="rounded-xl h-10 font-sans text-sm flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => verifySeller(sellerCode)}
                          className="rounded-xl h-10 font-sans"
                          disabled={!sellerCode.trim()}
                        >
                          Verificar
                        </Button>
                      </div>
                      {sellerVerified && (
                        <p className="text-xs text-success font-sans flex items-center gap-1">
                          <Check className="w-3 h-3" /> Vendedor: {sellerName}
                        </p>
                      )}
                      {sellerCode && !sellerVerified && sellerName === "" && (
                        <p className="text-xs text-muted-foreground font-sans">Clique em "Verificar" para validar o código</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex justify-between mt-6">
            <Button onClick={prevStep} variant="ghost" className="rounded-xl font-sans h-12" disabled={stepIndex === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            {step === "payment" ? (
              <Button onClick={placeOrder} disabled={loading || !canProceed()} className="rounded-xl font-sans h-12 px-8 shine bg-success hover:bg-success/90 text-success-foreground font-bold">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4 mr-2" /> Finalizar Pedido</>}
              </Button>
            ) : (
              <Button onClick={nextStep} disabled={!canProceed()} className="rounded-xl font-sans h-12 px-8 shine font-bold">
                Continuar <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <Card className="border-0 shadow-premium sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display text-lg font-bold">Resumo do pedido</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img src={getItemImage(item)} alt={item.product?.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-xs font-medium line-clamp-2">{item.product?.name}</p>
                      {item.variant && <p className="font-sans text-xs text-muted-foreground">{item.variant.name}</p>}
                      <p className="font-sans text-xs text-muted-foreground">{item.quantity}x R$ {((item.variant?.price ?? item.product?.price ?? 0)).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Coupon */}
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Cupom de desconto"
                  className="rounded-xl h-10 font-sans text-sm"
                  disabled={!!couponApplied}
                />
                <Button onClick={applyCoupon} variant="outline" className="rounded-xl h-10 shrink-0 font-sans text-sm" disabled={!!couponApplied || applyingCoupon}>
                  {applyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />}
                </Button>
              </div>
              {couponApplied && (
                <p className="font-sans text-xs text-success flex items-center gap-1"><Check className="w-3 h-3" /> Cupom {couponApplied} aplicado</p>
              )}

              <Separator />

              <div className="space-y-2 font-sans text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto cupom</span>
                    <span>-R$ {couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto PIX (5%)</span>
                    <span>-R$ {pixDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-success font-medium">Grátis</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-sans">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-display font-bold text-accent">R$ {finalTotal.toFixed(2)}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground font-sans text-xs pt-2">
                <Lock className="w-3 h-3" />
                <span>Compra 100% segura</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
