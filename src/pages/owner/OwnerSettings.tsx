import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Shield, Loader2, Copy, ChevronDown, ChevronUp, QrCode } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useOwnerSettings } from "@/hooks/useOwnerSettings";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

export default function OwnerSettings() {
  const { getValue, saveMultiple, isLoading } = useOwnerSettings();
  const [efiClientId, setEfiClientId] = useState("");
  const [efiClientSecret, setEfiClientSecret] = useState("");
  const [efiPixKey, setEfiPixKey] = useState("");
  const [efiEnvironment, setEfiEnvironment] = useState("sandbox");
  const [efiActive, setEfiActive] = useState(false);
  const [efiExpanded, setEfiExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setEfiClientId(getValue("efi_client_id"));
      setEfiClientSecret(getValue("efi_client_secret"));
      setEfiPixKey(getValue("efi_pix_key"));
      setEfiEnvironment(getValue("efi_environment") || "sandbox");
      setEfiActive(getValue("efi_active") === "true");
    }
  }, [isLoading, getValue]);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-efi`;

  const handleSave = async () => {
    setSaving(true);
    await saveMultiple([
      { key: "efi_client_id", value: efiClientId },
      { key: "efi_client_secret", value: efiClientSecret },
      { key: "efi_pix_key", value: efiPixKey },
      { key: "efi_environment", value: efiEnvironment },
      { key: "efi_active", value: String(efiActive) },
    ]);
    setSaving(false);
  };

  const handleToggle = async (val: boolean) => {
    setEfiActive(val);
    // Auto-save toggle
    await saveMultiple([{ key: "efi_active", value: String(val) }]);
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

      {/* Payment Integrations */}
      <motion.div {...fadeUp(0)}>
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-800">Integrações de Pagamento</h2>
            <p className="text-sm text-slate-400 mt-0.5">Configure quais provedores de pagamento estão ativos para cobranças de assinaturas</p>
          </div>

          {/* EFI Bank Card */}
          <div className={`rounded-2xl border-2 transition-colors ${efiActive ? "border-amber-200 bg-amber-50/30" : "border-slate-100 bg-slate-50/30"}`}>
            {/* Card header */}
            <div
              className="flex items-center gap-4 p-5 cursor-pointer select-none"
              onClick={() => setEfiExpanded(!efiExpanded)}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800">EFI Bank (PIX)</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Cobranças via PIX com QR Code</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {efiActive && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    Ativo
                  </span>
                )}
                <div onClick={e => e.stopPropagation()}>
                  <Switch
                    checked={efiActive}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
                {efiExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Description always visible */}
            <div className="px-5 pb-4 -mt-1">
              <p className="text-xs text-slate-500 leading-relaxed">
                Gera cobranças PIX instantâneas usando a API da EFI (Gerencianet). Quando ativo, é usado como método prioritário para novas assinaturas.
              </p>
            </div>

            {/* Expandable credentials section */}
            <AnimatePresence>
              {efiExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-5 border-t border-slate-100 pt-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Client ID</Label>
                        <Input
                          value={efiClientId}
                          onChange={e => setEfiClientId(e.target.value)}
                          placeholder="Seu Client ID da Efí"
                          className="h-11 rounded-xl bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Client Secret</Label>
                        <Input
                          value={efiClientSecret}
                          onChange={e => setEfiClientSecret(e.target.value)}
                          type="password"
                          placeholder="Seu Client Secret da Efí"
                          className="h-11 rounded-xl bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Chave PIX</Label>
                      <Input
                        value={efiPixKey}
                        onChange={e => setEfiPixKey(e.target.value)}
                        placeholder="CPF, CNPJ, email ou chave aleatória"
                        className="h-11 rounded-xl bg-white border-slate-200 text-slate-800 placeholder:text-slate-300"
                      />
                      <p className="text-[11px] text-slate-400">Chave PIX cadastrada na sua conta Efí Bank</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Ambiente</Label>
                      <div className="flex gap-2">
                        {[
                          { value: "sandbox", label: "Sandbox" },
                          { value: "production", label: "Produção" },
                        ].map(env => (
                          <button
                            key={env.value}
                            onClick={() => setEfiEnvironment(env.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                              efiEnvironment === env.value
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-white text-slate-400 border-slate-100 hover:text-slate-600"
                            }`}
                          >
                            {env.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Webhook Endpoint</Label>
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
                      <p className="text-[11px] text-slate-400">Configure este endpoint no painel da Efí Bank para receber notificações de pagamento</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Salvar Credenciais
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
                        onClick={handleTest}
                        disabled={testing || !efiClientId || !efiClientSecret}
                      >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Testar Conexão
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
