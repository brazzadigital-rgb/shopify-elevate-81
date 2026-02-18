import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";

interface SettingsMap {
  [key: string]: string;
}

const settingsGroups = [
  {
    title: "⚙️ Geral",
    settings: [
      { key: "store_name", label: "Nome da Loja", type: "text" },
      { key: "topbar_enabled", label: "Ativar TopBar", type: "toggle" },
      { key: "topbar_text", label: "Texto da TopBar", type: "text" },
      { key: "newsletter_enabled", label: "Ativar Newsletter", type: "toggle" },
      { key: "drawer_cart_enabled", label: "Ativar Drawer Cart", type: "toggle" },
      { key: "wishlist_enabled", label: "Ativar Wishlist", type: "toggle" },
      { key: "reviews_enabled", label: "Ativar Reviews", type: "toggle" },
      { key: "sold_count_enabled", label: "Mostrar 'X vendidos'", type: "toggle" },
      { key: "verified_badge_enabled", label: "Selo Verificado", type: "toggle" },
      { key: "sku_enabled", label: "Mostrar SKU", type: "toggle" },
    ],
  },
  {
    title: "🔥 Promoções",
    settings: [
      { key: "black_friday_enabled", label: "Ativar Black Friday", type: "toggle" },
      { key: "black_friday_text", label: "Texto Black Friday", type: "text" },
      { key: "clearance_enabled", label: "Ativar Queima de Estoque", type: "toggle" },
      { key: "christmas_enabled", label: "Ativar Promoção de Natal", type: "toggle" },
    ],
  },
  {
    title: "💳 Pagamento",
    settings: [
      { key: "pix_enabled", label: "Ativar Pix", type: "toggle" },
      { key: "pix_discount_percent", label: "Desconto Pix (%)", type: "number" },
      { key: "installments_enabled", label: "Ativar Parcelamento", type: "toggle" },
      { key: "max_installments", label: "Máx. Parcelas", type: "number" },
      { key: "payment_badges_enabled", label: "Mostrar Bandeiras", type: "toggle" },
    ],
  },
  {
    title: "📦 Estoque & Urgência",
    settings: [
      { key: "stock_warning_enabled", label: "Aviso 'Apenas X restantes'", type: "toggle" },
      { key: "stock_warning_threshold", label: "Limite para aviso", type: "number" },
      { key: "stock_status_enabled", label: "Mostrar 'Disponível em estoque'", type: "toggle" },
    ],
  },
  {
    title: "📱 WhatsApp",
    settings: [
      { key: "whatsapp_enabled", label: "Botão WhatsApp no produto", type: "toggle" },
      { key: "whatsapp_number", label: "Número WhatsApp", type: "text" },
      { key: "whatsapp_message", label: "Mensagem padrão", type: "text" },
    ],
  },
  {
    title: "🚚 Frete",
    settings: [
      { key: "shipping_enabled", label: "Bloco Frete no produto", type: "toggle" },
      { key: "free_shipping_min_value", label: "Frete grátis acima de (R$)", type: "number" },
      { key: "free_shipping_text", label: "Texto frete grátis", type: "text" },
      { key: "shipping_default_days", label: "Prazo padrão (dias)", type: "number" },
    ],
  },
  {
    title: "🏪 Vendido por",
    settings: [
      { key: "sold_by_enabled", label: "Mostrar 'Vendido e enviado por'", type: "toggle" },
      { key: "sold_by_name", label: "Nome do vendedor", type: "text" },
    ],
  },
];

export default function StoreSettings() {
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

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const promises = Object.entries(settings).map(([key, value]) =>
      supabase.from("store_settings").update({ value }).eq("key", key)
    );
    await Promise.all(promises);
    toast({ title: "Configurações salvas!" });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Configurações da Loja</h1>
          <p className="text-muted-foreground font-sans mt-1">Controle todos os recursos da loja</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl shine h-11 font-sans">
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="grid gap-6">
        {settingsGroups.map((group) => (
          <Card key={group.title} className="shadow-premium border-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.settings.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <Label className="font-sans text-sm flex-1">{s.label}</Label>
                  {s.type === "toggle" ? (
                    <Switch
                      checked={settings[s.key] === "true"}
                      onCheckedChange={(v) => updateSetting(s.key, v ? "true" : "false")}
                    />
                  ) : (
                    <Input
                      type={s.type === "number" ? "number" : "text"}
                      value={settings[s.key] || ""}
                      onChange={(e) => updateSetting(s.key, e.target.value)}
                      className="h-10 rounded-xl max-w-xs"
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
