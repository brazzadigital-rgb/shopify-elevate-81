import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
  const { title = "Nova Coleção", subtitle = "Descubra as últimas tendências", cta_text = "Ver Coleção", cta_link = "/colecoes" } = config;

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="container py-20 md:py-28 lg:py-36 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/20 text-accent text-sm font-sans font-medium mb-6">
            Exclusivo 2026
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.1] mb-6">
            {title.includes("transforma") ? (
              <>Elegância que <span className="text-gradient-gold">transforma</span></>
            ) : title}
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/60 font-sans mb-8 max-w-lg leading-relaxed">
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={cta_link}>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shine font-sans h-12 px-8 text-sm font-semibold w-full sm:w-auto"
              >
                {cta_text} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/colecoes">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 rounded-xl font-sans h-12 px-8 text-sm w-full sm:w-auto"
              >
                Ver Coleções
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/70" />
      {config.image_url && (
        <img src={config.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay" />
      )}
    </section>
  );
}
