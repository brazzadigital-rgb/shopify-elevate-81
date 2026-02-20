import { useState, useEffect } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Search, Filter, Package, CreditCard, Truck, AlertTriangle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const FILTERS = [
  { id: "all", label: "Todas", icon: Bell },
  { id: "unread", label: "Não lidas", icon: Bell },
  { id: "orders", label: "Pedidos", icon: Package },
  { id: "payments", label: "Pagamentos", icon: CreditCard },
  { id: "shipping", label: "Entregas", icon: Truck },
  { id: "system", label: "Sistema", icon: AlertTriangle },
];

const TYPE_LABELS: Record<string, string> = {
  order_new: "Novo Pedido",
  order_created: "Pedido Criado",
  payment_paid: "Pagamento",
  order_shipped: "Enviado",
  order_delivered: "Entregue",
  order_canceled: "Cancelado",
  refund: "Reembolso",
  stock_low: "Estoque Baixo",
  system: "Sistema",
  marketing: "Marketing",
};

const FILTER_TYPES: Record<string, string[]> = {
  orders: ["order_new", "order_created", "order_canceled"],
  payments: ["payment_paid", "refund"],
  shipping: ["order_shipped", "order_delivered"],
  system: ["system", "stock_low", "marketing"],
};

export default function AdminNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchMore } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [allNotifs, setAllNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setAllNotifs(notifications);
  }, [notifications]);

  const loadMore = async () => {
    if (allNotifs.length === 0) return;
    setLoading(true);
    const last = allNotifs[allNotifs.length - 1];
    const more = await fetchMore(last.created_at);
    setAllNotifs(prev => [...prev, ...more]);
    setLoading(false);
  };

  const filtered = allNotifs.filter(n => {
    if (filter === "unread" && n.is_read) return false;
    if (FILTER_TYPES[filter] && !FILTER_TYPES[filter].includes(n.type)) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    }
    return true;
  });

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead([n.id]);
    if (n.entity_type === "order" && n.entity_id) {
      navigate(`/admin/pedidos/${n.entity_id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            <Bell className="w-6 h-6 text-accent" />
            Notificações
            {unreadCount > 0 && (
              <Badge className="bg-accent text-white text-xs">{unreadCount} não lidas</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Central de notificações do sistema</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead} className="gap-2">
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              filter === f.id
                ? "bg-accent text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <f.icon className="w-4 h-4" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar notificações..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
          </Card>
        ) : (
          filtered.map(n => (
            <Card
              key={n.id}
              className={cn(
                "p-4 cursor-pointer hover:shadow-md transition-all duration-200 group",
                !n.is_read && "border-accent/20 bg-accent/[0.02]"
              )}
              onClick={() => handleClick(n)}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
                  n.priority === "high" ? "bg-destructive/10" : "bg-muted"
                )}>
                  {n.type === "order_new" ? "🛒" :
                   n.type === "payment_paid" ? "💰" :
                   n.type === "order_shipped" ? "📦" :
                   n.type === "order_delivered" ? "🎉" :
                   n.type === "order_canceled" ? "❌" :
                   n.type === "refund" ? "↩️" :
                   n.type === "stock_low" ? "⚠️" : "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn("text-sm", !n.is_read ? "font-bold text-foreground" : "text-muted-foreground")}>
                      {n.title}
                    </p>
                    {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                    <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                      {TYPE_LABELS[n.type] || n.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {filtered.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
