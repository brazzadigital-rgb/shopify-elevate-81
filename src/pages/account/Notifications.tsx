import { useState, useEffect } from "react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Trash2, Search, Package, CreditCard, Truck } from "lucide-react";
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
];

const FILTER_TYPES: Record<string, string[]> = {
  orders: ["order_created", "order_canceled"],
  payments: ["payment_paid"],
  shipping: ["order_shipped", "order_delivered"],
};

export default function CustomerNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, fetchMore } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [allNotifs, setAllNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setAllNotifs(notifications); }, [notifications]);

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
    if (n.entity_type === "order" && n.entity_id) navigate(`/conta/pedidos/${n.entity_id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          Notificações
          {unreadCount > 0 && <Badge className="bg-accent text-white text-xs">{unreadCount}</Badge>}
        </h2>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs gap-1">
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas
          </Button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all",
              filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <f.icon className="w-3.5 h-3.5" />
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma notificação</p>
          </div>
        ) : (
          filtered.map(n => (
            <Card
              key={n.id}
              className={cn("p-4 cursor-pointer hover:shadow-md transition-all group", !n.is_read && "border-accent/20 bg-accent/[0.02]")}
              onClick={() => handleClick(n)}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base shrink-0">
                  {n.type === "order_created" ? "✅" :
                   n.type === "payment_paid" ? "💰" :
                   n.type === "order_shipped" ? "📦" :
                   n.type === "order_delivered" ? "🎉" : "🔔"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", !n.is_read ? "font-bold" : "text-muted-foreground")}>{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                <Button
                  variant="ghost" size="icon"
                  className="opacity-0 group-hover:opacity-100 shrink-0 h-8 w-8"
                  onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {filtered.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" onClick={async () => {
            setLoading(true);
            const last = allNotifs[allNotifs.length - 1];
            const more = await fetchMore(last?.created_at);
            setAllNotifs(p => [...p, ...more]);
            setLoading(false);
          }} disabled={loading}>
            {loading ? "Carregando..." : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  );
}
