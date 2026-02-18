import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ShoppingCart, Zap, MessageCircle, Minus, Plus, ChevronRight,
  CheckCircle2, AlertTriangle, Truck, Shield, CreditCard,
  BadgeCheck, Package, Clock,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
  is_new: boolean;
  is_featured: boolean;
  sold_count: number;
  product_images: { id: string; url: string; is_primary: boolean; sort_order: number }[];
  product_badges: { id: string; badge_type: string; title: string | null; text: string | null; image_url: string | null; style: string; is_active: boolean; sort_order: number }[];
}

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState("");
  const [shippingResult, setShippingResult] = useState<string | null>(null);
  const { getSetting, isEnabled } = useStoreSettings();

  useEffect(() => {
    const fetch = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from("products")
        .select("*, product_images(*), product_badges(*)")
        .eq("slug", slug)
        .maybeSingle();
      setProduct(data as any);
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

  const images = [...(product.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const primaryImage = images[selectedImage]?.url || "/placeholder.svg";
  const discount = product.compare_at_price && product.compare_at_price > product.price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100) : 0;
  const pixDiscount = parseInt(getSetting("pix_discount_percent", "5"));
  const pixPrice = product.price * (1 - pixDiscount / 100);
  const maxInstallments = parseInt(getSetting("max_installments", "12"));
  const installmentValue = product.price / maxInstallments;
  const stockThreshold = parseInt(getSetting("stock_warning_threshold", "3"));
  const badges = (product.product_badges || []).filter((b) => b.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const simulateShipping = () => {
    if (cep.length < 8) { toast({ title: "CEP inválido", variant: "destructive" }); return; }
    const days = parseInt(getSetting("shipping_default_days", "7"));
    const minValue = parseFloat(getSetting("free_shipping_min_value", "199"));
    const isFree = product.price * quantity >= minValue;
    setShippingResult(
      isFree
        ? `✅ Frete Grátis — Receba em até ${days} dias úteis`
        : `📦 Frete R$ 19,90 — Receba em 1 a ${days} dias úteis`
    );
  };

  const whatsappLink = () => {
    const number = getSetting("whatsapp_number", "5511999999999");
    const msg = getSetting("whatsapp_message", "Olá! Tenho interesse no produto: {product} - {price}")
      .replace("{product}", product.name)
      .replace("{price}", `R$ ${product.price.toFixed(2)}`)
      .replace("{link}", window.location.href);
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="container py-4">
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
          <Link to="/" className="hover:text-accent transition-colors">Início</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/colecoes" className="hover:text-accent transition-colors">Coleções</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      <div className="container pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* GALLERY */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="sticky top-24">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3">
                <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                {product.is_new && (
                  <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground font-sans text-xs rounded-lg">Novo</Badge>
                )}
                {discount > 0 && (
                  <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground font-sans text-xs rounded-lg">-{discount}%</Badge>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === selectedImage ? "border-accent" : "border-transparent hover:border-border"
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* PRODUCT INFO */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-5">
            {/* Promotional Banners */}
            {badges.length > 0 && (
              <div className="space-y-2">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`rounded-xl px-4 py-2.5 font-sans text-sm font-semibold flex items-center gap-2 ${
                      badge.style === "urgency"
                        ? "bg-destructive/10 text-destructive border border-destructive/20"
                        : "bg-accent/10 text-accent border border-accent/20"
                    }`}
                  >
                    {badge.badge_type === "image" && badge.image_url ? (
                      <img src={badge.image_url} alt="" className="h-6" />
                    ) : null}
                    <span>{badge.text || badge.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Global banners */}
            {isEnabled("black_friday_enabled") && (
              <div className="rounded-xl px-4 py-2.5 bg-destructive text-destructive-foreground font-sans text-sm font-bold flex items-center gap-2 animate-pulse-slow">
                🔥 {getSetting("black_friday_text", "PRÉ-BLACK FRIDAY — Descontos de até 70%!")}
              </div>
            )}
            {isEnabled("clearance_enabled") && (
              <div className="rounded-xl px-4 py-2.5 bg-warning text-warning-foreground font-sans text-sm font-bold flex items-center gap-2">
                ⚡ QUEIMA DE ESTOQUE
              </div>
            )}
            {isEnabled("christmas_enabled") && (
              <div className="rounded-xl px-4 py-2.5 bg-accent/10 text-accent border border-accent/20 font-sans text-sm font-bold flex items-center gap-2">
                🎄 Promoção de Natal
              </div>
            )}

            {/* Sold count */}
            {isEnabled("sold_count_enabled") && product.sold_count > 0 && (
              <p className="text-xs text-muted-foreground font-sans">
                🔥 {product.sold_count} vendidos
              </p>
            )}

            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight flex items-center gap-2 flex-wrap">
                {product.name}
                {isEnabled("verified_badge_enabled") && (
                  <BadgeCheck className="w-5 h-5 text-accent shrink-0" />
                )}
              </h1>
              {product.short_description && (
                <p className="text-muted-foreground font-sans text-sm mt-2">{product.short_description}</p>
              )}
            </div>

            {/* SKU */}
            {isEnabled("sku_enabled") && product.sku && (
              <p className="text-xs text-muted-foreground font-sans">SKU: {product.sku}</p>
            )}

            {/* Stock status */}
            {isEnabled("stock_status_enabled") && product.stock > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-success font-sans text-xs font-medium">Disponível em estoque</span>
              </div>
            )}

            {/* Sold by */}
            {isEnabled("sold_by_enabled") && (
              <p className="text-xs text-muted-foreground font-sans flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Vendido e enviado por <strong className="text-foreground">{getSetting("sold_by_name", "Loja")}</strong>
              </p>
            )}

            {/* PRICE BLOCK */}
            <div className="bg-muted/50 rounded-2xl p-5 space-y-3">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-bold font-sans">R$ {product.price.toFixed(2)}</span>
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <span className="text-base text-muted-foreground line-through font-sans">
                    R$ {Number(product.compare_at_price).toFixed(2)}
                  </span>
                )}
                {discount > 0 && (
                  <Badge className="bg-destructive text-destructive-foreground text-xs font-sans rounded-lg">
                    -{discount}% OFF
                  </Badge>
                )}
              </div>

              {/* Installments */}
              {isEnabled("installments_enabled") && (
                <p className="text-sm text-muted-foreground font-sans">
                  em até <strong className="text-foreground">{maxInstallments}x de R$ {installmentValue.toFixed(2)}</strong> sem juros
                </p>
              )}

              {/* Pix */}
              {isEnabled("pix_enabled") && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20">
                  <span className="text-success font-sans text-sm font-bold">
                    R$ {pixPrice.toFixed(2)}
                  </span>
                  <span className="text-success/80 font-sans text-xs">
                    com {pixDiscount}% OFF no Pix
                  </span>
                </div>
              )}
            </div>

            {/* Stock warning */}
            {isEnabled("stock_warning_enabled") && product.stock > 0 && product.stock <= stockThreshold && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/5 border border-destructive/10">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-destructive font-sans text-sm font-medium">
                  Apenas {product.stock} {product.stock === 1 ? "unidade restante" : "unidades restantes"}!
                </span>
              </div>
            )}

            {/* Shipping */}
            {isEnabled("shipping_enabled") && (
              <div className="space-y-2 p-4 rounded-2xl border bg-background">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="font-sans text-sm font-semibold">Calcular frete e prazo</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="CEP"
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    className="h-10 rounded-xl font-sans flex-1"
                    maxLength={8}
                  />
                  <Button onClick={simulateShipping} variant="outline" className="rounded-xl h-10 font-sans text-sm px-5">
                    Calcular
                  </Button>
                </div>
                {shippingResult && (
                  <p className="text-sm font-sans text-success font-medium mt-1">{shippingResult}</p>
                )}
              </div>
            )}

            {/* Quantity & CTAs */}
            <div className="space-y-3 pt-2">
              {/* Quantity stepper */}
              <div className="flex items-center gap-3">
                <span className="font-sans text-sm font-medium text-muted-foreground">Qtd:</span>
                <div className="flex items-center border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-sans text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Buy now */}
              <Button
                size="lg"
                className="w-full h-13 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-sans font-bold text-base shine"
                onClick={() => toast({ title: "Redirecionando ao checkout..." })}
              >
                <Zap className="w-5 h-5 mr-2" /> Comprar agora
              </Button>

              {/* Add to cart */}
              <Button
                size="lg"
                variant="outline"
                className="w-full h-13 rounded-xl font-sans font-semibold text-base border-2"
                onClick={() => toast({ title: "Produto adicionado ao carrinho!" })}
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> Adicionar ao carrinho
              </Button>

              {/* WhatsApp */}
              {isEnabled("whatsapp_enabled") && (
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="block">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-13 rounded-xl font-sans font-semibold text-base border-success/30 text-success hover:bg-success/5"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" /> Comprar pelo WhatsApp
                  </Button>
                </a>
              )}
            </div>

            {/* Payment badges */}
            {isEnabled("payment_badges_enabled") && (
              <div className="flex items-center gap-3 p-4 rounded-2xl border bg-muted/30">
                <Shield className="w-5 h-5 text-accent shrink-0" />
                <div>
                  <p className="font-sans text-xs font-semibold">Pagamento 100% Seguro</p>
                  <div className="flex gap-1.5 mt-1.5">
                    {["Visa", "Master", "Elo", "Amex", "Pix", "Boleto"].map((m) => (
                      <span key={m} className="px-1.5 py-0.5 rounded bg-background border text-[9px] font-sans font-medium text-muted-foreground">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Accordions */}
            <Accordion type="multiple" className="mt-4">
              {product.description && (
                <AccordionItem value="description" className="border rounded-xl px-4 mb-2 last:mb-0">
                  <AccordionTrigger className="font-sans text-sm font-semibold py-4 hover:no-underline">
                    📋 Descrição
                  </AccordionTrigger>
                  <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed pb-4 whitespace-pre-wrap">
                    {product.description}
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="payment" className="border rounded-xl px-4 mb-2">
                <AccordionTrigger className="font-sans text-sm font-semibold py-4 hover:no-underline">
                  🔒 Pagamento Seguro
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed pb-4">
                  Todas as transações são processadas em ambiente seguro com criptografia SSL.
                  Aceitamos Visa, Mastercard, Elo, American Express, Pix e Boleto Bancário.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="returns" className="border rounded-xl px-4 mb-2">
                <AccordionTrigger className="font-sans text-sm font-semibold py-4 hover:no-underline">
                  🔄 Trocas e Garantia
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed pb-4">
                  Trocas e devoluções em até 30 dias após o recebimento. O produto deve estar em perfeito estado, sem uso, com etiquetas e na embalagem original.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq" className="border rounded-xl px-4">
                <AccordionTrigger className="font-sans text-sm font-semibold py-4 hover:no-underline">
                  ❓ Perguntas Frequentes
                </AccordionTrigger>
                <AccordionContent className="font-sans text-sm text-muted-foreground leading-relaxed pb-4 space-y-3">
                  <div>
                    <p className="font-medium text-foreground">Qual o prazo de entrega?</p>
                    <p>De 1 a {getSetting("shipping_default_days", "7")} dias úteis, dependendo da região.</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Posso parcelar?</p>
                    <p>Sim, em até {getSetting("max_installments", "12")}x sem juros no cartão de crédito.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </div>

      {/* Mobile fixed CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/90 backdrop-blur-xl border-t">
        <div className="flex gap-2">
          <Button
            className="flex-1 h-12 rounded-xl bg-success hover:bg-success/90 text-success-foreground font-sans font-bold shine"
            onClick={() => toast({ title: "Redirecionando ao checkout..." })}
          >
            <Zap className="w-4 h-4 mr-1.5" /> Comprar — R$ {product.price.toFixed(2)}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-xl border-2 shrink-0"
            onClick={() => toast({ title: "Adicionado ao carrinho!" })}
          >
            <ShoppingCart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
