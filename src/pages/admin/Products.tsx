import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Supplier {
  id: string;
  trade_name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  sold_count: number;
  created_at: string;
}

const emptyProduct = {
  name: "", slug: "", description: "", short_description: "",
  price: 0, compare_at_price: null as number | null,
  sku: "", stock: 0, is_active: true, is_featured: false, is_new: false,
  supplier_id: null as string | null,
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    const { data } = await supabase.from("suppliers").select("id, trade_name").eq("status", "active").order("trade_name");
    setSuppliers((data as Supplier[]) || []);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); fetchSuppliers(); }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    setSaving(true);

    const slug = form.slug || generateSlug(form.name);
    const payload = { ...form, slug, price: Number(form.price), stock: Number(form.stock), compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null };

    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Produto atualizado!" }); }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast({ title: "Erro ao criar", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Produto criado!" }); }
    }

    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyProduct);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name, slug: product.slug, description: product.description || "",
      short_description: product.short_description || "",
      price: product.price, compare_at_price: product.compare_at_price,
      sku: product.sku || "", stock: product.stock,
      is_active: product.is_active, is_featured: product.is_featured, is_new: product.is_new,
      supplier_id: (product as any).supplier_id || null,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
    else { toast({ title: "Produto removido" }); fetchProducts(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Produtos</h1>
          <p className="text-muted-foreground font-sans mt-1">Gerencie o catálogo da loja</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyProduct); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shine h-11 font-sans">
              <Plus className="w-4 h-4" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} placeholder="Nome do produto" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug-do-produto" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Descrição curta</Label>
                <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Breve descrição" className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Descrição completa</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição detalhada do produto" rows={4} className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">Preço (R$) *</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="h-11 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">Preço comparativo (R$)</Label>
                  <Input type="number" step="0.01" value={form.compare_at_price || ""} onChange={(e) => setForm({ ...form, compare_at_price: parseFloat(e.target.value) || null })} className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">SKU</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="h-11 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-sans text-sm font-medium">Estoque</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="h-11 rounded-xl" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Fornecedor</Label>
                <Select value={form.supplier_id || "none"} onValueChange={(v) => setForm({ ...form, supplier_id: v === "none" ? null : v })}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="font-sans text-sm">Nenhum</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="font-sans text-sm">{s.trade_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label className="font-sans text-sm">Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                  <Label className="font-sans text-sm">Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_new} onCheckedChange={(v) => setForm({ ...form, is_new: v })} />
                  <Label className="font-sans text-sm">Novo</Label>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl shine font-sans">
                {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar produto"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-premium border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mb-4 opacity-40" />
              <p className="font-sans text-lg">Nenhum produto cadastrado</p>
              <p className="font-sans text-sm mt-1">Clique em "Novo Produto" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans">Nome</TableHead>
                  <TableHead className="font-sans">Preço</TableHead>
                  <TableHead className="font-sans">Estoque</TableHead>
                  <TableHead className="font-sans">Status</TableHead>
                  <TableHead className="font-sans text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-sans">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku || "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-sans">
                      <p className="font-semibold">R$ {Number(product.price).toFixed(2)}</p>
                      {product.compare_at_price && (
                        <p className="text-xs text-muted-foreground line-through">R$ {Number(product.compare_at_price).toFixed(2)}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-sans">{product.stock}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs font-sans">
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {product.is_featured && <Badge variant="outline" className="text-xs font-sans border-accent text-accent">Destaque</Badge>}
                        {product.is_new && <Badge variant="outline" className="text-xs font-sans border-success text-success">Novo</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
