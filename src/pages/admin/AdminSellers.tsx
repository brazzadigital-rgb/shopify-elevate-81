import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, UserCheck, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  status: string;
  monthly_goal: number;
  commission_rate: number;
  created_at: string;
}

const emptyForm = {
  name: "", email: "", phone: "", document: "", status: "active", monthly_goal: 0, commission_rate: 0,
};

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
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      toast({ title: editing ? "Vendedor atualizado" : "Vendedor criado" });
    },
    onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sellers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sellers"] });
      toast({ title: "Vendedor removido" });
    },
  });

  const openEdit = (s: Seller) => {
    setEditing(s);
    setForm({
      name: s.name, email: s.email, phone: s.phone || "", document: s.document || "",
      status: s.status, monthly_goal: s.monthly_goal, commission_rate: s.commission_rate,
    });
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
          <h1 className="text-2xl font-display font-bold text-foreground">Vendedores</h1>
          <p className="text-sm text-muted-foreground font-sans">Gerencie sua equipe de vendas</p>
        </div>
        <Button onClick={openNew} className="bg-accent text-accent-foreground font-sans font-bold rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Novo Vendedor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Vendedor</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Meta Mensal</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Comissão</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">
                <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                Nenhum vendedor encontrado
              </td></tr>
            ) : filtered.map(s => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.status === "active" ? "default" : "secondary"} className={s.status === "active" ? "bg-success/10 text-success border-success/20" : ""}>
                    {s.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{formatCurrency(s.monthly_goal)}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{s.commission_rate}%</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="rounded-lg w-8 h-8" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="rounded-lg w-8 h-8 text-destructive" onClick={() => deleteMutation.mutate(s.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Editar Vendedor" : "Novo Vendedor"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Documento</Label><Input value={form.document} onChange={e => setForm(f => ({ ...f, document: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Meta Mensal (R$)</Label><Input type="number" value={form.monthly_goal} onChange={e => setForm(f => ({ ...f, monthly_goal: Number(e.target.value) }))} /></div>
              <div><Label>Comissão (%)</Label><Input type="number" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: Number(e.target.value) }))} /></div>
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || !form.email || saveMutation.isPending} className="bg-accent text-accent-foreground font-bold rounded-xl">
              {saveMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
