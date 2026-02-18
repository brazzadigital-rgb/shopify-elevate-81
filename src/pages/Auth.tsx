import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, Zap, ShieldCheck, ArrowRight } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 sport-gradient-radial relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-mesh opacity-40" />
        
        {/* Glow circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        
        <div className="relative z-10 text-center p-12">
          {/* Mascot */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-40 h-40 mx-auto rounded-3xl glass-card border-glow flex items-center justify-center animate-float">
              <span className="text-7xl">🐆</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground uppercase mb-4">
              Área <span className="text-gradient-orange">Exclusiva</span>
            </h2>
            <p className="text-primary-foreground/40 font-sans text-sm max-w-sm mx-auto leading-relaxed">
              Acesse sua conta para acompanhar pedidos, favoritos e ofertas exclusivas.
            </p>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-6 mt-10"
          >
            {[
              { icon: ShieldCheck, label: "Seguro" },
              { icon: Zap, label: "Rápido" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-primary-foreground/30">
                <Icon className="w-4 h-4 text-accent" />
                <span className="font-sans text-xs font-bold uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent font-sans text-xs font-bold uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3" />
              {isLogin ? "Bem-vindo de volta" : "Criar conta"}
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold uppercase">
              {isLogin ? "Faça Login" : "Cadastre-se"}
            </h1>
            <p className="text-muted-foreground mt-2 font-sans text-sm">
              {isLogin ? "Entre na sua conta para continuar" : "Crie sua conta e aproveite ofertas exclusivas"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required={!isLogin}
                  className="h-13 rounded-xl border-border/50 focus:border-accent focus:ring-accent/20 font-sans"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-13 rounded-xl border-border/50 focus:border-accent focus:ring-accent/20 font-sans"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-sans text-sm font-bold uppercase tracking-wider text-muted-foreground">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-13 rounded-xl pr-12 border-border/50 focus:border-accent focus:ring-accent/20 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl text-base font-sans font-bold uppercase tracking-wider shine bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 glow-orange hover:glow-orange-lg"
            >
              {loading ? "Processando..." : isLogin ? (
                <>Entrar <ArrowRight className="ml-2 w-4 h-4" /></>
              ) : (
                <>Criar conta <Zap className="ml-2 w-4 h-4" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-accent transition-colors font-sans"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
