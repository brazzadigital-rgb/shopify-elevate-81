import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumToggle3D } from "@/components/ui/premium-toggle-3d";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Settings, Flame, CreditCard, Package, MessageCircle, Phone, Truck, Store } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsMap {
  [key: string]: string;
}

const settingsGroups = [
  {
    id: "geral",
    title: "Geral",
    icon: Settings,
    description: "Nome, recursos e funcionalidades básicas",
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
    id: "promocoes",
    title: "Promoções",
    icon: Flame,
    description: "Black Friday, Natal e queima de estoque",
    settings: [
      { key: "black_friday_enabled", label: "Ativar Black Friday", type: "toggle" },
      { key: "black_friday_text", label: "Texto Black Friday", type: "text" },
      { key: "clearance_enabled", label: "Ativar Queima de Estoque", type: "toggle" },
      { key: "christmas_enabled", label: "Ativar Promoção de Natal", type: "toggle" },
    ],
  },
  {
    id: "pagamento",
    title: "Pagamento",
    icon: CreditCard,
    description: "Pix, parcelamento e bandeiras",
    settings: [
      { key: "pix_enabled", label: "Ativar Pix", type: "toggle" },
      { key: "pix_discount_percent", label: "Desconto Pix (%)", type: "number" },
      { key: "installments_enabled", label: "Ativar Parcelamento", type: "toggle" },
      { key: "max_installments", label: "Máx. Parcelas", type: "number" },
      { key: "payment_badges_enabled", label: "Mostrar Bandeiras", type: "toggle" },
    ],
  },
  {
    id: "estoque",
    title: "Estoque & Urgência",
    icon: Package,
    description: "Avisos de estoque e urgência",
    settings: [
      { key: "stock_warning_enabled", label: "Aviso 'Apenas X restantes'", type: "toggle" },
      { key: "stock_warning_threshold", label: "Limite para aviso", type: "number" },
      { key: "stock_status_enabled", label: "Mostrar 'Disponível em estoque'", type: "toggle" },
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    icon: MessageCircle,
    description: "Botão e mensagem padrão",
    settings: [
      { key: "whatsapp_enabled", label: "Botão WhatsApp no produto", type: "toggle" },
      { key: "whatsapp_number", label: "Número WhatsApp", type: "text" },
      { key: "whatsapp_message", label: "Mensagem padrão", type: "text" },
    ],
  },
  {
    id: "contato",
    title: "Contato",
    icon: Phone,
    description: "Dados da empresa e redes sociais",
    settings: [
      { key: "contact_cnpj", label: "CNPJ da Empresa", type: "text" },
      { key: "contact_email", label: "E-mail de contato", type: "text" },
      { key: "contact_phone", label: "Telefone", type: "text" },
      { key: "contact_address", label: "Endereço", type: "text" },
      { key: "contact_hours_weekday", label: "Horário Seg-Sex", type: "text" },
      { key: "contact_hours_saturday", label: "Horário Sábado", type: "text" },
      { key: "contact_hours_sunday", label: "Horário Dom/Feriado", type: "text" },
      { key: "contact_instagram", label: "Link Instagram", type: "text" },
      { key: "contact_facebook", label: "Link Facebook", type: "text" },
    ],
  },
  {
    id: "frete",
    title: "Frete",
    icon: Truck,
    description: "Frete grátis e prazos",
    settings: [
      { key: "shipping_enabled", label: "Bloco Frete no produto", type: "toggle" },
      { key: "free_shipping_min_value", label: "Frete grátis acima de (R$)", type: "number" },
      { key: "free_shipping_text", label: "Texto frete grátis", type: "text" },
      { key: "shipping_default_days", label: "Prazo padrão (dias)", type: "number" },
    ],
  },
  {
    id: "vendido-por",
    title: "Vendido por",
    icon: Store,
    description: "Informações do vendedor",
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
  const [activeTab, setActiveTab] = useState("geral");

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

  const activeGroup = settingsGroups.find(g => g.id === activeTab)!;

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Configurações da Loja</h1>
          <p className="text-muted-foreground font-sans mt-1 text-sm">Controle todos os recursos da loja</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl shine h-11 font-sans w-full sm:w-auto">
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar navigation */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {settingsGroups.map((group) => {
              const Icon = group.icon;
              const isActive = activeTab === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveTab(group.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-sans whitespace-nowrap transition-all text-left",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{group.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content area */}
        <Card className="shadow-premium border-0 flex-1 min-w-0">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                <activeGroup.icon className="w-5 h-5 text-primary" />
                {activeGroup.title}
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">{activeGroup.description}</p>
            </div>

            <div className="divide-y divide-border/50">
              {activeGroup.settings.map((s) => (
                <div key={s.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-4 first:pt-0 last:pb-0">
                  <Label className="font-sans text-sm">{s.label}</Label>
                  {s.type === "toggle" ? (
                    <PremiumToggle3D
                      size="sm"
                      checked={settings[s.key] === "true"}
                      onCheckedChange={(v) => updateSetting(s.key, v ? "true" : "false")}
                    />
                  ) : (
                    <Input
                      type={s.type === "number" ? "number" : "text"}
                      value={settings[s.key] || ""}
                      onChange={(e) => updateSetting(s.key, e.target.value)}
                      className="h-10 rounded-xl w-full sm:max-w-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
