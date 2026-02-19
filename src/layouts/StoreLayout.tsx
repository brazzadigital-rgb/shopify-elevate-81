import { Outlet } from "react-router-dom";
import { StoreHeaderRouter } from "@/components/store/StoreHeaderRouter";
import { StoreFooter } from "@/components/store/StoreFooter";
import { CartDrawer } from "@/components/store/CartDrawer";
import { BottomPromoBanner } from "@/components/store/BottomPromoBanner";
import { useDynamicTheme } from "@/hooks/useDynamicTheme";
import { TrackingProvider } from "@/hooks/useTracking";
import { CookieConsentBanner } from "@/components/store/CookieConsentBanner";
import { useTrackingSettings } from "@/hooks/useTrackingSettings";

function StoreInner() {
  const { config } = useTrackingSettings();

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <StoreHeaderRouter />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomPromoBanner />
      <StoreFooter />
      <CartDrawer />
      <CookieConsentBanner
        bannerText={config.lgpd_banner_text}
        policyLink={config.lgpd_policy_link}
      />
    </div>
  );
}

export default function StoreLayout() {
  const themeReady = useDynamicTheme();

  if (!themeReady) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <TrackingProvider>
      <StoreInner />
    </TrackingProvider>
  );
}
