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
    <section className="py-10 md:py-14 bg-background">
      <div className="container">
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-display text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-foreground mb-8 md:mb-10"
        >
          Categorias
        </motion.h3>

        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide px-1 snap-x snap-mandatory md:justify-center">
          {collections.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
              className="snap-center"
            >
              <Link
                to={`/colecao/${cat.slug}`}
                className="flex flex-col items-center gap-3 group shrink-0"
              >
                {/* Card container */}
                <div className="relative w-[88px] h-[88px] md:w-[100px] md:h-[100px] rounded-2xl overflow-hidden bg-card border border-border transition-all duration-400 group-hover:border-accent group-hover:shadow-[0_0_24px_-4px_hsl(var(--accent)/0.35)] group-hover:-translate-y-1">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/10 transition-colors duration-300" />
                </div>

                {/* Label */}
                <span className="font-sans text-[10px] md:text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground group-hover:text-accent transition-colors duration-300 text-center leading-tight max-w-[90px] truncate">
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
