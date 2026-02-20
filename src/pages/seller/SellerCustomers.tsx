import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Phone } from "lucide-react";
import { motion } from "framer-motion";

export default function SellerCustomers() {
  const { sellerId } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    const load = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("customer_name, customer_email, customer_phone, total, created_at")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      // Group by email
      const map = new Map<string, { name: string; email: string; phone: string; totalSpent: number; purchases: number; lastPurchase: string }>();
      (orders || []).forEach((o: any) => {
        const key = o.customer_email || o.customer_name || "unknown";
        const existing = map.get(key);
        if (existing) {
          existing.totalSpent += Number(o.total);
          existing.purchases += 1;
          if (o.created_at > existing.lastPurchase) existing.lastPurchase = o.created_at;
        } else {
          map.set(key, { name: o.customer_name || "—", email: o.customer_email || "", phone: o.customer_phone || "", totalSpent: Number(o.total), purchases: 1, lastPurchase: o.created_at });
        }
      });
      setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
      setLoading(false);
    };
    load();
  }, [sellerId]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-60 rounded-2xl" /></div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Meus Clientes</h1>
        <p className="text-sm text-muted-foreground font-sans mt-1">{customers.length} clientes</p>
      </motion.div>

      <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-sans">Nenhum cliente ainda</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {customers.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-sans truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(c.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">{c.purchases} compra{c.purchases > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
