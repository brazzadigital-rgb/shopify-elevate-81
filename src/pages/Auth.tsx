import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sparkles, Diamond } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import authHeroImg from "@/assets/auth-jewelry-hero.jpg";

type AuthMode = "login" | "register" | "recover";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { getSetting } = useStoreSettings();
  const navigate = useNavigate();
  const logoUrl = getSetting("logo_url");
  const storeName = getSetting("store_name");

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
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      }
    } else if (mode === "recover") {
      // Password recovery - just show toast for now
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada para redefinir sua senha." });
    }
    setLoading(false);
  };

  const titles: Record<AuthMode, { badge: string; heading: string; sub: string }> = {
    login: {
      badge: "Bem-vinda de volta",
      heading: "Acesse sua Conta",
      sub: "Entre na sua área exclusiva",
    },
    register: {
      badge: "Junte-se a nós",
      heading: "Crie sua Conta",
      sub: "Cadastre-se e descubra peças exclusivas",
    },
    recover: {
      badge: "Recuperar acesso",
      heading: "Redefinir Senha",
      sub: "Informe seu email para receber o link de recuperação",
    },
  };

  const current = titles[mode];

  return (
    <div className="min-h-screen flex bg-[#FAF8F5]">
      {/* Left side — Jewelry hero image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img
          src={authHeroImg}
          alt="Joias elegantes sobre tecido acetinado"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/60 via-[#FAF8F5]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FAF8F5]/40 to-transparent" />

        {/* Sparkle dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#C9A96E]/60"
            style={{
              top: `${15 + i * 14}%`,
              left: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          />
        ))}

        {/* Logo + branding on hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-center px-12"
        >
          <h2 className="font-display text-2xl font-bold text-[#5A4A3B] tracking-wide">
            {storeName || "Sua Joalheria"}
          </h2>
          <p className="text-[#8B7D6B] text-sm mt-2 tracking-widest uppercase">
            Elegância & Exclusividade
          </p>
        </motion.div>
      </div>

      {/* Right side — Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-[#FAF8F5]">
        {/* Mobile hero */}
        <div className="lg:hidden relative h-48 overflow-hidden">
          <img
            src={authHeroImg}
            alt="Joias elegantes"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#FAF8F5]/50 to-[#FAF8F5]" />
          {logoUrl && (
            <motion.img
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              src={logoUrl}
              alt="Logo"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-20 h-20 object-contain drop-shadow-lg"
            />
          )}
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-md"
            >
              {/* Premium card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-[#E8E0D8]/60 p-8 md:p-10">
                {/* Logo inside card */}
                {logoUrl && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={logoUrl}
                      alt="Logo da loja"
                      className="w-24 h-24 object-contain drop-shadow-md"
                    />
                  </div>
                )}

                {/* Badge */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9A96E]/10 text-[#C9A96E]">
                    {mode === "recover" ? (
                      <Diamond className="w-3 h-3" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span className="text-xs font-semibold tracking-wider uppercase">
                      {current.badge}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-display font-bold text-[#3D3225] tracking-wide mb-1">
                  {current.heading}
                </h1>
                <p className="text-[#8B7D6B] text-sm mb-8">
                  {current.sub}
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1.5"
                    >
                      <Label
                        htmlFor="fullName"
                        className="text-xs font-semibold uppercase tracking-wider text-[#8B7D6B]"
                      >
                        Nome completo
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Seu nome"
                        required
                        className="h-12 bg-transparent border-0 border-b border-[#E0D6CC] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#C9A96E] placeholder:text-[#C4B8AB] text-[#3D3225] transition-colors duration-300"
                      />
                    </motion.div>
                  )}

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-wider text-[#8B7D6B]"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="h-12 bg-transparent border-0 border-b border-[#E0D6CC] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#C9A96E] placeholder:text-[#C4B8AB] text-[#3D3225] transition-colors duration-300"
                    />
                  </div>

                  {mode !== "recover" && (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-xs font-semibold uppercase tracking-wider text-[#8B7D6B]"
                      >
                        Senha
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="h-12 bg-transparent border-0 border-b border-[#E0D6CC] rounded-none px-0 pr-10 focus-visible:ring-0 focus-visible:border-[#C9A96E] placeholder:text-[#C4B8AB] text-[#3D3225] transition-colors duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 text-[#C4B8AB] hover:text-[#C9A96E] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Forgot password link (login only) */}
                  {mode === "login" && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setMode("recover")}
                        className="text-xs text-[#C9A96E] hover:text-[#B8963F] transition-colors tracking-wide"
                      >
                        Esqueceu sua senha?
                      </button>
                    </div>
                  )}

                  {/* Submit button — rosé/champagne gradient */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-sm font-semibold uppercase tracking-widest text-white border-0 relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(201,169,110,0.35)] active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #C9A96E 0%, #DFC198 50%, #C9A96E 100%)",
                      backgroundSize: "200% 200%",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget.style.backgroundPosition = "100% 100%");
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget.style.backgroundPosition = "0% 0%");
                    }}
                  >
                    {/* Shine sweep */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                    <span className="relative flex items-center justify-center gap-2">
                      {loading
                        ? "Processando..."
                        : mode === "login"
                        ? <>Entrar <ArrowRight className="w-4 h-4" /></>
                        : mode === "register"
                        ? <>Criar Conta <Sparkles className="w-4 h-4" /></>
                        : <>Enviar Link <ArrowRight className="w-4 h-4" /></>
                      }
                    </span>
                  </Button>
                </form>

                {/* Mode switcher */}
                <div className="mt-6 pt-6 border-t border-[#E8E0D8]/60 text-center space-y-2">
                  {mode === "login" && (
                    <button
                      onClick={() => setMode("register")}
                      className="text-sm text-[#8B7D6B] hover:text-[#C9A96E] transition-colors"
                    >
                      Não tem conta? <span className="font-semibold">Cadastre-se</span>
                    </button>
                  )}
                  {mode === "register" && (
                    <button
                      onClick={() => setMode("login")}
                      className="text-sm text-[#8B7D6B] hover:text-[#C9A96E] transition-colors"
                    >
                      Já tem conta? <span className="font-semibold">Faça login</span>
                    </button>
                  )}
                  {mode === "recover" && (
                    <button
                      onClick={() => setMode("login")}
                      className="text-sm text-[#8B7D6B] hover:text-[#C9A96E] transition-colors"
                    >
                      ← Voltar para o login
                    </button>
                  )}
                </div>
              </div>

              {/* Trust line */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-[10px] text-[#C4B8AB] mt-6 tracking-widest uppercase"
              >
                <Diamond className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                Ambiente seguro e criptografado
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
