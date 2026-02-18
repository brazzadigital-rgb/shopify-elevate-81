import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useCartStore } from "@/stores/cartStore";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ShopifyProduct } from "@/lib/shopify";

interface FeaturedProductsProps {
  config: { limit?: number };
  title?: string;
}

export function FeaturedProducts({ config, title = "Produtos em Destaque" }: FeaturedProductsProps) {
  const { products, loading } = useShopifyProducts(config.limit || 8);
  const { addItem, isLoading } = useCartStore();

  const getImage = (p: ShopifyProduct) => p.node.images?.edges?.[0]?.node?.url || "/placeholder.svg";

  const getDiscount = (p: ShopifyProduct) => {
    const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
    const compare = parseFloat(p.node.compareAtPriceRange?.maxVariantPrice?.amount || "0");
    if (!compare || compare <= price) return 0;
    return Math.round(((compare - price) / compare) * 100);
  };

  const handleAddToCart = async (e: React.MouseEvent, product: ShopifyProduct) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.node.variants.edges[0]?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
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
            <p className="text-sm text-muted-foreground/60 font-sans">Crie produtos no Shopify para exibi-los aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => {
              const price = parseFloat(product.node.priceRange.minVariantPrice.amount);
              const currency = product.node.priceRange.minVariantPrice.currencyCode;
              const comparePrice = parseFloat(product.node.compareAtPriceRange?.maxVariantPrice?.amount || "0");
              const disc = getDiscount(product);

              return (
                <motion.div
                  key={product.node.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/produto/${product.node.handle}`} className="group block">
                    <div className="rounded-2xl overflow-hidden bg-card border border-border/50 hover-energy">
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        <img
                          src={getImage(product)}
                          alt={product.node.title}
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
                            disabled={isLoading}
                            className="w-9 h-9 rounded-xl bg-primary/80 backdrop-blur-sm flex items-center justify-center hover:bg-accent transition-colors"
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" /> : <ShoppingCart className="w-4 h-4 text-primary-foreground" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 md:p-4">
                        <p className="font-sans text-sm font-medium truncate group-hover:text-accent transition-colors">
                          {product.node.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-display text-lg font-bold">
                            {currency} {price.toFixed(2)}
                          </span>
                          {comparePrice > price && (
                            <span className="font-sans text-xs text-muted-foreground line-through">
                              {currency} {comparePrice.toFixed(2)}
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
