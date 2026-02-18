import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function CartPage() {
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl } = useCartStore();
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const subtotal = useCartStore(s => s.items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0));

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) window.open(checkoutUrl, '_blank');
  };

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

  const currencyCode = items[0]?.price.currencyCode || 'BRL';

  return (
    <div className="container py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold mb-8">Carrinho ({itemCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = parseFloat(item.price.amount);
            const imageUrl = item.product?.node?.images?.edges?.[0]?.node?.url || "/placeholder.svg";
            return (
              <motion.div key={item.variantId} layout>
                <Card className="border-0 shadow-premium">
                  <CardContent className="p-4 flex gap-4">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img src={imageUrl} alt={item.product?.node?.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/produto/${item.product?.node?.handle}`} className="font-sans text-sm font-medium hover:text-accent transition-colors line-clamp-2">
                        {item.product?.node?.title}
                      </Link>
                      {item.variantTitle && item.variantTitle !== "Default Title" && (
                        <p className="text-xs text-muted-foreground font-sans mt-0.5">{item.variantTitle}</p>
                      )}
                      <p className="font-sans text-xs text-muted-foreground mt-1">{currencyCode} {price.toFixed(2)} un.</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center border rounded-xl overflow-hidden">
                          <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors" disabled={isLoading}>
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-sans text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors" disabled={isLoading}>
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-sans font-bold">{currencyCode} {(price * item.quantity).toFixed(2)}</span>
                          <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-destructive transition-colors" disabled={isLoading}>
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

        <div>
          <Card className="border-0 shadow-premium sticky top-24">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-display text-lg font-bold">Resumo do pedido</h3>

              <Separator />

              <div className="space-y-2 font-sans text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{currencyCode} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-muted-foreground">Calculado no checkout</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-sans">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{currencyCode} {subtotal.toFixed(2)}</span>
              </div>

              <Button onClick={handleCheckout} disabled={isLoading || isSyncing} className="w-full h-12 rounded-xl shine font-sans font-bold bg-success hover:bg-success/90 text-success-foreground">
                {isLoading || isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4 mr-2" /> Finalizar no Shopify</>}
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
