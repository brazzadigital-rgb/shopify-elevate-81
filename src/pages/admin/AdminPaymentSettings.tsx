import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PremiumToggle3D } from "@/components/ui/premium-toggle-3d";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CreditCard, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GatewayConfig {
  id: string;
  provider: string;
  is_active: boolean;
  is_default: boolean;
  environment: string;
  config: any;
  sort_order: number;
}

interface GatewaySecret {
  provider: string;
  secret_key: string;
  secret_value: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  asaas: "Asaas",
  mercadopago: "Mercado Pago",
  pagseguro: "PagSeguro",
  stripe: "Stripe",
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
    setGateways(prev =>
      prev.map(g => g.provider === provider ? { ...g, ...updates } : g)
    );
  };

  const updateGatewayConfig = (provider: string, key: string, value: any) => {
    setGateways(prev =>
      prev.map(g =>
        g.provider === provider
          ? { ...g, config: { ...g.config, [key]: value } }
          : g
      )
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
    setSecrets(prev => ({
      ...prev,
      [provider]: { ...(prev[provider] || {}), [key]: value },
    }));
  };

  const setDefaultGateway = (provider: string) => {
    setGateways(prev =>
      prev.map(g => ({ ...g, is_default: g.provider === provider }))
    );
  };

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save gateway configs
      const configPromises = gateways.map(g =>
        supabase
          .from("payment_gateway_configs")
          .update({
            is_active: g.is_active,
            is_default: g.is_default,
            environment: g.environment,
            config: g.config,
            sort_order: g.sort_order,
          })
          .eq("id", g.id)
      );

      // Save secrets (upsert)
      const secretPromises: PromiseLike<any>[] = [];
      Object.entries(secrets).forEach(([provider, keys]) => {
        Object.entries(keys).forEach(([key, value]) => {
          if (value) {
            secretPromises.push(
              supabase
                .from("payment_gateway_secrets")
                .upsert(
                  { provider, secret_key: key, secret_value: value },
                  { onConflict: "provider,secret_key" }
                )
                .select()
                .then(() => {})
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

  return (
    <div className="space-y-6">
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="geral" className="rounded-lg font-sans text-xs sm:text-sm">⚙️ Geral</TabsTrigger>
          {gateways.map(g => (
            <TabsTrigger key={g.provider} value={g.provider} className="rounded-lg font-sans text-xs sm:text-sm relative">
              {PROVIDER_LABELS[g.provider]}
              {g.is_active && (
                <span className="ml-1.5 w-2 h-2 rounded-full bg-success inline-block" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* General tab */}
        <TabsContent value="geral" className="mt-6 space-y-6">
          <Card className="shadow-premium border-0">
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg">Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label className="font-sans text-sm">Moeda</Label>
                <Input value="BRL" disabled className="h-10 rounded-xl w-full sm:max-w-xs" />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-sans text-sm font-semibold mb-3">Status dos Gateways</h3>
                <div className="grid gap-3">
                  {gateways.map(g => (
                    <div key={g.provider} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-sm font-medium">{PROVIDER_LABELS[g.provider]}</span>
                        <Badge variant={g.is_active ? "default" : "secondary"} className="text-xs font-sans">
                          {g.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        {g.is_default && (
                          <Badge variant="outline" className="text-xs font-sans border-accent text-accent">
                            Padrão
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-sans text-muted-foreground capitalize">{g.environment}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provider tabs */}
        {gateways.map(g => (
          <TabsContent key={g.provider} value={g.provider} className="mt-6 space-y-6">
            {/* Activation & Environment */}
            <Card className="shadow-premium border-0">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  {PROVIDER_LABELS[g.provider]}
                  {g.is_active && <Badge className="text-xs font-sans">Ativo</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="font-sans text-sm">Ativar gateway</Label>
                  <PremiumToggle3D
                    size="sm"
                    checked={g.is_active}
                    onCheckedChange={v => updateGateway(g.provider, { is_active: v })}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="font-sans text-sm">Ambiente</Label>
                  <Select
                    value={g.environment}
                    onValueChange={v => updateGateway(g.provider, { environment: v })}
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
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card className="shadow-premium border-0">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" /> Credenciais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {PROVIDER_SECRET_FIELDS[g.provider]?.map(field => {
                  const secretKey = `${g.provider}_${field.key}`;
                  const isVisible = visibleSecrets[secretKey];
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="font-sans text-sm">{field.label}</Label>
                      <div className="relative">
                        <Input
                          type={isVisible ? "text" : "password"}
                          value={secrets[g.provider]?.[field.key] || ""}
                          onChange={e => updateSecret(g.provider, field.key, e.target.value)}
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
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="shadow-premium border-0">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg">Métodos de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {["pix", "card", "boleto"].map(method => (
                  <div key={method} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <Label className="font-sans text-sm capitalize">
                      {method === "card" ? "Cartão de Crédito" : method === "pix" ? "PIX" : "Boleto"}
                    </Label>
                    <PremiumToggle3D
                      size="sm"
                      checked={g.config?.methods?.[method] ?? false}
                      onCheckedChange={v => updateGatewayMethod(g.provider, method, v)}
                    />
                  </div>
                ))}

                {g.config?.methods?.card && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
                    <Label className="font-sans text-sm">Máximo de parcelas</Label>
                    <Select
                      value={String(g.config.max_installments || 12)}
                      onValueChange={v => updateGatewayConfig(g.provider, "max_installments", Number(v))}
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

                {g.provider === "stripe" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
                    <Label className="font-sans text-sm">Captura de cartão</Label>
                    <Select
                      value={g.config.capture_method || "automatic"}
                      onValueChange={v => updateGatewayConfig(g.provider, "capture_method", v)}
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

                {g.config?.methods?.pix && g.provider === "asaas" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
                    <Label className="font-sans text-sm">Expiração PIX (minutos)</Label>
                    <Input
                      type="number"
                      value={g.config.pix_expiration_minutes || 30}
                      onChange={e => updateGatewayConfig(g.provider, "pix_expiration_minutes", Number(e.target.value))}
                      className="h-10 rounded-xl w-full sm:max-w-xs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
