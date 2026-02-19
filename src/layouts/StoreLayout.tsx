import { Outlet } from "react-router-dom";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { CartDrawer } from "@/components/store/CartDrawer";
import { BottomPromoBanner } from "@/components/store/BottomPromoBanner";
import { useDynamicTheme } from "@/hooks/useDynamicTheme";

export default function StoreLayout() {
  const themeReady = useDynamicTheme();

  if (!themeReady) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomPromoBanner />
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
