import { useCart, CartItem } from "@/hooks/useCart";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, itemCount, subtotal, updateQuantity, removeItem } = useCart();

  const getImage = (item: CartItem) => {
    const imgs = item.product?.product_images || [];
    const primary = imgs.find((i) => i.is_primary);
    return primary?.url || imgs[0]?.url || "/placeholder.svg";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-5 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-lg">
              Carrinho {itemCount > 0 && <span className="text-muted-foreground font-sans text-sm font-normal ml-1">({itemCount})</span>}
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-display text-lg mb-1">Carrinho vazio</p>
            <p className="font-sans text-sm">Adicione produtos para continuar</p>
            <Button onClick={() => setIsOpen(false)} className="mt-6 rounded-xl font-sans" asChild>
              <Link to="/">Explorar produtos</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const price = item.variant?.price ?? item.product?.price ?? 0;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                        <img src={getImage(item)} alt={item.product?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/produto/${item.product?.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="font-sans text-sm font-medium hover:text-accent transition-colors line-clamp-2"
                        >
                          {item.product?.name}
                        </Link>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">{item.variant.name}</p>
                        )}
                        <p className="font-sans text-sm font-bold mt-1">R$ {(Number(price) * item.quantity).toFixed(2)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded-lg overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-sans text-xs font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="p-5 border-t bg-muted/30 space-y-4">
              <div className="flex items-center justify-between font-sans">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold">R$ {subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground font-sans">Frete calculado no checkout</p>
              <div className="flex flex-col gap-2">
                <Button asChild className="h-12 rounded-xl shine font-sans font-bold bg-success hover:bg-success/90 text-success-foreground">
                  <Link to="/checkout" onClick={() => setIsOpen(false)}>
                    Finalizar compra <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-xl font-sans">
                  <Link to="/carrinho" onClick={() => setIsOpen(false)}>
                    Ver carrinho completo
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
