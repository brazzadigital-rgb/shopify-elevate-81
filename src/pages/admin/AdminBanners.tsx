import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/store/ImageUpload";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Image, Eye, EyeOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Banner {
  id: string;
  title: string | null;
  location: string;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  link: string | null;
  overlay_opacity: number;
  show_text: boolean;
  content_position: string;
  height: string | null;
  subtitle: string | null;
  cta_text: string | null;
  is_active: boolean;
  sort_order: number;
  border_radius: string | null;
  full_width: boolean;
}

const emptyForm = {
  title: "", location: "hero", desktop_image_url: "", mobile_image_url: "",
  link: "", overlay_opacity: 40, show_text: true, content_position: "left",
  height: "adaptive", subtitle: "", cta_text: "", is_active: true,
  sort_order: 0, border_radius: "16", full_width: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterLocation, setFilterLocation] = useState<string>("all");

  const fetchBanners = async () => {
    setLoading(true);
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners((data as Banner[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload: any = {
      title: form.title || null, location: form.location,
      desktop_image_url: form.desktop_image_url || null,
      mobile_image_url: form.mobile_image_url || null,
      link: form.link || null, overlay_opacity: form.overlay_opacity,
      show_text: form.show_text, content_position: form.content_position,
      height: form.height || "adaptive", subtitle: form.subtitle || null,
      cta_text: form.cta_text || null, is_active: form.is_active,
      sort_order: Number(form.sort_order), border_radius: form.border_radius || "0",
      full_width: form.full_width,
    };

    if (editingId) {
      const { error } = await supabase.from("banners").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
      else toast({ title: "Banner atualizado!" });
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
      else toast({ title: "Banner criado!" });
    }
    setSaving(false);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchBanners();
  };

  const handleEdit = (b: Banner) => {
    setEditingId(b.id);
    setForm({
      title: b.title || "", location: b.location,
      desktop_image_url: b.desktop_image_url || "",
      mobile_image_url: b.mobile_image_url || "",
      link: b.link || "", overlay_opacity: b.overlay_opacity,
      show_text: b.show_text, content_position: b.content_position,
      height: b.height || "adaptive", subtitle: b.subtitle || "",
      cta_text: b.cta_text || "", is_active: b.is_active,
      sort_order: b.sort_order, border_radius: b.border_radius || "0",
      full_width: b.full_width,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    toast({ title: "Banner removido" });
    fetchBanners();
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
    fetchBanners();
  };

  const filtered = filterLocation === "all" ? banners : banners.filter(b => b.location === filterLocation);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Banners</h1>
          <p className="text-muted-foreground font-sans mt-1 text-sm">Gerencie banners da loja (hero e promocional)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-36 h-10 rounded-xl font-sans text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="hero">Hero</SelectItem>
              <SelectItem value="bottom">Rodapé</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl shine h-10 font-sans text-sm"><Plus className="w-4 h-4" /> Novo Banner</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{editingId ? "Editar Banner" : "Novo Banner"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-sans text-sm">Localização</Label>
                    <Select value={form.location} onValueChange={(v) => setForm({ ...form, location: v })}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hero">Hero (Topo)</SelectItem>
                        <SelectItem value="bottom">Antes do Rodapé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-sans text-sm">Ordem</Label>
                    <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="h-10 rounded-xl" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="font-sans text-sm">Título</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-10 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-sans text-sm">Subtítulo</Label>
                  <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="h-10 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-sans text-sm">CTA Texto</Label>
                    <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} className="h-10 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-sans text-sm">Link</Label>
                    <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="h-10 rounded-xl" placeholder="/colecoes" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="font-sans text-sm">Imagem Desktop</Label>
                  <ImageUpload value={form.desktop_image_url} onChange={(v) => setForm({ ...form, desktop_image_url: v })} folder="banners" label="Upload Desktop" />
                </div>
                <div className="grid gap-2">
                  <Label className="font-sans text-sm">Imagem Mobile (opcional)</Label>
                  <ImageUpload value={form.mobile_image_url} onChange={(v) => setForm({ ...form, mobile_image_url: v })} folder="banners" label="Upload Mobile" />
                </div>

                <div className="grid gap-2">
                  <Label className="font-sans text-sm">Opacidade Overlay: {form.overlay_opacity}%</Label>
                  <Slider value={[form.overlay_opacity]} onValueChange={([v]) => setForm({ ...form, overlay_opacity: v })} min={0} max={80} step={5} className="py-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-sans text-sm">Posição Conteúdo</Label>
                    <Select value={form.content_position} onValueChange={(v) => setForm({ ...form, content_position: v })}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="font-sans text-sm">Altura</Label>
                    <Input value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="h-10 rounded-xl" placeholder="adaptive ou 500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="font-sans text-sm">Borda arredondada (px)</Label>
                    <Input value={form.border_radius} onChange={(e) => setForm({ ...form, border_radius: e.target.value })} className="h-10 rounded-xl" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.show_text} onCheckedChange={(v) => setForm({ ...form, show_text: v })} />
                    <Label className="font-sans text-sm">Mostrar textos</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.full_width} onCheckedChange={(v) => setForm({ ...form, full_width: v })} />
                    <Label className="font-sans text-sm">Largura total</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                    <Label className="font-sans text-sm">Ativo</Label>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="h-11 rounded-xl shine font-sans w-full">
                  {saving ? "Salvando..." : editingId ? "Salvar" : "Criar Banner"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="shadow-premium border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Image className="w-12 h-12 mb-4 opacity-40" />
            <p className="font-sans text-lg">Nenhum banner configurado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((b) => (
            <Card key={b.id} className="shadow-premium border-0 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {b.desktop_image_url && (
                    <div className="w-full sm:w-48 h-28 sm:h-auto shrink-0">
                      <img src={b.desktop_image_url} alt={b.title || ""} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-sm">{b.title || "Sem título"}</h3>
                        <Badge variant={b.is_active ? "default" : "secondary"} className="text-[10px]">
                          {b.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {b.location === "hero" ? "Hero" : "Rodapé"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-sans">{b.subtitle || "—"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => toggleActive(b)}>
                        {b.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(b)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" onClick={() => handleDelete(b.id)}>
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
