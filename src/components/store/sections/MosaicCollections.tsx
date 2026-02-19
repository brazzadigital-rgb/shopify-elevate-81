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
  banner_url: string | null;
}

interface OverrideCollection {
  id: string;
  collection_id: string;
  sort_order: number;
  card_size: string;
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    banner_url: string | null;
  };
}

interface Props {
  overrideTitle?: string | null;
  overrideSubtitle?: string | null;
  overrideCollections?: OverrideCollection[];
}

export function MosaicCollections({ overrideTitle, overrideSubtitle, overrideCollections }: Props) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (overrideCollections && overrideCollections.length > 0) {
      setCollections(overrideCollections.map((oc) => oc.collection));
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase
        .from("collections")
        .select("id, name, slug, description, image_url, banner_url")
        .eq("is_active", true)
        .order("sort_order")
        .limit(6);
      setCollections((data as Collection[]) || []);
      setLoading(false);
    };
    fetch();
  }, [overrideCollections]);

  if (loading) {
    return (
      <section className="py-8 md:py-16 bg-background">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                className={`rounded-[20px] ${i < 2 ? "h-[280px] md:h-[420px]" : "h-[200px] md:h-[300px]"} ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (collections.length === 0) return null;

  // Assign grid sizes: first = large, rest alternate medium/small
  const getSizeClass = (index: number) => {
    if (index === 0) return "col-span-2 row-span-2 h-[280px] md:h-[420px]";
    if (index <= 2) return "col-span-1 h-[135px] md:h-[200px]";
    return "col-span-1 h-[200px] md:h-[300px]";
  };

  return (
    <section className="md:py-16 bg-background">
      <div className="md:container">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full border border-accent/20 text-accent font-sans text-xs font-bold uppercase tracking-wider mb-3">
            Explore
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground">
            {overrideTitle || "Coleções em Destaque"}
          </h2>
          {overrideSubtitle && (
            <p className="text-sm text-muted-foreground font-sans mt-2 max-w-lg mx-auto">{overrideSubtitle}</p>
          )}
        </motion.div>

        {/* Desktop: CSS Grid Mosaic */}
        <div className="hidden md:grid grid-cols-3 gap-5 auto-rows-[200px]">
          {collections.slice(0, 6).map((c, i) => {
            // Grid placement for mosaic effect
            const spanClass =
              i === 0
                ? "col-span-2 row-span-2"
                : i === 3
                ? "col-span-2"
                : "";

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={spanClass}
              >
                <Link
                  to={`/colecao/${c.slug}`}
                  className="group relative block w-full h-full rounded-[22px] overflow-hidden"
                >
                  {/* Image — prefer banner_url for full-bleed mosaic */}
                  {(c.banner_url || c.image_url) ? (
                    <img
                      src={c.banner_url || c.image_url!}
                      alt={c.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7">
                    <h3 className="font-display text-xl md:text-2xl font-bold text-white uppercase leading-tight mb-1.5">
                      {c.name}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-white/80 font-sans text-xs font-semibold uppercase tracking-wider opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      clique e confira <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Soft glow on hover */}
                  <div className="absolute inset-0 rounded-[22px] ring-1 ring-white/0 group-hover:ring-white/10 transition-all duration-300 pointer-events-none" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: uniform 2-column grid */}
        <div className="md:hidden grid grid-cols-2 gap-[3px]">
          {collections.slice(0, 6).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/colecao/${c.slug}`}
                className="group relative block w-full aspect-[3/4] overflow-hidden"
              >
                {(c.banner_url || c.image_url) ? (
                  <img
                    src={c.banner_url || c.image_url!}
                    alt={c.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                  <h3 className="font-display text-sm font-bold text-white uppercase leading-tight">
                    {c.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-white/80 bg-black/30 backdrop-blur-sm rounded-full px-2 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap">
                    clique e confira
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
