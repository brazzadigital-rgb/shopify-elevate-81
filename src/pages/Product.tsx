import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { storefrontApiRequest, PRODUCT_BY_HANDLE_QUERY, ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ShoppingCart, Zap, Minus, Plus, ChevronRight,
  Loader2, ExternalLink,
} from "lucide-react";

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem, isLoading: cartLoading, getCheckoutUrl, setIsOpen } = useCartStore();
  const [product, setProduct] = useState<ShopifyProduct["node"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      if (!slug) return;
      try {
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle: slug });
        setProduct(data?.data?.product || null);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetch();
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
  const primaryImage = images[selectedImage]?.node?.url || "/placeholder.svg";
  const variants = product.variants?.edges || [];
  const selectedVariant = variants[selectedVariantIdx]?.node;
  const price = selectedVariant ? parseFloat(selectedVariant.price.amount) : parseFloat(product.priceRange.minVariantPrice.amount);
  const currency = selectedVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode;
  const comparePrice = selectedVariant?.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice.amount) : 0;
  const discount = comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    const shopifyProduct: ShopifyProduct = {
      node: product,
    };
    await addItem({
      product: shopifyProduct,
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
    const shopifyProduct: ShopifyProduct = {
      node: product,
    };
    await addItem({
      product: shopifyProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) window.open(checkoutUrl, '_blank');
  };

  const hasMultipleOptions = product.options && product.options.length > 0 && !(product.options.length === 1 && product.options[0].values.length === 1 && product.options[0].values[0] === "Default Title");

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
          {/* GALLERY */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="sticky top-24">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
                <img src={primaryImage} alt={product.title} className="w-full h-full object-cover" />
                {discount > 0 && (
                  <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground font-sans text-xs rounded-lg">-{discount}%</Badge>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === selectedImage ? "border-accent" : "border-transparent hover:border-border"
                      }`}
                    >
                      <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* PRODUCT INFO */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">{product.title}</h1>
            </div>

            {/* PRICE BLOCK */}
            <div className="bg-muted/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-bold font-sans">{currency} {price.toFixed(2)}</span>
                {comparePrice > price && (
                  <span className="text-base text-muted-foreground line-through font-sans">{currency} {comparePrice.toFixed(2)}</span>
                )}
                {discount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-xs font-sans rounded-lg">-{discount}% OFF</Badge>
                )}
              </div>
            </div>

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
                        // Only show unique values per option
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

            {/* Availability */}
            {selectedVariant && (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedVariant.availableForSale ? "bg-success animate-pulse" : "bg-destructive"}`} />
                <span className={`font-sans text-xs font-medium ${selectedVariant.availableForSale ? "text-success" : "text-destructive"}`}>
                  {selectedVariant.availableForSale ? "Disponível em estoque" : "Indisponível"}
                </span>
              </div>
            )}

            {/* Quantity & CTAs */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="font-sans text-sm font-medium text-muted-foreground">Qtd:</span>
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-sans text-sm font-semibold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground font-sans font-bold text-base uppercase tracking-wider shine glow-orange hover:glow-orange-lg transition-all duration-300"
                onClick={handleBuyNow}
                disabled={cartLoading || !selectedVariant?.availableForSale}
              >
                {cartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 mr-2" /> Comprar agora</>}
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="w-full h-14 rounded-2xl font-sans font-bold text-base uppercase tracking-wider border-2 border-border hover:border-accent hover:text-accent transition-all duration-300"
                onClick={handleAddToCart}
                disabled={cartLoading || !selectedVariant?.availableForSale}
              >
                {cartLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShoppingCart className="w-5 h-5 mr-2" /> Adicionar ao carrinho</>}
              </Button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t">
                <h3 className="font-display text-lg font-bold mb-3">Descrição</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
