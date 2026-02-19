import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { HeroSection } from "@/components/store/sections/HeroSection";
import { CategoriesSection } from "@/components/store/sections/CategoriesSection";
import { FeaturedProducts } from "@/components/store/sections/FeaturedProducts";
import { FeaturedCollections } from "@/components/store/sections/FeaturedCollections";
import { BenefitsSection } from "@/components/store/sections/BenefitsSection";
import { NewsletterSection } from "@/components/store/sections/NewsletterSection";
import { MascotPromoPanel } from "@/components/store/sections/MascotPromoPanel";
import { Skeleton } from "@/components/ui/skeleton";

interface HomeSection {
  id: string;
  section_type: string;
  title: string | null;
  config: any;
  sort_order: number;
}

const Index = () => {
  const { data: sections = [], isLoading: loading } = useQuery({
    queryKey: ["home-sections"],
    queryFn: async () => {
      const { data } = await supabase
        .from("home_sections")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return (data as HomeSection[]) || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  if (loading) {
    return (
      <div className="min-h-screen">
        <Skeleton className="h-[400px] w-full" />
        <div className="container py-16">
          <Skeleton className="h-8 w-64 mx-auto mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {(() => {
        let featuredProductsCount = 0;
        return sections.map((section) => {
          switch (section.section_type) {
            case "hero":
              return (
                <div key={section.id}>
                  <HeroSection config={section.config} />
                  <CategoriesSection />
                </div>
              );
            case "featured_products": {
              featuredProductsCount++;
              return (
                <div key={section.id}>
                  <FeaturedProducts config={section.config} title={section.title || undefined} />
                  {featuredProductsCount === 1 && <MascotPromoPanel />}
                </div>
              );
            }
            case "featured_collections":
              return <FeaturedCollections key={section.id} config={section.config} title={section.title || undefined} />;
            case "benefits":
              return <BenefitsSection key={section.id} config={section.config} />;
            case "newsletter":
              return <NewsletterSection key={section.id} config={section.config} />;
            default:
              return null;
          }
        });
      })()}
    </main>
  );
};

export default Index;
