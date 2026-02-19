import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { HeroSection } from "@/components/store/sections/HeroSection";
import { CategoriesSection } from "@/components/store/sections/CategoriesSection";
import { FeaturedProducts } from "@/components/store/sections/FeaturedProducts";
import { FeaturedCollections } from "@/components/store/sections/FeaturedCollections";
import { BenefitsSection } from "@/components/store/sections/BenefitsSection";
import { NewsletterSection } from "@/components/store/sections/NewsletterSection";
import { MascotPromoPanel } from "@/components/store/sections/MascotPromoPanel";
import PromoTriplePanel from "@/components/store/sections/PromoTriplePanel";
import { MosaicCollections } from "@/components/store/sections/MosaicCollections";
import { ShowcaseCountdown } from "@/components/store/sections/ShowcaseCountdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useSellerReferral } from "@/hooks/useSellerReferral";
import { useHomeTemplate, type HomeTemplate } from "@/hooks/useHomeTemplate";
import { useActiveShowcase } from "@/hooks/useActiveShowcase";

interface HomeSection {
  id: string;
  section_type: string;
  title: string | null;
  config: any;
  sort_order: number;
}

const Index = () => {
  useSellerReferral();
  const { homeTemplate } = useHomeTemplate();
  const { showcase } = useActiveShowcase();
  const [searchParams] = useSearchParams();
  
  // Allow preview override via query param (admin preview, no save)
  const previewTemplate = searchParams.get("preview_template") as HomeTemplate | null;
  const activeTemplate = previewTemplate || homeTemplate;

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

  // Mosaic template: Hero + Mosaic grid + rest of sections
  if (activeTemplate === "mosaic_collections_v1") {
    const heroSection = sections.find((s) => s.section_type === "hero");
    const otherSections = sections.filter((s) => s.section_type !== "hero" && s.section_type !== "featured_collections");

    // Build override banner object for the HeroSection when showcase is active
    const showcaseBannerOverride = showcase?.banner_desktop_url
      ? {
          desktop_image_url: showcase.banner_desktop_url,
          mobile_image_url: showcase.banner_mobile_url || showcase.banner_desktop_url,
          link: showcase.banner_link || undefined,
          show_text: !showcase.banner_clean_mode,
          overlay_opacity: showcase.banner_overlay_opacity ?? 0,
          content_position: showcase.banner_text_position || "center",
        }
      : null;

    // If showcase has collections, pass them to MosaicCollections
    const showcaseCollections = showcase?.collections;

    return (
      <main className="min-h-screen">
        {heroSection && (
          <HeroSection
            config={heroSection.config}
            overrideBanner={showcaseBannerOverride}
          />
        )}

        {/* Promo strip */}
        {showcase?.enable_promo_strip && showcase.promo_strip_text && (
          <div className="w-full py-2.5 bg-accent text-accent-foreground text-center font-sans text-sm font-medium">
            {showcase.promo_strip_text}
          </div>
        )}

        {/* Countdown */}
        {showcase?.enable_countdown && (
          <ShowcaseCountdown
            endsAt={showcase.ends_at}
            title={showcase.section_title || showcase.name}
          />
        )}

        <MosaicCollections
          overrideTitle={showcase?.section_title}
          overrideSubtitle={showcase?.section_subtitle}
          overrideCollections={showcaseCollections}
        />

        {otherSections.map((section) => {
          switch (section.section_type) {
            case "featured_products":
              return <FeaturedProducts key={section.id} config={section.config} title={section.title || undefined} />;
            case "benefits":
              return <BenefitsSection key={section.id} config={section.config} />;
            case "newsletter":
              return <NewsletterSection key={section.id} config={section.config} />;
            default:
              return null;
          }
        })}
      </main>
    );
  }

  // Classic template (default)
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
                  {featuredProductsCount === 1 && (
                    <>
                      <MascotPromoPanel />
                      <PromoTriplePanel />
                    </>
                  )}
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
