import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    const fetch = async () => {
      const [o, i] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id),
      ]);
      setOrder(o.data);
      setItems(i.data || []);
      setLoading(false);
    };
    fetch();
  }, [user, id]);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!order) return <div className="text-center py-12"><p className="font-sans">Pedido não encontrado</p></div>;

  const addr = order.shipping_address as any;

  return (
    <div className="space-y-6">
      <Link to="/conta/pedidos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-sans transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar aos pedidos
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="font-display text-xl font-bold">{order.order_number}</h2>
        <Badge className="font-sans text-xs">{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-premium">
          <CardHeader><CardTitle className="font-display text-base">Dados do Cliente</CardTitle></CardHeader>
          <CardContent className="font-sans text-sm space-y-1">
            <p><strong>Nome:</strong> {order.customer_name}</p>
            <p><strong>Email:</strong> {order.customer_email}</p>
            <p><strong>Telefone:</strong> {order.customer_phone}</p>
          </CardContent>
        </Card>

        {addr && (
          <Card className="border-0 shadow-premium">
            <CardHeader><CardTitle className="font-display text-base">Endereço de Entrega</CardTitle></CardHeader>
            <CardContent className="font-sans text-sm space-y-1">
              <p>{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
              <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
              <p>CEP: {addr.zip_code}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="border-0 shadow-premium">
        <CardHeader><CardTitle className="font-display text-base">Itens do Pedido</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-sans text-sm font-medium">{item.product_name}</p>
                  {item.variant_name && <p className="font-sans text-xs text-muted-foreground">{item.variant_name}</p>}
                  <p className="font-sans text-xs text-muted-foreground">Qtd: {item.quantity} × R$ {Number(item.unit_price).toFixed(2)}</p>
                </div>
                <span className="font-sans text-sm font-bold">R$ {Number(item.total_price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t space-y-1 font-sans text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {Number(order.subtotal).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ {Number(order.shipping_cost).toFixed(2)}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-success"><span>Desconto</span><span>-R$ {Number(order.discount).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-2"><span>Total</span><span>R$ {Number(order.total).toFixed(2)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
