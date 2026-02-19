import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import { DynamicHeroBanner } from "@/components/store/DynamicHeroBanner";

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
  const { data: hasDynamicBanners } = useQuery({
    queryKey: ["hero-banners-check"],
    queryFn: async () => {
      const { count } = await supabase.from("banners").select("id", { count: "exact", head: true }).eq("location", "hero").eq("is_active", true);
      return (count || 0) > 0;
    },
    staleTime: 1000 * 60 * 5,
  });

  // If dynamic banners exist, show them instead
  if (hasDynamicBanners === true) {
    return (
      <section className="bg-background md:py-6 lg:py-10">
        <div className="md:container md:px-6">
          <div className="md:rounded-2xl overflow-hidden">
            <DynamicHeroBanner />
          </div>
        </div>
      </section>
    );
  }

  // Loading or no dynamic banners → show static fallback
  const {
    title = "Nova coleção disponível",
    subtitle = "Qualidade e confiança em cada compra.",
    cta_text = "CONFERIR",
    cta_link = "/colecoes",
  } = config;

  const bannerImage = config.image_url || heroBanner;

  return (
    <section className="bg-background md:py-6 lg:py-10">
      <div className="md:container md:px-6">
        {/* Mobile: 750x1100 aspect ratio, full bleed */}
        <div
          className="relative w-full overflow-hidden md:hidden flex items-end"
          style={{
            aspectRatio: "750 / 1100",
            backgroundImage: `url(${bannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "hsl(var(--primary))",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 p-5 sm:p-8 max-w-lg"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white mb-2">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-white/70 font-sans mb-4 leading-relaxed">
              {subtitle}
            </p>
            <Link to={cta_link}>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shine font-sans h-11 px-6 text-xs font-bold uppercase tracking-[0.15em] glow-orange transition-all duration-300 w-full sm:w-auto"
              >
                {cta_text} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <div className="flex gap-2 mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
            </div>
          </motion.div>
        </div>

        {/* Desktop */}
        <div
          className="relative w-full rounded-2xl overflow-hidden hidden md:flex items-end min-h-[480px] lg:min-h-[540px]"
          style={{
            backgroundImage: `url(${bannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundColor: "hsl(var(--primary))",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 p-12 lg:p-16 max-w-lg"
          >
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight text-white mb-3">
              {title}
            </h2>
            <p className="text-base text-white/70 font-sans mb-6 leading-relaxed">
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
