import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumToggle3D } from "@/components/ui/premium-toggle-3d";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/exportCsv";
import { motion } from "framer-motion";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
}

const emptyCoupon = {
  code: "", description: "", discount_type: "percentage", discount_value: 0,
  min_order_value: null as number | null, max_uses: null as number | null,
  is_active: true, expires_at: "",
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCoupon);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as Coupon[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleSave = async () => {
    if (!form.code) { toast({ title: "Código obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      ...form,
      code: form.code.toUpperCase(),
      discount_value: Number(form.discount_value),
      min_order_value: form.min_order_value ? Number(form.min_order_value) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    };

    if (editingId) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingId);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Cupom atualizado!" });
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Cupom criado!" });
    }

    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyCoupon);
    fetchCoupons();
  };

  const handleEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code, description: c.description || "",
      discount_type: c.discount_type, discount_value: c.discount_value,
      min_order_value: c.min_order_value, max_uses: c.max_uses,
      is_active: c.is_active, expires_at: c.expires_at?.split("T")[0] || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Cupom removido" }); fetchCoupons(); }
  };

  const filtered = coupons.filter(c => {
    if (!search.trim()) return true;
    return c.code.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cupons</h1>
          <p className="text-sm mt-1" style={{ color: `hsl(var(--admin-text-secondary))` }}>{filtered.length} cupom(ns) cadastrado(s)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyCoupon); } }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Novo Cupom
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">{editingId ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Código *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PROMO10" className="h-10 rounded-xl uppercase" />
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-10 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Valor</Label>
                  <Input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Pedido mínimo (R$)</Label>
                  <Input type="number" step="0.01" value={form.min_order_value || ""} onChange={(e) => setForm({ ...form, min_order_value: parseFloat(e.target.value) || null })} className="h-10 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">Máx. usos</Label>
                  <Input type="number" value={form.max_uses || ""} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || null })} className="h-10 rounded-xl" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-sm font-medium">Expira em</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="h-10 rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <PremiumToggle3D size="sm" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="text-sm">Ativo</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl w-full">
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar cupom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="admin-card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `hsl(var(--admin-text-secondary))` }} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cupom..." className="pl-9 h-10 rounded-xl border-0 bg-muted/30 text-sm" />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="admin-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Tag className="w-12 h-12 mb-4" style={{ color: `hsl(var(--admin-text-secondary) / 0.3)` }} />
            <p className="text-base font-medium" style={{ color: `hsl(var(--admin-text-secondary))` }}>Nenhum cupom encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderBottom: `1px solid hsl(var(--admin-border))` }}>
                    {["Código", "Desconto", "Usos", "Status", "Expira", ""].map(h => (
                      <TableHead key={h} className={`text-[11px] uppercase tracking-wider font-semibold ${h === "" ? "text-right" : ""}`} style={{ color: `hsl(var(--admin-text-secondary))` }}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="transition-colors" style={{ borderBottom: `1px solid hsl(var(--admin-border-subtle))` }}>
                      <TableCell className="text-sm font-bold py-3.5 font-mono">{c.code}</TableCell>
                      <TableCell className="text-sm py-3.5">
                        {c.discount_type === "percentage" ? `${c.discount_value}%` : formatBRL(Number(c.discount_value))}
                      </TableCell>
                      <TableCell className="text-sm py-3.5" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                        {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className={`admin-status-pill text-[10px] ${c.is_active ? "admin-status-success" : "admin-status-danger"}`}>
                          {c.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm py-3.5" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell className="text-right py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y" style={{ borderColor: `hsl(var(--admin-border-subtle))` }}>
              {filtered.map((c) => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold font-mono">{c.code}</span>
                    <span className={`admin-status-pill text-[10px] ${c.is_active ? "admin-status-success" : "admin-status-danger"}`}>
                      {c.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: `hsl(var(--admin-text-secondary))` }}>
                    <span>{c.discount_type === "percentage" ? `${c.discount_value}%` : formatBRL(Number(c.discount_value))}</span>
                    <span>{c.used_count} usos</span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-[11px] rounded-lg" onClick={() => handleEdit(c)}><Pencil className="w-3 h-3" /> Editar</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
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
