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
        .limit(10);
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

        <div className="flex gap-5 md:gap-8 overflow-x-auto pb-4 scrollbar-hide justify-start md:justify-center px-2">
          {collections.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 200 }}
            >
              <Link
                to={`/colecao/${cat.slug}`}
                className="flex flex-col items-center gap-3 group shrink-0 w-24 md:w-28"
              >
                {/* Circle with glow effect */}
                <div className="relative">
                  {/* Glow ring */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-accent/40 via-accent/10 to-transparent opacity-0 group-hover:opacity-100 blur-md transition-all duration-500" />
                  
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-border bg-card flex items-center justify-center overflow-hidden transition-all duration-400 group-hover:-translate-y-1.5 group-hover:border-accent group-hover:shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.4)]">
                    {cat.image_url ? (
                      <img
                        src={cat.image_url}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <span className="text-3xl">📦</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Label */}
                <span className="font-sans text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground group-hover:text-accent transition-colors duration-300 text-center leading-tight">
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
