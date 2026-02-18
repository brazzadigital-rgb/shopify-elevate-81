import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  config: {
    layout?: string;
    title?: string;
    subtitle?: string;
    cta_text?: string;
    cta_link?: string;
    image_url?: string;
  };
}

export function HeroSection({ config }: HeroSectionProps) {
  const {
    title = "COMPRA 100% SEGURA E GARANTIDA",
    subtitle = "Performance, estilo e confiança em cada produto. A melhor experiência de compra esportiva do Brasil.",
    cta_text = "Comprar agora",
    cta_link = "/colecoes",
  } = config;

  return (
    <section className="relative overflow-hidden sport-gradient-radial min-h-[520px] md:min-h-[600px] flex items-center">
      {/* Animated background mesh */}
      <div className="absolute inset-0 bg-mesh opacity-60" />
      
      {/* Diagonal accent line */}
      <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden">
        <div className="absolute -right-20 -top-20 w-[600px] h-[600px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute right-10 bottom-10 w-[300px] h-[300px] rounded-full bg-accent/8 blur-2xl animate-float" />
      </div>

      {/* Orange accent stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />

      <div className="container relative z-10 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/10 mb-6"
            >
              <ShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-accent font-sans text-xs font-bold uppercase tracking-wider">
                100% Seguro & Garantido
              </span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[0.95] text-primary-foreground mb-6">
              {title.split(" ").map((word, i) => (
                <span key={i} className={word === "SEGURA" || word === "GARANTIDA" ? "text-gradient-orange" : ""}>
                  {word}{" "}
                </span>
              ))}
            </h1>
            
            <p className="text-base md:text-lg text-primary-foreground/50 font-sans mb-8 max-w-lg leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to={cta_link}>
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl shine font-sans h-14 px-10 text-sm font-bold uppercase tracking-wider w-full sm:w-auto glow-orange transition-all duration-300 hover:glow-orange-lg"
                >
                  <Zap className="w-4 h-4 mr-2" /> {cta_text}
                </Button>
              </Link>
              <Link to="/colecoes">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:border-accent/50 rounded-2xl font-sans h-14 px-10 text-sm font-bold uppercase tracking-wider w-full sm:w-auto transition-all duration-300"
                >
                  Ver Coleções <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 mt-10">
              {[
                { value: "10k+", label: "Clientes" },
                { value: "4.9★", label: "Avaliação" },
                { value: "24h", label: "Suporte" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-xl md:text-2xl font-bold text-accent">{stat.value}</p>
                  <p className="font-sans text-[10px] text-primary-foreground/40 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right side - mascot / image placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full bg-accent/10 blur-3xl animate-glow-pulse" />
              <div className="relative w-full h-full rounded-3xl glass-card flex items-center justify-center border-glow overflow-hidden">
                {config.image_url ? (
                  <img src={config.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-8">
                    <div className="text-6xl mb-3">🐆</div>
                    <p className="font-display text-lg text-primary-foreground/60">MASCOTE</p>
                    <p className="font-sans text-xs text-primary-foreground/30">Seu guia esportivo</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
