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

        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide sm:justify-center sm:flex-wrap sm:px-2 md:gap-8">
          {collections.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
            >
              <Link
                to={`/colecao/${cat.slug}`}
                className="flex flex-col items-center gap-2 sm:gap-3 group"
              >
                <div className="relative w-[60px] h-[60px] sm:w-[90px] sm:h-[90px] md:w-[130px] md:h-[130px] lg:w-[150px] lg:h-[150px] rounded-full p-[2px] bg-gradient-to-br from-border to-border group-hover:from-accent group-hover:to-accent/60 transition-all duration-400 flex-shrink-0">
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
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                  </div>
                </div>
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
