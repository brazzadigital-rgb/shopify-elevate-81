import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

function JewelRing({ children, index }: { children: React.ReactNode; index: number }) {
  const [tapped, setTapped] = useState(false);

  const handleTap = useCallback(() => {
    setTapped(true);
    setTimeout(() => setTapped(false), 2000);
  }, []);

  return (
    <motion.div
      className="jewel-ring-wrapper relative"
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onTapStart={handleTap}
    >
      {/* Outer glow */}
      <div className={`absolute inset-[-3px] rounded-full jewel-glow transition-opacity duration-500 ${tapped ? 'opacity-80' : 'opacity-40'}`} />
      
      {/* Metallic gradient ring */}
      <div className="relative rounded-full p-[3px] jewel-ring-gradient">
        {/* Sparkle overlay */}
        <div
          className="absolute inset-0 rounded-full jewel-sparkle overflow-hidden pointer-events-none"
          style={{ animationDelay: `${index * -0.8}s` }}
        >
          <div className="jewel-sparkle-beam" style={{ animationDelay: `${index * -1.2}s` }} />
        </div>
        
        {/* Micro sparkle particles */}
        <div className="jewel-particles pointer-events-none" style={{ animationDelay: `${index * -1.5}s` }}>
          <span className="jewel-particle" style={{ top: '10%', left: '85%', animationDelay: `${index * 0.3}s` }} />
          <span className="jewel-particle" style={{ top: '75%', left: '5%', animationDelay: `${index * 0.3 + 1.2}s` }} />
          <span className="jewel-particle" style={{ top: '5%', left: '40%', animationDelay: `${index * 0.3 + 2.4}s` }} />
        </div>

        {/* Inner separator ring */}
        <div className="rounded-full p-[1px] bg-gradient-to-b from-white/30 to-transparent">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

export function CategoriesSection() {
  const [collections, setCollections] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .order("sort_order")
        .limit(12);
      setCollections((data as Category[]) || []);
    };
    fetchData();
  }, []);

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

        <div className="flex gap-3 px-3 overflow-x-auto no-scrollbar snap-x snap-mandatory justify-start sm:justify-center sm:flex-wrap sm:px-2 sm:gap-4 md:gap-8" style={{ WebkitOverflowScrolling: 'touch' }}>
          {collections.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
              className="flex-shrink-0 snap-center"
            >
              <Link
                to={`/colecao/${cat.slug}`}
                className="flex flex-col items-center gap-2 sm:gap-3 group"
              >
                <JewelRing index={i}>
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
