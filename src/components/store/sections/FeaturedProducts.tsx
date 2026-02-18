import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart } from "lucide-react";

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
    <section className="py-14 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold">{title}</h2>
          <p className="text-muted-foreground font-sans text-sm mt-2">Selecionados especialmente para você</p>
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
                  <Card className="border-0 shadow-none hover:shadow-premium-lg transition-all duration-300 overflow-hidden rounded-2xl bg-transparent">
                    <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
                      <img
                        src={getImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.is_new && (
                          <Badge className="bg-accent text-accent-foreground font-sans text-[10px] px-2 py-0.5 rounded-lg">
                            Novo
                          </Badge>
                        )}
                        {discount(product) > 0 && (
                          <Badge className="bg-destructive text-destructive-foreground font-sans text-[10px] px-2 py-0.5 rounded-lg">
                            -{discount(product)}%
                          </Badge>
                        )}
                      </div>
                      {/* Wishlist */}
                      <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-background">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                    <CardContent className="px-1 pt-3 pb-0">
                      <p className="font-sans text-sm font-medium truncate group-hover:text-accent transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-sans text-base font-bold">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="font-sans text-xs text-muted-foreground line-through">
                            R$ {Number(product.compare_at_price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
