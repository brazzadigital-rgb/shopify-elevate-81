import { useState } from "react";
import { useTrackingSettings, type TrackingConfig } from "@/hooks/useTrackingSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Facebook, BarChart3, Link2, Shield, Wrench, Save, Loader2,
  CheckCircle2, XCircle, Activity, Eye
} from "lucide-react";

export default function AdminTracking() {
  const { config, isLoading, saveConfig, isSaving } = useTrackingSettings();
  const [local, setLocal] = useState<TrackingConfig | null>(null);

  const c = local || config;
  const set = (patch: Partial<TrackingConfig>) => setLocal({ ...c, ...patch });

  const handleSave = () => {
    if (local) saveConfig(local);
  };

  if (isLoading) return <div className="space-y-4 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Rastreamento & Analytics</h1>
          <p className="font-sans text-sm text-muted-foreground">Configure Meta Pixel, GA4, UTMs e consentimento LGPD</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !local} className="rounded-xl font-sans gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </Button>
      </div>

      <Tabs defaultValue="meta" className="w-full">
        <TabsList className="grid w-full grid-cols-5 rounded-xl h-auto p-1">
          <TabsTrigger value="meta" className="rounded-lg font-sans text-xs py-2 gap-1.5">
            <Facebook className="w-3.5 h-3.5" /> Meta Pixel
          </TabsTrigger>
          <TabsTrigger value="ga4" className="rounded-lg font-sans text-xs py-2 gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> GA4
          </TabsTrigger>
          <TabsTrigger value="utm" className="rounded-lg font-sans text-xs py-2 gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> UTMify
          </TabsTrigger>
          <TabsTrigger value="lgpd" className="rounded-lg font-sans text-xs py-2 gap-1.5">
            <Shield className="w-3.5 h-3.5" /> LGPD
          </TabsTrigger>
          <TabsTrigger value="debug" className="rounded-lg font-sans text-xs py-2 gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Diagnóstico
          </TabsTrigger>
        </TabsList>

        {/* META PIXEL */}
        <TabsContent value="meta">
          <Card className="border-0 shadow-premium rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-600" /> Meta Pixel (Facebook)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-sans font-medium">Ativar Meta Pixel</Label>
                  <p className="text-xs text-muted-foreground font-sans">Carrega o script do Facebook Pixel</p>
                </div>
                <Switch checked={c.meta_pixel_enabled} onCheckedChange={v => set({ meta_pixel_enabled: v })} />
              </div>

              {c.meta_pixel_enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-sans text-sm">Pixel ID</Label>
                      <Input className="mt-1 rounded-lg" placeholder="123456789" value={c.meta_pixel_id} onChange={e => set({ meta_pixel_id: e.target.value })} />
                    </div>
                    <div>
                      <Label className="font-sans text-sm">Access Token (CAPI)</Label>
                      <Input className="mt-1 rounded-lg" placeholder="Opcional" value={c.meta_pixel_access_token} onChange={e => set({ meta_pixel_access_token: e.target.value })} type="password" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-sans font-medium">Deduplicação (event_id)</Label>
                      <p className="text-xs text-muted-foreground font-sans">Envia event_id único para evitar contagem dupla</p>
                    </div>
                    <Switch checked={c.meta_pixel_dedup} onCheckedChange={v => set({ meta_pixel_dedup: v })} />
                  </div>

                  <Separator />
                  <h3 className="font-sans font-semibold text-sm">Advanced Matching</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "email", label: "Email (hash)" },
                      { key: "phone", label: "Telefone (hash)" },
                      { key: "name", label: "Nome" },
                      { key: "city_state_zip", label: "Cidade/Estado/CEP" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <Label className="font-sans text-sm">{item.label}</Label>
                        <Switch
                          checked={(c.meta_pixel_advanced_matching as any)[item.key]}
                          onCheckedChange={v => set({
                            meta_pixel_advanced_matching: { ...c.meta_pixel_advanced_matching, [item.key]: v }
                          })}
                        />
                      </div>
                    ))}
                  </div>

                  <Separator />
                  <h3 className="font-sans font-semibold text-sm">Eventos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(c.meta_pixel_events).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <Label className="font-sans text-sm">{key}</Label>
                        <Switch
                          checked={val}
                          onCheckedChange={v => set({
                            meta_pixel_events: { ...c.meta_pixel_events, [key]: v }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GA4 */}
        <TabsContent value="ga4">
          <Card className="border-0 shadow-premium rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-600" /> Google Analytics 4
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-sans font-medium">Ativar GA4</Label>
                  <p className="text-xs text-muted-foreground font-sans">Carrega o Google Analytics 4</p>
                </div>
                <Switch checked={c.ga4_enabled} onCheckedChange={v => set({ ga4_enabled: v })} />
              </div>

              {c.ga4_enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-sans text-sm">Measurement ID</Label>
                      <Input className="mt-1 rounded-lg" placeholder="G-XXXXXXXXXX" value={c.ga4_measurement_id} onChange={e => set({ ga4_measurement_id: e.target.value })} />
                    </div>
                    <div>
                      <Label className="font-sans text-sm">API Secret (Measurement Protocol)</Label>
                      <Input className="mt-1 rounded-lg" placeholder="Opcional" value={c.ga4_api_secret} onChange={e => set({ ga4_api_secret: e.target.value })} type="password" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-sans font-medium">Enhanced Measurement</Label>
                      <p className="text-xs text-muted-foreground font-sans">Scroll, outbound clicks, site search automático</p>
                    </div>
                    <Switch checked={c.ga4_enhanced_measurement} onCheckedChange={v => set({ ga4_enhanced_measurement: v })} />
                  </div>

                  <Separator />
                  <h3 className="font-sans font-semibold text-sm">Eventos E-commerce</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(c.ga4_events).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                        <Label className="font-sans text-sm">{key}</Label>
                        <Switch
                          checked={val}
                          onCheckedChange={v => set({
                            ga4_events: { ...c.ga4_events, [key]: v }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* UTMify */}
        <TabsContent value="utm">
          <Card className="border-0 shadow-premium rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" /> UTMify (Captura & Atribuição)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-sans font-medium">Ativar UTMify</Label>
                  <p className="text-xs text-muted-foreground font-sans">Captura UTMs, fbclid, gclid automaticamente</p>
                </div>
                <Switch checked={c.utmify_enabled} onCheckedChange={v => set({ utmify_enabled: v })} />
              </div>

              {c.utmify_enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-sans text-sm">Janela de atribuição (dias)</Label>
                      <Select value={String(c.utmify_attribution_window)} onValueChange={v => set({ utmify_attribution_window: Number(v) })}>
                        <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                          <SelectItem value="60">60 dias</SelectItem>
                          <SelectItem value="90">90 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="font-sans text-sm">Modelo de atribuição</Label>
                      <Select value={c.utmify_model} onValueChange={v => set({ utmify_model: v as any })}>
                        <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="first_click">First-click</SelectItem>
                          <SelectItem value="last_click">Last-click</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <Label className="font-sans text-sm">localStorage</Label>
                      <Switch checked={c.utmify_use_localstorage} onCheckedChange={v => set({ utmify_use_localstorage: v })} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <Label className="font-sans text-sm">Cookie</Label>
                      <Switch checked={c.utmify_use_cookie} onCheckedChange={v => set({ utmify_use_cookie: v })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-sans font-medium">Normalização</Label>
                      <p className="text-xs text-muted-foreground font-sans">Converte para lowercase e remove espaços</p>
                    </div>
                    <Switch checked={c.utmify_normalize} onCheckedChange={v => set({ utmify_normalize: v })} />
                  </div>

                  <div>
                    <Label className="font-sans text-sm">Ignorar auto-referrals (domínios separados por vírgula)</Label>
                    <Input className="mt-1 rounded-lg" placeholder="meusite.com, meusite.com.br" value={c.utmify_ignore_domains} onChange={e => set({ utmify_ignore_domains: e.target.value })} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LGPD */}
        <TabsContent value="lgpd">
          <Card className="border-0 shadow-premium rounded-2xl">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" /> Consentimento LGPD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-sans font-medium">Ativar banner de consentimento</Label>
                  <p className="text-xs text-muted-foreground font-sans">Exibe cookie banner para visitantes</p>
                </div>
                <Switch checked={c.lgpd_enabled} onCheckedChange={v => set({ lgpd_enabled: v })} />
              </div>

              {c.lgpd_enabled && (
                <>
                  <div>
                    <Label className="font-sans text-sm">Texto do banner</Label>
                    <Textarea className="mt-1 rounded-lg min-h-[80px]" value={c.lgpd_banner_text} onChange={e => set({ lgpd_banner_text: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-sans text-sm">Link da política de privacidade</Label>
                      <Input className="mt-1 rounded-lg" value={c.lgpd_policy_link} onChange={e => set({ lgpd_policy_link: e.target.value })} />
                    </div>
                    <div>
                      <Label className="font-sans text-sm">Ação padrão</Label>
                      <Select value={c.lgpd_default_action} onValueChange={v => set({ lgpd_default_action: v as any })}>
                        <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reject">Rejeitar (recomendado)</SelectItem>
                          <SelectItem value="accept">Aceitar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="font-sans text-sm">Categoria do UTM tracking</Label>
                    <Select value={c.lgpd_utm_category} onValueChange={v => set({ lgpd_utm_category: v as any })}>
                      <SelectTrigger className="mt-1 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analytics">Analytics</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DIAGNOSTICS */}
        <TabsContent value="debug">
          <DiagnosticsTab config={c} onToggleDebug={v => set({ debug_mode: v })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DiagnosticsTab({ config, onToggleDebug }: { config: TrackingConfig; onToggleDebug: (v: boolean) => void }) {
  const debugLogs = (() => {
    try {
      const raw = localStorage.getItem("tracking_debug_log");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  })();

  const firstTouch = (() => {
    try { return JSON.parse(localStorage.getItem("utm_first_touch") || "null"); } catch { return null; }
  })();
  const lastTouch = (() => {
    try { return JSON.parse(localStorage.getItem("utm_last_touch") || "null"); } catch { return null; }
  })();
  const visitorId = localStorage.getItem("utm_visitor_id") || "—";

  const StatusBadge = ({ active, label }: { active: boolean; label: string }) => (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
      {active ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
      <span className="font-sans text-sm">{label}</span>
      <Badge variant={active ? "default" : "secondary"} className="ml-auto text-[10px]">
        {active ? "Ativo" : "Inativo"}
      </Badge>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-premium rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" /> Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusBadge active={config.meta_pixel_enabled && !!config.meta_pixel_id} label="Meta Pixel" />
          <StatusBadge active={config.ga4_enabled && !!config.ga4_measurement_id} label="Google Analytics 4" />
          <StatusBadge active={config.utmify_enabled} label="UTMify" />
          <StatusBadge active={config.lgpd_enabled} label="Consentimento LGPD" />

          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-sans font-medium">Modo Debug</Label>
              <p className="text-xs text-muted-foreground font-sans">Registra todos os eventos no console e localStorage</p>
            </div>
            <Switch checked={config.debug_mode} onCheckedChange={onToggleDebug} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-premium rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Link2 className="w-5 h-5" /> UTMs Capturadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-sans text-xs text-muted-foreground mb-1">Visitor ID</p>
            <code className="font-mono text-xs bg-muted p-2 rounded-lg block">{visitorId}</code>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-sans text-sm font-medium mb-2">First Touch</p>
              {firstTouch ? (
                <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                  {Object.entries(firstTouch).filter(([, v]) => v).map(([k, v]) => (
                    <p key={k} className="font-sans text-xs"><span className="text-muted-foreground">{k}:</span> {String(v)}</p>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground font-sans">Nenhum dado capturado</p>}
            </div>
            <div>
              <p className="font-sans text-sm font-medium mb-2">Last Touch</p>
              {lastTouch ? (
                <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                  {Object.entries(lastTouch).filter(([, v]) => v).map(([k, v]) => (
                    <p key={k} className="font-sans text-xs"><span className="text-muted-foreground">{k}:</span> {String(v)}</p>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground font-sans">Nenhum dado capturado</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {debugLogs.length > 0 && (
        <Card className="border-0 shadow-premium rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" /> Últimos Eventos ({debugLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {debugLogs.map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg text-xs font-mono">
                  <Badge variant="outline" className="text-[9px] shrink-0">{log.platform}</Badge>
                  <span className="text-muted-foreground shrink-0">{new Date(log.ts).toLocaleTimeString("pt-BR")}</span>
                  <span className="font-semibold">{log.event}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
