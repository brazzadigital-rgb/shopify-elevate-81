import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  cta_text: string | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  link: string | null;
  overlay_opacity: number;
  show_text: boolean;
  content_position: string;
  height: string | null;
}

export function DynamicHeroBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("location", "hero")
        .eq("is_active", true)
        .order("sort_order");
      setBanners((data as Banner[]) || []);
    };
    fetch();
  }, []);

  // Auto-rotate
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % banners.length), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const b = banners[current];
  const desktopImg = b.desktop_image_url;
  const mobileImg = b.mobile_image_url || desktopImg;
  const heightStyle = b.height && b.height !== "adaptive" ? { minHeight: `${b.height}px` } : {};

  const positionClass = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  }[b.content_position] || "items-start text-left";

  return (
    <section className="relative w-full overflow-hidden">
      {/* Mobile: fixed 750x1100 aspect ratio */}
      <div className="md:hidden relative w-full" style={{ aspectRatio: "750 / 1100" }}>
        <img
          src={mobileImg || desktopImg || ""}
          alt={b.title || ""}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,${b.overlay_opacity / 100 * 1.2}), rgba(0,0,0,${b.overlay_opacity / 100 * 0.4}), transparent)`,
          }}
        />
        {b.show_text && (
          <motion.div
            key={b.id + "-mobile"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-8 max-w-lg flex flex-col ${positionClass}`}
          >
            {b.title && (
              <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white mb-2">
                {b.title}
              </h2>
            )}
            {b.subtitle && (
              <p className="text-xs sm:text-sm text-white/70 font-sans mb-4 leading-relaxed">
                {b.subtitle}
              </p>
            )}
            {b.cta_text && b.link && (
              <Link to={b.link}>
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shine font-sans h-11 px-6 text-xs font-bold uppercase tracking-[0.15em] glow-orange transition-all duration-300 w-full sm:w-auto"
                >
                  {b.cta_text} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
          </motion.div>
        )}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all min-h-[unset] min-w-[unset] ${
                  i === current ? "bg-white scale-110" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div
        className="relative w-full hidden md:flex items-end md:min-h-[480px] lg:min-h-[540px]"
        style={heightStyle}
      >
        <img
          src={desktopImg || ""}
          alt={b.title || ""}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,${b.overlay_opacity / 100 * 1.2}), rgba(0,0,0,${b.overlay_opacity / 100 * 0.4}), transparent)`,
          }}
        />

        {/* Content */}
        {b.show_text && (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`relative z-10 p-5 sm:p-8 md:p-12 lg:p-16 max-w-lg flex flex-col ${positionClass}`}
          >
            {b.title && (
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white mb-2 md:mb-3">
                {b.title}
              </h2>
            )}
            {b.subtitle && (
              <p className="text-xs sm:text-sm md:text-base text-white/70 font-sans mb-4 md:mb-6 leading-relaxed">
                {b.subtitle}
              </p>
            )}
            {b.cta_text && b.link && (
              <Link to={b.link}>
                <Button
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full shine font-sans h-11 md:h-12 px-6 md:px-10 text-xs md:text-sm font-bold uppercase tracking-[0.15em] glow-orange transition-all duration-300 hover:glow-orange-lg w-full sm:w-auto"
                >
                  {b.cta_text} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
          </motion.div>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all min-h-[unset] min-w-[unset] ${
                  i === current ? "bg-white scale-110" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
