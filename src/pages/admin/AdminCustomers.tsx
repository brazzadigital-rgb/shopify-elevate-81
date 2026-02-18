import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

export default function AdminCustomers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetch = async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      setProfiles((profileData as Profile[]) || []);

      // Fetch order counts per user
      const { data: ordersData } = await supabase
        .from("orders")
        .select("user_id");
      const counts: Record<string, number> = {};
      ordersData?.forEach((o: any) => {
        if (o.user_id) counts[o.user_id] = (counts[o.user_id] || 0) + 1;
      });
      setOrderCounts(counts);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Clientes</h1>
        <p className="text-muted-foreground font-sans mt-1">Lista de clientes cadastrados</p>
      </div>

      <Card className="shadow-premium border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : profiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-40" />
              <p className="font-sans text-lg">Nenhum cliente cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Nome</TableHead>
                  <TableHead className="font-sans">Telefone</TableHead>
                  <TableHead className="font-sans">Pedidos</TableHead>
                  <TableHead className="font-sans">Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-sans font-medium">{p.full_name || "Sem nome"}</TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">{p.phone || "—"}</TableCell>
                    <TableCell className="font-sans">{orderCounts[p.user_id] || 0}</TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
