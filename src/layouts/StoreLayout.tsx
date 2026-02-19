import { Outlet } from "react-router-dom";
import { StoreHeaderRouter } from "@/components/store/StoreHeaderRouter";
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
      <StoreHeaderRouter />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomPromoBanner />
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
