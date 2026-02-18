import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Loader2, Truck, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_featured: boolean;
  is_new: boolean;
  sold_count: number;
  product_images: { url: string; is_primary: boolean }[];
}

interface FeaturedProductsProps {
  config: { limit?: number };
  title?: string;
}

export function FeaturedProducts({ config, title = "Produtos em Destaque" }: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, loading: cartLoading } = useCart();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, stock, is_featured, is_new, sold_count, product_images(url, is_primary)")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(config.limit || 8);
      setProducts((data as Product[]) || []);
      setLoading(false);
    };
    fetch();
  }, [config.limit]);

  const getImage = (p: Product) => {
    const primary = p.product_images?.find(i => i.is_primary);
    return primary?.url || p.product_images?.[0]?.url || "/placeholder.svg";
  };

  const getDiscount = (p: Product) => {
    if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
    return Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100);
  };

  const getInstallment = (price: number) => {
    const installments = 12;
    const value = price / installments;
    return `em até ${installments}x de R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product.id);
    toast({ title: "Adicionado ao carrinho! 🛒" });
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent font-sans text-xs font-bold uppercase tracking-wider mb-3">
            Destaques
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold">{title}</h2>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-[18px]" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-muted-foreground font-sans">Nenhum produto encontrado.</p>
            <p className="text-sm text-muted-foreground/60 font-sans">Adicione produtos no painel admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7">
            {products.map((product, i) => {
              const disc = getDiscount(product);
              const isBestseller = product.sold_count >= 10;
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                >
                  <Link to={`/produto/${product.slug}`} className="group block h-full">
                    <div className="relative flex flex-col h-full bg-card rounded-[18px] border border-border/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                      {/* Image */}
                      <div className="relative aspect-square bg-muted/30">
                        <div className="absolute inset-0 overflow-hidden">
                          <img
                            src={getImage(product)}
                            alt={product.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
                            loading="lazy"
                          />
                        </div>

                        {/* Discount badge — only on image */}
                        {disc > 0 && (
                          <span className="absolute top-3 left-3 z-10 inline-flex items-center px-2 py-[3px] rounded-md bg-foreground text-background text-[10px] font-bold tracking-wide uppercase shadow-sm">
                            {disc}% OFF
                          </span>
                        )}

                        {/* New badge — top right */}
                        {product.is_new && (
                          <span className="absolute top-3 right-3 z-10 inline-flex items-center px-2 py-[3px] rounded-md bg-accent text-accent-foreground text-[10px] font-bold tracking-wide uppercase shadow-sm">
                            Novo
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col flex-1 p-4 md:p-5 gap-1.5">
                        {/* Brand */}
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-sans">
                          Loja Oficial
                        </span>

                        {/* Name + inline bestseller */}
                        <div className="flex items-start gap-2">
                          <p className="font-sans text-sm md:text-base font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors flex-1 min-h-[2.5em]">
                            {product.name}
                          </p>
                        </div>

                        {/* Bestseller tag — inline under name */}
                        {isBestseller && (
                          <span className="inline-flex items-center gap-1 self-start px-2 py-[2px] rounded bg-success/10 text-success text-[10px] font-semibold">
                            <TrendingUp className="w-3 h-3" />
                            Top vendas
                          </span>
                        )}

                        {/* Prices */}
                        <div className="mt-auto pt-2 space-y-0.5">
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <p className="font-sans text-xs text-muted-foreground line-through">
                              de R$ {product.compare_at_price.toFixed(2).replace(".", ",")}
                            </p>
                          )}
                          <p className="font-display text-xl md:text-2xl font-bold text-foreground">
                            R$ {product.price.toFixed(2).replace(".", ",")}
                          </p>
                          <p className="font-sans text-[11px] text-muted-foreground">
                            {getInstallment(product.price)}
                          </p>
                        </div>

                        {/* Free shipping */}
                        <span className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-medium mt-1">
                          <Truck className="w-3 h-3" />
                          Frete grátis
                        </span>

                        {/* CTA Button */}
                        <button
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={cartLoading || product.stock <= 0}
                          className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-sans text-sm font-bold py-3 px-4 transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cartLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : product.stock <= 0 ? (
                            "Esgotado"
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              Comprar agora
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
