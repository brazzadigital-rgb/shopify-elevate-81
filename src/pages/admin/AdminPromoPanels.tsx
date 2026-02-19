import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/store/ImageUpload";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image, Eye, EyeOff, GripVertical } from "lucide-react";

interface PromoPanel {
  id: string;
  image_url: string;
  alt_text: string;
  link: string | null;
  sort_order: number;
  is_active: boolean;
}

const emptyForm = {
  image_url: "",
  alt_text: "",
  link: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminPromoPanels() {
  const [panels, setPanels] = useState<PromoPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPanels = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("promo_panels")
      .select("*")
      .order("sort_order");
    setPanels((data as PromoPanel[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPanels(); }, []);

  const handleSave = async () => {
    if (!form.image_url) {
      toast({ title: "Imagem obrigatória", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      image_url: form.image_url,
      alt_text: form.alt_text || "",
      link: form.link || null,
      sort_order: Number(form.sort_order),
      is_active: form.is_active,
    };

    if (editingId) {
      const { error } = await supabase.from("promo_panels").update(payload).eq("id", editingId);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Painel atualizado!" });
    } else {
      const { error } = await supabase.from("promo_panels").insert(payload);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Painel criado!" });
    }
    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchPanels();
  };

  const handleEdit = (p: PromoPanel) => {
    setEditingId(p.id);
    setForm({
      image_url: p.image_url,
      alt_text: p.alt_text,
      link: p.link || "",
      sort_order: p.sort_order,
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("promo_panels").delete().eq("id", id);
    toast({ title: "Painel removido" });
    fetchPanels();
  };

  const toggleActive = async (p: PromoPanel) => {
    await supabase.from("promo_panels").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchPanels();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Painéis Promocionais</h1>
          <p className="text-muted-foreground font-sans mt-1 text-sm">
            Gerencie os 3 painéis promocionais exibidos na home (rastreio, cartão, redes)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shine h-10 font-sans text-sm">
              <Plus className="w-4 h-4" /> Novo Painel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {editingId ? "Editar Painel" : "Novo Painel"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="font-sans text-sm">Imagem *</Label>
                <ImageUpload
                  value={form.image_url}
                  onChange={(v) => setForm({ ...form, image_url: v })}
                  folder="promo-panels"
                  label="Upload Imagem"
                />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm">Texto alternativo</Label>
                <Input
                  value={form.alt_text}
                  onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                  className="h-10 rounded-xl"
                  placeholder="Ex: Rastreie seu pedido"
                />
              </div>
              <div className="grid gap-2">
                <Label className="font-sans text-sm">Link (opcional)</Label>
                <Input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="h-10 rounded-xl"
                  placeholder="/rastreamento ou https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="font-sans text-sm">Ordem</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label className="font-sans text-sm">Ativo</Label>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl shine font-sans w-full">
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar Painel"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : panels.length === 0 ? (
        <Card className="shadow-premium border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Image className="w-12 h-12 mb-4 opacity-40" />
            <p className="font-sans text-lg">Nenhum painel configurado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {panels.map((p) => (
            <Card key={p.id} className="shadow-premium border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {p.image_url && (
                    <div className="w-full sm:w-48 h-28 sm:h-auto shrink-0">
                      <img src={p.image_url} alt={p.alt_text} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-display font-bold text-sm">{p.alt_text || "Sem título"}</h3>
                        <Badge variant={p.is_active ? "default" : "secondary"} className="text-[10px]">
                          {p.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-sans">
                        {p.link ? `Link: ${p.link}` : "Sem link"} · Ordem: {p.sort_order}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toggleActive(p)}>
                        {p.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
