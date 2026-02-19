import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Eye } from "lucide-react";
import { ProductImageGallery } from "@/components/admin/ProductImageGallery";
import { ImageUpload } from "@/components/store/ImageUpload";

interface ProductImage {
  id?: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

interface Supplier { id: string; trade_name: string; }
interface Collection { id: string; name: string; }

interface ProductVariant {
  id?: string;
  name: string;
  price: number | null;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  sort_order: number;
}

interface CustomField {
  id?: string;
  field_label: string;
  field_type: string;
  options: string[];
  max_length: number | null;
  is_required: boolean;
  sort_order: number;
}

const defaultForm = {
  name: "", slug: "", description: "", short_description: "",
  brand: "", tags: [] as string[], status: "active",
  is_active: true, is_featured: false, is_new: false, is_bestseller: false, show_on_home: false,
  price: 0, compare_at_price: null as number | null, cost_price: null as number | null,
  promo_start_date: "", promo_end_date: "",
  max_installments: 12, installments_interest: false, pix_discount: 0,
  wholesale_price: null as number | null, reseller_price: null as number | null,
  sku: "", barcode: "", stock: 0, min_stock_alert: 5,
  track_stock: true, allow_backorder: false, stock_location: "",
  supplier_id: null as string | null,
  product_type: "physical", weight: null as number | null,
  height: null as number | null, width: null as number | null, length: null as number | null,
  free_shipping: false, extra_prep_days: 0,
  meta_title: "", meta_description: "", og_image_url: "",
  hide_price: false, quote_only: false, is_subscription: false,
  related_product_ids: [] as string[], upsell_product_ids: [] as string[], crosssell_product_ids: [] as string[],
};

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form, setForm] = useState(defaultForm);
  const [formImages, setFormImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [primaryCategory, setPrimaryCategory] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [tagInput, setTagInput] = useState("");

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const margin = useMemo(() => {
    if (form.cost_price && form.price) {
      const m = ((form.price - form.cost_price) / form.price) * 100;
      return m.toFixed(1);
    }
    return null;
  }, [form.cost_price, form.price]);

  useEffect(() => {
    const load = async () => {
      const [{ data: sups }, { data: cols }] = await Promise.all([
        supabase.from("suppliers").select("id, trade_name").eq("status", "active").order("trade_name"),
        supabase.from("collections").select("id, name").eq("is_active", true).order("name"),
      ]);
      setSuppliers((sups as Supplier[]) || []);
      setCollections((cols as Collection[]) || []);

      if (id) {
        setLoading(true);
        const { data: p } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (p) {
          setForm({
            name: p.name, slug: p.slug, description: p.description || "", short_description: p.short_description || "",
            brand: (p as any).brand || "", tags: (p as any).tags || [], status: (p as any).status || "active",
            is_active: p.is_active, is_featured: p.is_featured, is_new: p.is_new,
            is_bestseller: (p as any).is_bestseller || false, show_on_home: (p as any).show_on_home || false,
            price: p.price, compare_at_price: p.compare_at_price, cost_price: p.cost_price,
            promo_start_date: (p as any).promo_start_date || "", promo_end_date: (p as any).promo_end_date || "",
            max_installments: (p as any).max_installments ?? 12, installments_interest: (p as any).installments_interest || false,
            pix_discount: (p as any).pix_discount || 0,
            wholesale_price: (p as any).wholesale_price, reseller_price: (p as any).reseller_price,
            sku: p.sku || "", barcode: p.barcode || "", stock: p.stock, min_stock_alert: (p as any).min_stock_alert ?? 5,
            track_stock: (p as any).track_stock ?? true, allow_backorder: (p as any).allow_backorder || false,
            stock_location: (p as any).stock_location || "", supplier_id: p.supplier_id,
            product_type: (p as any).product_type || "physical", weight: p.weight,
            height: (p as any).height, width: (p as any).width, length: (p as any).length,
            free_shipping: (p as any).free_shipping || false, extra_prep_days: (p as any).extra_prep_days || 0,
            meta_title: p.meta_title || "", meta_description: p.meta_description || "", og_image_url: (p as any).og_image_url || "",
            hide_price: (p as any).hide_price || false, quote_only: (p as any).quote_only || false,
            is_subscription: (p as any).is_subscription || false,
            related_product_ids: (p as any).related_product_ids || [],
            upsell_product_ids: (p as any).upsell_product_ids || [],
            crosssell_product_ids: (p as any).crosssell_product_ids || [],
          });
        }
        // Load images
        const { data: imgs } = await supabase.from("product_images").select("*").eq("product_id", id).order("sort_order");
        setFormImages((imgs as ProductImage[]) || []);
        // Load variants
        const { data: vars } = await supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order");
        setVariants((vars as ProductVariant[]) || []);
        // Load categories
        const { data: cats } = await supabase.from("product_categories").select("collection_id, is_primary").eq("product_id", id);
        if (cats) {
          setSelectedCategories(cats.map((c: any) => c.collection_id));
          const primary = cats.find((c: any) => c.is_primary);
          if (primary) setPrimaryCategory((primary as any).collection_id);
        }
        // Load custom fields
        const { data: fields } = await supabase.from("product_custom_fields").select("*").eq("product_id", id).order("sort_order");
        setCustomFields((fields as CustomField[]) || []);
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    const slug = form.slug || generateSlug(form.name);

    const payload: any = {
      name: form.name, slug, description: form.description, short_description: form.short_description,
      brand: form.brand || null, tags: form.tags, status: form.status,
      is_active: form.status === "active", is_featured: form.is_featured, is_new: form.is_new,
      is_bestseller: form.is_bestseller, show_on_home: form.show_on_home,
      price: Number(form.price), compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      cost_price: form.cost_price ? Number(form.cost_price) : null,
      promo_start_date: form.promo_start_date || null, promo_end_date: form.promo_end_date || null,
      max_installments: form.max_installments, installments_interest: form.installments_interest,
      pix_discount: form.pix_discount,
      wholesale_price: form.wholesale_price ? Number(form.wholesale_price) : null,
      reseller_price: form.reseller_price ? Number(form.reseller_price) : null,
      sku: form.sku || null, barcode: form.barcode || null, stock: Number(form.stock),
      min_stock_alert: form.min_stock_alert, track_stock: form.track_stock,
      allow_backorder: form.allow_backorder, stock_location: form.stock_location || null,
      supplier_id: form.supplier_id || null,
      product_type: form.product_type, weight: form.weight ? Number(form.weight) : null,
      height: form.height ? Number(form.height) : null, width: form.width ? Number(form.width) : null,
      length: form.length ? Number(form.length) : null,
      free_shipping: form.free_shipping, extra_prep_days: form.extra_prep_days,
      meta_title: form.meta_title || null, meta_description: form.meta_description || null,
      og_image_url: form.og_image_url || null,
      hide_price: form.hide_price, quote_only: form.quote_only, is_subscription: form.is_subscription,
      related_product_ids: form.related_product_ids, upsell_product_ids: form.upsell_product_ids,
      crosssell_product_ids: form.crosssell_product_ids,
    };

    let productId = id;
    if (isEditing) {
      const { error } = await supabase.from("products").update(payload).eq("id", id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
    } else {
      const { data: newP, error } = await supabase.from("products").insert(payload).select("id").single();
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSaving(false); return; }
      productId = newP.id;
    }

    if (productId) {
      // Images
      await supabase.from("product_images").delete().eq("product_id", productId);
      if (formImages.length > 0) {
        await supabase.from("product_images").insert(
          formImages.map((img, i) => ({ product_id: productId!, url: img.url, is_primary: img.is_primary, sort_order: i }))
        );
      }
      // Categories
      await supabase.from("product_categories").delete().eq("product_id", productId);
      if (selectedCategories.length > 0) {
        await supabase.from("product_categories").insert(
          selectedCategories.map(cid => ({ product_id: productId!, collection_id: cid, is_primary: cid === primaryCategory }))
        );
      }
      // Variants
      await supabase.from("product_variants").delete().eq("product_id", productId);
      if (variants.length > 0) {
        await supabase.from("product_variants").insert(
          variants.map((v, i) => ({ product_id: productId!, name: v.name, price: v.price, compare_at_price: v.compare_at_price, stock: v.stock, sku: v.sku, sort_order: i }))
        );
      }
      // Custom fields
      await supabase.from("product_custom_fields").delete().eq("product_id", productId);
      if (customFields.length > 0) {
        await supabase.from("product_custom_fields").insert(
          customFields.map((f, i) => ({ product_id: productId!, field_label: f.field_label, field_type: f.field_type, options: f.options, max_length: f.max_length, is_required: f.is_required, sort_order: i }))
        );
      }
    }

    toast({ title: isEditing ? "Produto atualizado!" : "Produto criado!" });
    setSaving(false);
    navigate("/admin/produtos");
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) { setForm({ ...form, tags: [...form.tags, t] }); setTagInput(""); }
  };

  const removeTag = (tag: string) => setForm({ ...form, tags: form.tags.filter(t => t !== tag) });

  const toggleCategory = (cid: string) => {
    setSelectedCategories(prev => prev.includes(cid) ? prev.filter(c => c !== cid) : [...prev, cid]);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const inputClass = "h-10 rounded-xl font-sans text-sm";
  const labelClass = "font-sans text-sm font-medium text-foreground/80";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/produtos")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">{isEditing ? "Editar Produto" : "Novo Produto"}</h1>
            <p className="text-sm text-muted-foreground font-sans mt-0.5">
              {isEditing ? form.name : "Preencha as informações do produto"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl shine h-10 font-sans">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          {[
            { v: "geral", l: "Geral" }, { v: "midias", l: "Mídias" }, { v: "precos", l: "Preços" },
            { v: "estoque", l: "Estoque" }, { v: "frete", l: "Frete" }, { v: "variacoes", l: "Variações" },
            { v: "seo", l: "SEO" }, { v: "personalizacao", l: "Personalização" }, { v: "avancado", l: "Avançado" },
          ].map(tab => (
            <TabsTrigger key={tab.v} value={tab.v} className="rounded-lg font-sans text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {tab.l}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* GERAL */}
        <TabsContent value="geral">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-2">
                <Label className={labelClass}>Nome do produto *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: form.slug || generateSlug(e.target.value) })} className={inputClass} placeholder="Ex: Anel Solitário Ouro 18k" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className={labelClass}>Descrição curta</Label>
                  <Input value={form.short_description} onChange={e => setForm({ ...form, short_description: e.target.value })} className={inputClass} placeholder="Breve descrição" />
                </div>
                <div className="grid gap-2">
                  <Label className={labelClass}>Marca</Label>
                  <Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className={inputClass} placeholder="Ex: Vivara" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className={labelClass}>Descrição completa</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5} className="rounded-xl font-sans text-sm" placeholder="Descrição detalhada do produto" />
              </div>
              <div className="grid gap-2">
                <Label className={labelClass}>Fornecedor</Label>
                <Select value={form.supplier_id || "none"} onValueChange={v => setForm({ ...form, supplier_id: v === "none" ? null : v })}>
                  <SelectTrigger className={inputClass}><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.trade_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Categories */}
              <div className="grid gap-2">
                <Label className={labelClass}>Categorias</Label>
                <div className="flex flex-wrap gap-2">
                  {collections.map(c => (
                    <button key={c.id} type="button" onClick={() => toggleCategory(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-sans border transition-colors ${
                        selectedCategories.includes(c.id) ? "bg-accent text-accent-foreground border-accent" : "bg-muted/50 border-border hover:bg-muted"
                      }`}>
                      {c.name}
                    </button>
                  ))}
                </div>
                {selectedCategories.length > 1 && (
                  <div className="mt-2">
                    <Label className="text-xs text-muted-foreground font-sans">Categoria principal:</Label>
                    <Select value={primaryCategory} onValueChange={setPrimaryCategory}>
                      <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue placeholder="Selecione a principal" /></SelectTrigger>
                      <SelectContent>
                        {selectedCategories.map(cid => {
                          const col = collections.find(c => c.id === cid);
                          return col ? <SelectItem key={cid} value={cid}>{col.name}</SelectItem> : null;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {/* Tags */}
              <div className="grid gap-2">
                <Label className={labelClass}>Tags</Label>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} className={`${inputClass} flex-1`} placeholder="Adicionar tag e pressione Enter" />
                  <Button type="button" variant="outline" size="sm" onClick={addTag} className="rounded-xl h-10">+</Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {form.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1 text-xs font-sans cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {/* Status & Flags */}
              <div className="grid gap-2">
                <Label className={labelClass}>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="hidden">Oculto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {[
                  { key: "is_new", label: "Novo produto" },
                  { key: "is_featured", label: "Produto destaque" },
                  { key: "is_bestseller", label: "Mais vendido" },
                  { key: "show_on_home", label: "Exibir na home" },
                ].map(flag => (
                  <div key={flag.key} className="flex items-center gap-2">
                    <Switch checked={(form as any)[flag.key]} onCheckedChange={v => setForm({ ...form, [flag.key]: v })} />
                    <Label className="font-sans text-sm">{flag.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MÍDIAS */}
        <TabsContent value="midias">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6">
              <ProductImageGallery productId={id || null} images={formImages} onChange={setFormImages} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* PREÇOS */}
        <TabsContent value="precos">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className={labelClass}>Preço normal (R$) *</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
                <div className="grid gap-2">
                  <Label className={labelClass}>Preço promocional (R$)</Label>
                  <Input type="number" step="0.01" value={form.compare_at_price || ""} onChange={e => setForm({ ...form, compare_at_price: parseFloat(e.target.value) || null })} className={inputClass} />
                </div>
                <div className="grid gap-2">
                  <Label className={labelClass}>Custo (R$)</Label>
                  <Input type="number" step="0.01" value={form.cost_price || ""} onChange={e => setForm({ ...form, cost_price: parseFloat(e.target.value) || null })} className={inputClass} />
                  {margin && <span className="text-xs text-muted-foreground font-sans">Margem: {margin}%</span>}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className={labelClass}>Início promoção</Label>
                  <Input type="datetime-local" value={form.promo_start_date} onChange={e => setForm({ ...form, promo_start_date: e.target.value })} className={inputClass} />
                </div>
                <div className="grid gap-2">
                  <Label className={labelClass}>Fim promoção</Label>
                  <Input type="datetime-local" value={form.promo_end_date} onChange={e => setForm({ ...form, promo_end_date: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className={labelClass}>Máx. parcelas</Label>
                  <Input type="number" value={form.max_installments} onChange={e => setForm({ ...form, max_installments: parseInt(e.target.value) || 1 })} className={inputClass} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.installments_interest} onCheckedChange={v => setForm({ ...form, installments_interest: v })} />
                  <Label className="font-sans text-sm">Com juros</Label>
                </div>
                <div className="grid gap-2">
                  <Label className={labelClass}>Desconto PIX (%)</Label>
                  <Input type="number" step="0.1" value={form.pix_discount} onChange={e => setForm({ ...form, pix_discount: parseFloat(e.target.value) || 0 })} className={inputClass} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className={labelClass}>Preço atacado (R$)</Label>
                  <Input type="number" step="0.01" value={form.wholesale_price || ""} onChange={e => setForm({ ...form, wholesale_price: parseFloat(e.target.value) || null })} className={inputClass} />
                </div>
                <div className="grid gap-2">
                  <Label className={labelClass}>Preço revendedor (R$)</Label>
                  <Input type="number" step="0.01" value={form.reseller_price || ""} onChange={e => setForm({ ...form, reseller_price: parseFloat(e.target.value) || null })} className={inputClass} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESTOQUE */}
        <TabsContent value="estoque">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className={labelClass}>SKU</Label>
                  <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className={inputClass} placeholder="Código interno" />
                </div>
                <div className="grid gap-2">
                  <Label className={labelClass}>Código de barras</Label>
                  <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className={inputClass} placeholder="EAN / GTIN" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.track_stock} onCheckedChange={v => setForm({ ...form, track_stock: v })} />
                <Label className="font-sans text-sm">Controlar estoque</Label>
              </div>
              {form.track_stock && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className={labelClass}>Quantidade</Label>
                    <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className={inputClass} />
                  </div>
                  <div className="grid gap-2">
                    <Label className={labelClass}>Estoque mínimo alerta</Label>
                    <Input type="number" value={form.min_stock_alert} onChange={e => setForm({ ...form, min_stock_alert: parseInt(e.target.value) || 0 })} className={inputClass} />
                  </div>
                  <div className="grid gap-2">
                    <Label className={labelClass}>Localização</Label>
                    <Input value={form.stock_location} onChange={e => setForm({ ...form, stock_location: e.target.value })} className={inputClass} placeholder="Ex: Galpão A" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={form.allow_backorder} onCheckedChange={v => setForm({ ...form, allow_backorder: v })} />
                <Label className="font-sans text-sm">Permitir vender sem estoque</Label>
              </div>
              <div className="grid gap-2">
                <Label className={labelClass}>Fornecedor vinculado</Label>
                <Select value={form.supplier_id || "none"} onValueChange={v => setForm({ ...form, supplier_id: v === "none" ? null : v })}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.trade_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FRETE */}
        <TabsContent value="frete">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-2">
                <Label className={labelClass}>Tipo de produto</Label>
                <Select value={form.product_type} onValueChange={v => setForm({ ...form, product_type: v })}>
                  <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.product_type === "physical" && (
                <>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="grid gap-2">
                      <Label className={labelClass}>Peso (kg)</Label>
                      <Input type="number" step="0.01" value={form.weight || ""} onChange={e => setForm({ ...form, weight: parseFloat(e.target.value) || null })} className={inputClass} />
                    </div>
                    <div className="grid gap-2">
                      <Label className={labelClass}>Altura (cm)</Label>
                      <Input type="number" step="0.1" value={form.height || ""} onChange={e => setForm({ ...form, height: parseFloat(e.target.value) || null })} className={inputClass} />
                    </div>
                    <div className="grid gap-2">
                      <Label className={labelClass}>Largura (cm)</Label>
                      <Input type="number" step="0.1" value={form.width || ""} onChange={e => setForm({ ...form, width: parseFloat(e.target.value) || null })} className={inputClass} />
                    </div>
                    <div className="grid gap-2">
                      <Label className={labelClass}>Comprimento (cm)</Label>
                      <Input type="number" step="0.1" value={form.length || ""} onChange={e => setForm({ ...form, length: parseFloat(e.target.value) || null })} className={inputClass} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.free_shipping} onCheckedChange={v => setForm({ ...form, free_shipping: v })} />
                      <Label className="font-sans text-sm">Frete grátis</Label>
                    </div>
                  </div>
                  <div className="grid gap-2 max-w-xs">
                    <Label className={labelClass}>Prazo adicional preparo (dias)</Label>
                    <Input type="number" value={form.extra_prep_days} onChange={e => setForm({ ...form, extra_prep_days: parseInt(e.target.value) || 0 })} className={inputClass} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* VARIAÇÕES */}
        <TabsContent value="variacoes">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>Variações do produto</Label>
                <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1 font-sans text-xs"
                  onClick={() => setVariants([...variants, { name: "", price: null, compare_at_price: null, stock: 0, sku: null, sort_order: variants.length }])}>
                  <Plus className="w-3 h-3" /> Adicionar
                </Button>
              </div>
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">Nenhuma variação. Produto simples.</p>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end border border-border rounded-xl p-3">
                      <div className="grid gap-1">
                        <Label className="text-xs font-sans text-muted-foreground">Nome *</Label>
                        <Input value={v.name} onChange={e => { const u = [...variants]; u[i].name = e.target.value; setVariants(u); }} className="h-9 rounded-lg text-sm" placeholder="Ex: P / Dourado" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs font-sans text-muted-foreground">Preço</Label>
                        <Input type="number" step="0.01" value={v.price || ""} onChange={e => { const u = [...variants]; u[i].price = parseFloat(e.target.value) || null; setVariants(u); }} className="h-9 rounded-lg text-sm w-24" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs font-sans text-muted-foreground">Estoque</Label>
                        <Input type="number" value={v.stock} onChange={e => { const u = [...variants]; u[i].stock = parseInt(e.target.value) || 0; setVariants(u); }} className="h-9 rounded-lg text-sm w-20" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs font-sans text-muted-foreground">SKU</Label>
                        <Input value={v.sku || ""} onChange={e => { const u = [...variants]; u[i].sku = e.target.value || null; setVariants(u); }} className="h-9 rounded-lg text-sm w-28" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setVariants(variants.filter((_, j) => j !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-2">
                <Label className={labelClass}>Slug (URL)</Label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputClass} placeholder="slug-do-produto" />
              </div>
              <div className="grid gap-2">
                <Label className={labelClass}>Meta título</Label>
                <Input value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} className={inputClass} maxLength={60} placeholder="Título para buscadores (máx. 60 chars)" />
                <span className="text-xs text-muted-foreground font-sans">{form.meta_title.length}/60</span>
              </div>
              <div className="grid gap-2">
                <Label className={labelClass}>Meta descrição</Label>
                <Textarea value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })} rows={3} className="rounded-xl font-sans text-sm" maxLength={160} placeholder="Descrição para buscadores (máx. 160 chars)" />
                <span className="text-xs text-muted-foreground font-sans">{form.meta_description.length}/160</span>
              </div>
              <div className="grid gap-2">
                <Label className={labelClass}>Imagem social (OG Image)</Label>
                <ImageUpload
                  value={form.og_image_url}
                  onChange={(url) => setForm({ ...form, og_image_url: url })}
                  folder="seo"
                  label="Enviar imagem social"
                />
              </div>
              {/* Google Preview */}
              <div className="border border-border rounded-xl p-4 space-y-1">
                <p className="text-xs text-muted-foreground font-sans mb-2">Preview Google</p>
                <p className="text-sm text-primary font-sans">{form.meta_title || form.name || "Título do produto"}</p>
                <p className="text-xs text-accent font-sans">sualoja.com.br/produto/{form.slug || "slug"}</p>
                <p className="text-xs text-muted-foreground font-sans">{form.meta_description || form.short_description || "Descrição do produto..."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERSONALIZAÇÃO */}
        <TabsContent value="personalizacao">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <Label className={labelClass}>Campos extras para o cliente</Label>
                <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1 font-sans text-xs"
                  onClick={() => setCustomFields([...customFields, { field_label: "", field_type: "text", options: [], max_length: null, is_required: false, sort_order: customFields.length }])}>
                  <Plus className="w-3 h-3" /> Adicionar campo
                </Button>
              </div>
              {customFields.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans">Nenhum campo personalizado.</p>
              ) : (
                <div className="space-y-3">
                  {customFields.map((f, i) => (
                    <div key={i} className="border border-border rounded-xl p-3 grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-end">
                      <div className="grid gap-1">
                        <Label className="text-xs font-sans text-muted-foreground">Label</Label>
                        <Input value={f.field_label} onChange={e => { const u = [...customFields]; u[i].field_label = e.target.value; setCustomFields(u); }} className="h-9 rounded-lg text-sm" placeholder="Ex: Gravação" />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs font-sans text-muted-foreground">Tipo</Label>
                        <Select value={f.field_type} onValueChange={v => { const u = [...customFields]; u[i].field_type = v; setCustomFields(u); }}>
                          <SelectTrigger className="h-9 rounded-lg text-sm w-28"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="select">Escolha</SelectItem>
                            <SelectItem value="upload">Upload</SelectItem>
                            <SelectItem value="textarea">Observação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs font-sans text-muted-foreground">Máx. chars</Label>
                        <Input type="number" value={f.max_length || ""} onChange={e => { const u = [...customFields]; u[i].max_length = parseInt(e.target.value) || null; setCustomFields(u); }} className="h-9 rounded-lg text-sm w-20" />
                      </div>
                      <div className="flex items-center gap-1 pb-0.5">
                        <Switch checked={f.is_required} onCheckedChange={v => { const u = [...customFields]; u[i].is_required = v; setCustomFields(u); }} />
                        <Label className="text-xs font-sans">Obrigatório</Label>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setCustomFields(customFields.filter((_, j) => j !== i))}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AVANÇADO */}
        <TabsContent value="avancado">
          <Card className="border-0 shadow-premium">
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={form.hide_price} onCheckedChange={v => setForm({ ...form, hide_price: v })} />
                  <Label className="font-sans text-sm">Esconder preço</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.quote_only} onCheckedChange={v => setForm({ ...form, quote_only: v })} />
                  <Label className="font-sans text-sm">Somente orçamento</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_subscription} onCheckedChange={v => setForm({ ...form, is_subscription: v })} />
                  <Label className="font-sans text-sm">Produto assinatura</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-sans mt-4">
                Produtos relacionados, upsell e cross-sell podem ser configurados após salvar o produto, vinculando outros itens do catálogo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
