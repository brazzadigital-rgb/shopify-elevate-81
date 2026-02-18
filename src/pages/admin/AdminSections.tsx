import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Section {
  id: string;
  section_type: string;
  title: string | null;
  config: any;
  sort_order: number;
  is_active: boolean;
}

const sectionTypes = [
  { value: "hero", label: "Hero Banner" },
  { value: "featured_products", label: "Produtos em Destaque" },
  { value: "featured_collections", label: "Coleções" },
  { value: "benefits", label: "Benefícios" },
  { value: "newsletter", label: "Newsletter" },
];

const emptySection = {
  section_type: "hero", title: "", config_json: "{}", sort_order: 0, is_active: true,
};

export default function AdminSections() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySection);
  const [saving, setSaving] = useState(false);

  const fetchSections = async () => {
    setLoading(true);
    const { data } = await supabase.from("home_sections").select("*").order("sort_order");
    setSections((data as Section[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchSections(); }, []);

  const handleSave = async () => {
    setSaving(true);
    let config: any;
    try { config = JSON.parse(form.config_json); } catch { toast({ title: "JSON inválido", variant: "destructive" }); setSaving(false); return; }

    const payload = {
      section_type: form.section_type,
      title: form.title || null,
      config,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from("home_sections").update(payload).eq("id", editingId);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Seção atualizada!" });
    } else {
      const { error } = await supabase.from("home_sections").insert(payload);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Seção criada!" });
    }

    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptySection);
    fetchSections();
  };

  const handleEdit = (s: Section) => {
    setEditingId(s.id);
    setForm({
      section_type: s.section_type,
      title: s.title || "",
      config_json: JSON.stringify(s.config, null, 2),
      sort_order: s.sort_order,
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("home_sections").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Seção removida" }); fetchSections(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Seções da Home</h1>
          <p className="text-muted-foreground font-sans mt-1">Configure as seções da página inicial</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptySection); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shine h-11 font-sans"><Plus className="w-4 h-4" /> Nova Seção</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">{editingId ? "Editar Seção" : "Nova Seção"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Tipo</Label>
                <Select value={form.section_type} onValueChange={(v) => setForm({ ...form, section_type: v })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sectionTypes.map((t) => <SelectItem key={t.value} value={t.value} className="font-sans">{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Título (opcional)</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Configuração (JSON)</Label>
                <Textarea
                  value={form.config_json}
                  onChange={(e) => setForm({ ...form, config_json: e.target.value })}
                  rows={6}
                  className="rounded-xl font-mono text-xs"
                  placeholder='{"title":"...", "limit": 8}'
                />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm font-medium">Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="h-11 rounded-xl" />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label className="font-sans text-sm">Ativa</Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl shine font-sans">
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar seção"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-premium border-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Image className="w-12 h-12 mb-4 opacity-40" />
              <p className="font-sans text-lg">Nenhuma seção configurada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-sans w-12">#</TableHead>
                  <TableHead className="font-sans">Tipo</TableHead>
                  <TableHead className="font-sans">Título</TableHead>
                  <TableHead className="font-sans">Status</TableHead>
                  <TableHead className="font-sans text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-sans text-muted-foreground">{s.sort_order}</TableCell>
                    <TableCell className="font-sans font-medium">
                      {sectionTypes.find((t) => t.value === s.section_type)?.label || s.section_type}
                    </TableCell>
                    <TableCell className="font-sans text-sm text-muted-foreground">{s.title || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "secondary"} className="text-xs font-sans">
                        {s.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(s)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
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
