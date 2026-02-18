import { useCartStore } from "@/stores/cartStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart, Zap, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();
  const itemCount = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const subtotal = useCartStore(s => s.items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0));

  useEffect(() => { if (isOpen) syncCart(); }, [isOpen, syncCart]);

  const handleCheckout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-primary border-l border-primary-foreground/10">
        <SheetHeader className="p-5 pb-4 border-b border-primary-foreground/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-lg text-primary-foreground uppercase">
              Carrinho {itemCount > 0 && <span className="text-accent font-sans text-sm font-bold ml-1">({itemCount})</span>}
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-primary-foreground/40">
            <ShoppingCart className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-display text-lg uppercase mb-1 text-primary-foreground/60">Carrinho vazio</p>
            <p className="font-sans text-sm">Adicione produtos para continuar</p>
            <Button onClick={() => setIsOpen(false)} className="mt-6 rounded-xl font-sans bg-accent text-accent-foreground hover:bg-accent/90 shine">
              Explorar produtos
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const imageUrl = item.product?.node?.images?.edges?.[0]?.node?.url || "/placeholder.svg";
                  const price = parseFloat(item.price.amount);
                  return (
                    <motion.div
                      key={item.variantId}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 p-3 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-primary-foreground/10 shrink-0">
                        <img src={imageUrl} alt={item.product?.node?.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-medium text-primary-foreground line-clamp-2">
                          {item.product?.node?.title}
                        </p>
                        {item.variantTitle && item.variantTitle !== "Default Title" && (
                          <p className="text-xs text-primary-foreground/40 font-sans mt-0.5">{item.variantTitle}</p>
                        )}
                        <p className="font-display text-base font-bold text-accent mt-1">
                          {item.price.currencyCode} {(price * item.quantity).toFixed(2)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-primary-foreground/20 rounded-lg overflow-hidden">
                            <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-primary-foreground/10 text-primary-foreground/60 transition-colors" disabled={isLoading}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-sans text-xs font-semibold text-primary-foreground">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-primary-foreground/10 text-primary-foreground/60 transition-colors" disabled={isLoading}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.variantId)} className="text-primary-foreground/30 hover:text-destructive transition-colors" disabled={isLoading}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="p-5 border-t border-primary-foreground/10 space-y-4">
              <div className="flex items-center justify-between font-sans">
                <span className="text-sm text-primary-foreground/50">Subtotal</span>
                <span className="text-xl font-display font-bold text-accent">
                  {items[0]?.price.currencyCode || 'BRL'} {subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-primary-foreground/30 font-sans">Frete calculado no checkout</p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCheckout}
                  disabled={isLoading || isSyncing}
                  className="h-13 rounded-xl shine font-sans font-bold bg-accent text-accent-foreground hover:bg-accent/90 uppercase tracking-wider glow-orange"
                >
                  {isLoading || isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><ExternalLink className="w-4 h-4 mr-2" /> Finalizar no Shopify</>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="h-11 rounded-xl font-sans border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Continuar comprando
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
