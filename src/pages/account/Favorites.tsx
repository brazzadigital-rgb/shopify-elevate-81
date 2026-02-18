import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Favorite {
  id: string;
  product_id: string;
  product: { name: string; slug: string; price: number; product_images: { url: string; is_primary: boolean }[] };
}

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("favorites")
      .select("id, product_id, product:products(name, slug, price, product_images(url, is_primary))")
      .eq("user_id", user.id);
    setFavorites((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    toast({ title: "Removido dos favoritos" });
    fetch();
  };

  const getImage = (f: Favorite) => {
    const imgs = f.product?.product_images || [];
    return imgs.find(i => i.is_primary)?.url || imgs[0]?.url || "/placeholder.svg";
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
        <p className="font-display text-xl mb-1">Nenhum favorito</p>
        <p className="text-muted-foreground font-sans text-sm mb-6">Salve produtos que você gosta</p>
        <Button asChild className="rounded-xl font-sans"><Link to="/">Explorar produtos</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl font-bold mb-4">Favoritos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {favorites.map(f => (
          <Card key={f.id} className="border-0 shadow-premium group">
            <CardContent className="p-4 flex gap-4">
              <Link to={`/produto/${f.product?.slug}`} className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                <img src={getImage(f)} alt={f.product?.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/produto/${f.product?.slug}`} className="font-sans text-sm font-medium hover:text-accent transition-colors line-clamp-2">
                  {f.product?.name}
                </Link>
                <p className="font-sans text-sm font-bold mt-1">R$ {Number(f.product?.price).toFixed(2)}</p>
              </div>
              <button onClick={() => remove(f.id)} className="text-muted-foreground hover:text-destructive transition-colors self-start">
                <Trash2 className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
