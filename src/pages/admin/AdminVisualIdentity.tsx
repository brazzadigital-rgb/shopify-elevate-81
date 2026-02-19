import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ImageUpload } from "@/components/store/ImageUpload";
import { toast } from "@/hooks/use-toast";
import { Save, Palette, Type, ImageIcon, Gem } from "lucide-react";

interface SettingsMap { [key: string]: string; }

const colorSettings = [
  { key: "color_primary", label: "Cor Primária (accent)" },
  { key: "color_secondary", label: "Cor Secundária" },
  { key: "color_buttons", label: "Cor dos Botões" },
  { key: "color_background", label: "Cor de Fundo" },
  { key: "color_text", label: "Cor dos Textos" },
  { key: "color_promotions", label: "Cor de Promoções" },
];

const fontSettings = [
  { key: "font_headings", label: "Fonte dos Títulos" },
  { key: "font_body", label: "Fonte dos Textos" },
  { key: "font_weight", label: "Peso da Fonte (400-900)" },
  { key: "font_size_base", label: "Tamanho Base (px)" },
];

// Convert HSL string "H S% L%" to hex for the color picker
function hslToHex(hsl: string): string {
  if (!hsl || hsl.length < 5) return "#ff4900";
  const parts = hsl.replace(/%/g, "").split(/\s+/).map(Number);
  if (parts.length < 3) return "#ff4900";
  const [h, s, l] = parts;
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert hex to HSL string "H S% L%"
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function AdminVisualIdentity() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("store_settings").select("key, value");
      const map: SettingsMap = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    };
    fetch();
  }, []);

  const update = (key: string, value: string) => setSettings((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const promises = Object.entries(settings).map(([key, value]) =>
      supabase.from("store_settings").upsert({ key, value }, { onConflict: "key" })
    );
    await Promise.all(promises);
    toast({ title: "Identidade visual salva!" });
    setSaving(false);
  };

  if (loading) return <div className="space-y-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Identidade Visual</h1>
          <p className="text-muted-foreground font-sans mt-1 text-sm">Personalize a aparência da sua loja</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl shine h-10 font-sans text-sm">
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Logos */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><ImageIcon className="w-5 h-5 text-accent" /> Logos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-sans text-sm">Logo Principal</Label>
              <ImageUpload value={settings.logo_url || ""} onChange={(v) => update("logo_url", v)} folder="logos" label="Upload Logo" />
            </div>
            <div className="space-y-2">
              <Label className="font-sans text-sm">Logo Mobile</Label>
              <ImageUpload value={settings.logo_mobile_url || ""} onChange={(v) => update("logo_mobile_url", v)} folder="logos" label="Upload Mobile" />
            </div>
            <div className="space-y-2">
              <Label className="font-sans text-sm">Favicon</Label>
              <ImageUpload value={settings.favicon_url || ""} onChange={(v) => update("favicon_url", v)} folder="logos" label="Upload Favicon" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-accent" /> Cores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorSettings.map((c) => (
              <div key={c.key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={hslToHex(settings[c.key] || "")}
                  onChange={(e) => update(c.key, hexToHsl(e.target.value))}
                  className="w-10 h-10 rounded-xl border border-border cursor-pointer shrink-0 min-h-[unset] min-w-[unset]"
                />
                <div className="flex-1">
                  <Label className="font-sans text-xs text-muted-foreground">{c.label}</Label>
                  <Input
                    value={settings[c.key] || ""}
                    onChange={(e) => update(c.key, e.target.value)}
                    className="h-8 rounded-lg text-xs font-mono"
                    placeholder="H S% L%"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><Type className="w-5 h-5 text-accent" /> Tipografia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fontSettings.map((f) => (
              <div key={f.key} className="grid gap-2">
                <Label className="font-sans text-sm">{f.label}</Label>
                <Input
                  value={settings[f.key] || ""}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="h-10 rounded-xl"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Jewel Ring Categories */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><Gem className="w-5 h-5 text-accent" /> Categorias — Efeito Joia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-sans text-sm font-medium">Borda Luxuosa (Joia)</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Anel metálico com reflexo cintilante</p>
            </div>
            <Switch
              checked={settings.jewel_enabled === "true"}
              onCheckedChange={(v) => update("jewel_enabled", v ? "true" : "false")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="font-sans text-sm">Cor Metálica</Label>
              <Select value={settings.jewel_color || "gold"} onValueChange={(v) => update("jewel_color", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Dourado</SelectItem>
                  <SelectItem value="rose">Rosé Gold</SelectItem>
                  <SelectItem value="silver">Prata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="font-sans text-sm">Velocidade do Sparkle</Label>
              <Select value={settings.jewel_speed || "normal"} onValueChange={(v) => update("jewel_speed", v)}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slow">Lento</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="fast">Rápido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="font-sans text-sm">Intensidade do Brilho: {settings.jewel_intensity || "50"}%</Label>
            <Slider
              value={[parseInt(settings.jewel_intensity || "50")]}
              onValueChange={([v]) => update("jewel_intensity", String(v))}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-sans text-sm font-medium">Brilho ao Toque</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Efeito luminoso ao tocar no mobile</p>
            </div>
            <Switch
              checked={settings.jewel_tap_glow !== "false"}
              onCheckedChange={(v) => update("jewel_tap_glow", v ? "true" : "false")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-sans text-sm font-medium">Realçar Categoria Ativa</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Brilho contínuo mais forte na selecionada</p>
            </div>
            <Switch
              checked={settings.jewel_active_highlight !== "false"}
              onCheckedChange={(v) => update("jewel_active_highlight", v ? "true" : "false")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
