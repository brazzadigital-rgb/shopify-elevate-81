import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { exportToCsv } from "@/lib/exportCsv";
import {
  ShoppingCart, Eye, Package, Filter, Search, Download, Copy, Check,
  Truck, CreditCard, Clock, QrCode, Banknote, Wallet
} from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_provider: string | null;
  shipment_status: string | null;
  tracking_code: string | null;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  created_at: string;
  seller_id: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-muted/60 text-muted-foreground" },
  confirmed: { label: "Confirmado", color: "bg-primary/8 text-primary" },
  processing: { label: "Em Separação", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  shipped: { label: "Enviado", color: "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400" },
  delivered: { label: "Entregue", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  cancelled: { label: "Cancelado", color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" },
};

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  paid: { label: "Pago", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
  failed: { label: "Falhou", color: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" },
  refunded: { label: "Reembolsado", color: "bg-muted/60 text-muted-foreground" },
};

const SHIPMENT_LABELS: Record<string, string> = {
  pending: "Aguardando",
  created: "Criado",
  posted: "Postado",
  in_transit: "Em Trânsito",
  delivered: "Entregue",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterShipment, setFilterShipment] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (filterStatus !== "all") result = result.filter(o => o.status === filterStatus);
    if (filterPayment !== "all") result = result.filter(o => o.payment_status === filterPayment);
    if (filterShipment !== "all") result = result.filter(o => (o.shipment_status || "pending") === filterShipment);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(o =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q) ||
        o.tracking_code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, filterStatus, filterPayment, filterShipment, search]);

  const quickUpdateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Status atualizado!" }); fetchOrders(); }
  };

  const copyTracking = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Código copiado!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    const rows = filteredOrders.map(o => ({
      Pedido: o.order_number,
      Cliente: o.customer_name || "",
      Email: o.customer_email || "",
      Telefone: o.customer_phone || "",
      Status: STATUS_LABELS[o.status]?.label || o.status,
      Pagamento: PAYMENT_LABELS[o.payment_status]?.label || o.payment_status,
      Método: o.payment_method || "",
      Envio: SHIPMENT_LABELS[o.shipment_status || "pending"] || "",
      Rastreio: o.tracking_code || "",
      Total: Number(o.total).toFixed(2),
      Data: new Date(o.created_at).toLocaleDateString("pt-BR"),
    }));
    exportToCsv("pedidos", rows);
    toast({ title: "CSV exportado!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Pedidos</h1>
          <p className="text-muted-foreground font-sans text-sm mt-1">{filteredOrders.length} pedido(s)</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg font-sans gap-2 shrink-0" onClick={handleExportCsv}>
          <Download className="w-4 h-4" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-border/40 shadow-sm bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
              <Input className="pl-9 rounded-xl font-sans border-border/40 bg-background/60 focus:bg-background transition-colors" placeholder="Buscar pedido, cliente, email, rastreio..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] rounded-xl font-sans text-sm border-border/40 bg-background/60 hover:bg-background transition-colors"><Filter className="w-3 h-3 mr-1 text-muted-foreground/60" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-[150px] rounded-xl font-sans text-sm border-border/40 bg-background/60 hover:bg-background transition-colors"><CreditCard className="w-3 h-3 mr-1 text-muted-foreground/60" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Pagamento</SelectItem>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterShipment} onValueChange={setFilterShipment}>
              <SelectTrigger className="w-[150px] rounded-xl font-sans text-sm border-border/40 bg-background/60 hover:bg-background transition-colors"><Truck className="w-3 h-3 mr-1 text-muted-foreground/60" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Envio</SelectItem>
                {Object.entries(SHIPMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="border border-border/30 shadow-sm overflow-hidden hidden md:block bg-card">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-sans text-sm">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Pedido</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Data</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Cliente</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Total</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Pagamento</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Envio</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Rastreio</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium">Status</TableHead>
                  <TableHead className="font-sans text-xs uppercase tracking-wider text-muted-foreground/70 font-medium text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                  const pt = PAYMENT_LABELS[order.payment_status] || PAYMENT_LABELS.pending;
                  return (
                    <TableRow key={order.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <TableCell className="font-sans font-semibold text-sm text-foreground/90">#{order.order_number}</TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        <br />
                        <span className="text-xs text-muted-foreground/60">{new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-sans">
                          <p className="text-sm font-medium truncate max-w-[160px] text-foreground/85">{order.customer_name || "—"}</p>
                          <p className="text-xs text-muted-foreground/60 truncate max-w-[160px]">{order.customer_email || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans font-semibold text-sm whitespace-nowrap text-foreground/90">R$ {Number(order.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="secondary" className={`${pt.color} border-0 text-xs font-sans font-medium px-2.5 py-0.5 rounded-full shadow-none`}>{pt.label}</Badge>
                          {order.payment_method && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 font-sans">
                              {order.payment_method === "pix" && <QrCode className="w-3 h-3" />}
                              {order.payment_method === "boleto" && <Banknote className="w-3 h-3" />}
                              {(order.payment_method === "credit_card" || order.payment_method === "cartão") && <CreditCard className="w-3 h-3" />}
                              {!["pix", "boleto", "credit_card", "cartão"].includes(order.payment_method) && <Wallet className="w-3 h-3" />}
                              {order.payment_method}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground/70 border-0 text-xs font-sans font-medium px-2.5 py-0.5 rounded-full shadow-none">
                          {SHIPMENT_LABELS[order.shipment_status || "pending"] || "Aguardando"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.tracking_code ? (
                          <button onClick={() => copyTracking(order.tracking_code!, order.id)} className="inline-flex items-center gap-1.5 text-xs font-mono text-foreground/70 hover:text-foreground transition-colors">
                            {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {order.tracking_code.slice(0, 13)}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/40 font-sans">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${st.color} border-0 text-xs font-sans font-medium px-2.5 py-0.5 rounded-full shadow-none`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted/30 transition-colors" asChild>
                          <Link to={`/admin/pedidos/${order.id}`}><Eye className="w-4 h-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2.5">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-sans text-sm">Nenhum pedido encontrado</p>
          </div>
        ) : filteredOrders.map(order => {
          const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
          const pt = PAYMENT_LABELS[order.payment_status] || PAYMENT_LABELS.pending;
          return (
            <Link key={order.id} to={`/admin/pedidos/${order.id}`}>
              <Card className="border border-border/30 shadow-sm hover:shadow-md transition-shadow bg-card">
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm font-semibold text-foreground/90">#{order.order_number}</span>
                    <span className="text-[11px] text-muted-foreground/60 font-sans">
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium truncate text-foreground/85">{order.customer_name || "—"}</p>
                      <p className="font-sans text-[11px] text-muted-foreground/55 truncate">{order.customer_email || ""}</p>
                    </div>
                    <span className="font-sans text-sm font-semibold shrink-0 ml-2 text-foreground/90">R$ {Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className={`${st.color} border-0 text-[10px] font-sans font-medium px-2 py-0.5 rounded-full shadow-none`}>{st.label}</Badge>
                    <Badge variant="secondary" className={`${pt.color} border-0 text-[10px] font-sans font-medium px-2 py-0.5 rounded-full shadow-none`}>{pt.label}</Badge>
                    {order.tracking_code && (
                      <Badge variant="secondary" className="bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 border-0 text-[10px] font-sans font-medium px-2 py-0.5 rounded-full shadow-none">
                        <Truck className="w-3 h-3 mr-1" /> Rastreio
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
