import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ShoppingCart, Zap, Minus, Plus, ChevronRight,
  Loader2, Truck, ShieldCheck, CreditCard, Package,
} from "lucide-react";

/* ── Sub-components ────────────────────────────────────── */

function ProductGallery({ images, title, discount, selectedImage, setSelectedImage }: {
  images: Array<{ node: { url: string; altText: string | null } }>;
  title: string;
  discount: number;
  selectedImage: number;
  setSelectedImage: (i: number) => void;
}) {
  const primaryImage = images[selectedImage]?.node?.url || "/placeholder.svg";
  return (
    <div className="sticky top-24">
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="flex">
          {images.length > 1 && (
            <div className="flex flex-col gap-2 p-3 border-r">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    i === selectedImage ? "border-accent" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="relative flex-1 aspect-square">
            <img src={primaryImage} alt={title} className="w-full h-full object-cover" />
            {discount > 0 && (
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground font-sans text-xs rounded-lg">-{discount}%</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PriceBlock({ price, comparePrice, discount, currency, pixEnabled, pixDiscount, installmentsEnabled, maxInstallments, blackFridayEnabled, blackFridayText }: {
  price: number; comparePrice: number; discount: number; currency: string;
  pixEnabled: boolean; pixDiscount: number; installmentsEnabled: boolean; maxInstallments: number;
  blackFridayEnabled?: boolean; blackFridayText?: string;
}) {
  const installmentValue = maxInstallments > 0 ? (price / maxInstallments).toFixed(2) : "0";
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-sans">
        <span>Preço:</span>
      </div>
      <div className="flex items-end gap-3 flex-wrap">
        <span className="text-3xl font-bold font-sans">R$ {price.toFixed(2).replace('.', ',')}</span>
        {discount > 0 && (
          <Badge className="bg-destructive text-destructive-foreground text-xs font-sans rounded-lg">-{discount}% OFF</Badge>
        )}
      </div>
      {comparePrice > price && (
        <span className="text-sm text-muted-foreground line-through font-sans">R$ {comparePrice.toFixed(2).replace('.', ',')}</span>
      )}
      {installmentsEnabled && maxInstallments > 1 && (
        <p className="text-sm text-muted-foreground font-sans">
          em até {maxInstallments}x de <span className="font-semibold text-foreground">R$ {installmentValue.replace('.', ',')}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {pixEnabled && pixDiscount > 0 && (
          <Badge variant="outline" className="text-xs font-sans border-success text-success">
            ✅ Até {pixDiscount}% OFF no PIX
          </Badge>
        )}
        {blackFridayEnabled && blackFridayText && (
          <Badge variant="outline" className="text-xs font-sans border-accent text-accent">
            🔥 {blackFridayText}
          </Badge>
        )}
      </div>
    </div>
  );
}

function ShippingInfo({ shippingEnabled, freeShippingText, shippingDays }: {
  shippingEnabled: boolean; freeShippingText: string; shippingDays: number;
}) {
  if (!shippingEnabled) return null;
  return (
    <div className="border-2 border-success/40 rounded-2xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Truck className="w-8 h-8 text-success shrink-0" />
        <div>
          <p className="font-sans text-sm font-semibold">Receba entre 1 à {shippingDays} Dias</p>
          <p className="font-sans text-xs text-muted-foreground">Envio para todo o Brasil</p>
        </div>
      </div>
      <Badge className="bg-success text-success-foreground font-sans text-xs shrink-0">Frete Grátis</Badge>
    </div>
  );
}

function PaymentMethods({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  const methods = ["Visa", "Master", "Elo", "Amex", "Pix", "Boleto"];
  return (
    <div className="bg-muted/60 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-muted-foreground" />
        <p className="font-sans text-sm font-semibold">Parcele suas compras</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {methods.map((m) => (
          <span key={m} className="px-3 py-1 rounded-lg bg-card border text-xs font-sans font-medium">{m}</span>
        ))}
      </div>
    </div>
  );
}

function SecurePayment() {
  return (
    <div className="bg-card border rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-bold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-success" /> Pagamento Seguro
        </h3>
      </div>
      <p className="font-sans text-xs text-muted-foreground leading-relaxed">
        Suas informações de pagamento são processadas com segurança. Nós não armazenamos dados do cartão de crédito nem temos acesso aos números do seu cartão.
      </p>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export default function ProductPage() {
  const { slug } = useParams();
  const { addItem, isLoading: cartLoading, getCheckoutUrl, setIsOpen } = useCartStore();
  const { isEnabled, getSetting } = useStoreSettings();
  const [product, setProduct] = useState<ShopifyProduct["node"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

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
  const freeShippingText = getSetting("free_shipping_text", "Frete grátis para todo o Brasil");
  const shippingDays = parseInt(getSetting("shipping_default_days", "7"), 10);
  const skuEnabled = isEnabled("sku_enabled");
  const soldCountEnabled = isEnabled("sold_count_enabled");
  const verifiedBadgeEnabled = isEnabled("verified_badge_enabled");
  const soldByEnabled = isEnabled("sold_by_enabled");
  const soldByName = getSetting("sold_by_name", "Minha Loja Premium");
  const whatsappEnabled = isEnabled("whatsapp_enabled");
  const whatsappNumber = getSetting("whatsapp_number", "");
  const whatsappMessage = getSetting("whatsapp_message", "");
  const blackFridayEnabled = isEnabled("black_friday_enabled");
  const blackFridayText = getSetting("black_friday_text", "🔥 BLACK FRIDAY — Descontos imperdíveis!");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle: slug });
        setProduct(data?.data?.product || null);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
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

  const images = product.images?.edges || [];
  const variants = product.variants?.edges || [];
  const selectedVariant = variants[selectedVariantIdx]?.node;
  const price = selectedVariant ? parseFloat(selectedVariant.price.amount) : parseFloat(product.priceRange.minVariantPrice.amount);
  const currency = selectedVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode;
  const comparePrice = selectedVariant?.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice.amount) : 0;
  const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const hasMultipleOptions = product.options && product.options.length > 0 && !(product.options.length === 1 && product.options[0].values.length === 1 && product.options[0].values[0] === "Default Title");

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addItem({
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    setIsOpen(true);
    toast({ title: "Adicionado ao carrinho! 🛒" });
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) return;
    await addItem({
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) window.open(checkoutUrl, '_blank');
  };

  const handleWhatsApp = () => {
    const msg = whatsappMessage
      .replace("{product}", product.title)
      .replace("{price}", `R$ ${price.toFixed(2).replace('.', ',')}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen">

      {/* Breadcrumb */}
      <div className="container py-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans font-medium uppercase tracking-wider">
          <Link to="/" className="hover:text-accent transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground truncate max-w-[200px]">{product.title}</span>
        </nav>
      </div>

      <div className="container pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* LEFT — Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <ProductGallery
              images={images}
              title={product.title}
              discount={discount}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
            />

            {/* Description below gallery */}
            {product.description && (
              <div className="mt-6 bg-card border rounded-2xl p-6">
                <h3 className="font-display text-lg font-bold mb-3 text-center">Descrição</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Secure Payment below description */}
            <div className="mt-6">
              <SecurePayment />
            </div>
          </motion.div>

          {/* RIGHT — Product Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-5">
            {/* Title & availability badge */}
            <div>
              {stockStatusEnabled && selectedVariant?.availableForSale && (
                <p className="text-xs text-success font-sans font-medium mb-1">Disponível em estoque</p>
              )}
              <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">{product.title}</h1>
              {verifiedBadgeEnabled && (
                <div className="flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span className="text-xs font-sans text-muted-foreground">Produto verificado</span>
                </div>
              )}
            </div>

            {/* Sold count */}
            {soldCountEnabled && (
              <p className="text-xs text-muted-foreground font-sans">🔥 Produto popular</p>
            )}

            {/* Price */}
            <PriceBlock
              price={price}
              comparePrice={comparePrice}
              discount={discount}
              currency={currency}
              pixEnabled={pixEnabled}
              pixDiscount={pixDiscount}
              installmentsEnabled={installmentsEnabled}
              maxInstallments={maxInstallments}
              blackFridayEnabled={blackFridayEnabled}
              blackFridayText={blackFridayText}
            />

            {/* Stock indicator */}
            {selectedVariant && (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedVariant.availableForSale ? "bg-success animate-pulse" : "bg-destructive"}`} />
                <span className={`font-sans text-xs font-semibold ${selectedVariant.availableForSale ? "text-success" : "text-destructive"}`}>
                  {selectedVariant.availableForSale ? "Em estoque" : "Indisponível"}
                </span>
              </div>
            )}

            {/* Stock warning */}
            {stockWarningEnabled && selectedVariant?.availableForSale && (
              <Badge variant="outline" className="border-warning text-warning text-xs font-sans">
                ⚡ Estoque limitado!
              </Badge>
            )}

            {/* Variant selector */}
            {hasMultipleOptions && (
              <div className="space-y-3">
                {product.options.map((option) => (
                  <div key={option.name}>
                    <p className="font-sans text-sm font-semibold mb-2">{option.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v, idx) => {
                        const optVal = v.node.selectedOptions.find(o => o.name === option.name)?.value;
                        if (!optVal) return null;
                        const alreadyShown = variants.slice(0, idx).some(prev =>
                          prev.node.selectedOptions.find(o => o.name === option.name)?.value === optVal
                        );
                        if (alreadyShown) return null;
                        const isSelected = selectedVariant?.selectedOptions.find(o => o.name === option.name)?.value === optVal;
                        return (
                          <button
                            key={`${option.name}-${optVal}`}
                            onClick={() => {
                              const match = variants.findIndex(vr => vr.node.selectedOptions.find(o => o.name === option.name)?.value === optVal);
                              if (match >= 0) setSelectedVariantIdx(match);
                            }}
                            className={`px-4 py-2 rounded-xl font-sans text-sm border-2 transition-all ${
                              isSelected ? "border-accent bg-accent/10 text-accent font-semibold" : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            {optVal}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shipping */}
            <ShippingInfo shippingEnabled={shippingEnabled} freeShippingText={freeShippingText} shippingDays={shippingDays} />

            {/* Buy Now */}
            <Button
              size="lg"
              className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-sans font-bold text-base uppercase tracking-wider shine glow-orange hover:glow-orange-lg transition-all duration-300"
              onClick={handleBuyNow}
              disabled={cartLoading || !selectedVariant?.availableForSale}
            >
              {cartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 mr-2" /> Comprar agora</>}
            </Button>

            {/* Quantity + Add to Cart */}
            <div className="flex gap-3">
              <div className="flex items-center border rounded-xl overflow-hidden shrink-0">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-sans text-sm font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-10 rounded-xl font-sans font-bold text-sm uppercase tracking-wider border-2 border-border hover:border-accent hover:text-accent transition-all duration-300"
                onClick={handleAddToCart}
                disabled={cartLoading || !selectedVariant?.availableForSale}
              >
                {cartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-5 h-5 mr-2" /> Adicionar ao carrinho</>}
              </Button>
            </div>

            {/* WhatsApp */}
            {whatsappEnabled && whatsappNumber && (
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-sans font-bold text-sm border-2 border-success text-success hover:bg-success/10 transition-all"
                onClick={handleWhatsApp}
              >
                📱 Comprar via WhatsApp
              </Button>
            )}

            {/* Payment methods */}
            <PaymentMethods enabled={paymentBadgesEnabled} />

            {/* Sold by */}
            {soldByEnabled && (
              <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-sans text-muted-foreground">
                  Vendido e enviado por <span className="font-semibold text-foreground">{soldByName}</span>
                </span>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
