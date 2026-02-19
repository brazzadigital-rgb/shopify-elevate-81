import { useCart } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingCart, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, setIsOpen, loading, itemCount, subtotal, updateQuantity, removeItem } = useCart();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout');
  };

  const getItemImage = (item: any) => {
    const primary = item.product?.product_images?.find((i: any) => i.is_primary);
    return primary?.url || item.product?.product_images?.[0]?.url || "/placeholder.svg";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-[90%] sm:max-w-md p-0 flex flex-col bg-primary border-l border-primary-foreground/10">
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
                  const imageUrl = getItemImage(item);
                  const price = item.variant?.price ?? item.product?.price ?? 0;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 p-3 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-primary-foreground/10 shrink-0">
                        <img src={imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-sm font-medium text-primary-foreground line-clamp-2">
                          {item.product?.name}
                        </p>
                        {item.variant && (
                          <p className="text-xs text-primary-foreground/40 font-sans mt-0.5">{item.variant.name}</p>
                        )}
                        <p className="font-display text-base font-bold text-accent mt-1">
                          R$ {(Number(price) * item.quantity).toFixed(2)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-primary-foreground/20 rounded-lg overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-primary-foreground/10 text-primary-foreground/60 transition-colors min-h-[unset] min-w-[unset]" disabled={loading}>
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-sans text-xs font-semibold text-primary-foreground">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-primary-foreground/10 text-primary-foreground/60 transition-colors min-h-[unset] min-w-[unset]" disabled={loading}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-primary-foreground/30 hover:text-destructive transition-colors min-h-[unset] min-w-[unset] p-2" disabled={loading}>
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
                  R$ {subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-primary-foreground/30 font-sans">Frete calculado no checkout</p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="h-13 rounded-xl shine font-sans font-bold bg-accent text-accent-foreground hover:bg-accent/90 uppercase tracking-wider glow-orange"
                >
                  <Lock className="w-4 h-4 mr-2" /> Finalizar Compra
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="h-11 rounded-xl font-sans border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
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
