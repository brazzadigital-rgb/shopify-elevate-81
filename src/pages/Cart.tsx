import { useCart, CartItem } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const getImage = (item: CartItem) => {
    const imgs = item.product?.product_images || [];
    const primary = imgs.find((i) => i.is_primary);
    return primary?.url || imgs[0]?.url || "/placeholder.svg";
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (!data) {
      toast({ title: "Cupom inválido", variant: "destructive" });
      return;
    }

    const d = data as any;
    if (d.min_order_value && subtotal < Number(d.min_order_value)) {
      toast({ title: `Valor mínimo: R$ ${Number(d.min_order_value).toFixed(2)}`, variant: "destructive" });
      return;
    }

    const discountValue = d.discount_type === "percentage"
      ? subtotal * (Number(d.discount_value) / 100)
      : Number(d.discount_value);

    setDiscount(discountValue);
    setAppliedCoupon(d.code);
    toast({ title: `Cupom ${d.code} aplicado! 🎉` });
  };

  const total = Math.max(0, subtotal - discount);

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
        <h1 className="font-display text-3xl font-bold mb-2">Carrinho vazio</h1>
        <p className="text-muted-foreground font-sans mb-8">Adicione produtos para continuar comprando</p>
        <Button asChild className="rounded-xl shine font-sans h-12 px-8">
          <Link to="/">Explorar produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold mb-8">Carrinho ({itemCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.variant?.price ?? item.product?.price ?? 0;
            return (
              <motion.div key={item.id} layout>
                <Card className="border-0 shadow-premium">
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img src={getImage(item)} alt={item.product?.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/produto/${item.product?.slug}`} className="font-sans text-sm font-medium hover:text-accent transition-colors line-clamp-2">
                        {item.product?.name}
                      </Link>
                      {item.variant && <p className="text-xs text-muted-foreground font-sans mt-0.5">{item.variant.name}</p>}
                      <p className="font-sans text-xs text-muted-foreground mt-1">R$ {Number(price).toFixed(2)} un.</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-xl overflow-hidden">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-sans text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-sans font-bold">R$ {(Number(price) * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div>
          <Card className="border-0 shadow-premium sticky top-24">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-display text-lg font-bold">Resumo do pedido</h3>

              {/* Coupon */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Cupom de desconto"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-10 rounded-xl font-sans uppercase"
                  />
                  <Button onClick={applyCoupon} variant="outline" className="rounded-xl h-10 font-sans px-4 shrink-0">
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {appliedCoupon && (
                  <p className="text-xs text-success font-sans font-medium">✅ Cupom {appliedCoupon} aplicado</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2 font-sans text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto</span>
                    <span>-R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-muted-foreground">Calculado no checkout</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-sans">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">R$ {total.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <p className="text-xs text-success font-sans font-medium text-center">
                  Você está economizando R$ {discount.toFixed(2)} 🎉
                </p>
              )}

              <Button asChild className="w-full h-12 rounded-xl shine font-sans font-bold bg-success hover:bg-success/90 text-success-foreground">
                <Link to="/checkout">
                  Finalizar compra <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full font-sans text-sm">
                <Link to="/">Continuar comprando</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
