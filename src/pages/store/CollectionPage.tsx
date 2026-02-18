import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  is_new: boolean;
  product_images: { url: string; is_primary: boolean }[];
}

export default function CollectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: colData } = await supabase
        .from("collections")
        .select("id, name, description, image_url")
        .eq("slug", slug!)
        .eq("is_active", true)
        .maybeSingle();

      if (!colData) { setLoading(false); return; }
      setCollection(colData as Collection);

      const { data: cpData } = await supabase
        .from("collection_products")
        .select("product_id")
        .eq("collection_id", colData.id);

      if (cpData && cpData.length > 0) {
        const ids = cpData.map((cp: any) => cp.product_id);
        const { data: prodData } = await supabase
          .from("products")
          .select("id, name, slug, price, compare_at_price, is_new, product_images(url, is_primary)")
          .eq("is_active", true)
          .in("id", ids);
        setProducts((prodData as any) || []);
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  const getImage = (p: Product) => p.product_images?.find((i) => i.is_primary)?.url || p.product_images?.[0]?.url || "/placeholder.svg";

  if (loading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-5 w-96 mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl font-bold mb-2">Coleção não encontrada</h1>
        <p className="text-muted-foreground font-sans">A coleção solicitada não existe ou foi desativada.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh]">
      <section className="bg-primary text-primary-foreground py-16 mb-10">
        <div className="container">
          <h1 className="text-4xl font-display font-bold">{collection.name}</h1>
          {collection.description && <p className="text-primary-foreground/60 font-sans mt-3 max-w-xl">{collection.description}</p>}
        </div>
      </section>

      <div className="container pb-16">
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground font-sans py-12">Nenhum produto nesta coleção ainda.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product, i) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/produto/${product.slug}`} className="group block">
                  <Card className="border-0 shadow-none hover:shadow-premium-lg transition-all duration-300 overflow-hidden rounded-2xl bg-transparent">
                    <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden">
                      <img src={getImage(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      {product.is_new && (
                        <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground font-sans text-[10px] px-2 py-0.5 rounded-lg">Novo</Badge>
                      )}
                    </div>
                    <CardContent className="px-1 pt-3 pb-0">
                      <p className="font-sans text-sm font-medium truncate group-hover:text-accent transition-colors">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-sans text-base font-bold">R$ {Number(product.price).toFixed(2)}</span>
                        {product.compare_at_price && product.compare_at_price > product.price && (
                          <span className="font-sans text-xs text-muted-foreground line-through">R$ {Number(product.compare_at_price).toFixed(2)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
