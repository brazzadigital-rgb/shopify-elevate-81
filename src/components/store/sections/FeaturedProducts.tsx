import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  is_featured: boolean;
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
        .select("id, name, slug, price, compare_at_price, stock, is_featured, product_images(url, is_primary)")
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => {
              const disc = getDiscount(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/produto/${product.slug}`} className="group block">
                    <div className="rounded-2xl overflow-hidden bg-card border border-border/50 hover-energy">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        <img
                          src={getImage(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {disc > 0 && (
                            <Badge className="bg-destructive text-destructive-foreground font-sans text-[10px] px-2.5 py-1 rounded-lg font-bold">
                              -{disc}%
                            </Badge>
                          )}
                        </div>

                        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={cartLoading || product.stock <= 0}
                            className="w-9 h-9 rounded-xl bg-primary/80 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors"
                          >
                            {cartLoading ? <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" /> : <ShoppingCart className="w-4 h-4 text-primary-foreground" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 md:p-4">
                        <p className="font-sans text-sm font-medium truncate group-hover:text-accent transition-colors">
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-display text-lg font-bold">
                            R$ {product.price.toFixed(2)}
                          </span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="font-sans text-xs text-muted-foreground line-through">
                              R$ {product.compare_at_price.toFixed(2)}
                            </span>
                          )}
                        </div>
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
