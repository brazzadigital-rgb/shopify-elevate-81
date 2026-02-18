import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

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
    subtitle = "Qualidade e confiança em cada compra.",
    cta_text = "CONFERIR",
    cta_link = "/colecoes",
  } = config;

  const bannerImage = config.image_url || heroBanner;

  return (
    <section className="bg-background py-6 md:py-10">
      <div className="container">
        <div
          className="relative w-full rounded-2xl overflow-hidden min-h-[320px] md:min-h-[420px] lg:min-h-[480px] flex items-end"
          style={{
            backgroundImage: `url(${bannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 p-8 md:p-12 lg:p-16 max-w-lg"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white mb-3">
              {title}
            </h2>
            <p className="text-sm md:text-base text-white/70 font-sans mb-6 leading-relaxed">
              {subtitle}
            </p>
            <Link to={cta_link}>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shine font-sans h-12 px-10 text-sm font-bold uppercase tracking-[0.15em] glow-orange transition-all duration-300 hover:glow-orange-lg"
              >
                {cta_text} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>

            {/* Dot indicators (decorative) */}
            <div className="flex gap-2 mt-6">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
