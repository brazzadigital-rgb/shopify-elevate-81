import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import mascotImage from "@/assets/mascot.png";

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
    title = "Nova coleção disponível",
    subtitle = "Qualidade e confiança em cada compra. A melhor experiência esportiva do Brasil.",
    cta_text = "CONFERIR",
    cta_link = "/colecoes",
  } = config;

  const heroImage = config.image_url || mascotImage;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Glow behind mascot */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/8 blur-[100px] pointer-events-none" />
      <div className="absolute right-20 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-accent/12 blur-[60px] pointer-events-none" />

      <div className="container py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[380px] md:min-h-[440px]">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-accent mb-3">
              — nova coleção —
            </p>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[0.95] text-foreground mb-5">
              {title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-sans max-w-md mx-auto lg:mx-0 leading-relaxed mb-8">
              {subtitle}
            </p>
            <Link to={cta_link}>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shine font-sans h-12 px-10 text-sm font-bold uppercase tracking-[0.2em] glow-orange transition-all duration-300 hover:glow-orange-lg"
              >
                {cta_text} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Right — Mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex items-center justify-center relative"
          >
            {/* Orange shape behind */}
            <div className="absolute w-64 h-72 md:w-80 md:h-96 rounded-[2rem] bg-accent/10 -rotate-3 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <motion.img
              src={heroImage}
              alt="Mascote esportivo"
              className="relative z-10 w-56 md:w-72 lg:w-80 max-h-[420px] object-contain drop-shadow-2xl"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
