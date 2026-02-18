import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Loader2,
  Truck,
  TrendingUp,
  Heart,
  Eye,
  Zap,
  Flame,
  CreditCard,
  X,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

/* ── types ─────────────────────────────────────────── */
interface ProductImage {
  url: string;
  is_primary: boolean;
}

interface ProductVariant {
  id: string;
  name: string;
  price: number | null;
  stock: number;
}

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
  product_images: ProductImage[];
  product_variants: ProductVariant[];
}

interface FeaturedProductsProps {
  config: { limit?: number };
  title?: string;
}

/* ── helpers ───────────────────────────────────────── */
const fmt = (v: number) => v.toFixed(2).replace(".", ",");

const getImages = (p: Product) => {
  const imgs = p.product_images ?? [];
  const primary = imgs.find((i) => i.is_primary);
  const first = primary?.url || imgs[0]?.url || "/placeholder.svg";
  const second = imgs.find((i) => i.url !== first)?.url || null;
  return { first, second };
};

const getDiscount = (p: Product) => {
  if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
  return Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100);
};

const installmentText = (price: number) => {
  const val = price / 12;
  return `12x de R$ ${fmt(val)} sem juros`;
};

/* ── QuickBuyModal ─────────────────────────────────── */
function QuickBuyModal({
  product,
  onClose,
  addItem,
  cartLoading,
}: {
  product: Product;
  onClose: () => void;
  addItem: (id: string, variantId?: string | null, qty?: number) => Promise<void>;
  cartLoading: boolean;
}) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    product.product_variants?.[0]?.id ?? null
  );
  const [qty, setQty] = useState(1);
  const disc = getDiscount(product);
  const { first } = getImages(product);
  const variants = product.product_variants ?? [];
  const activeVariant = variants.find((v) => v.id === selectedVariant);
  const finalPrice = activeVariant?.price ?? product.price;

  const handleBuy = async () => {
    await addItem(product.id, selectedVariant, qty);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="relative w-full md:max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-t-3xl md:rounded-3xl shadow-2xl border border-border/50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex gap-4">
            <div className="w-28 h-28 rounded-2xl bg-muted/30 flex-shrink-0 overflow-hidden">
              <img src={first} alt={product.name} className="w-full h-full object-contain p-2" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-sans text-sm font-semibold leading-snug line-clamp-2">{product.name}</p>
              {product.compare_at_price && product.compare_at_price > finalPrice && (
                <p className="font-sans text-xs text-muted-foreground line-through">
                  R$ {fmt(product.compare_at_price)}
                </p>
              )}
              <p className="font-display text-2xl font-bold">R$ {fmt(finalPrice)}</p>
              <p className="font-sans text-[11px] text-muted-foreground">{installmentText(finalPrice)}</p>
              {disc > 0 && (
                <span className="inline-flex px-2 py-[2px] rounded bg-destructive/10 text-destructive text-[10px] font-bold">
                  -{disc}% OFF
                </span>
              )}
            </div>
          </div>

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-2">
              <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variação</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    disabled={v.stock <= 0}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedVariant === v.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-foreground hover:border-accent/50"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {v.name}
                    {v.stock <= 0 && " (esgotado)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantidade</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-sans text-sm font-bold w-8 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleBuy}
            disabled={cartLoading || product.stock <= 0}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground font-sans text-base font-bold py-4 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {cartLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Comprar agora — R$ {fmt(finalPrice * qty)}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── ProductCard ───────────────────────────────────── */
function ProductCard({
  product,
  index,
  addItem,
  cartLoading,
  onQuickBuy,
}: {
  product: Product;
  index: number;
  addItem: (id: string, variantId?: string | null, qty?: number) => Promise<void>;
  cartLoading: boolean;
  onQuickBuy: (p: Product) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [showSecondImg, setShowSecondImg] = useState(false);
  const disc = getDiscount(product);
  const { first, second } = getImages(product);
  const isBestseller = product.sold_count >= 10;
  const lowStock = product.stock > 0 && product.stock <= 5;
  const variants = product.product_variants ?? [];

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product.id);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickBuy(product);
  };

  // Image swap on hover with delay
  useEffect(() => {
    if (!second) return;
    let timer: ReturnType<typeof setTimeout>;
    if (hovered) {
      timer = setTimeout(() => setShowSecondImg(true), 200);
    } else {
      setShowSecondImg(false);
    }
    return () => clearTimeout(timer);
  }, [hovered, second]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={`/produto/${product.slug}`} className="group block h-full">
        <div className="relative flex flex-col h-full bg-card rounded-[20px] border border-border/40 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group-hover:-translate-y-1">
          {/* ── Image Area ── */}
          <div className="relative aspect-square bg-muted/20">
            <div className="absolute inset-0 overflow-hidden">
              {/* Primary image */}
              <img
                src={first}
                alt={product.name}
                className={`absolute inset-0 w-full h-full object-contain p-4 transition-all duration-500 ease-out group-hover:scale-105 ${
                  showSecondImg ? "opacity-0" : "opacity-100"
                }`}
                loading="lazy"
              />
              {/* Secondary image */}
              {second && (
                <img
                  src={second}
                  alt={`${product.name} - imagem 2`}
                  className={`absolute inset-0 w-full h-full object-contain p-4 transition-all duration-500 ease-out group-hover:scale-105 ${
                    showSecondImg ? "opacity-100" : "opacity-0"
                  }`}
                  loading="lazy"
                />
              )}
            </div>

            {/* Badges on image */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
              {disc > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wide shadow-md">
                  {disc}% OFF
                </span>
              )}
              {product.is_new && (
                <span className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wide shadow-md">
                  Novo
                </span>
              )}
            </div>

            {/* Hover actions — desktop */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  className="absolute top-3 right-3 z-10 hidden md:flex flex-col gap-2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-md border border-border/50 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors shadow-lg"
                    title="Favoritar"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/produto/${product.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur-md border border-border/50 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors shadow-lg"
                    title="Ver detalhes"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick add overlay — desktop */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 z-10 hidden md:flex gap-2 p-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={handleQuickBuy}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground font-sans text-xs font-bold py-2.5 transition-all hover:brightness-110 active:scale-[0.97] shadow-lg"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Comprar
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={cartLoading || product.stock <= 0}
                    className="flex items-center justify-center rounded-xl bg-card/90 backdrop-blur-md border border-border/50 px-3 py-2.5 hover:bg-muted transition-colors shadow-lg disabled:opacity-50"
                    title="Adicionar ao carrinho"
                  >
                    {cartLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Variant Swatches ── */}
          {variants.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-1.5">
              {variants.slice(0, 6).map((v) => (
                <span
                  key={v.id}
                  className={`px-2 py-[2px] rounded-md border text-[10px] font-medium ${
                    v.stock > 0
                      ? "border-border text-foreground"
                      : "border-border/50 text-muted-foreground line-through opacity-50"
                  }`}
                >
                  {v.name}
                </span>
              ))}
              {variants.length > 6 && (
                <span className="px-2 py-[2px] rounded-md text-[10px] text-muted-foreground">
                  +{variants.length - 6}
                </span>
              )}
            </div>
          )}

          {/* ── Content ── */}
          <div className="flex flex-col flex-1 p-4 md:p-5 gap-1">
            {/* Name */}
            <p className="font-sans text-sm md:text-[15px] font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors min-h-[2.4em]">
              {product.name}
            </p>

            {/* Conversion indicators */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {isBestseller && (
                <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded bg-warning/10 text-warning text-[10px] font-semibold">
                  <Flame className="w-3 h-3" />
                  Mais vendido
                </span>
              )}
              {lowStock && (
                <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded bg-destructive/10 text-destructive text-[10px] font-semibold">
                  <Zap className="w-3 h-3" />
                  Últimas {product.stock} un.
                </span>
              )}
            </div>

            {/* Prices */}
            <div className="mt-auto pt-2 space-y-0.5">
              {product.compare_at_price && product.compare_at_price > product.price && (
                <p className="font-sans text-xs text-muted-foreground line-through">
                  R$ {fmt(product.compare_at_price)}
                </p>
              )}
              <p className="font-display text-xl md:text-2xl font-bold text-foreground">
                R$ {fmt(product.price)}
              </p>
              <p className="font-sans text-[11px] text-muted-foreground flex items-center gap-1">
                <CreditCard className="w-3 h-3" />
                {installmentText(product.price)}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-medium">
                <Truck className="w-3 h-3" />
                Frete grátis
              </span>
            </div>

            {/* CTA — Mobile always visible */}
            <div className="flex gap-2 mt-3 md:hidden">
              <button
                onClick={handleQuickBuy}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground font-sans text-sm font-bold py-3 transition-all active:scale-[0.97]"
              >
                <Zap className="w-4 h-4" />
                Comprar
              </button>
              <button
                onClick={handleAddToCart}
                disabled={cartLoading || product.stock <= 0}
                className="w-12 flex items-center justify-center rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50"
              >
                {cartLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── FeaturedProducts ──────────────────────────────── */
export function FeaturedProducts({ config, title = "Produtos em Destaque" }: FeaturedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, loading: cartLoading } = useCart();
  const [quickBuyProduct, setQuickBuyProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, slug, price, compare_at_price, stock, is_featured, is_new, sold_count, product_images(url, is_primary), product_variants(id, name, price, stock)"
        )
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(config.limit || 8);
      setProducts((data as Product[]) || []);
      setLoading(false);
    };
    fetchProducts();
  }, [config.limit]);

  return (
    <>
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-[20px]" />
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={i}
                  addItem={addItem}
                  cartLoading={cartLoading}
                  onQuickBuy={setQuickBuyProduct}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick Buy Modal */}
      <AnimatePresence>
        {quickBuyProduct && (
          <QuickBuyModal
            product={quickBuyProduct}
            onClose={() => setQuickBuyProduct(null)}
            addItem={addItem}
            cartLoading={cartLoading}
          />
        )}
      </AnimatePresence>
    </>
  );
}
