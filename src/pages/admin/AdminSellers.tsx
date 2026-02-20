import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserCheck, Pencil, Trash2, Copy } from "lucide-react";
import { toast as toastFn } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Seller {
  id: string; name: string; email: string; phone: string | null; document: string | null;
  status: string; monthly_goal: number; commission_rate: number; referral_code: string | null;
  user_id: string | null; created_at: string;
}

const emptyForm = { name: "", email: "", phone: "", document: "", status: "active", monthly_goal: 0, commission_rate: 0 };

export default function AdminSellers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: sellers = [], isLoading } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sellers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Seller[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, monthly_goal: Number(form.monthly_goal), commission_rate: Number(form.commission_rate) };
      if (editing) {
        const { error } = await supabase.from("sellers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sellers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
      setDialogOpen(false); setEditing(null); setForm(emptyForm);
      toast({ title: editing ? "Vendedor atualizado" : "Vendedor criado" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sellers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sellers"] }); toast({ title: "Vendedor removido" }); },
  });

  const openEdit = (s: Seller) => {
    setEditing(s);
    setForm({ name: s.name, email: s.email, phone: s.phone || "", document: s.document || "", status: s.status, monthly_goal: s.monthly_goal, commission_rate: s.commission_rate });
    setDialogOpen(true);
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const filtered = sellers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-sm mt-1" style={{ color: `hsl(var(--admin-text-secondary))` }}>Gerencie sua equipe de vendas</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Novo Vendedor
        </button>
      </div>

      <div className="admin-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `hsl(var(--admin-text-secondary))` }} />
          <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl border-0 bg-muted/30 text-sm" />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid hsl(var(--admin-border))` }}>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: `hsl(var(--admin-text-secondary))` }}>Vendedor</th>
                  <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-semibold hidden md:table-cell" style={{ color: `hsl(var(--admin-text-secondary))` }}>Email</th>
                  <th className="text-center px-4 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: `hsl(var(--admin-text-secondary))` }}>Status</th>
                  <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell" style={{ color: `hsl(var(--admin-text-secondary))` }}>Meta Mensal</th>
                  <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell" style={{ color: `hsl(var(--admin-text-secondary))` }}>Comissão</th>
                  <th className="text-center px-4 py-3 text-[11px] uppercase tracking-wider font-semibold hidden lg:table-cell" style={{ color: `hsl(var(--admin-text-secondary))` }}>Código</th>
                  <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider font-semibold" style={{ color: `hsl(var(--admin-text-secondary))` }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center py-12" style={{ color: `hsl(var(--admin-text-secondary))` }}>Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                    <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    Nenhum vendedor encontrado
                  </td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="transition-colors hover:bg-muted/20" style={{ borderBottom: `1px solid hsl(var(--admin-border-subtle))` }}>
                    <td className="px-4 py-3.5 font-medium">{s.name}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell" style={{ color: `hsl(var(--admin-text-secondary))` }}>{s.email}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`admin-status-pill text-[10px] ${s.status === "active" ? "admin-status-success" : "admin-status-danger"}`}>
                        {s.status === "active" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell" style={{ color: `hsl(var(--admin-text-secondary))` }}>{formatCurrency(s.monthly_goal)}</td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell" style={{ color: `hsl(var(--admin-text-secondary))` }}>{s.commission_rate}%</td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      {s.referral_code && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${s.referral_code}`); toastFn({ title: "Link copiado!" }); }}
                          className="inline-flex items-center gap-1 text-xs hover:text-foreground font-mono" style={{ color: `hsl(var(--admin-text-secondary))` }}
                        >
                          <Copy className="w-3 h-3" /> {s.referral_code}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="rounded-lg w-8 h-8" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-lg w-8 h-8 text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editing ? "Editar Vendedor" : "Novo Vendedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl border-0 bg-muted/30" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl border-0 bg-muted/30" /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl border-0 bg-muted/30" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Documento</Label><Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} className="rounded-xl border-0 bg-muted/30" /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="rounded-xl border-0 bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Meta Mensal (R$)</Label><Input type="number" value={form.monthly_goal} onChange={e => setForm(f => ({ ...f, monthly_goal: Number(e.target.value) }))} className="rounded-xl border-0 bg-muted/30" /></div>
              <div><Label>Comissão (%)</Label><Input type="number" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))} className="rounded-xl border-0 bg-muted/30" /></div>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.email || saveMutation.isPending} className="rounded-xl">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
