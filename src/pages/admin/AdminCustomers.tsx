import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ShieldCheck, ShieldOff, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    const { data: profileData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setProfiles((profileData as Profile[]) || []);

    const { data: ordersData } = await supabase.from("orders").select("user_id");
    const counts: Record<string, number> = {};
    ordersData?.forEach((o: any) => { if (o.user_id) counts[o.user_id] = (counts[o.user_id] || 0) + 1; });
    setOrderCounts(counts);

    const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");
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
    const admin = userRoles[userId]?.includes("admin");
    if (admin) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Papel admin removido" });
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" } as any);
      if (error) toast({ title: "Erro", description: error.message?.includes("duplicate") ? "Já é admin" : error.message, variant: "destructive" });
      else toast({ title: "Promovido a admin" });
    }
    await fetchData();
    setToggling(null);
  };

  const isAdmin = (userId: string) => userRoles[userId]?.includes("admin");

  const filtered = profiles.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm mt-1" style={{ color: `hsl(var(--admin-text-secondary))` }}>{filtered.length} cliente(s) cadastrado(s)</p>
        </div>
      </div>

      {/* Search */}
      <div className="admin-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `hsl(var(--admin-text-secondary))` }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="pl-9 h-10 rounded-xl border-0 bg-muted/30 text-sm" />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="admin-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Users className="w-12 h-12 mb-4" style={{ color: `hsl(var(--admin-text-secondary) / 0.3)` }} />
            <p className="text-base font-medium" style={{ color: `hsl(var(--admin-text-secondary))` }}>Nenhum cliente encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderBottom: `1px solid hsl(var(--admin-border))` }}>
                    {["Nome", "Telefone", "Pedidos", "Papel", "Cadastro", ""].map(h => (
                      <TableHead key={h} className={`text-[11px] uppercase tracking-wider font-semibold ${h === "" ? "text-right" : ""}`} style={{ color: `hsl(var(--admin-text-secondary))` }}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="transition-colors" style={{ borderBottom: `1px solid hsl(var(--admin-border-subtle))` }}>
                      <TableCell className="text-sm font-medium py-3.5">{p.full_name || "Sem nome"}</TableCell>
                      <TableCell className="text-sm py-3.5" style={{ color: `hsl(var(--admin-text-secondary))` }}>{p.phone || "—"}</TableCell>
                      <TableCell className="text-sm py-3.5 font-medium">{orderCounts[p.user_id] || 0}</TableCell>
                      <TableCell className="py-3.5">
                        <span className={`admin-status-pill text-[10px] ${isAdmin(p.user_id) ? "admin-status-info" : ""}`}
                          style={!isAdmin(p.user_id) ? { background: `hsl(var(--muted))`, color: `hsl(var(--admin-text-secondary))` } : {}}>
                          {isAdmin(p.user_id) ? "Admin" : "Cliente"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm py-3.5" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right py-3.5">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs rounded-lg" disabled={toggling === p.user_id} onClick={() => toggleAdmin(p.user_id)}>
                          {isAdmin(p.user_id) ? <><ShieldOff className="w-3.5 h-3.5" /> Remover</> : <><ShieldCheck className="w-3.5 h-3.5" /> Admin</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y" style={{ borderColor: `hsl(var(--admin-border-subtle))` }}>
              {filtered.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{p.full_name || "Sem nome"}</p>
                    <span className={`admin-status-pill text-[10px] ${isAdmin(p.user_id) ? "admin-status-info" : ""}`}
                      style={!isAdmin(p.user_id) ? { background: `hsl(var(--muted))`, color: `hsl(var(--admin-text-secondary))` } : {}}>
                      {isAdmin(p.user_id) ? "Admin" : "Cliente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                    <span>{p.phone || "Sem telefone"}</span>
                    <span>{orderCounts[p.user_id] || 0} pedidos</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px]" style={{ color: `hsl(var(--admin-text-secondary))` }}>Desde {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] rounded-lg" disabled={toggling === p.user_id} onClick={() => toggleAdmin(p.user_id)}>
                      {isAdmin(p.user_id) ? <><ShieldOff className="w-3 h-3" /> Remover</> : <><ShieldCheck className="w-3 h-3" /> Admin</>}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
