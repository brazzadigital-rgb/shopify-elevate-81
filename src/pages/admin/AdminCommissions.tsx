import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Percent, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Commission {
  id: string;
  order_id: string | null;
  seller_id: string;
  sale_amount: number;
  commission_rate: number;
  commission_amount: number;
  payment_status: string;
  paid_at: string | null;
  created_at: string;
  sellers?: { name: string } | null;
  orders?: { order_number: string } | null;
}

export default function AdminCommissions() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*, sellers(name), orders(order_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Commission[];
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commissions").update({ payment_status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-commissions"] });
      toast({ title: "Comissão marcada como paga" });
    },
  });

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusColor: Record<string, string> = {
    pending: "bg-warning/10 text-warning border-warning/20",
    paid: "bg-success/10 text-success border-success/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };
  const statusLabel: Record<string, string> = { pending: "Pendente", paid: "Pago", cancelled: "Cancelado" };

  const filtered = commissions.filter(c => {
    if (statusFilter !== "all" && c.payment_status !== statusFilter) return false;
    if (search && !(c.sellers?.name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPending = commissions.filter(c => c.payment_status === "pending").reduce((sum, c) => sum + Number(c.commission_amount), 0);
  const totalPaid = commissions.filter(c => c.payment_status === "paid").reduce((sum, c) => sum + Number(c.commission_amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Comissões</h1>
        <p className="text-sm text-muted-foreground font-sans">Acompanhe e gerencie comissões dos vendedores</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">Total Pendente</p>
          <p className="text-2xl font-display font-bold text-warning mt-1">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">Total Pago</p>
          <p className="text-2xl font-display font-bold text-success mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">Total Registros</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{commissions.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar vendedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Vendedor</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Pedido</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Venda</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Comissão</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                <Percent className="w-10 h-10 mx-auto mb-2 opacity-30" />
                Nenhuma comissão encontrada
              </td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{c.sellers?.name || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">#{c.orders?.order_number || "—"}</td>
                <td className="px-4 py-3">{formatCurrency(Number(c.sale_amount))}</td>
                <td className="px-4 py-3 font-semibold">{formatCurrency(Number(c.commission_amount))} <span className="text-muted-foreground font-normal">({c.commission_rate}%)</span></td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={statusColor[c.payment_status] || ""}>
                    {statusLabel[c.payment_status] || c.payment_status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.payment_status === "pending" && (
                    <Button variant="ghost" size="sm" className="rounded-lg text-success gap-1" onClick={() => markPaidMutation.mutate(c.id)}>
                      <CheckCircle className="w-4 h-4" /> Pagar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
