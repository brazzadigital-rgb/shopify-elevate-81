import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useOwnerSettings } from "@/hooks/useOwnerSettings";
import { supabase } from "@/integrations/supabase/client";

export default function OwnerSettings() {
  const { getValue, saveMultiple, isLoading } = useOwnerSettings();
  const [efiClientId, setEfiClientId] = useState("");
  const [efiClientSecret, setEfiClientSecret] = useState("");
  const [efiEnvironment, setEfiEnvironment] = useState("sandbox");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setEfiClientId(getValue("efi_client_id"));
      setEfiClientSecret(getValue("efi_client_secret"));
      setEfiEnvironment(getValue("efi_environment") || "sandbox");
    }
  }, [isLoading, getValue]);

  const webhookUrl = `${window.location.origin}/api/webhooks/efi`;

  const handleSave = async () => {
    setSaving(true);
    await saveMultiple([
      { key: "efi_client_id", value: efiClientId },
      { key: "efi_client_secret", value: efiClientSecret },
      { key: "efi_environment", value: efiEnvironment },
    ]);
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("owner-efi-charge", {
        body: { action: "test_connection" },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Conexão testada", description: "Conexão com a Efí validada com sucesso." });
      } else {
        toast({ title: "Falha na conexão", description: data?.error || "Verifique as credenciais.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro ao testar", description: "Não foi possível conectar com a Efí.", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 text-sm mt-1">Configurações do sistema e integrações</p>
      </div>

      <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            Efí Bank — Assinatura
          </CardTitle>
          <CardDescription className="text-slate-400">
            Configure as credenciais da Efí Bank para cobranças de assinatura via PIX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Client ID</Label>
              <Input
                value={efiClientId}
                onChange={e => setEfiClientId(e.target.value)}
                placeholder="Seu Client ID da Efí"
                className="h-11 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-amber-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">Client Secret</Label>
              <Input
                value={efiClientSecret}
                onChange={e => setEfiClientSecret(e.target.value)}
                type="password"
                placeholder="Seu Client Secret da Efí"
                className="h-11 rounded-xl bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-600 focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium">Ambiente</Label>
            <div className="flex gap-2">
              {["sandbox", "production"].map(env => (
                <button
                  key={env}
                  onClick={() => setEfiEnvironment(env)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    efiEnvironment === env
                      ? "bg-amber-500 text-slate-900"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {env === "sandbox" ? "Sandbox" : "Produção"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300 text-sm font-medium">Webhook Endpoint</Label>
            <div className="flex items-center gap-2">
              <Input
                value={webhookUrl}
                readOnly
                className="h-11 rounded-xl bg-slate-800/50 border-slate-700 text-slate-400 font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  toast({ title: "Copiado!" });
                }}
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-slate-500">Configure este endpoint no painel da Efí Bank</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Configurações
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-slate-900/60 backdrop-blur shadow-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40">
            <div>
              <p className="text-sm font-medium text-white">Autenticação 2FA</p>
              <p className="text-xs text-slate-500">Adiciona uma camada extra de segurança ao login</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-700 text-slate-400">
              Em breve
            </span>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40">
            <div>
              <p className="text-sm font-medium text-white">Expiração de Sessão</p>
              <p className="text-xs text-slate-500">Sessão expira automaticamente após 24h de inatividade</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
              Ativo
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
