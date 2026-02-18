import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

interface FeaturedCollectionsProps {
  config: { limit?: number };
  title?: string;
}

export function FeaturedCollections({ config, title = "Coleções em Destaque" }: FeaturedCollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug, description, image_url")
        .eq("is_active", true)
        .order("sort_order")
        .limit(config.limit || 4);
      setCollections((data as Collection[]) || []);
      setLoading(false);
    };
    fetch();
  }, [config.limit]);

  return (
    <section className="py-14 md:py-20 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-display font-bold">{title}</h2>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : collections.length === 0 ? (
          <p className="text-center text-muted-foreground font-sans py-8">Nenhuma coleção encontrada.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {collections.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link to={`/colecao/${c.slug}`} className="group block">
                  <div className="relative h-52 rounded-2xl overflow-hidden bg-primary">
                    {c.image_url && (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display text-lg font-bold text-white">{c.name}</h3>
                      <span className="inline-flex items-center gap-1 text-white/70 font-sans text-xs mt-1 group-hover:text-accent transition-colors">
                        Explorar <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
