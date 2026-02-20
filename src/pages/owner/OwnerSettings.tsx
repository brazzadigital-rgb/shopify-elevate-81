import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CreditCard, Shield, Loader2, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useOwnerSettings } from "@/hooks/useOwnerSettings";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

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

  const fadeUp = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-400 text-sm mt-1">Configurações do sistema e integrações</p>
      </div>

      {/* Efí Bank card */}
      <motion.div {...fadeUp(0)}>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Efí Bank — Assinatura</h3>
              <p className="text-xs text-slate-400">Credenciais para cobranças de assinatura via PIX</p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm font-medium">Client ID</Label>
                <Input
                  value={efiClientId}
                  onChange={e => setEfiClientId(e.target.value)}
                  placeholder="Seu Client ID da Efí"
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-emerald-300 focus:ring-emerald-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm font-medium">Client Secret</Label>
                <Input
                  value={efiClientSecret}
                  onChange={e => setEfiClientSecret(e.target.value)}
                  type="password"
                  placeholder="Seu Client Secret da Efí"
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-emerald-300 focus:ring-emerald-200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 text-sm font-medium">Ambiente</Label>
              <div className="flex gap-2">
                {["sandbox", "production"].map(env => (
                  <button
                    key={env}
                    onClick={() => setEfiEnvironment(env)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      efiEnvironment === env
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-600"
                    }`}
                  >
                    {env === "sandbox" ? "Sandbox" : "Produção"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600 text-sm font-medium">Webhook Endpoint</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={webhookUrl}
                  readOnly
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-400 font-mono text-xs flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    toast({ title: "Copiado!" });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">Configure este endpoint no painel da Efí Bank</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar Configurações
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
                onClick={handleTest}
                disabled={testing}
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Testar Conexão
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security card */}
      <motion.div {...fadeUp(1)}>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Segurança</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Autenticação 2FA</p>
                <p className="text-xs text-slate-400">Camada extra de segurança ao login</p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
                Em breve
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-sm font-medium text-slate-800">Expiração de Sessão</p>
                <p className="text-xs text-slate-400">Sessão expira após 24h de inatividade</p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Ativo
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
