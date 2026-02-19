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
  Truck, CreditCard, Clock
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
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmado", color: "bg-primary/10 text-primary" },
  processing: { label: "Em Separação", color: "bg-accent/10 text-accent" },
  shipped: { label: "Enviado", color: "bg-accent/10 text-accent" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "Cancelado", color: "bg-destructive/10 text-destructive" },
};

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-muted text-muted-foreground" },
  paid: { label: "Pago", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  failed: { label: "Falhou", color: "bg-destructive/10 text-destructive" },
  refunded: { label: "Reembolsado", color: "bg-muted text-muted-foreground" },
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
      <Card className="border-0 shadow-premium">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9 rounded-lg font-sans" placeholder="Buscar pedido, cliente, email, rastreio..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] rounded-lg font-sans text-sm"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="w-[150px] rounded-lg font-sans text-sm"><CreditCard className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Pagamento</SelectItem>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterShipment} onValueChange={setFilterShipment}>
              <SelectTrigger className="w-[150px] rounded-lg font-sans text-sm"><Truck className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Envio</SelectItem>
                {Object.entries(SHIPMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="shadow-premium border-0 overflow-hidden hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-40" />
              <p className="font-sans text-lg">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans text-xs">Pedido</TableHead>
                  <TableHead className="font-sans text-xs">Data</TableHead>
                  <TableHead className="font-sans text-xs">Cliente</TableHead>
                  <TableHead className="font-sans text-xs">Total</TableHead>
                  <TableHead className="font-sans text-xs">Pagamento</TableHead>
                  <TableHead className="font-sans text-xs">Envio</TableHead>
                  <TableHead className="font-sans text-xs">Rastreio</TableHead>
                  <TableHead className="font-sans text-xs">Status</TableHead>
                  <TableHead className="font-sans text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
                  const pt = PAYMENT_LABELS[order.payment_status] || PAYMENT_LABELS.pending;
                  return (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-sans font-semibold text-sm">#{order.order_number}</TableCell>
                      <TableCell className="font-sans text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        <br />
                        <span className="text-[10px]">{new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-sans">
                          <p className="text-sm font-medium truncate max-w-[150px]">{order.customer_name || "—"}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{order.customer_email || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans font-semibold text-sm whitespace-nowrap">R$ {Number(order.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={`${pt.color} border-0 text-[10px] font-sans`}>{pt.label}</Badge>
                          {order.payment_method && <p className="text-[10px] text-muted-foreground font-sans">{order.payment_method}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-muted text-muted-foreground border-0 text-[10px] font-sans">
                          {SHIPMENT_LABELS[order.shipment_status || "pending"] || "Aguardando"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.tracking_code ? (
                          <button onClick={() => copyTracking(order.tracking_code!, order.id)} className="inline-flex items-center gap-1 text-[11px] font-mono font-sans text-accent hover:underline">
                            {copiedId === order.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {order.tracking_code.slice(0, 13)}
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-sans">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${st.color} border-0 text-[10px] font-sans`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                            <Link to={`/admin/pedidos/${order.id}`}><Eye className="w-4 h-4" /></Link>
                          </Button>
                        </div>
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
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mb-4 opacity-40" />
            <p className="font-sans text-lg">Nenhum pedido encontrado</p>
          </div>
        ) : filteredOrders.map(order => {
          const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
          const pt = PAYMENT_LABELS[order.payment_status] || PAYMENT_LABELS.pending;
          return (
            <Link key={order.id} to={`/admin/pedidos/${order.id}`}>
              <Card className="border-0 shadow-premium hover:shadow-premium-lg transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm font-bold">#{order.order_number}</span>
                    <span className="text-xs text-muted-foreground font-sans">
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium truncate">{order.customer_name || "—"}</p>
                      <p className="font-sans text-xs text-muted-foreground truncate">{order.customer_email || ""}</p>
                    </div>
                    <span className="font-sans text-sm font-bold shrink-0 ml-2">R$ {Number(order.total).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${st.color} border-0 text-[10px] font-sans`}>{st.label}</Badge>
                    <Badge className={`${pt.color} border-0 text-[10px] font-sans`}>{pt.label}</Badge>
                    {order.tracking_code && (
                      <Badge className="bg-accent/10 text-accent border-0 text-[10px] font-sans">
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
