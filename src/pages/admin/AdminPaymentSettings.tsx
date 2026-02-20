import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { PremiumToggle3D } from "@/components/ui/premium-toggle-3d";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CreditCard, Shield, Eye, EyeOff, Loader2, Settings, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GatewayConfig {
  id: string;
  provider: string;
  is_active: boolean;
  is_default: boolean;
  environment: string;
  config: any;
  sort_order: number;
}

const PROVIDER_LABELS: Record<string, string> = {
  asaas: "Asaas",
  mercadopago: "Mercado Pago",
  pagseguro: "PagSeguro",
  stripe: "Stripe",
};

const PROVIDER_ICONS: Record<string, string> = {
  asaas: "💳",
  mercadopago: "🟡",
  pagseguro: "🟢",
  stripe: "🟣",
};

const PROVIDER_SECRET_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  asaas: [
    { key: "api_key", label: "API Key", placeholder: "$aact_..." },
    { key: "webhook_token", label: "Webhook Token", placeholder: "Token de webhook" },
  ],
  mercadopago: [
    { key: "access_token", label: "Access Token", placeholder: "APP_USR-..." },
    { key: "public_key", label: "Public Key", placeholder: "APP_USR-..." },
    { key: "webhook_secret", label: "Webhook Secret", placeholder: "Assinatura webhook" },
  ],
  pagseguro: [
    { key: "token", label: "Token", placeholder: "Token PagSeguro" },
    { key: "email", label: "Email da conta", placeholder: "email@pagseguro.com" },
    { key: "app_key", label: "App Key (v4)", placeholder: "Chave da aplicação" },
    { key: "webhook_token", label: "Webhook Token", placeholder: "Token de webhook" },
  ],
  stripe: [
    { key: "publishable_key", label: "Publishable Key", placeholder: "pk_..." },
    { key: "secret_key", label: "Secret Key", placeholder: "sk_..." },
    { key: "webhook_signing_secret", label: "Webhook Signing Secret", placeholder: "whsec_..." },
  ],
};

export default function AdminPaymentSettings() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [secrets, setSecrets] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("geral");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [configRes, secretsRes] = await Promise.all([
      supabase.from("payment_gateway_configs").select("*").order("sort_order"),
      supabase.from("payment_gateway_secrets").select("*"),
    ]);
    setGateways((configRes.data as GatewayConfig[]) || []);
    const secretMap: Record<string, Record<string, string>> = {};
    (secretsRes.data || []).forEach((s: any) => {
      if (!secretMap[s.provider]) secretMap[s.provider] = {};
      secretMap[s.provider][s.secret_key] = s.secret_value;
    });
    setSecrets(secretMap);
    setLoading(false);
  };

  const updateGateway = (provider: string, updates: Partial<GatewayConfig>) => {
    setGateways(prev => prev.map(g => g.provider === provider ? { ...g, ...updates } : g));
  };

  const updateGatewayConfig = (provider: string, key: string, value: any) => {
    setGateways(prev =>
      prev.map(g => g.provider === provider ? { ...g, config: { ...g.config, [key]: value } } : g)
    );
  };

  const updateGatewayMethod = (provider: string, method: string, enabled: boolean) => {
    setGateways(prev =>
      prev.map(g =>
        g.provider === provider
          ? { ...g, config: { ...g.config, methods: { ...g.config.methods, [method]: enabled } } }
          : g
      )
    );
  };

  const updateSecret = (provider: string, key: string, value: string) => {
    setSecrets(prev => ({ ...prev, [provider]: { ...(prev[provider] || {}), [key]: value } }));
  };

  const setDefaultGateway = (provider: string) => {
    setGateways(prev => prev.map(g => ({ ...g, is_default: g.provider === provider })));
  };

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const configPromises = gateways.map(g =>
        supabase.from("payment_gateway_configs").update({
          is_active: g.is_active, is_default: g.is_default, environment: g.environment,
          config: g.config, sort_order: g.sort_order,
        }).eq("id", g.id)
      );
      const secretPromises: PromiseLike<any>[] = [];
      Object.entries(secrets).forEach(([provider, keys]) => {
        Object.entries(keys).forEach(([key, value]) => {
          if (value) {
            secretPromises.push(
              supabase.from("payment_gateway_secrets")
                .upsert({ provider, secret_key: key, secret_value: value }, { onConflict: "provider,secret_key" })
                .select().then(() => {})
            );
          }
        });
      });
      await Promise.all([...configPromises, ...secretPromises]);
      toast({ title: "Configurações de pagamento salvas! ✅" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
      </div>
    );
  }

  const defaultGateway = gateways.find(g => g.is_default)?.provider || "asaas";

  const navItems = [
    { id: "geral", label: "Visão Geral", icon: Settings, description: "Gateway padrão e status" },
    ...gateways.map(g => ({
      id: g.provider,
      label: PROVIDER_LABELS[g.provider],
      icon: Wallet,
      description: g.is_active ? "Ativo" : "Inativo",
      emoji: PROVIDER_ICONS[g.provider],
      isActive: g.is_active,
    })),
  ];

  const activeGateway = gateways.find(g => g.provider === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
            <CreditCard className="w-7 h-7" /> Pagamentos
          </h1>
          <p className="text-muted-foreground font-sans mt-1 text-sm">Configure os gateways de pagamento da loja</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2 rounded-xl shine h-11 font-sans w-full sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-sans whitespace-nowrap transition-all text-left w-full",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {"emoji" in item ? (
                    <span className="text-base shrink-0">{item.emoji}</span>
                  ) : (
                    <item.icon className="w-4 h-4 shrink-0" />
                  )}
                  <span className="flex-1">{item.label}</span>
                  {"isActive" in item && (
                    <span className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      item.isActive ? "bg-primary/70" : "bg-muted-foreground/30"
                    )} />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* General tab */}
          {activeTab === "geral" && (
            <Card className="shadow-premium border-0">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" /> Visão Geral
                  </h2>
                  <p className="text-muted-foreground text-sm mt-0.5">Gateway padrão e status dos provedores</p>
                </div>

                <div className="divide-y divide-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 first:pt-0">
                    <Label className="font-sans text-sm">Gateway padrão</Label>
                    <Select value={defaultGateway} onValueChange={setDefaultGateway}>
                      <SelectTrigger className="w-full sm:max-w-xs rounded-xl h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {gateways.filter(g => g.is_active).map(g => (
                          <SelectItem key={g.provider} value={g.provider}>
                            {PROVIDER_LABELS[g.provider]}
                          </SelectItem>
                        ))}
                        {gateways.filter(g => g.is_active).length === 0 && (
                          <SelectItem value="none" disabled>Nenhum gateway ativo</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4">
                    <Label className="font-sans text-sm">Moeda</Label>
                    <Input value="BRL" disabled className="h-10 rounded-xl w-full sm:max-w-xs" />
                  </div>
                </div>

                <div className="border-t pt-5 mt-5">
                  <h3 className="font-sans text-sm font-semibold mb-3">Status dos Gateways</h3>
                  <div className="grid gap-3">
                    {gateways.map(g => (
                      <div key={g.provider} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{PROVIDER_ICONS[g.provider]}</span>
                          <span className="font-sans text-sm font-medium">{PROVIDER_LABELS[g.provider]}</span>
                          <Badge variant={g.is_active ? "default" : "secondary"} className="text-xs font-sans">
                            {g.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          {g.is_default && (
                            <Badge variant="outline" className="text-xs font-sans border-accent text-accent">Padrão</Badge>
                          )}
                        </div>
                        <span className="text-xs font-sans text-muted-foreground capitalize">{g.environment}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider tabs */}
          {activeGateway && (
            <>
              {/* Activation & Environment */}
              <Card className="shadow-premium border-0">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-5">
                    <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                      <span className="text-xl">{PROVIDER_ICONS[activeGateway.provider]}</span>
                      {PROVIDER_LABELS[activeGateway.provider]}
                      {activeGateway.is_active && <Badge className="text-xs font-sans">Ativo</Badge>}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Ativação e ambiente</p>
                  </div>

                  <div className="divide-y divide-border/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 first:pt-0">
                      <Label className="font-sans text-sm">Ativar gateway</Label>
                      <PremiumToggle3D
                        size="sm"
                        checked={activeGateway.is_active}
                        onCheckedChange={v => updateGateway(activeGateway.provider, { is_active: v })}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4">
                      <Label className="font-sans text-sm">Ambiente</Label>
                      <Select
                        value={activeGateway.environment}
                        onValueChange={v => updateGateway(activeGateway.provider, { environment: v })}
                      >
                        <SelectTrigger className="w-full sm:max-w-xs rounded-xl h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sandbox">🧪 Sandbox (testes)</SelectItem>
                          <SelectItem value="production">🚀 Produção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Credentials */}
              <Card className="shadow-premium border-0">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-5">
                    <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" /> Credenciais
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Chaves de API e tokens de autenticação</p>
                  </div>

                  <div className="space-y-4">
                    {PROVIDER_SECRET_FIELDS[activeGateway.provider]?.map(field => {
                      const secretKey = `${activeGateway.provider}_${field.key}`;
                      const isVisible = visibleSecrets[secretKey];
                      return (
                        <div key={field.key} className="space-y-1.5">
                          <Label className="font-sans text-sm">{field.label}</Label>
                          <div className="relative">
                            <Input
                              type={isVisible ? "text" : "password"}
                              value={secrets[activeGateway.provider]?.[field.key] || ""}
                              onChange={e => updateSecret(activeGateway.provider, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="h-10 rounded-xl pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => toggleSecretVisibility(secretKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-xs text-muted-foreground font-sans flex items-center gap-1 pt-2">
                      <Shield className="w-3 h-3" /> Credenciais armazenadas com segurança no backend
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="shadow-premium border-0">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-5">
                    <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> Métodos de Pagamento
                    </h2>
                    <p className="text-muted-foreground text-sm mt-0.5">PIX, Cartão e Boleto</p>
                  </div>

                  <div className="divide-y divide-border/50">
                    {["pix", "card", "boleto"].map(method => (
                      <div key={method} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 first:pt-0 last:pb-0">
                        <Label className="font-sans text-sm">
                          {method === "card" ? "Cartão de Crédito" : method === "pix" ? "PIX" : "Boleto"}
                        </Label>
                        <PremiumToggle3D
                          size="sm"
                          checked={activeGateway.config?.methods?.[method] ?? false}
                          onCheckedChange={v => updateGatewayMethod(activeGateway.provider, method, v)}
                        />
                      </div>
                    ))}

                    {activeGateway.config?.methods?.card && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4">
                        <Label className="font-sans text-sm">Máximo de parcelas</Label>
                        <Select
                          value={String(activeGateway.config.max_installments || 12)}
                          onValueChange={v => updateGatewayConfig(activeGateway.provider, "max_installments", Number(v))}
                        >
                          <SelectTrigger className="w-full sm:max-w-xs rounded-xl h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 6, 8, 10, 12].map(n => (
                              <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {activeGateway.provider === "stripe" && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4">
                        <Label className="font-sans text-sm">Captura de cartão</Label>
                        <Select
                          value={activeGateway.config.capture_method || "automatic"}
                          onValueChange={v => updateGatewayConfig(activeGateway.provider, "capture_method", v)}
                        >
                          <SelectTrigger className="w-full sm:max-w-xs rounded-xl h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="automatic">Automática</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {activeGateway.config?.methods?.pix && activeGateway.provider === "asaas" && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4">
                        <Label className="font-sans text-sm">Expiração PIX (minutos)</Label>
                        <Input
                          type="number"
                          value={activeGateway.config.pix_expiration_minutes || 30}
                          onChange={e => updateGatewayConfig(activeGateway.provider, "pix_expiration_minutes", Number(e.target.value))}
                          className="h-10 rounded-xl w-full sm:max-w-xs"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
