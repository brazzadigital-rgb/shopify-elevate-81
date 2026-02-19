import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Package, MapPin, Copy, Check, Truck,
  Clock, CheckCircle2, AlertCircle, Loader2, MessageCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface TrackingEvent {
  id: string;
  status: string;
  description: string | null;
  location: string | null;
  event_date: string;
}

interface OrderInfo {
  order_number: string;
  status: string;
  shipment_status: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  shipping_method: string | null;
  shipping_days: number | null;
  created_at: string;
  customer_name: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground", icon: <Clock className="w-3.5 h-3.5" /> },
  confirmed: { label: "Confirmado", color: "bg-primary/10 text-primary", icon: <Check className="w-3.5 h-3.5" /> },
  processing: { label: "Em preparo", color: "bg-primary/10 text-primary", icon: <Package className="w-3.5 h-3.5" /> },
  shipped: { label: "Enviado", color: "bg-accent/10 text-accent", icon: <Truck className="w-3.5 h-3.5" /> },
  in_transit: { label: "Em trânsito", color: "bg-accent/10 text-accent", icon: <Truck className="w-3.5 h-3.5" /> },
  delivered: { label: "Entregue", color: "bg-success/10 text-success", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  failed: { label: "Falha", color: "bg-destructive/10 text-destructive", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export default function TrackOrderPage() {
  const { getSetting, isEnabled } = useStoreSettings();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const whatsappEnabled = isEnabled("whatsapp_enabled");
  const whatsappNumber = getSetting("whatsapp_number", "");

  const search = async (mode: "order" | "tracking") => {
    setLoading(true);
    setError("");
    setOrder(null);
    setEvents([]);

    try {
      const body = mode === "tracking"
        ? { tracking_code: trackingCode.trim() }
        : { order_number: orderNumber.trim(), email: email.trim() };

      const { data, error: fnError } = await supabase.functions.invoke("track-order", { body });

      if (fnError) throw fnError;
      if (data?.error) {
        setError(data.error);
      } else {
        setOrder(data.order);
        setEvents(data.events || []);
      }
    } catch {
      setError("Erro ao buscar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copyTracking = () => {
    if (order?.tracking_code) {
      navigator.clipboard.writeText(order.tracking_code);
      setCopied(true);
      toast({ title: "Código copiado!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const statusInfo = order ? STATUS_MAP[order.shipment_status || order.status] || STATUS_MAP.pending : null;

  return (
    <div className="container max-w-2xl py-10 md:py-16 px-4">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Package className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Rastrear Pedido</h1>
        <p className="text-muted-foreground font-sans text-sm mt-2">
          Acompanhe o status da sua encomenda em tempo real
        </p>
      </div>

      <Card className="border-0 shadow-premium mb-8">
        <CardContent className="p-5 md:p-6">
          <Tabs defaultValue="order" className="w-full">
            <TabsList className="w-full mb-4 rounded-xl">
              <TabsTrigger value="order" className="flex-1 rounded-lg font-sans text-sm">Nº do Pedido</TabsTrigger>
              <TabsTrigger value="tracking" className="flex-1 rounded-lg font-sans text-sm">Código de Rastreio</TabsTrigger>
            </TabsList>

            <TabsContent value="order" className="space-y-3">
              <div>
                <Label className="font-sans text-sm">Número do pedido</Label>
                <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value.toUpperCase())} placeholder="ORD-XXXXXX" className="mt-1 rounded-xl h-11 font-sans" />
              </div>
              <div>
                <Label className="font-sans text-sm">E-mail cadastrado</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" type="email" className="mt-1 rounded-xl h-11 font-sans" />
              </div>
              <Button onClick={() => search("order")} disabled={loading || !orderNumber || !email} className="w-full h-11 rounded-xl font-sans font-bold shine">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Buscar Pedido</>}
              </Button>
            </TabsContent>

            <TabsContent value="tracking" className="space-y-3">
              <div>
                <Label className="font-sans text-sm">Código de rastreio</Label>
                <Input value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())} placeholder="Ex: BR123456789XX" className="mt-1 rounded-xl h-11 font-sans" />
              </div>
              <Button onClick={() => search("tracking")} disabled={loading || !trackingCode} className="w-full h-11 rounded-xl font-sans font-bold shine">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Rastrear</>}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-sans text-sm text-muted-foreground">{error}</p>
        </motion.div>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      )}

      <AnimatePresence>
        {order && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Status card */}
            <Card className="border-0 shadow-premium">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider mb-1">Pedido</p>
                    <p className="font-display text-lg font-bold">{order.order_number}</p>
                    {order.customer_name && (
                      <p className="font-sans text-sm text-muted-foreground mt-0.5">{order.customer_name}</p>
                    )}
                  </div>
                  {statusInfo && (
                    <Badge className={`${statusInfo.color} font-sans text-xs gap-1.5 px-3 py-1.5 rounded-full border-0`}>
                      {statusInfo.icon} {statusInfo.label}
                    </Badge>
                  )}
                </div>

                {order.tracking_code && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/50 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-sans text-xs text-muted-foreground">Código de rastreio</p>
                      <p className="font-sans text-sm font-bold font-mono truncate">{order.tracking_code}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={copyTracking} className="shrink-0 rounded-lg">
                      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                )}

                {order.shipping_method && (
                  <p className="font-sans text-xs text-muted-foreground mt-3">
                    Método: {order.shipping_method}
                    {order.shipping_days ? ` • Prazo: ${order.shipping_days} dias úteis` : ""}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="border-0 shadow-premium">
              <CardContent className="p-5 md:p-6">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground mb-5">
                  Histórico de Rastreamento
                </h3>

                {events.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="font-sans text-sm text-muted-foreground">
                      Aguardando atualizações de rastreamento
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-5">
                      {events.map((evt, i) => {
                        const isFirst = i === 0;
                        return (
                          <motion.div
                            key={evt.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="relative flex gap-4 pl-0"
                          >
                            <div className={`relative z-10 w-[31px] h-[31px] rounded-full flex items-center justify-center shrink-0 ${
                              isFirst ? "bg-accent text-accent-foreground" : "bg-muted border border-border"
                            }`}>
                              {isFirst ? <Truck className="w-3.5 h-3.5" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
                            </div>
                            <div className="pb-1 min-w-0">
                              <p className={`font-sans text-sm font-semibold ${isFirst ? "text-foreground" : "text-muted-foreground"}`}>
                                {evt.description || evt.status}
                              </p>
                              {evt.location && (
                                <p className="font-sans text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3" /> {evt.location}
                                </p>
                              )}
                              <p className="font-sans text-xs text-muted-foreground/60 mt-0.5">
                                {new Date(evt.event_date).toLocaleDateString("pt-BR", {
                                  day: "2-digit", month: "2-digit", year: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* WhatsApp CTA */}
            {whatsappEnabled && whatsappNumber && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-sans gap-2"
                onClick={() => {
                  const msg = `Olá! Gostaria de informações sobre meu pedido ${order.order_number}`;
                  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
                }}
              >
                <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
