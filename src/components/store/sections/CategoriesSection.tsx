import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

interface JewelConfig {
  enabled: boolean;
  color: "gold" | "rose" | "silver";
  speed: "slow" | "normal" | "fast";
  intensity: number;
  tapGlow: boolean;
  activeHighlight: boolean;
}

const defaultJewelConfig: JewelConfig = {
  enabled: true,
  color: "gold",
  speed: "normal",
  intensity: 50,
  tapGlow: true,
  activeHighlight: true,
};

const colorPalettes = {
  gold: {
    ring: "linear-gradient(135deg, hsl(40,60%,70%) 0%, hsl(38,80%,85%) 20%, hsl(35,50%,60%) 40%, hsl(42,70%,80%) 60%, hsl(30,55%,65%) 80%, hsl(40,60%,75%) 100%)",
    glow: "hsla(40,70%,70%,0.3)",
    sparkle: "hsla(45,100%,95%,0.9)",
    sparkleMid: "hsla(40,80%,80%,0.4)",
    particle: "hsla(45,100%,90%,0.9)",
    particleShadow: "hsla(40,80%,80%,0.5)",
  },
  rose: {
    ring: "linear-gradient(135deg, hsl(350,50%,75%) 0%, hsl(340,60%,85%) 20%, hsl(355,40%,65%) 40%, hsl(345,55%,80%) 60%, hsl(350,45%,70%) 80%, hsl(340,50%,78%) 100%)",
    glow: "hsla(350,60%,75%,0.3)",
    sparkle: "hsla(340,100%,95%,0.9)",
    sparkleMid: "hsla(350,70%,85%,0.4)",
    particle: "hsla(345,100%,92%,0.9)",
    particleShadow: "hsla(350,70%,80%,0.5)",
  },
  silver: {
    ring: "linear-gradient(135deg, hsl(220,10%,75%) 0%, hsl(210,15%,88%) 20%, hsl(215,8%,65%) 40%, hsl(220,12%,82%) 60%, hsl(210,10%,70%) 80%, hsl(220,10%,78%) 100%)",
    glow: "hsla(220,15%,75%,0.3)",
    sparkle: "hsla(210,30%,96%,0.9)",
    sparkleMid: "hsla(220,20%,85%,0.4)",
    particle: "hsla(215,25%,92%,0.9)",
    particleShadow: "hsla(220,20%,80%,0.5)",
  },
};

const speedMap = { slow: 8, normal: 5, fast: 3 };

function JewelRing({
  children,
  index,
  config,
  isActive,
}: {
  children: React.ReactNode;
  index: number;
  config: JewelConfig;
  isActive: boolean;
}) {
  const [tapped, setTapped] = useState(false);
  const palette = colorPalettes[config.color];
  const orbitDuration = speedMap[config.speed];
  const intensityScale = config.intensity / 100;

  const handleTap = useCallback(() => {
    if (!config.tapGlow) return;
    setTapped(true);
    setTimeout(() => setTapped(false), 2000);
  }, [config.tapGlow]);

  if (!config.enabled) {
    return (
      <div className="relative rounded-full p-[2px] bg-gradient-to-br from-border to-border">
        <div className="rounded-full p-[1px] bg-transparent">{children}</div>
      </div>
    );
  }

  const glowOpacity = tapped ? 0.8 : isActive && config.activeHighlight ? 0.65 : 0.4;
  const orbitSpeedMultiplier = isActive && config.activeHighlight ? 0.7 : 1;

  return (
    <motion.div
      className="relative"
      whileTap={config.tapGlow ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onTapStart={handleTap}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-[-3px] rounded-full transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle, ${palette.glow} 60%, transparent 70%)`,
          filter: "blur(4px)",
          opacity: glowOpacity * intensityScale,
        }}
      />

      {/* Metallic gradient ring */}
      <div
        className="relative rounded-full p-[3px]"
        style={{
          background: palette.ring,
          backgroundSize: "200% 200%",
          animation: `jewel-shimmer 4s ease-in-out infinite`,
        }}
      >
        {/* Sparkle beam */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div
            style={{
              position: "absolute",
              width: "30%",
              height: "30%",
              background: `radial-gradient(circle, ${palette.sparkle} 0%, ${palette.sparkleMid} 40%, transparent 70%)`,
              borderRadius: "50%",
              animation: `jewel-orbit ${orbitDuration * orbitSpeedMultiplier}s linear infinite`,
              animationDelay: `${index * -1.2}s`,
              top: 0,
              left: "35%",
              filter: "blur(1px)",
              opacity: intensityScale,
            }}
          />
        </div>

        {/* Micro particles */}
        <div className="absolute inset-0 rounded-full pointer-events-none">
          {[
            { top: "10%", left: "85%", delay: index * 0.3 },
            { top: "75%", left: "5%", delay: index * 0.3 + 1.2 },
            { top: "5%", left: "40%", delay: index * 0.3 + 2.4 },
          ].map((p, pi) => (
            <span
              key={pi}
              className="absolute"
              style={{
                width: 3,
                height: 3,
                background: palette.particle,
                borderRadius: "50%",
                boxShadow: `0 0 3px 1px ${palette.particleShadow}`,
                top: p.top,
                left: p.left,
                animation: `jewel-twinkle 3s ease-in-out infinite`,
                animationDelay: `${p.delay}s`,
                opacity: intensityScale,
              }}
            />
          ))}
        </div>

        {/* Inner separator */}
        <div className="rounded-full p-[1px] bg-gradient-to-b from-white/30 to-transparent">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function CategoriesSection() {
  const [collections, setCollections] = useState<Category[]>([]);
  const [jewelConfig, setJewelConfig] = useState<JewelConfig>(defaultJewelConfig);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      const [collectionsRes, settingsRes] = await Promise.all([
        supabase
          .from("collections")
          .select("id, name, slug, image_url")
          .eq("is_active", true)
          .order("sort_order")
          .limit(12),
        supabase
          .from("store_settings")
          .select("key, value")
          .in("key", [
            "jewel_enabled",
            "jewel_color",
            "jewel_speed",
            "jewel_intensity",
            "jewel_tap_glow",
            "jewel_active_highlight",
          ]),
      ]);

      setCollections((collectionsRes.data as Category[]) || []);

      if (settingsRes.data) {
        const map: Record<string, string> = {};
        settingsRes.data.forEach((s: any) => {
          map[s.key] = s.value;
        });
        setJewelConfig({
          enabled: map.jewel_enabled !== "false",
          color: (map.jewel_color as JewelConfig["color"]) || "gold",
          speed: (map.jewel_speed as JewelConfig["speed"]) || "normal",
          intensity: parseInt(map.jewel_intensity || "50"),
          tapGlow: map.jewel_tap_glow !== "false",
          activeHighlight: map.jewel_active_highlight !== "false",
        });
      }
    };
    fetchData();
  }, []);

  const activeSlug = useMemo(() => {
    const match = location.pathname.match(/^\/colecao\/(.+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  if (collections.length === 0) return null;

  return (
    <section className="py-8 md:py-16 bg-background">
      <div className="md:container">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-display text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-foreground mb-10 md:mb-12"
        >
          Categorias
        </motion.h3>

        <div
          className="flex gap-3 px-3 overflow-x-auto no-scrollbar snap-x snap-mandatory justify-start sm:justify-center sm:flex-wrap sm:px-2 sm:gap-4 md:gap-8"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {collections.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.05,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="flex-shrink-0 snap-center"
            >
              <Link
                to={`/colecao/${cat.slug}`}
                className="flex flex-col items-center gap-2 sm:gap-3 group"
              >
                <JewelRing
                  index={i}
                  config={jewelConfig}
                  isActive={activeSlug === cat.slug}
                >
                  <div className="w-[75px] h-[75px] sm:w-[90px] sm:h-[90px] md:w-[130px] md:h-[130px] lg:w-[150px] lg:h-[150px] rounded-full overflow-hidden bg-card">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                </JewelRing>
                <span className="font-sans text-[9px] sm:text-[10px] md:text-sm font-bold uppercase tracking-[0.1em] text-foreground/70 group-hover:text-accent transition-colors duration-300 text-center leading-tight max-w-[80px] sm:max-w-[100px] md:max-w-[140px]">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
