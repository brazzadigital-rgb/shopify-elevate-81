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
    const fetch = async () => {
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug, image_url")
        .eq("is_active", true)
        .order("sort_order")
        .limit(10);
      setCollections((data as Category[]) || []);
    };
    fetch();
  }, []);

  if (collections.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container">
        <div className="flex gap-6 md:gap-8 overflow-x-auto pb-4 scrollbar-hide justify-start md:justify-center">
          {collections.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/colecao/${cat.slug}`}
                className="flex flex-col items-center gap-2.5 group shrink-0 w-20 md:w-24"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-border bg-card flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:border-accent/40">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
                <span className="font-sans text-[11px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
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
