import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
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
    <section className="py-12 md:py-16 bg-background">
      <div className="container">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-display text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-foreground mb-10 md:mb-12"
        >
          Categorias
        </motion.h3>

        <div className="flex gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide px-1 snap-x snap-mandatory md:justify-center">
          {collections.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
              className="snap-center"
            >
              <Link
                to={`/colecao/${cat.slug}`}
                className="flex flex-col items-center gap-4 group shrink-0"
              >
                {/* Image ring container */}
                <div className="relative">
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent/0 via-accent/0 to-accent/0 group-hover:from-accent/20 group-hover:via-accent/10 group-hover:to-transparent transition-all duration-500 blur-md" />
                  
                  {/* Ring border */}
                  <div className="relative w-[110px] h-[110px] md:w-[130px] md:h-[130px] rounded-full p-[3px] bg-gradient-to-br from-border to-border group-hover:from-accent group-hover:to-accent/60 transition-all duration-400">
                    {/* Inner image */}
                    <div className="w-full h-full rounded-full overflow-hidden bg-card">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-3xl">📦</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <span className="font-sans text-[11px] md:text-xs font-bold uppercase tracking-[0.1em] text-foreground/70 group-hover:text-accent transition-colors duration-300 text-center leading-tight max-w-[120px]">
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
