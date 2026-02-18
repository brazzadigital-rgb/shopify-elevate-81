import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  is_new: boolean;
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

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, is_new, is_featured, product_images(url, is_primary)")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(config.limit || 8);
      setProducts((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [config.limit]);

  const getImage = (p: Product) => {
    const primary = p.product_images?.find((i) => i.is_primary);
    return primary?.url || p.product_images?.[0]?.url || "/placeholder.svg";
  };

  const discount = (p: Product) => {
    if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
    return Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100);
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
          <p className="text-center text-muted-foreground font-sans py-12">Nenhum produto em destaque ainda.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => (
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
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.is_new && (
                          <Badge className="bg-accent text-accent-foreground font-sans text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
                            Novo
                          </Badge>
                        )}
                        {discount(product) > 0 && (
                          <Badge className="bg-destructive text-destructive-foreground font-sans text-[10px] px-2.5 py-1 rounded-lg font-bold">
                            -{discount(product)}%
                          </Badge>
                        )}
                      </div>

                      {/* Quick actions */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button className="w-9 h-9 rounded-xl bg-primary/80 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors">
                          <Heart className="w-4 h-4 text-primary-foreground" />
                        </button>
                        <button className="w-9 h-9 rounded-xl bg-primary/80 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors">
                          <ShoppingCart className="w-4 h-4 text-primary-foreground" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 md:p-4">
                      <p className="font-sans text-sm font-medium truncate group-hover:text-accent transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-display text-lg font-bold">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="font-sans text-xs text-muted-foreground line-through">
                            R$ {Number(product.compare_at_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
