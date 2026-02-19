import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sparkles, Diamond, Loader2, MapPin } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCepLookup } from "@/hooks/useCepLookup";
import authHeroImg from "@/assets/auth-jewelry-hero.jpg";

type AuthMode = "login" | "register" | "recover";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { getSetting } = useStoreSettings();
  const { lookup: lookupCep, loading: cepLoading } = useCepLookup();
  const navigate = useNavigate();
  const logoUrl = getSetting("logo_url");
  const storeName = getSetting("store_name");

  // Address fields for registration
  const [showAddress, setShowAddress] = useState(false);
  const [addr, setAddr] = useState({
    zip_code: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });

  const handleCepBlur = async () => {
    const result = await lookupCep(addr.zip_code);
    if (result) {
      setAddr(prev => ({ ...prev, ...result }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    } else if (mode === "register") {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === "SIGNED_IN" && session?.user) {
            const uid = session.user.id;
            if (phone || cpf) {
              await supabase.from("profiles").update({ phone, cpf } as any).eq("user_id", uid);
            }
            if (addr.zip_code && addr.street && addr.number) {
              await supabase.from("customer_addresses").insert({
                user_id: uid, label: "Casa", recipient_name: fullName, phone,
                zip_code: addr.zip_code, street: addr.street, number: addr.number,
                complement: addr.complement || null, neighborhood: addr.neighborhood,
                city: addr.city, state: addr.state, is_default: true,
              } as any);
            }
            subscription.unsubscribe();
          }
        });
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      }
    } else if (mode === "recover") {
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada para redefinir sua senha." });
    }
    setLoading(false);
  };

  const titles: Record<AuthMode, { badge: string; heading: string; sub: string }> = {
    login: { badge: "Bem-vinda(o) de volta", heading: "Acesse sua Conta", sub: "Entre na sua área exclusiva" },
    register: { badge: "Junte-se a nós", heading: "Crie sua Conta", sub: "Cadastre-se e descubra peças exclusivas" },
    recover: { badge: "Recuperar acesso", heading: "Redefinir Senha", sub: "Informe seu email para receber o link de recuperação" },
  };

  const current = titles[mode];

  const inputClass = "h-12 bg-transparent border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary placeholder:text-muted-foreground text-foreground transition-colors duration-300";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side — Hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img src={authHeroImg} alt="Joias elegantes sobre tecido acetinado" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-primary/60"
            style={{ top: `${15 + i * 14}%`, left: `${20 + (i % 3) * 25}%` }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.8 }}
          />
        ))}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="relative z-10 text-center px-12">
          <div className="inline-block bg-black/40 backdrop-blur-sm rounded-2xl px-8 py-5">
            <h2 className="font-display text-2xl font-bold text-white tracking-wide">{storeName || "Sua Joalheria"}</h2>
            <p className="text-white/80 text-sm mt-2 tracking-widest uppercase">Elegância & Exclusividade</p>
          </div>
        </motion.div>
      </div>

      {/* Right side — Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        <div className="lg:hidden relative h-48 overflow-hidden">
          <img src={authHeroImg} alt="Joias elegantes" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="w-full max-w-md">
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-border/60 p-8 md:p-10">
                {logoUrl && (
                  <div className="flex justify-center mb-6">
                    <img src={logoUrl} alt="Logo da loja" className="w-40 h-40 object-contain drop-shadow-md" />
                  </div>
                )}

                <div className="flex items-center gap-2 mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    {mode === "recover" ? <Diamond className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                    <span className="text-xs font-semibold tracking-wider uppercase">{current.badge}</span>
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-wide mb-1">{current.heading}</h1>
                <p className="text-muted-foreground text-sm mb-8">{current.sub}</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === "register" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className={labelClass}>Nome completo</Label>
                        <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome" required className={inputClass} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className={labelClass}>Telefone / WhatsApp</Label>
                          <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className={labelClass}>CPF (opcional)</Label>
                          <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className={inputClass} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className={labelClass}>Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className={inputClass} />
                  </div>

                  {mode !== "recover" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className={labelClass}>Senha</Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className={`${inputClass} pr-10`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Address section for registration */}
                  {mode === "register" && (
                    <div className="space-y-4">
                      <button
                        type="button"
                        onClick={() => setShowAddress(!showAddress)}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-semibold"
                      >
                        <MapPin className="w-4 h-4" />
                        {showAddress ? "Ocultar endereço" : "Adicionar endereço de entrega"}
                      </button>

                      <AnimatePresence>
                        {showAddress && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                          >
                            <div className="p-4 rounded-xl border border-border/60 bg-card/50 space-y-4">
                              <div className="space-y-1.5">
                                <Label className={labelClass}>CEP</Label>
                                <div className="relative">
                                  <Input
                                    value={addr.zip_code}
                                    onChange={e => setAddr({ ...addr, zip_code: e.target.value })}
                                    onBlur={handleCepBlur}
                                    placeholder="00000-000"
                                    className={inputClass}
                                  />
                                  {cepLoading && <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1.5">
                                  <Label className={labelClass}>Rua</Label>
                                  <Input value={addr.street} onChange={e => setAddr({ ...addr, street: e.target.value })} placeholder="Logradouro" className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className={labelClass}>Nº</Label>
                                  <Input value={addr.number} onChange={e => setAddr({ ...addr, number: e.target.value })} placeholder="123" className={inputClass} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className={labelClass}>Complemento</Label>
                                <Input value={addr.complement} onChange={e => setAddr({ ...addr, complement: e.target.value })} placeholder="Apto, bloco..." className={inputClass} />
                              </div>
                              <div className="space-y-1.5">
                                <Label className={labelClass}>Bairro</Label>
                                <Input value={addr.neighborhood} onChange={e => setAddr({ ...addr, neighborhood: e.target.value })} placeholder="Bairro" className={inputClass} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className={labelClass}>Cidade</Label>
                                  <Input value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} placeholder="Cidade" className={inputClass} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className={labelClass}>Estado</Label>
                                  <Input value={addr.state} onChange={e => setAddr({ ...addr, state: e.target.value })} placeholder="SP" maxLength={2} className={inputClass} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {mode === "login" && (
                    <div className="text-right">
                      <button type="button" onClick={() => setMode("recover")} className="text-xs text-primary hover:text-primary/80 transition-colors tracking-wide">
                        Esqueceu sua senha?
                      </button>
                    </div>
                  )}

                  <Button type="submit" disabled={loading}
                    className="w-full h-12 rounded-xl text-sm font-semibold uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 border-0 relative overflow-hidden transition-all duration-300 hover:shadow-lg active:scale-[0.98]"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {loading ? "Processando..." : mode === "login" ? <>Entrar <ArrowRight className="w-4 h-4" /></> : mode === "register" ? <>Criar Conta <Sparkles className="w-4 h-4" /></> : <>Enviar Link <ArrowRight className="w-4 h-4" /></>}
                    </span>
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border/60 text-center space-y-2">
                  {mode === "login" && (
                    <button onClick={() => setMode("register")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Não tem conta? <span className="font-semibold">Cadastre-se</span>
                    </button>
                  )}
                  {mode === "register" && (
                    <button onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      Já tem conta? <span className="font-semibold">Faça login</span>
                    </button>
                  )}
                  {mode === "recover" && (
                    <button onClick={() => setMode("login")} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      ← Voltar para o login
                    </button>
                  )}
                </div>
              </div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-[10px] text-muted-foreground mt-6 tracking-widest uppercase">
                <Diamond className="w-3 h-3 inline-block mr-1 -mt-0.5" /> Ambiente seguro e criptografado
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
