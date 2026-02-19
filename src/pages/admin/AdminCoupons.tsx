import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumToggle3D } from "@/components/ui/premium-toggle-3d";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBRL } from "@/lib/exportCsv";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Cupons</h1>
          <p className="text-muted-foreground font-sans mt-1">Gerencie cupons de desconto</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyCoupon); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shine h-11 font-sans"><Plus className="w-4 h-4" /> Novo Cupom</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{editingId ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Código *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PROMO10" className="h-11 rounded-xl uppercase" />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Descrição</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">Tipo</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">Valor</Label>
                  <Input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">Pedido mínimo (R$)</Label>
                  <Input type="number" step="0.01" value={form.min_order_value || ""} onChange={(e) => setForm({ ...form, min_order_value: parseFloat(e.target.value) || null })} className="h-11 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">Máx. usos</Label>
                  <Input type="number" value={form.max_uses || ""} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || null })} className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Expira em</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <PremiumToggle3D size="sm" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="font-sans text-sm">Ativo</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl shine font-sans">
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar cupom"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-premium border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Tag className="w-12 h-12 mb-4 opacity-40" />
              <p className="font-sans text-lg">Nenhum cupom cadastrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Código</TableHead>
                  <TableHead className="font-sans">Desconto</TableHead>
                  <TableHead className="font-sans">Usos</TableHead>
                  <TableHead className="font-sans">Status</TableHead>
                  <TableHead className="font-sans text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-sans font-bold">{c.code}</TableCell>
                    <TableCell className="font-sans">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : formatBRL(Number(c.discount_value))}
                    </TableCell>
                    <TableCell className="font-sans text-sm">
                      {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.is_active ? "default" : "secondary"} className="text-xs font-sans">
                        {c.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
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
