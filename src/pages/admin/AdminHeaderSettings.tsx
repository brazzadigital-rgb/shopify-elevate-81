import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ImageUpload } from "@/components/store/ImageUpload";
import { toast } from "@/hooks/use-toast";
import { Save, Palette, Type, Eye, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SettingsMap { [key: string]: string; }

// HSL <-> Hex helpers
function hslToHex(hsl: string): string {
  if (!hsl || hsl.length < 5) return "#333333";
  const parts = hsl.replace(/%/g, "").split(/\s+/).map(Number);
  if (parts.length < 3) return "#333333";
  const [h, s, l] = parts;
  const sn = s / 100, ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

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

export default function AdminHeaderSettings() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("store_settings").select("key, value");
      const map: SettingsMap = {};
      data?.forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const update = (key: string, value: string) => setSettings((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const headerKeys = Object.keys(settings).filter(k => k.startsWith("header_") || k === "logo_url" || k === "logo_mobile_url");
    const promises = headerKeys.map((key) =>
      supabase.from("store_settings").upsert({ key, value: settings[key] }, { onConflict: "key" })
    );
    await Promise.all(promises);
    toast({ title: "Configurações do header salvas!" });
    setSaving(false);
  };

  if (loading) return <div className="space-y-6">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>;

  const colorField = (key: string, label: string) => (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={hslToHex(settings[key] || "")}
        onChange={(e) => update(key, hexToHsl(e.target.value))}
        className="w-10 h-10 rounded-xl border border-border cursor-pointer shrink-0 min-h-[unset] min-w-[unset]"
      />
      <div className="flex-1">
        <Label className="font-sans text-xs text-muted-foreground">{label}</Label>
        <Input
          value={settings[key] || ""}
          onChange={(e) => update(key, e.target.value)}
          className="h-8 rounded-lg text-xs font-mono"
          placeholder="H S% L%"
        />
      </div>
    </div>
  );

  const toggleField = (key: string, label: string) => (
    <div className="flex items-center justify-between gap-4">
      <Label className="font-sans text-sm flex-1">{label}</Label>
      <Switch
        checked={settings[key] === "true"}
        onCheckedChange={(v) => update(key, v ? "true" : "false")}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">Configurações do Header</h1>
          <p className="text-muted-foreground font-sans mt-1 text-sm">Personalize o cabeçalho da sua loja</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl shine h-10 font-sans text-sm">
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Cores */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><Palette className="w-5 h-5 text-accent" /> Cores do Header</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colorField("header_bg_color", "Cor de Fundo")}
            {colorField("header_text_color", "Cor do Texto / Ícones")}
            {colorField("header_search_bg_color", "Cor do Campo de Busca")}
          </div>
        </CardContent>
      </Card>

      {/* Logos */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><Eye className="w-5 h-5 text-accent" /> Logos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-sans text-sm">Logo Desktop</Label>
              <ImageUpload value={settings.logo_url || ""} onChange={(v) => update("logo_url", v)} folder="logos" label="Upload Logo" />
            </div>
            <div className="space-y-2">
              <Label className="font-sans text-sm">Logo Mobile</Label>
              <ImageUpload value={settings.logo_mobile_url || ""} onChange={(v) => update("logo_mobile_url", v)} folder="logos" label="Upload Mobile" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimensões e Efeitos */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><Settings2 className="w-5 h-5 text-accent" /> Dimensões e Efeitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="font-sans text-sm">Altura do Header: {settings.header_height || "88"}px</Label>
            <Slider
              value={[parseInt(settings.header_height || "88")]}
              onValueChange={([v]) => update("header_height", String(v))}
              min={60}
              max={120}
              step={4}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-sans text-sm">Intensidade da Sombra: {settings.header_shadow_intensity || "50"}%</Label>
            <Slider
              value={[parseInt(settings.header_shadow_intensity || "50")]}
              onValueChange={([v]) => update("header_shadow_intensity", String(v))}
              min={0}
              max={100}
              step={5}
            />
          </div>
          {toggleField("header_sticky_enabled", "Header Sticky (fixo ao rolar)")}
        </CardContent>
      </Card>

      {/* Textos */}
      <Card className="shadow-premium border-0">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg flex items-center gap-2"><Type className="w-5 h-5 text-accent" /> Textos e Visibilidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {toggleField("header_account_enabled", "Mostrar 'Minha Conta'")}
          {toggleField("header_track_enabled", "Mostrar 'Rastrear Pedido'")}
          {toggleField("header_cart_enabled", "Mostrar 'Carrinho'")}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="grid gap-2">
              <Label className="font-sans text-sm">Texto acima de "Minha conta"</Label>
              <Input
                value={settings.header_account_top_text || ""}
                onChange={(e) => update("header_account_top_text", e.target.value)}
                className="h-10 rounded-xl"
                placeholder="Entrar / Cadastrar"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-sans text-sm">Texto acima de "Rastrear pedido"</Label>
              <Input
                value={settings.header_track_top_text || ""}
                onChange={(e) => update("header_track_top_text", e.target.value)}
                className="h-10 rounded-xl"
                placeholder="Onde está meu produto?"
              />
            </div>
            <div className="grid gap-2">
              <Label className="font-sans text-sm">Placeholder da Busca</Label>
              <Input
                value={settings.header_search_placeholder || ""}
                onChange={(e) => update("header_search_placeholder", e.target.value)}
                className="h-10 rounded-xl"
                placeholder="O que está buscando?"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
