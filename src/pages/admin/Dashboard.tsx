import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { formatBRL } from "@/lib/exportCsv";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalOrders: 0, totalRevenue: 0, totalCustomers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [products, orders, profiles] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

      setStats({
        totalProducts: products.count || 0,
        totalOrders: orders.data?.length || 0,
        totalRevenue,
        totalCustomers: profiles.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Produtos", value: stats.totalProducts, icon: Package, color: "text-accent" },
    { title: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-success" },
    { title: "Receita", value: formatBRL(stats.totalRevenue), icon: DollarSign, color: "text-accent" },
    { title: "Clientes", value: stats.totalCustomers, icon: Users, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground font-sans mt-1">Visão geral da sua loja</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Card className="shadow-premium border-0 hover:shadow-premium-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-sans text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold font-sans mt-1">{card.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl bg-muted flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="shadow-premium border-0">
        <CardHeader>
          <CardTitle className="font-display text-xl">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-sans text-sm">Nenhuma atividade recente. Comece adicionando produtos!</p>
        </CardContent>
      </Card>
    </div>
  );
}
