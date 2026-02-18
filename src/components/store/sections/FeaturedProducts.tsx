import { useEffect, useState, useRef, useCallback, TouchEvent as ReactTouchEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Loader2,
  Truck,
  Heart,
  Eye,
  Zap,
  Flame,
  CreditCard,
  X,
  Minus,
  Plus,
} from "lucide-react";

/* ── types ─────────────────────────────────────────── */
interface ProductImage { url: string; is_primary: boolean }
interface ProductVariant { id: string; name: string; price: number | null; stock: number }

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
const getDiscount = (p: Product) => {
  if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
  return Math.round(((p.compare_at_price - p.price) / p.compare_at_price) * 100);
};
const installment = (price: number) => `12x de R$ ${fmt(price / 12)} s/ juros`;

const getAllImages = (p: Product) => {
  const imgs = p.product_images ?? [];
  if (imgs.length === 0) return ["/placeholder.svg"];
  const primary = imgs.find((i) => i.is_primary);
  const sorted = primary
    ? [primary.url, ...imgs.filter((i) => i.url !== primary.url).map((i) => i.url)]
    : imgs.map((i) => i.url);
  return sorted;
};

/* ── ImageCarousel (touch swipe) ───────────────────── */
function ImageCarousel({
  images,
  alt,
  onTap,
}: {
  images: string[];
  alt: string;
  onTap: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchDelta = useRef(0);
  const swiped = useRef(false);
  const count = images.length;

  const handleTouchStart = (e: ReactTouchEvent) => {
    touchStart.current = e.touches[0].clientX;
    touchDelta.current = 0;
    swiped.current = false;
  };

  const handleTouchMove = (e: ReactTouchEvent) => {
    if (touchStart.current === null) return;
    touchDelta.current = e.touches[0].clientX - touchStart.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDelta.current) > 40 && count > 1) {
      swiped.current = true;
      if (touchDelta.current < 0) setCurrent((c) => (c + 1) % count);
      else setCurrent((c) => (c - 1 + count) % count);
    }
    touchStart.current = null;
  };

  const handleClick = () => {
    if (!swiped.current) onTap();
  };

  // Desktop hover swap
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative aspect-square bg-muted/20 overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      onMouseEnter={() => count > 1 && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : `${alt} - ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-contain p-3 md:p-4 transition-opacity duration-400 ease-out will-change-[opacity] ${
            i === current ? "opacity-100" : "opacity-0"
          } ${i === 0 && hovered && count > 1 && current === 0 ? "md:opacity-0" : ""}
          ${i === 1 && hovered && count > 1 && current === 0 ? "md:opacity-100" : ""}`}
          loading={i === 0 ? "eager" : "lazy"}
          draggable={false}
        />
      ))}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {images.map((_, i) => (
            <span
              key={i}
              className={`block w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                i === current ? "bg-accent w-3" : "bg-foreground/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── QuickBuyModal (bottom sheet mobile) ───────────── */
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
  const images = getAllImages(product);
  const variants = product.product_variants ?? [];
  const activeVariant = variants.find((v) => v.id === selectedVariant);
  const finalPrice = activeVariant?.price ?? product.price;

  // Swipe-to-close
  const dragRef = useRef<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        ref={panelRef}
        className="relative w-full md:max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-t-3xl md:rounded-3xl shadow-2xl border border-border/50"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) onClose();
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex gap-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-muted/30 flex-shrink-0 overflow-hidden">
              <img src={images[0]} alt={product.name} className="w-full h-full object-contain p-2" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-sans text-sm font-semibold leading-snug line-clamp-2">{product.name}</p>
              {product.compare_at_price && product.compare_at_price > finalPrice && (
                <p className="font-sans text-xs text-muted-foreground line-through">
                  R$ {fmt(product.compare_at_price)}
                </p>
              )}
              <p className="font-display text-2xl font-bold">R$ {fmt(finalPrice)}</p>
              <p className="font-sans text-[11px] text-muted-foreground">{installment(finalPrice)}</p>
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
                    className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
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
                className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-sans text-base font-bold w-10 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-muted active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleBuy}
            disabled={cartLoading || product.stock <= 0}
            className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-accent text-accent-foreground font-sans text-base font-bold py-4 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {cartLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Comprar — R$ {fmt(finalPrice * qty)}
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
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const disc = getDiscount(product);
  const images = getAllImages(product);
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

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-full"
    >
      <div className="relative flex flex-col h-full bg-card rounded-2xl md:rounded-[20px] border border-border/40 overflow-hidden shadow-sm md:hover:shadow-2xl transition-all duration-300 md:group-hover:-translate-y-1 group">
        {/* ── Image ── */}
        <div className="relative">
          <ImageCarousel
            images={images}
            alt={product.name}
            onTap={() => navigate(`/produto/${product.slug}`)}
          />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
            {disc > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wide shadow">
                {disc}% OFF
              </span>
            )}
            {product.is_new && (
              <span className="px-2 py-0.5 rounded-lg bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wide shadow">
                Novo
              </span>
            )}
          </div>

          {/* Desktop hover actions */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className="absolute top-2.5 right-2.5 z-10 hidden md:flex flex-col gap-1.5"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  onClick={handleFavorite}
                  className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur border border-border/50 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors shadow-md"
                  title="Favoritar"
                >
                  <Heart className="w-4 h-4" />
                </button>
                <Link
                  to={`/produto/${product.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 h-9 rounded-xl bg-card/90 backdrop-blur border border-border/50 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors shadow-md"
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile favorite */}
          <button
            onClick={handleFavorite}
            className="absolute top-2.5 right-2.5 z-10 md:hidden w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex flex-col flex-1 px-3 pb-3 pt-1 md:px-4 md:pb-4 md:pt-2">
          {/* Variant pills */}
          {variants.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {variants.slice(0, 4).map((v) => (
                <span
                  key={v.id}
                  className={`px-1.5 py-[1px] rounded border text-[9px] font-medium ${
                    v.stock > 0
                      ? "border-border text-muted-foreground"
                      : "border-border/40 text-muted-foreground/40 line-through"
                  }`}
                >
                  {v.name}
                </span>
              ))}
              {variants.length > 4 && (
                <span className="px-1.5 py-[1px] text-[9px] text-muted-foreground">+{variants.length - 4}</span>
              )}
            </div>
          )}

          {/* Name */}
          <Link to={`/produto/${product.slug}`}>
            <p className="font-sans text-[13px] md:text-sm font-semibold leading-snug line-clamp-2 hover:text-accent transition-colors">
              {product.name}
            </p>
          </Link>

          {/* Conversion badges — tight under name */}
          {(isBestseller || lowStock) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {isBestseller && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded bg-warning/10 text-warning text-[9px] font-semibold">
                  <Flame className="w-2.5 h-2.5" />
                  Mais vendido
                </span>
              )}
              {lowStock && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded bg-destructive/10 text-destructive text-[9px] font-semibold">
                  <Zap className="w-2.5 h-2.5" />
                  Só {product.stock} restam
                </span>
              )}
            </div>
          )}

          {/* Prices */}
          <div className="mt-auto pt-1">
            {product.compare_at_price && product.compare_at_price > product.price && (
              <p className="font-sans text-[11px] text-muted-foreground line-through leading-none">
                R$ {fmt(product.compare_at_price)}
              </p>
            )}
            <p className="font-display text-lg md:text-xl font-bold text-foreground leading-tight">
              R$ {fmt(product.price)}
            </p>
            <p className="font-sans text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
              <CreditCard className="w-2.5 h-2.5 flex-shrink-0" />
              {installment(product.price)}
            </p>
          </div>

          {/* Frete grátis */}
          <span className="inline-flex items-center gap-1 self-start px-1.5 py-0.5 rounded-full bg-success/10 text-success text-[9px] font-medium mt-1">
            <Truck className="w-2.5 h-2.5" />
            Frete grátis
          </span>

          {/* CTA */}
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={handleQuickBuy}
              className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground font-sans text-[13px] font-bold py-2.5 transition-all hover:brightness-110 active:scale-[0.96]"
            >
              <Zap className="w-3.5 h-3.5" />
              Comprar
            </button>
            <button
              onClick={handleAddToCart}
              disabled={cartLoading || product.stock <= 0}
              className="min-h-[44px] w-11 flex items-center justify-center rounded-xl border border-border hover:bg-muted active:scale-95 transition-all disabled:opacity-50"
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
      <section className="py-10 md:py-24">
        <div className="container px-3 md:px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent font-sans text-xs font-bold uppercase tracking-wider mb-3">
              Destaques
            </span>
            <h2 className="text-2xl md:text-4xl font-display font-bold">{title}</h2>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-muted-foreground font-sans">Nenhum produto encontrado.</p>
              <p className="text-sm text-muted-foreground/60 font-sans">Adicione produtos no painel admin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
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
