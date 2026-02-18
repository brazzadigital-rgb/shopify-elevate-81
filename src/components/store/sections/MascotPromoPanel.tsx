import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import mascotPromo from "@/assets/mascot-promo.png";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  product_images: { url: string; is_primary: boolean }[];
}

export function MascotPromoPanel() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, product_images(url, is_primary)")
        .eq("is_active", true)
        .order("sold_count", { ascending: false })
        .limit(4);
      setProducts((data as any) || []);
    };
    fetchProducts();
  }, []);

  const getImage = (p: Product) => {
    const primary = p.product_images?.find((i) => i.is_primary);
    return primary?.url || p.product_images?.[0]?.url || "/placeholder.svg";
  };

  const discount = (p: Product) => {
    if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
    return Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100);
  };

  return (
    <section className="py-8 md:py-14">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr] gap-4 md:gap-5 overflow-hidden">
          {/* Left mascot panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden min-h-[320px] md:min-h-full"
            style={{
              backgroundImage: `url(${mascotPromo})`,
              backgroundSize: "cover",
              backgroundPosition: "center top",
            }}
          >
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/30" />

            <div className="relative z-10 p-6 md:p-8 flex flex-col justify-end h-full min-h-[320px] md:min-h-[420px]">
              <h3 className="font-display text-xl md:text-2xl lg:text-[1.65rem] font-bold leading-tight text-primary-foreground mb-3">
                Os produtos mais vendidos da sua coleção
              </h3>
              <p className="text-sm text-primary-foreground/50 font-sans mb-5 leading-relaxed">
                Veja mais produtos relacionados clicando no botão abaixo
              </p>
              <Link to="/colecoes">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full font-sans h-11 px-8 text-sm font-bold uppercase tracking-wider shine glow-orange transition-all duration-300 hover:glow-orange-lg">
                  Ver mais produtos
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right product cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={`/produto/${product.slug}`} className="group block h-full">
                  <div className="rounded-2xl overflow-hidden bg-card border border-border/50 h-full flex flex-col transition-all duration-300 hover:shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.2)] hover:border-accent/30">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      <img
                        src={getImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {discount(product) > 0 && (
                        <span className="absolute top-2.5 left-2.5 bg-destructive text-destructive-foreground text-[10px] font-bold font-sans px-2 py-1 rounded-lg">
                          -{discount(product)}%
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="font-sans text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">
                        Coleção Premium
                      </p>
                      <p className="font-sans text-sm font-medium truncate group-hover:text-accent transition-colors mb-auto">
                        {product.name}
                      </p>
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display text-base font-bold text-accent">
                            R$ {Number(product.price).toFixed(2)}
                          </span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="font-sans text-[11px] text-muted-foreground line-through">
                              R$ {Number(product.compare_at_price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                          em até 12x de R$ {(Number(product.price) / 12).toFixed(2)}
                        </p>
                        <span className="inline-block mt-1.5 bg-accent/15 text-accent text-[9px] font-bold font-sans uppercase tracking-wider px-2 py-0.5 rounded">
                          Frete Grátis
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
