import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck, ShieldOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setProfiles((profileData as Profile[]) || []);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("user_id");
    const counts: Record<string, number> = {};
    ordersData?.forEach((o: any) => {
      if (o.user_id) counts[o.user_id] = (counts[o.user_id] || 0) + 1;
    });
    setOrderCounts(counts);

    // Fetch roles for all users
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role");
    const roles: Record<string, string[]> = {};
    rolesData?.forEach((r: any) => {
      if (!roles[r.user_id]) roles[r.user_id] = [];
      roles[r.user_id].push(r.role);
    });
    setUserRoles(roles);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleAdmin = async (userId: string) => {
    setToggling(userId);
    const isAdmin = userRoles[userId]?.includes("admin");

    if (isAdmin) {
      // Remove admin role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Papel admin removido" });
      }
    } else {
      // Add admin role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" } as any);
      if (error) {
        toast({ title: "Erro", description: error.message?.includes("duplicate") ? "Usuário já é admin" : error.message, variant: "destructive" });
      } else {
        toast({ title: "Usuário promovido a admin" });
      }
    }

    await fetchData();
    setToggling(null);
  };

  const isAdmin = (userId: string) => userRoles[userId]?.includes("admin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Clientes</h1>
        <p className="text-muted-foreground font-sans mt-1 text-sm">Lista de clientes cadastrados</p>
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
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-sans">Nome</TableHead>
                      <TableHead className="font-sans">Telefone</TableHead>
                      <TableHead className="font-sans">Pedidos</TableHead>
                      <TableHead className="font-sans">Papel</TableHead>
                      <TableHead className="font-sans">Cadastro</TableHead>
                      <TableHead className="font-sans text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-sans font-medium">{p.full_name || "Sem nome"}</TableCell>
                        <TableCell className="font-sans text-sm text-muted-foreground">{p.phone || "—"}</TableCell>
                        <TableCell className="font-sans">{orderCounts[p.user_id] || 0}</TableCell>
                        <TableCell>
                          {isAdmin(p.user_id) ? (
                            <Badge className="bg-accent/15 text-accent border-accent/30 font-sans text-[11px]">Admin</Badge>
                          ) : (
                            <Badge variant="secondary" className="font-sans text-[11px]">Cliente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-sans text-sm text-muted-foreground">
                          {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-sans"
                            disabled={toggling === p.user_id}
                            onClick={() => toggleAdmin(p.user_id)}
                          >
                            {isAdmin(p.user_id) ? (
                              <><ShieldOff className="w-3.5 h-3.5" /> Remover Admin</>
                            ) : (
                              <><ShieldCheck className="w-3.5 h-3.5" /> Tornar Admin</>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-border">
                {profiles.map((p) => (
                  <div key={p.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-sans font-medium text-sm">{p.full_name || "Sem nome"}</p>
                      {isAdmin(p.user_id) ? (
                        <Badge className="bg-accent/15 text-accent border-accent/30 font-sans text-[10px]">Admin</Badge>
                      ) : (
                        <Badge variant="secondary" className="font-sans text-[10px]">Cliente</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-sans">
                      <span>{p.phone || "Sem telefone"}</span>
                      <span>{orderCounts[p.user_id] || 0} pedidos</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-sans">
                        Desde {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-[11px] font-sans"
                        disabled={toggling === p.user_id}
                        onClick={() => toggleAdmin(p.user_id)}
                      >
                        {isAdmin(p.user_id) ? (
                          <><ShieldOff className="w-3 h-3" /> Remover</>
                        ) : (
                          <><ShieldCheck className="w-3 h-3" /> Admin</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
