import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { FavoriteButton } from "@/components/store/FavoriteButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Zap, Minus, Plus, ChevronRight,
  Loader2, Truck, ShieldCheck, CreditCard, Package,
} from "lucide-react";
import paymentFlagsImg from "@/assets/pagamento-pix.webp";

/* ── Types ────────────────────────────────────── */
interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  sold_count: number;
  product_images: { url: string; is_primary: boolean; alt_text: string | null }[];
  product_variants: { id: string; name: string; price: number | null; stock: number }[];
}

/* ── Sub-components ────────────────────────────────────── */

function ProductGallery({ images, title, discount, selectedImage, setSelectedImage }: {
  images: ProductData["product_images"];
  title: string;
  discount: number;
  selectedImage: number;
  setSelectedImage: (i: number) => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const primaryImage = images[selectedImage]?.url || "/placeholder.svg";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <div>
      <div className="rounded-[20px] overflow-hidden border border-border/50 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)]">
        {/* Desktop: side thumbnails */}
        <div className="hidden lg:flex">
          {images.length > 1 && (
            <div className="flex flex-col gap-2.5 p-3 border-r border-border/40">
              {images.map((img, i) => (
                <motion.button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 min-h-[unset] min-w-[unset] ${
                    i === selectedImage
                      ? "border-accent shadow-[0_0_0_1px_hsl(var(--accent)/0.3)]"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          )}
          <div
            className="relative flex-1 aspect-square cursor-zoom-in overflow-hidden"
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={primaryImage}
                alt={title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full object-cover transition-transform duration-300"
                style={zoomed ? {
                  transform: "scale(2)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                } : undefined}
              />
            </AnimatePresence>
            {discount > 0 && (
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground font-sans text-xs rounded-full px-3 py-1 shadow-md">-{discount}%</Badge>
            )}
          </div>
        </div>

        {/* Mobile: swipeable carousel */}
        <div className="lg:hidden">
          <div className="relative aspect-square overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out h-full"
              style={{ transform: `translateX(-${selectedImage * 100}%)`, width: `${images.length * 100}%` }}
            >
              {images.map((img, i) => (
                <div key={i} className="w-full h-full shrink-0" style={{ width: `${100 / images.length}%` }}>
                  <img src={img.url} alt={title} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            {discount > 0 && (
              <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground font-sans text-xs rounded-full px-3 py-1 shadow-md">-{discount}%</Badge>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`rounded-full transition-all duration-300 min-h-[unset] min-w-[unset] ${
                      i === selectedImage ? "bg-accent w-6 h-2" : "bg-white/60 w-2 h-2"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 min-h-[unset] min-w-[unset] ${
                    i === selectedImage ? "border-accent" : "border-transparent"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceBlock({ price, comparePrice, discount, pixEnabled, pixDiscount, installmentsEnabled, maxInstallments, blackFridayEnabled, blackFridayText }: {
  price: number; comparePrice: number; discount: number;
  pixEnabled: boolean; pixDiscount: number; installmentsEnabled: boolean; maxInstallments: number;
  blackFridayEnabled?: boolean; blackFridayText?: string;
}) {
  const installmentValue = maxInstallments > 0 ? (price / maxInstallments).toFixed(2) : "0";
  return (
    <div className="space-y-2">
      {comparePrice > price && (
        <span className="text-sm text-muted-foreground line-through font-sans">R$ {comparePrice.toFixed(2).replace('.', ',')}</span>
      )}
      <div className="flex items-end gap-3 flex-wrap">
        <span className="text-3xl md:text-4xl font-bold font-sans tracking-tight">R$ {price.toFixed(2).replace('.', ',')}</span>
        {discount > 0 && (
          <Badge className="bg-destructive/10 text-destructive text-xs font-sans rounded-full px-3 py-1 border border-destructive/20">-{discount}%</Badge>
        )}
      </div>
      {installmentsEnabled && maxInstallments > 1 && (
        <p className="text-xs text-muted-foreground font-sans">
          ou {maxInstallments}x de <span className="font-semibold text-foreground">R$ {installmentValue.replace('.', ',')}</span> sem juros
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {pixEnabled && pixDiscount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-success bg-success/10 border border-success/20 rounded-full px-3 py-1">
            ✦ {pixDiscount}% OFF no PIX
          </span>
        )}
        {blackFridayEnabled && blackFridayText && (
          <span className="inline-flex items-center gap-1 text-xs font-sans font-medium text-accent bg-accent/10 border border-accent/20 rounded-full px-3 py-1">
            🔥 {blackFridayText}
          </span>
        )}
      </div>
    </div>
  );
}

function ShippingInfo({ shippingEnabled, shippingDays }: { shippingEnabled: boolean; shippingDays: number }) {
  if (!shippingEnabled) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-success/20 bg-success/5 p-4 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
          <Truck className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="font-sans text-sm font-semibold">Receba entre 1 à {shippingDays} dias</p>
          <p className="font-sans text-[11px] text-muted-foreground">Envio para todo o Brasil</p>
        </div>
      </div>
      <span className="text-xs font-sans font-bold text-success bg-success/10 rounded-full px-3 py-1 shrink-0 border border-success/20">Frete Grátis</span>
    </motion.div>
  );
}

function PaymentMethods({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  const methods = ["Visa", "Master", "Elo", "Amex", "Pix", "Boleto"];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl bg-card border border-border/40 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formas de pagamento</p>
      </div>
      <div className="flex flex-wrap gap-1.5 bg-foreground/80 rounded-xl px-4 py-2.5 w-fit">
        <img src={paymentFlagsImg} alt="Bandeiras de pagamento: Visa, Master, Elo, Pix, Boleto" className="h-6 object-contain brightness-[2] invert" />
      </div>
    </motion.div>
  );
}

function SecurePayment() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-border/50 bg-card p-5 space-y-3 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-success" />
        </div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wider">Pagamento 100% Seguro</h3>
      </div>
      <p className="font-sans text-xs text-muted-foreground leading-relaxed">
        Suas informações de pagamento são processadas com segurança. Nós não armazenamos dados do cartão de crédito nem temos acesso aos números do seu cartão.
      </p>
    </motion.div>
  );
}

/* ── Stagger container ──────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ── Main Page ─────────────────────────────────────────── */

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, loading: cartLoading } = useCart();
  const { isEnabled, getSetting } = useStoreSettings();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);

  // Settings
  const pixEnabled = isEnabled("pix_enabled");
  const pixDiscount = parseInt(getSetting("pix_discount_percent", "5"), 10);
  const installmentsEnabled = isEnabled("installments_enabled");
  const maxInstallments = parseInt(getSetting("max_installments", "12"), 10);
  const paymentBadgesEnabled = isEnabled("payment_badges_enabled");
  const stockStatusEnabled = isEnabled("stock_status_enabled");
  const stockWarningEnabled = isEnabled("stock_warning_enabled");
  const stockWarningThreshold = parseInt(getSetting("stock_warning_threshold", "3"), 10);
  const shippingEnabled = isEnabled("shipping_enabled");
  const shippingDays = parseInt(getSetting("shipping_default_days", "7"), 10);
  const verifiedBadgeEnabled = isEnabled("verified_badge_enabled");
  const soldCountEnabled = isEnabled("sold_count_enabled");
  const soldByEnabled = isEnabled("sold_by_enabled");
  const soldByName = getSetting("sold_by_name", "Minha Loja Premium");
  const whatsappEnabled = isEnabled("whatsapp_enabled");
  const whatsappNumber = getSetting("whatsapp_number", "");
  const whatsappMessage = getSetting("whatsapp_message", "");
  const blackFridayEnabled = isEnabled("black_friday_enabled");
  const blackFridayText = getSetting("black_friday_text", "🔥 BLACK FRIDAY — Descontos imperdíveis!");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("products")
        .select("id, name, slug, description, price, compare_at_price, stock, sku, sold_count, product_images(url, is_primary, alt_text), product_variants(id, name, price, stock)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      setProduct(data as ProductData | null);
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          <Skeleton className="aspect-square rounded-[20px]" />
          <div className="space-y-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <p className="font-display text-2xl mb-2">Produto não encontrado</p>
        <Link to="/" className="text-accent font-sans text-sm hover:underline">Voltar à loja</Link>
      </div>
    );
  }

  const images = product.product_images || [];
  const variants = product.product_variants || [];
  const selectedVariant = selectedVariantIdx !== null ? variants[selectedVariantIdx] : null;
  const price = selectedVariant?.price ?? product.price;
  const comparePrice = product.compare_at_price ?? 0;
  const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const inStock = currentStock > 0;

  const handleAddToCart = async () => {
    await addItem(product.id, selectedVariant?.id || null, quantity);
  };

  const handleBuyNow = async () => {
    await addItem(product.id, selectedVariant?.id || null, quantity);
    navigate('/checkout');
  };

  const handleWhatsApp = () => {
    const msg = whatsappMessage
      .replace("{product}", product.name)
      .replace("{price}", `R$ ${price.toFixed(2).replace('.', ',')}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {/* Breadcrumb */}
      <div className="container px-4 md:px-6 py-4">
        <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-sans font-medium uppercase tracking-widest overflow-hidden">
          <Link to="/" className="hover:text-accent transition-colors shrink-0">Início</Link>
          <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
          <span className="text-foreground/70 truncate">{product.name}</span>
        </nav>
      </div>

      <div className="container px-4 md:px-6 pb-10 lg:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* LEFT — Gallery */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <ProductGallery images={images} title={product.name} discount={discount} selectedImage={selectedImage} setSelectedImage={setSelectedImage} />
            {/* Description below gallery only on desktop */}
            <div className="hidden lg:block space-y-5 mt-6">
              {product.description && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="rounded-2xl border border-border/50 bg-card p-6 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.04)]"
                >
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-4 text-center text-muted-foreground">Descrição</h3>
                  <div className="font-sans text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
                </motion.div>
              )}
              <SecurePayment />
            </div>
          </motion.div>

          {/* RIGHT — Product Info */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {/* Title block */}
            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-2 mb-2">
                {stockStatusEnabled && inStock && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-success font-sans font-medium bg-success/8 border border-success/15 rounded-full px-2.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    Disponível
                  </span>
                )}
                {verifiedBadgeEnabled && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    Verificado
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">{product.name}</h1>
                <FavoriteButton
                  productId={product.id}
                  variantId={selectedVariant?.id || null}
                  size="lg"
                  className="shrink-0 border border-border/50 bg-card hover:bg-muted shadow-sm"
                />
              </div>
              {soldCountEnabled && product.sold_count > 0 && (
                <p className="text-[11px] text-muted-foreground font-sans mt-1.5">🔥 {product.sold_count} vendidos</p>
              )}
            </motion.div>

            {/* Price */}
            <motion.div variants={fadeUp}>
              <PriceBlock
                price={price}
                comparePrice={comparePrice}
                discount={discount}
                pixEnabled={pixEnabled}
                pixDiscount={pixDiscount}
                installmentsEnabled={installmentsEnabled}
                maxInstallments={maxInstallments}
                blackFridayEnabled={blackFridayEnabled}
                blackFridayText={blackFridayText}
              />
            </motion.div>

            {/* Stock indicator */}
            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${inStock ? "bg-success animate-pulse" : "bg-destructive"}`} />
              <span className={`font-sans text-xs font-medium ${inStock ? "text-muted-foreground" : "text-destructive"}`}>
                {inStock ? `Em estoque (${currentStock})` : "Indisponível"}
              </span>
            </motion.div>

            {stockWarningEnabled && inStock && currentStock <= stockWarningThreshold && (
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-1 text-xs font-sans font-medium text-warning bg-warning/10 border border-warning/20 rounded-full px-3 py-1">
                  ⚡ Últimas {currentStock} unidades!
                </span>
              </motion.div>
            )}

            {/* Variant selector */}
            {variants.length > 0 && (
              <motion.div variants={fadeUp} className="space-y-2.5">
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variante</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, idx) => (
                    <motion.button
                      key={v.id}
                      onClick={() => setSelectedVariantIdx(idx)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      className={`px-4 py-2 rounded-full font-sans text-sm border-2 transition-all duration-200 ${
                        selectedVariantIdx === idx
                          ? "border-accent bg-accent/10 text-accent font-semibold shadow-[0_0_0_1px_hsl(var(--accent)/0.2)]"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      {v.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Shipping */}
            <motion.div variants={fadeUp}>
              <ShippingInfo shippingEnabled={shippingEnabled} shippingDays={shippingDays} />
            </motion.div>

            {/* Divider */}
            <motion.div variants={fadeUp} className="border-t border-border/40" />

            {/* Buy Now CTA */}
            <motion.div variants={fadeUp}>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="w-full h-14 rounded-2xl bg-buttons hover:brightness-110 text-white font-sans font-bold text-base uppercase tracking-wider shine transition-all duration-300 shadow-[0_4px_20px_-4px_hsl(var(--accent)/0.4)]"
                  onClick={handleBuyNow}
                  disabled={cartLoading || !inStock}
                >
                  {cartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 mr-2" /> Comprar agora</>}
                </Button>
              </motion.div>
            </motion.div>

            {/* Quantity + Add to Cart */}
            <motion.div variants={fadeUp} className="flex gap-3">
              <div className="flex items-center border border-border/60 rounded-full overflow-hidden shrink-0 bg-card">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted/60 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <span className="w-10 text-center font-sans text-sm font-semibold">{quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted/60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-10 rounded-full font-sans font-bold text-sm uppercase tracking-wider border-2 border-border hover:border-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                  onClick={handleAddToCart}
                  disabled={cartLoading || !inStock}
                >
                  {cartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-4 h-4 mr-2" /> Adicionar ao carrinho</>}
                </Button>
              </motion.div>
            </motion.div>

            {/* WhatsApp */}
            {whatsappEnabled && whatsappNumber && (
              <motion.div variants={fadeUp}>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-full font-sans font-bold text-sm border-2 border-success text-success hover:bg-success hover:text-success-foreground transition-all duration-300"
                    onClick={handleWhatsApp}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Comprar via WhatsApp
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {/* Payment methods */}
            <motion.div variants={fadeUp}>
              <PaymentMethods enabled={paymentBadgesEnabled} />
            </motion.div>

            {/* Sold by */}
            {soldByEnabled && (
              <motion.div variants={fadeUp} className="rounded-2xl bg-muted/30 border border-border/40 p-3.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
                  <Package className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-xs font-sans text-muted-foreground">
                  Vendido e enviado por <span className="font-semibold text-foreground">{soldByName}</span>
                </span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Description + secure payment on mobile (below grid) */}
        <div className="lg:hidden mt-8 space-y-5">
          {product.description && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border/50 bg-card p-5 shadow-[0_1px_8px_-2px_rgba(0,0,0,0.04)]"
            >
              <h3 className="font-display text-sm font-bold uppercase tracking-wider mb-3 text-muted-foreground">Descrição</h3>
              <div className="font-sans text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
            </motion.div>
          )}
          <SecurePayment />
        </div>
      </div>

      {/* Sticky CTA bar — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/60 px-4 py-3 safe-area-bottom shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-sans text-lg font-bold text-foreground truncate">
              R$ {price.toFixed(2).replace('.', ',')}
            </p>
            {installmentsEnabled && maxInstallments > 1 && (
              <p className="text-[10px] text-muted-foreground font-sans truncate">
                {maxInstallments}x de R$ {(price / maxInstallments).toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              size="sm"
              variant="outline"
              className="h-11 w-11 rounded-full shrink-0 border-2 border-border p-0"
              onClick={handleAddToCart}
              disabled={cartLoading || !inStock}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }} className="flex-1 max-w-[180px]">
            <Button
              className="w-full h-11 rounded-full bg-buttons text-white font-sans font-bold text-sm uppercase tracking-wider shine"
              onClick={handleBuyNow}
              disabled={cartLoading || !inStock}
            >
              {cartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Comprar"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
